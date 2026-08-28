-- STEP 5 verification queries. Run after applying migrations 00000 through 00003.

-- Every profile has either a supported demand type or an explicit reason.
select count(*) as profiles_without_result_or_reason
from analytics.v_sku_demand_profile
where demand_type is null and reason_code is null;

-- KPI and Croston candidates.
select * from analytics.v_demand_profile_kpi;
select item_id, demand_type, adi, cv_squared
from analytics.v_sku_demand_profile
where demand_type in ('INTERMITTENT', 'LUMPY');

-- Seasonality must remain unavailable below 24 training periods.
select count(*) as invalid_short_period_seasonality
from analytics.v_sku_demand_profile
where n_periods < 24 and seasonality is not null;

-- The configured train and test views must not overlap on SKU/date.
select count(*) as train_test_overlap
from core.v_train_demand train
join core.v_test_actual test using (item_id, usage_date);

-- Add a test-period row in a transaction, compare the profile, then roll it back.
-- The profile must be unchanged because it reads core.v_train_demand only.
-- begin;
-- select * into temporary demand_profile_before from analytics.v_sku_demand_profile;
-- insert into raw.usage_history(item_id, usage_date, quantity, source_type)
-- values ('STEP5_TEST_SKU', (select test_start from core.forecast_setting where setting_key = 'default'), 999, 'VERIFICATION');
-- select * from analytics.v_sku_demand_profile where item_id = 'STEP5_TEST_SKU';
-- rollback;
