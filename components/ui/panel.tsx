import type { ReactNode } from 'react';

export default function Panel({ title, description, actions, children }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode }) {
  return <section className="panel">{title && <div className="panel-header"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{actions}</div>}<div className="panel-body">{children}</div></section>;
}
