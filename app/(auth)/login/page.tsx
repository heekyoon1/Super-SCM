import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';
import LoginForm from '@/components/auth/login-form';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) { const params = await searchParams; const nextPath = params.next?.startsWith('/') && !params.next.startsWith('//') ? params.next : '/dashboard'; return <main className="content-shell"><PageHeader eyebrow="AUTHENTICATION" title="ProcureOps 로그인" description="SCM Control Center에 접속합니다." /><Panel title="로그인"><LoginForm nextPath={nextPath} /></Panel></main>; }
