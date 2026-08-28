import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';
import { requireAdmin } from '@/lib/auth';
import ModelConfigTable from './model-config-table';

export default async function ForecastModelsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.schema('analytics').from('v_model_config').select('*').order('model_id');
  return <><PageHeader eyebrow="ADMIN / FORECAST MODELS" title="Forecast Models" description="SQL Baseline 모델의 활성화 상태와 parameters를 DB에서 관리합니다." /><Panel title="Model Registry" description="모델 정의 변경은 이후 실행부터 적용되며 기존 run snapshot에는 영향을 주지 않습니다."><ModelConfigTable models={(data ?? []) as never[]} /></Panel></>;
}
