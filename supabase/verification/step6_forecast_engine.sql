-- STEP 6 verification queries. Run after migrations 00000 through 00004.

-- Model registry and DB-managed parameters.
select model_id, version, enabled, parameters, applicable_demand_type
from analytics.v_model_config
order by model_id;

-- Run status, model snapshots, and stale state.
select run_id, status, n_models, n_items, n_rows, data_snapshot_at, is_stale
from analytics.v_forecast_run
order by started_at desc;
select run_id, model_id, version, parameters, definition
from core.model_version
order by snapshotted_at desc;

-- Result rows must carry run/model/version and expose interval fields.
select count(*) as result_rows_without_identity
from analytics.v_forecast_result
where run_id is null or model_id is null or model_version is null;
select model_id, count(*) as rows, count(*) filter (where p50 is not null) as p50_rows,
       count(*) filter (where p80 is not null) as p80_rows,
       count(*) filter (where p90 is not null) as p90_rows,
       count(*) filter (where sigma is not null) as sigma_rows
from analytics.v_forecast_result
group by model_id;

-- A missing sigma must never produce an interval.
select count(*) as invalid_intervals
from analytics.v_forecast_result
where sigma is null and (p80 is not null or p90 is not null);

-- Forecast periods must start after train_end and remain within configured horizon.
select count(*) as invalid_horizon_rows
from analytics.v_forecast_result r
join analytics.v_forecast_run run using (run_id)
where r.period <= run.train_end
   or r.period > (run.train_end + (run.horizon * interval '1 month'))::date;

-- Train/test boundaries must not overlap.
select count(*) as train_test_overlap
from core.v_train_demand train
join core.v_test_actual test using (item_id, usage_date);
