-- Apply the STEP 10 migration first, then run as an authenticated ADMIN/USER.
select item_id, safety_stock, calculation_status, calculation_reason from analytics.v_safety_stock order by item_id;
select item_id, recommended_qty, required_qty, moq, pack_size, recommended_order_date, is_immediate_order from analytics.purchase_recommendation order by item_id;
select count(*) as unavailable_without_reason from analytics.purchase_recommendation where calculation_status = 'CALCULATION_UNAVAILABLE' and calculation_reason is null;
select count(*) as invalid_pack_rounding from analytics.purchase_recommendation where recommended_qty > 0 and pack_size > 0 and mod(recommended_qty::numeric, pack_size::numeric) <> 0;
