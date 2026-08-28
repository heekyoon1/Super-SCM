import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';
import Button from '@/components/ui/button';

export default function LoginPage() { return <main className="content-shell"><PageHeader eyebrow="AUTHENTICATION" title="ProcureOps 로그인" description="SCM Control Center에 접속합니다." /><Panel title="로그인"><div className="stack"><input className="field" aria-label="이메일" placeholder="이메일" /><input className="field" aria-label="비밀번호" placeholder="비밀번호" type="password" /><Button variant="primary">로그인</Button></div></Panel></main>; }
