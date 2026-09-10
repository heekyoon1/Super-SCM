'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/analysis/demand-profile', label: 'Demand Profile' },
  { href: '/analysis/model-comparison', label: 'Model Comparison' },
  { href: '/analysis/inventory-projection', label: 'Inventory Projection' },
];

export default function AnalysisTabs() {
  const pathname = usePathname();
  return <nav className="analysis-tabs" aria-label="분석 메뉴">
    {tabs.map((tab) => <Link key={tab.href} href={tab.href} className={pathname === tab.href ? 'analysis-tab active' : 'analysis-tab'}>{tab.label}</Link>)}
  </nav>;
}
