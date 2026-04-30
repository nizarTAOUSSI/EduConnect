import type { ReactNode } from 'react';

interface TableProps {
  columns: string[];
  children: ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}

export default function Table({ columns, children, emptyMessage = "Aucune donnée trouvée.", isEmpty }: TableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isEmpty ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Td({ children, className = "" }: { children: ReactNode, className?: string }) {
  return <td className={`px-6 py-4 whitespace-nowrap text-sm text-slate-700 ${className}`}>{children}</td>;
}
