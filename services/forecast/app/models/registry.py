from .classical import ExponentialSmoothingModel, HoltModel, HoltWintersModel, LightGBMModel, ProphetModel, SarimaModel, XGBoostModel
from .intermittent import CrostonModel, SbaModel, TsbModel

MODEL_REGISTRY = {model.model_id: model for model in [ExponentialSmoothingModel(), HoltModel(), HoltWintersModel(), SarimaModel(), ProphetModel(), CrostonModel(), SbaModel(), TsbModel(), XGBoostModel(), LightGBMModel()]}

def get_model(model_id: str):
    if model_id not in MODEL_REGISTRY:
        raise KeyError(f"MODEL_NOT_REGISTERED:{model_id}")
    return MODEL_REGISTRY[model_id]
