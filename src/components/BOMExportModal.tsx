/**
 * HarnessMap Pro - BOM (Bill of Materials) & Shop Traveler Exporter
 * 100% Client-Side generation with CSV and Print capabilities
 */

import React from 'react';
import { BOMItem } from '../types/harness';
import { X, Download, Printer, FileText, CheckCircle2 } from 'lucide-react';

interface BOMExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bomItems: BOMItem[];
  projectName?: string;
}

export const BOMExportModal: React.FC<BOMExportModalProps> = ({
  isOpen,
  onClose,
  bomItems,
  projectName = 'Dual 40A Aux Light Bar & Fog Harness',
}) => {
  if (!isOpen) return null;

  // Export to CSV directly in browser
  const handleDownloadCsv = () => {
    const headers = ['Category', 'Part Number', 'Description', 'Specification', 'Quantity', 'Unit', 'Tooling Required'];
    const rows = bomItems.map((item) => [
      `"${item.category}"`,
      `"${item.partNumber}"`,
      `"${item.description.replace(/"/g, '""')}"`,
      `"${item.specification.replace(/"/g, '""')}"`,
      item.quantity,
      `"${item.unit}"`,
      `"${(item.toolingRequired || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HarnessMap_Pro_BOM_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  // Group by category
  const categories = Array.from(new Set(bomItems.map((b) => b.category)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-right" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">רשימת חומרים נלווים וכרטיס ניתוב ייצור (BOM)</h3>
              <p className="text-xs text-slate-400">
                {projectName} · תואם תקני ISO 7588-1 & SAE J1128
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>הורד קובץ CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
            >
              <Printer className="w-4 h-4" />
              <span>הדפס כרטיס ניתוב</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {categories.map((cat) => {
            const items = bomItems.filter((i) => i.category === cat);
            return (
              <div key={cat} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-wider font-mono border-b border-slate-800 pb-1">
                  <span>{cat}</span>
                  <span className="text-slate-400">{items.length} items</span>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-mono text-[11px]">
                        <th className="py-2.5 px-4">מק"ט (Part #)</th>
                        <th className="py-2.5 px-4">תיאור הרכיב</th>
                        <th className="py-2.5 px-4">מפרט טכני</th>
                        <th className="py-2.5 px-4 text-left">כמות</th>
                        <th className="py-2.5 px-4">יחידה</th>
                        <th className="py-2.5 px-4">כלי לחיצה נדרש</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-900/40">
                          <td className="py-2.5 px-4 font-mono font-bold text-amber-300">
                            {item.partNumber}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-200">
                            {item.description}
                          </td>
                          <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                            {item.specification}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-left text-white">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-400">
                            {item.unit}
                          </td>
                          <td className="py-2.5 px-4 font-sans text-sky-300 text-[11px]">
                            {item.toolingRequired || 'הרכבה ידנית'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-900/90 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>מאושר להכנה ולחיצה בסדנת הכבילה (Production Ready)</span>
          </div>
          <span>סה"כ רכיבים לצמה: {bomItems.reduce((acc, i) => acc + (i.unit === 'pcs' ? i.quantity : 1), 0)}</span>
        </div>
      </div>
    </div>
  );
};
