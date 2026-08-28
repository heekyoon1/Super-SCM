-- STEP 10: SQL-only Safety Stock and Purchase Recommendation.
-- sigma_d = forecast error RMSE from STEP 7; sigma_L = stddev of observed lead_time_days.

create table if not exists core.service_level_policy (
  item_grade text primary key,
  service_level numeric not null check (service_level > 0 and service_level < 1),
  z_value numeric not null,
  description text,
  active boolean not null default true,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
insert into core.service_level_policy(item_grade, service_level, z_value, description)
values ('A', 0.95, 1.645, 'Default grade A service level'), ('B', 0.98, 2.054, 'Default grade B service level'), ('C', 0.99, 2.326, 'Default grade C service level')
on conflict (item_grade) do nothing;

alter table core.service_level_policy enable row level security;
grant select, insert, update, delete on core.service_level_policy to authenticated;
drop policy if exists service_level_policy_read on core.service_level_policy;
drop policy if exists service_level_policy_admin_write on core.service_level_policy;
create policy service_level_policy_read on core.service_level_policy for select to authenticated using (auth.role() = 'authenticated');
create policy service_level_policy_admin_write on core.service_level_policy for all to authenticated using (core.is_admin()) with check (core.is_admin());

create or replace view analytics.v_safety_stock as
with first_projection as (
  select distinct on (item_id) *
  from analytics.v_inventory_projection
  order by item_id, period
), current_champion as (
  select c.item_id, c.champion_model_id, c.model_version, br.forecast_run_id
  from analytics.v_champion_model c
  join core.backtest_run br on br.backtest_run_id = c.backtest_run_id
), forecast_error as (
  select p.item_id, p.rmse as sigma_d
  from analytics.v_champion_model c
  join core.model_performance p on p.backtest_run_id = c.backtest_run_id and p.item_id = c.item_id and p.model_id = c.champion_model_id and p.calculation_status = 'SUCCESS'
), lead_stats as (
  select item_id, avg(lead_time_days) as lead_time_mean, stddev_samp(lead_time_days) as sigma_l, count(*)::integer as lead_time_sample_count
  from raw.lead_time_observation
  where lead_time_days is not null and lead_time_days >= 0
  group by item_id
), lead_policy as (
  select item_id, max(effective_lead_time) as effective_lead_time
  from analytics.v_lead_time_policy
  group by item_id
), safety_inputs as (
  select ip.item_id, ip.item_name, ip.item_grade, ip.moq, ip.pack_size,
         sl.service_level, sl.z_value,
         fe.sigma_d, ls.lead_time_mean, ls.sigma_l, ls.lead_time_sample_count,
         coalesce(lp.effective_lead_time, fp.effective_lead_time) as effective_lead_time,
         fp.forecast_demand as forecast_qty, fp.confirmed_sales_order as confirmed_order_qty, fp.soft_allocation,
         fp.available_inventory, fp.scheduled_receipts as scheduled_receipt,
         sr.stockout_date, sr.risk_status, sr.reason_code as risk_reason_code,
         cm.forecast_run_id, cm.model_version,
         pc.safety_buffer_days
  from core.item_policy ip
  left join core.service_level_policy sl on sl.item_grade = ip.item_grade and sl.active = true
  left join first_projection fp on fp.item_id = ip.item_id
  left join analytics.v_stockout_risk sr on sr.item_id = ip.item_id
  left join forecast_error fe on fe.item_id = ip.item_id
  left join lead_stats ls on ls.item_id = ip.item_id
  left join lead_policy lp on lp.item_id = ip.item_id
  left join current_champion cm on cm.item_id = ip.item_id
  left join (select safety_buffer_days from core.policy_config where active = true order by policy_key limit 1) pc on true
), classified as (
  select s.*, greatest(s.forecast_qty, s.confirmed_order_qty) + coalesce(s.soft_allocation, 0) as demand_basis_qty,
    case
      when s.item_id is null then 'NO_ITEM_POLICY'
      when s.forecast_qty is null then 'NO_FORECAST'
      when s.available_inventory is null then 'NO_INVENTORY_DATA'
      when s.effective_lead_time is null then 'NO_LEADTIME'
      when s.sigma_d is null then 'INSUFFICIENT_FORECAST_ERROR'
      when s.sigma_l is null then 'INSUFFICIENT_LEADTIME_VARIABILITY'
      when s.service_level is null or s.z_value is null then 'NO_SERVICE_LEVEL'
      when s.safety_buffer_days is null then 'NO_POLICY_CONFIG'
      when s.moq is null or s.pack_size is null or s.pack_size <= 0 then 'NO_ITEM_POLICY'
    end as reason_code
  from safety_inputs s
), calculated as (
  select c.*,
    case when c.reason_code is null then c.z_value * sqrt((c.effective_lead_time * power(c.sigma_d, 2)) + (power(c.demand_basis_qty, 2) * power(c.sigma_l, 2))) end as safety_stock,
    case when c.reason_code is null then c.demand_basis_qty + c.z_value * sqrt((c.effective_lead_time * power(c.sigma_d, 2)) + (power(c.demand_basis_qty, 2) * power(c.sigma_l, 2))) - c.available_inventory - c.scheduled_receipt end as required_qty
  from classified c
)
select c.item_id, c.item_name, c.item_grade, c.forecast_qty, c.confirmed_order_qty, c.demand_basis_qty,
       c.available_inventory, c.scheduled_receipt, c.safety_stock, c.sigma_d, c.lead_time_mean, c.sigma_l, c.service_level, c.z_value,
       c.effective_lead_time, c.stockout_date, c.safety_buffer_days, c.required_qty,
       c.moq, c.pack_size, c.forecast_run_id, c.model_version, c.reason_code,
       case when c.reason_code is not null then null when c.required_qty <= 0 then 0 when c.moq > 0 then ceil(greatest(c.required_qty, c.moq) / c.pack_size) * c.pack_size else ceil(c.required_qty / c.pack_size) * c.pack_size end as recommended_qty,
       case when c.reason_code is null and c.stockout_date is not null then c.stockout_date - ceil(c.effective_lead_time)::integer - c.safety_buffer_days end as recommended_order_date,
       coalesce(c.risk_status, case when c.reason_code is null then 'SAFE' else 'CALCULATION_UNAVAILABLE' end) as risk_status,
       case when c.reason_code is null and c.required_qty <= 0 then 'NO_ORDER_REQUIRED' else c.reason_code end as calculation_reason,
       case when c.reason_code is null then 'CALCULATED' else 'CALCULATION_UNAVAILABLE' end as calculation_status,
       case when c.reason_code is null then jsonb_build_object('forecast_qty', c.forecast_qty, 'confirmed_order_qty', c.confirmed_order_qty, 'soft_allocation', c.soft_allocation, 'demand_basis_qty', c.demand_basis_qty, 'sigma_d', c.sigma_d, 'sigma_l', c.sigma_l, 'effective_lead_time', c.effective_lead_time, 'z_value', c.z_value, 'safety_stock', c.safety_stock, 'available_inventory', c.available_inventory, 'scheduled_receipt', c.scheduled_receipt, 'required_qty', c.required_qty, 'moq', c.moq, 'pack_size', c.pack_size, 'recommended_qty', case when c.required_qty <= 0 then 0 when c.moq > 0 then ceil(greatest(c.required_qty, c.moq) / c.pack_size) * c.pack_size else ceil(c.required_qty / c.pack_size) * c.pack_size end) end as calculation_trace
from calculated c;

create or replace view analytics.purchase_recommendation as
select item_id, item_name, item_grade, forecast_qty, confirmed_order_qty, demand_basis_qty, available_inventory, scheduled_receipt, safety_stock, effective_lead_time, stockout_date, safety_buffer_days, required_qty, moq, pack_size, recommended_qty, recommended_order_date, risk_status, calculation_status, calculation_reason as reason_code, forecast_run_id, model_version, calculation_trace,
       recommended_order_date < current_date as is_immediate_order,
       recommended_order_date is not null and recommended_order_date < current_date as is_overdue
from analytics.v_safety_stock;

grant select on analytics.v_safety_stock, analytics.purchase_recommendation to authenticated;
