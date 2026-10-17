/**
 * HarnessMap Pro - Wire Schedule File Uploader & Importer Modal (100% Client-Side)
 * Supports file uploading (.csv, .tsv, .txt), drag & drop, paste, and auto-schematic building
 */

import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Layers,
  FileUp,
  Cpu,
  Radio,
  ShieldAlert,
} from 'lucide-react';
import { parseWireScheduleTable, USER_SAMPLE_WIRE_SCHEDULE, ParseResult } from '../utils/csvWireParser';
import { CircuitNode, WireConnection } from '../types/harness';

interface WireScheduleImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (nodes: CircuitNode[], wires: WireConnection[], subsystems: string[]) => void;
}

export const WireScheduleImporterModal: React.FC<WireScheduleImporterModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [rawText, setRawText] = useState<string>(USER_SAMPLE_WIRE_SCHEDULE);
  const [preview, setPreview] = useState<ParseResult>(() => parseWireScheduleTable(USER_SAMPLE_WIRE_SCHEDULE));
  const [fileName, setFileName] = useState<string>('sample_can_powertrain_body_harness.csv');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleTextChange = (text: string) => {
    setRawText(text);
    const parsed = parseWireScheduleTable(text);
    setPreview(parsed);
  };

  const handleLoadDefaultSample = () => {
    setRawText(USER_SAMPLE_WIRE_SCHEDULE);
    setFileName('automotive_network_42_wires.csv');
    const parsed = parseWireScheduleTable(USER_SAMPLE_WIRE_SCHEDULE);
    setPreview(parsed);
  };

  // 100% Client-Side File Reader
  const processUploadedFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setRawText(content);
        const parsed = parseWireScheduleTable(content);
        setPreview(parsed);
      }
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleExecuteImport = () => {
    if (preview.wires.length === 0) return;
    onImportComplete(preview.nodes, preview.wires, preview.subsystems);
    onClose();
  };

  // Count twisted pairs and termination resistors
  const twistedPairCount = new Set(preview.wires.map((w) => w.twistedPairId).filter((tp) => tp && tp !== 'NONE')).size;
  const termResistorCount = preview.wires.filter((w) => w.terminationResistor && w.terminationResistor.includes('120')).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-right" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">העלאת קובץ טבלת חיווט ויצירת סרטוט אוטומטי</h3>
              <p className="text-xs text-slate-400">
                עיבוד 100% בדפדפן (Client-Side) לקבצי CSV / TSV / Netlist עם זיהוי רשתות ומערכים
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLoadDefaultSample}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>טען טבלת 42 חוטים (ברירת מחדל)</span>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Client-Side File Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-4 border-2 border-dashed rounded-xl cursor-pointer text-center transition-all ${
              isDragging
                ? 'border-amber-400 bg-amber-500/10'
                : 'border-slate-700 bg-slate-950/40 hover:border-slate-500 hover:bg-slate-950/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <FileUp className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-200">
              גרור ושחרר קובץ טבלה (CSV / TSV) או לחץ לבחירת קובץ מהמחשב
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              הקובץ מעובד ונשמר מקומית בדפדפן בלבד (ללא שליחה לשרת חיצוני) · קובץ פעיל: <span className="font-mono text-amber-300">{fileName}</span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
              <span className="text-slate-400">סה"כ מוליכים:</span>
              <span className="font-mono font-bold text-amber-400 text-sm">{preview.rawRowsCount}</span>
            </div>
            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
              <span className="text-slate-400">רכיבים ומחשבים:</span>
              <span className="font-mono font-bold text-sky-400 text-sm">{preview.nodes.length}</span>
            </div>
            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
              <span className="text-slate-400">זוגות שזורים (TP):</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{twistedPairCount}</span>
            </div>
            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
              <span className="text-slate-400">נגדי סיומת 120Ω:</span>
              <span className="font-mono font-bold text-purple-400 text-sm">{termResistorCount}</span>
            </div>
          </div>

          {/* Subsystems detected badges */}
          {preview.subsystems.length > 0 && (
            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>רשתות ומערכים שזוהו אוטומטית (Subsystems):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {preview.subsystems.map((sub) => (
                  <span
                    key={sub}
                    className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-medium"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Raw Text Preview Collapsible / Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <label className="font-semibold text-slate-200">טקסט הטבלה הגולמי (ניתן לערוך ידנית):</label>
              <span className="text-slate-400 font-mono text-[11px] ltr">Wire_ID, Network_Bus, Signal, From, To, AWG, Colors...</span>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => handleTextChange(e.target.value)}
              rows={6}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed resize-none text-left"
              dir="ltr"
            />
          </div>

          {/* Live Table Preview */}
          {preview.wires.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-300 mb-2">תצוגה מקדימה של נתוני הצמה שייבנו:</div>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 text-xs">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-mono text-[11px]">
                      <th className="py-2 px-3">סימון חוט</th>
                      <th className="py-2 px-3">רשת / Bus</th>
                      <th className="py-2 px-3">מקור (From)</th>
                      <th className="py-2 px-3">יעד (To)</th>
                      <th className="py-2 px-3">אות</th>
                      <th className="py-2 px-3">AWG</th>
                      <th className="py-2 px-3">צבע ראשי / פס</th>
                      <th className="py-2 px-3">זרם / פיוז</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 font-mono">
                    {preview.wires.slice(0, 15).map((w) => (
                      <tr key={w.id} className="hover:bg-slate-900/40">
                        <td className="py-1.5 px-3 font-bold text-amber-300">{w.wireNumber}</td>
                        <td className="py-1.5 px-3 text-sky-400 text-[10px]">{w.networkBus}</td>
                        <td className="py-1.5 px-3 text-slate-200">{w.fromNodeId}:{w.fromPin}</td>
                        <td className="py-1.5 px-3 text-slate-200">{w.toNodeId}:{w.toPin}</td>
                        <td className="py-1.5 px-3 text-slate-300 font-sans">{w.signalName}</td>
                        <td className="py-1.5 px-3 font-bold text-slate-300">{w.gaugeAwg} AWG</td>
                        <td className="py-1.5 px-3 font-sans">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: w.color }} />
                            <span>{w.colorName}</span>
                            {w.stripeColor && <span className="text-[10px] text-slate-400">({w.stripeColor})</span>}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-amber-400 font-bold">
                          {w.expectedCurrentAmps}A / {w.fuseRatingA ? `${w.fuseRatingA}A` : 'ללא'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.wires.length > 15 && (
                <div className="text-[11px] text-slate-500 text-center mt-1">
                  ועוד {preview.wires.length - 15} מוליכים נוספים בסרטוט המלא...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-900/90 text-xs">
          <span className="text-slate-400">
            {preview.wires.length > 0
              ? `מוכן לבניית סרטוט עם ${preview.wires.length} מוליכים, ${preview.nodes.length} רכיבים ו-${preview.subsystems.length} רשתות`
              : 'העלה או הדבק טבלה תקפה כדי להמשיך'}
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-medium"
            >
              ביטול
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={preview.wires.length === 0}
              className="flex items-center gap-1.5 px-5 py-2 text-slate-950 font-bold bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>בנה סרטוט ומערכים אוטומטית</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
