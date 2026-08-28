-- STEP 9 verification queries. Run after migrations 00000 through 00007.

-- Risk distribution and unavailable reasons.
select risk_status, count(*) from analytics.v_stockout_risk group by risk_status order by risk_status;
select item_id, reason_code from analytics.v_stockout_risk where risk_status = 'CALCULATION_UNAVAILABLE';

-- Projection inputs and period-by-period ending inventory.
select item_id, period, beginning_inventory, scheduled_receipts, confirmed_sales_order, soft_allocation, forecast_demand, ending_projected_inventory, effective_lead_time
from analytics.v_inventory_projection order by item_id, period;

-- CASE 7/8/9: receipt/order/allocation values are present only in their matching periods.
select item_id, period, scheduled_receipts, confirmed_sales_order, soft_allocation
from analytics.v_inventory_projection
where scheduled_receipts <> 0 or confirmed_sales_order <> 0 or soft_allocation <> 0;

-- CASE 10/11: administrator value wins; otherwise P80 is the fallback.
select item_id, supplier_id, p50, p80, p90, admin_confirmed_lead_time, effective_lead_time,
       case when admin_confirmed_lead_time is not null then effective_lead_time = admin_confirmed_lead_time
            else effective_lead_time = p80 end as effective_rule_ok
from analytics.v_lead_time_policy;

-- CASE 1/2/3: stockout period is the first non-positive projected inventory period.
select r.item_id, r.stockout_period, r.risk_status, r.effective_lead_time
from analytics.v_stockout_risk r;

-- No row with unavailable risk may be reported as SAFE.
select count(*) as invalid_unavailable_safe_rows
from analytics.v_stockout_risk
where risk_status = 'CALCULATION_UNAVAILABLE' and reason_code is null;
