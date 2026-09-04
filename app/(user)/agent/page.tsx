import PageHeader from '@/components/shell/page-header';
import { requireUser } from '@/lib/auth';
import ChatForm from './chat-form';

export default async function AgentPage() {
  await requireUser();
  const enabled = Boolean((process.env.OPENAI_BASE_URL ?? '').trim() && (process.env.OPENAI_API_KEY ?? '').trim() && (process.env.OPENAI_MODEL ?? '').trim());
  return <><PageHeader eyebrow="ASSISTANT / SCM AGENT" title="SCM Agent" description="실데이터 근거와 구조화된 답변으로 SCM 질문을 확인합니다." /><ChatForm enabled={enabled} /></>;
}
