-- Run these queries after applying 20260828000001_step3_data_model_isolation.sql.

-- 1) Configuration and data coverage.
select * from analytics.v_data_coverage;

-- 2) No train/test overlap at the item/date grain.
select count(*) as train_test_overlap_count
from core.v_train_demand train
join core.v_test_actual test
  on test.item_id = train.item_id
 and test.usage_date = train.usage_date;

-- 3) Every test row is inside the configured test window.
select count(*) as rows_outside_test_window
from core.v_test_actual actual
cross join core.forecast_setting setting
where setting.setting_key = 'default'
  and (actual.usage_date < setting.test_start or actual.usage_date > setting.test_end);

-- 4) Raw ingestion tables are not directly granted to anon/authenticated.
select table_schema, table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'raw'
  and grantee in ('anon', 'authenticated');
