-- STEP 7 verification queries. Run after migrations 00000 through 00005.

select * from analytics.v_backtest_run order by started_at desc;
select * from analytics.v_backtest_run_kpi;

-- All candidate models and their saved metrics/ranks.
select backtest_run_id, item_id, model_id, model_version, wape, mape, bias, rmse, mae, baseline_improvement, rank, calculation_status, reason_code
from analytics.v_model_performance
order by backtest_run_id desc, item_id, rank nulls last, model_id;

-- AUTO/MANUAL champion and complete candidate evidence.
select item_id, champion_model_id, champion_metric, champion_metric_value, selection_method, selection_reason, candidate_performance
from analytics.v_champion_history
order by selected_at desc;

-- Calculation-unavailable rows must have a reason and must not be ranked first.
select count(*) as invalid_unavailable_rows
from analytics.v_model_performance
where calculation_status = 'CALCULATION_UNAVAILABLE' and (reason_code is null or rank = 1);

-- Missing sigma must not produce an interval.
select count(*) as invalid_prediction_intervals
from analytics.v_forecast_result
where sigma is null and (p80 is not null or p90 is not null);

-- Test Actual comes from the validation view and must not overlap the train view.
select count(*) as train_test_overlap
from core.v_train_demand train
join core.v_test_actual test using (item_id, usage_date);
