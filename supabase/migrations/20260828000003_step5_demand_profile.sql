-- STEP 5: SKU demand profile. All demand statistics use core.v_train_demand only.
alter table core.item_policy add column if not exists item_name text;

create or replace view analytics.v_sku_demand_profile as
with setting as (
  select train_start, train_end
  from core.forecast_setting
  where setting_key = 'default' and active = true
), periods as (
  select gs::date as period_start, row_number() over (order by gs)::integer as period_index
  from setting
  cross join lateral generate_series(
    date_trunc('month', train_start)::date,
    date_trunc('month', train_end)::date,
    interval '1 month'
  ) gs
  where train_start is not null and train_end is not null
), item_sources as (
  select item_id, max(item_name) as item_name
  from core.item_policy
  group by item_id
  union all
  select item_id, null::text as item_name
  from core.v_train_demand
  group by item_id
), items as (
  select item_id, max(item_name) as item_name
  from item_sources
  group by item_id
), grid as (
  select i.item_id, i.item_name, p.period_start, p.period_index
  from items i cross join periods p
), monthly as (
  select
    g.item_id,
    g.item_name,
    g.period_start,
    g.period_index,
    case when count(d.usage_date) = 0 then 0::numeric else sum(d.quantity) end as quantity,
    count(d.usage_date) as source_row_count,
    count(d.quantity) as nonnull_quantity_count
  from grid g
  left join core.v_train_demand d
    on d.item_id = g.item_id
   and date_trunc('month', d.usage_date)::date = g.period_start
  group by g.item_id, g.item_name, g.period_start, g.period_index
), stats as (
  select
    item_id,
    max(item_name) as item_name,
    count(*)::integer as n_periods,
    count(*) filter (where quantity > 0)::integer as n_nonzero_periods,
    count(*) filter (where quantity is null)::integer as n_null_periods,
    count(*) filter (where quantity = 0)::integer as n_zero_periods,
    avg(quantity) filter (where quantity > 0) as mean_nonzero,
    stddev_samp(quantity) filter (where quantity > 0) as stddev_nonzero,
    regr_slope(quantity, period_index) filter (where quantity is not null) as trend,
    max(quantity) as peak_quantity
  from monthly
  group by item_id
), recent as (
  select
    item_id,
    avg(quantity) filter (where period_index > n_periods - 3) as recent_mean,
    avg(quantity) filter (where period_index between n_periods - 5 and n_periods - 3) as prior_mean,
    count(*) filter (where period_index > n_periods - 3 and quantity is not null) as recent_count,
    count(*) filter (where period_index between n_periods - 5 and n_periods - 3 and quantity is not null) as prior_count
  from monthly
  join (select item_id as stat_item_id, max(period_index) as n_periods from monthly group by item_id) last_period
    on last_period.stat_item_id = monthly.item_id
  group by item_id
), peaks as (
  select distinct on (item_id) item_id, to_char(period_start, 'YYYY-MM') as peak_period
  from monthly
  where quantity is not null
  order by item_id, quantity desc nulls last, period_start asc
), seasonal as (
  select item_id, stddev_samp(month_mean) as month_mean_stddev
  from (
    select item_id, extract(month from period_start) as month_number, avg(quantity) as month_mean
    from monthly
    where quantity is not null
    group by item_id, extract(month from period_start)
  ) month_values
  group by item_id
)
select
  s.item_id,
  s.item_name,
  s.n_periods,
  s.n_nonzero_periods,
  case when s.n_nonzero_periods > 0 then s.n_periods::numeric / s.n_nonzero_periods else null end as adi,
  case when s.n_nonzero_periods >= 2 and s.mean_nonzero > 0 then s.stddev_nonzero / s.mean_nonzero else null end as cv,
  case when s.n_nonzero_periods >= 2 and s.mean_nonzero > 0 then power(s.stddev_nonzero / s.mean_nonzero, 2) else null end as cv_squared,
  case when s.n_periods > 0 then s.n_zero_periods::numeric / s.n_periods else null end as zero_demand_rate,
  s.trend,
  case when r.recent_count = 3 and r.prior_count = 3 and r.prior_mean is not null and r.prior_mean <> 0
       then (r.recent_mean - r.prior_mean) / abs(r.prior_mean) else null end as recent_change_rate,
  p.peak_period,
  case
    when s.n_nonzero_periods = 0 then null
    when s.n_periods::numeric / s.n_nonzero_periods < 1.32 and power(s.stddev_nonzero / nullif(s.mean_nonzero, 0), 2) < 0.49 then 'SMOOTH'
    when s.n_periods::numeric / s.n_nonzero_periods >= 1.32 and power(s.stddev_nonzero / nullif(s.mean_nonzero, 0), 2) < 0.49 then 'INTERMITTENT'
    when s.n_periods::numeric / s.n_nonzero_periods < 1.32 and power(s.stddev_nonzero / nullif(s.mean_nonzero, 0), 2) >= 0.49 then 'ERRATIC'
    when s.n_periods::numeric / s.n_nonzero_periods >= 1.32 and power(s.stddev_nonzero / nullif(s.mean_nonzero, 0), 2) >= 0.49 then 'LUMPY'
    else null
  end as demand_type,
  case when s.n_periods < 24 then null else coalesce(se.month_mean_stddev > 0, false) end as seasonality,
  case
    when s.n_periods = 0 then 'NO_TRAIN_PERIODS'
    when s.n_periods < 24 then 'INSUFFICIENT_PERIODS'
    when s.n_nonzero_periods = 0 then 'NO_NONZERO_DEMAND'
    when s.n_nonzero_periods < 2 then 'INSUFFICIENT_NONZERO_PERIODS'
    when s.mean_nonzero = 0 then 'ZERO_MEAN_DEMAND'
    when s.n_null_periods > 0 then 'SOURCE_NULL_QUANTITY_PRESENT'
    else null
  end as reason_code,
  case
    when s.n_nonzero_periods = 0 or s.n_nonzero_periods < 2 then 'CALCULATION_UNAVAILABLE'
    when s.n_null_periods > 0 then 'REVIEW_REQUIRED'
    else 'CALCULATED'
  end as stability
from stats s
left join recent r on r.item_id = s.item_id
left join peaks p on p.item_id = s.item_id
left join seasonal se on se.item_id = s.item_id;

create or replace view analytics.v_demand_profile_kpi as
select
  count(*)::integer as total_items,
  count(*) filter (where demand_type = 'SMOOTH')::integer as n_smooth,
  count(*) filter (where demand_type = 'INTERMITTENT')::integer as n_intermittent,
  count(*) filter (where demand_type = 'ERRATIC')::integer as n_erratic,
  count(*) filter (where demand_type = 'LUMPY')::integer as n_lumpy,
  count(*) filter (where demand_type in ('INTERMITTENT', 'LUMPY'))::integer as n_croston_needed,
  count(*) filter (where demand_type is null)::integer as n_calculation_unavailable
from analytics.v_sku_demand_profile;

grant select on analytics.v_sku_demand_profile, analytics.v_demand_profile_kpi to authenticated;

-- Verification examples:
-- select demand_type, count(*) from analytics.v_sku_demand_profile group by demand_type;
-- select * from analytics.v_demand_profile_kpi;
-- select count(*) from analytics.v_sku_demand_profile where demand_type is null and reason_code is null;
