/**
 * HarnessMap Pro - Crimp & Tooling Matrix (מטריצת לחיצה וכלים ייעודיים)
 * Detailed technical reference for Faston spade terminals, ring studs, and ratchet tools
 */

import React, { useState } from 'react';
import { TERMINAL_CATALOG, CRIMP_TOOLS } from '../utils/safetyEngine';
import { TerminalSpec, CrimpToolSpec } from '../types/harness';
import { Wrench, Search, Filter, ShieldCheck, Check, Info } from 'lucide-react';

export const CrimpMatrixTable: React.FC = () => {
  const [filterFamily, setFilterFamily] = useState<string>('ALL');
  const [filterBarrel, setFilterBarrel] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const terminals = Object.values(TERMINAL_CATALOG).filter((t) => {
    if (filterFamily !== 'ALL' && !t.family.startsWith(filterFamily)) return false;
    if (filterBarrel !== 'ALL' && t.barrel !== filterBarrel) return false;
    if (
      searchTerm &&
      !t.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !t.recommendedTool.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !t.standardPartNumber.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 p-6 overflow-y-auto text-right" dir="rtl">
      {/* Title & Technical Context */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 font-mono uppercase mb-1">
          <Wrench className="w-3.5 h-3.5" />
          <span>Industrial Tooling & Terminal Matrix (Crimp Standards)</span>
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-1">
          מטריצת לחיצה וכלים ייעודיים לטרמינלי פיוז וממסר
        </h2>
        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
          התאמה מדויקת בין מבנה נעל הכבל (Open-Barrel לעומת Closed-Barrel), עובי חוט המוליך (AWG/mm²), 
          וכלי הלחיצה התואם המבטיח לחיצת B-Crimp תקנית, אטימות לגזים (Gas-Tight Crimp) ועמידות במשיכה לפי תקן SAE J1128.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Family Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            {[
              { id: 'ALL', label: 'כל הטרמינלים' },
              { id: 'FASTON', label: 'נעלי כבל Faston' },
              { id: 'RING', label: 'נעלי כבל Ring (טבעת)' },
            ].map((fam) => (
              <button
                key={fam.id}
                onClick={() => setFilterFamily(fam.id)}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${
                  filterFamily === fam.id
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {fam.label}
              </button>
            ))}
          </div>

          {/* Barrel Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setFilterBarrel('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterBarrel === 'ALL'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              כל המבנים
            </button>
            <button
              onClick={() => setFilterBarrel('OPEN_BARREL_UNINSULATED')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterBarrel === 'OPEN_BARREL_UNINSULATED'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              מבנה פתוח (Open Barrel)
            </button>
            <button
              onClick={() => setFilterBarrel('CLOSED_BARREL_PREINSULATED')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterBarrel === 'CLOSED_BARREL_PREINSULATED'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              מבודדות (Closed Barrel)
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-64">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="חיפוש מק&quot;ט, כלי או מידה..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl mb-8">
        <table className="w-full text-right border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">סוג נעל כבל ומשפחה</th>
              <th className="py-3 px-4">רוחב לשונית / בורג</th>
              <th className="py-3 px-4">מבנה מכני</th>
              <th className="py-3 px-4">עובי חוט מתאים (AWG)</th>
              <th className="py-3 px-4">זרם רציף מרבי</th>
              <th className="py-3 px-4">כלי לחיצה מומלץ</th>
              <th className="py-3 px-4">סוג לחיצה (Crimp Profile)</th>
              <th className="py-3 px-4">מק"ט יצרן תקני</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {terminals.map((item) => (
              <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-4 font-sans font-semibold text-slate-200">
                  {item.name}
                </td>
                <td className="py-3.5 px-4 text-amber-400 font-bold">
                  {item.tabWidthMm ? `${item.tabWidthMm} mm (0.${Math.round(item.tabWidthMm / 0.0254)}")` : item.studSize}
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-sans font-medium ${
                      item.barrel === 'OPEN_BARREL_UNINSULATED'
                        ? 'bg-sky-950/60 text-sky-300 border border-sky-800/40'
                        : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                    }`}
                  >
                    {item.barrel === 'OPEN_BARREL_UNINSULATED' ? 'Open Barrel' : 'Pre-Insulated Closed'}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-300 font-bold">
                  {item.compatibleAwgMin} - {item.compatibleAwgMax} AWG
                </td>
                <td className="py-3.5 px-4 font-bold text-slate-100">
                  {item.maxContinuousCurrentA}A DC
                </td>
                <td className="py-3.5 px-4 text-amber-300 font-sans font-semibold">
                  {item.recommendedTool}
                </td>
                <td className="py-3.5 px-4 font-sans text-slate-300">
                  {item.crimpProfile === 'B_F_CRIMP' ? (
                    <span className="text-sky-300">B-Crimp (F-Crimp) Double Wing</span>
                  ) : item.crimpProfile === 'OVAL_INDENT' ? (
                    <span className="text-emerald-300">Oval / Indent Double-Crimp</span>
                  ) : (
                    <span>Hexagonal Stud Crimp</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                  {item.standardPartNumber}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visual Quality Standards & Crimp Cross-Section Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CRIMP_TOOLS.map((tool) => (
          <div key={tool.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-amber-400">{tool.model}</span>
                <span className="text-[10px] text-slate-400">{tool.manufacturer}</span>
              </div>
              <div className="text-xs font-semibold text-slate-200 mb-1">{tool.crimpType}</div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">{tool.description}</p>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex justify-between">
              <span>Range: {tool.wireRangeAwg}</span>
              <span className="text-sky-400">Jaws: {tool.jawMarkings.join(', ')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
