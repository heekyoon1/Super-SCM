import type { ButtonHTMLAttributes, ReactNode } from 'react';

export default function Button({ children, variant = 'default', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'primary' | 'danger'; children: ReactNode }) {
  return <button className={`button ${variant === 'primary' ? 'button-primary' : variant === 'danger' ? 'button-danger' : ''}`} {...props}>{children}</button>;
}
