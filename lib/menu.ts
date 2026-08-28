import { BarChart3, Boxes, Database, Gauge, Settings2, ShieldAlert, Timer, type LucideIcon } from 'lucide-react';

export type MenuRole = 'USER' | 'ADMIN';
export type MenuItem = { label: string; href: string; icon: LucideIcon; roles: MenuRole[] };

export const menuItems: MenuItem[] = [
  { label: '대시보드', href: '/dashboard', icon: Gauge, roles: ['USER', 'ADMIN'] },
  { label: 'Lead Time 분석', href: '/lead-time', icon: Timer, roles: ['USER', 'ADMIN'] },
  { label: 'Stockout Risk', href: '/stockout-risk', icon: ShieldAlert, roles: ['USER', 'ADMIN'] },
  { label: '수요·발주', href: '/demand', icon: BarChart3, roles: ['USER', 'ADMIN'] },
  { label: 'SKU Demand Profile', href: '/analysis/demand-profile', icon: BarChart3, roles: ['USER', 'ADMIN'] },
  { label: '재고·공급', href: '/supply', icon: Boxes, roles: ['USER', 'ADMIN'] },
  { label: '관리자 설정', href: '/admin/settings', icon: Settings2, roles: ['ADMIN'] },
  { label: 'Forecast 설정', href: '/admin/forecast-settings', icon: Settings2, roles: ['ADMIN'] },
  { label: 'Data Management', href: '/admin/data-management', icon: Database, roles: ['ADMIN'] },
];

export const getMenuItems = (role: MenuRole = 'USER') => menuItems.filter((item) => item.roles.includes(role));
