-- STEP 8: Python model registry entries. The Python service consumes only enabled PYTHON models.
insert into core.model_config (model_id, model_name, family, engine, version, enabled, is_default, applicable_demand_type, parameters, description)
values
  ('PY_EXP_SMOOTHING', 'Python Exponential Smoothing', 'EXPONENTIAL_SMOOTHING', 'PYTHON', '1.0.0', true, false, array['SMOOTH','ERRATIC'], '{"alpha": 0.3}'::jsonb, 'Python service level smoothing'),
  ('PY_HOLT', 'Python Holt', 'HOLT', 'PYTHON', '1.0.0', true, false, array['SMOOTH','ERRATIC'], '{"alpha": 0.3, "beta": 0.1}'::jsonb, 'Python level and trend smoothing'),
  ('PY_HOLT_WINTERS', 'Python Holt-Winters', 'HOLT_WINTERS', 'PYTHON', '1.0.0', true, false, array['SMOOTH','ERRATIC'], '{"season_length": 12}'::jsonb, 'Python seasonal level/trend model'),
  ('PY_CROSTON', 'Python Croston', 'CROSTON', 'PYTHON', '1.0.0', true, false, array['INTERMITTENT','LUMPY'], '{"alpha": 0.1}'::jsonb, 'Intermittent demand Croston model'),
  ('PY_SBA', 'Python SBA', 'CROSTON', 'PYTHON', '1.0.0', true, false, array['INTERMITTENT','LUMPY'], '{"alpha": 0.1}'::jsonb, 'Syntetos-Boylan adjustment'),
  ('PY_TSB', 'Python TSB', 'CROSTON', 'PYTHON', '1.0.0', true, false, array['INTERMITTENT','LUMPY'], '{"alpha": 0.1, "beta": 0.1}'::jsonb, 'Teunter-Syntetos-Babai model'),
  ('PY_SARIMA', 'Python SARIMA', 'SARIMA', 'PYTHON', '1.0.0', false, false, array['SMOOTH','ERRATIC'], '{"order": [1,1,1], "seasonal_order": [0,1,1,12]}'::jsonb, 'Optional statsmodels adapter'),
  ('PY_PROPHET', 'Python Prophet', 'PROPHET', 'PYTHON', '1.0.0', false, false, array['SMOOTH','ERRATIC'], '{}'::jsonb, 'Optional Prophet adapter'),
  ('PY_XGBOOST', 'Python XGBoost', 'GRADIENT_BOOSTING', 'PYTHON', '1.0.0', false, false, array['SMOOTH','ERRATIC'], '{"n_estimators": 200}'::jsonb, 'Optional XGBoost adapter'),
  ('PY_LIGHTGBM', 'Python LightGBM', 'GRADIENT_BOOSTING', 'PYTHON', '1.0.0', false, false, array['SMOOTH','ERRATIC'], '{"n_estimators": 200}'::jsonb, 'Optional LightGBM adapter')
on conflict (model_id) do nothing;
