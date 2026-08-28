import type { ReactNode } from 'react';

export type DataColumn<T> = { key: string; label: string; numeric?: boolean; render?: (row: T) => ReactNode };
export default function DataTable<T extends { id: string }>({ columns, rows }: { columns: DataColumn<T>[]; rows: T[] }) {
  return <div className="data-table-wrap"><table className="data-table"><thead><tr>{columns.map((column) => <th className={column.numeric ? 'numeric' : ''} key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{columns.map((column) => <td className={column.numeric ? 'numeric' : ''} key={column.key}>{column.render ? column.render(row) : String(row[column.key as keyof T] ?? '')}</td>)}</tr>)}</tbody></table></div>;
}
