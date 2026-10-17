/**
 * HarnessMap Pro - Component Pinout & Assembly Inspector Modal
 * Displays complete pinout ledger, wire origins, destinations, terminal tooling, and 3D preview
 */

import React from 'react';
import {
  CircuitNode,
  WireConnection,
} from '../types/harness';
import {
  X,
  Cpu,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  CircleDot,
  Wrench,
  ShieldAlert,
  Zap,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { InspectableModel } from './ThreeWorkbench';

interface ComponentPinoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: CircuitNode | null;
  allWires: WireConnection[];
  assembledWireIds: Set<string>;
  onToggleWireAssembled: (wireId: string) => void;
  onSelectComponentFor3D: (model: InspectableModel) => void;
  onSelectWireForFocus: (wireId: string) => void;
}

export const ComponentPinoutModal: React.FC<ComponentPinoutModalProps> = ({
  isOpen,
  onClose,
  node,
  allWires,
  assembledWireIds,
  onToggleWireAssembled,
  onSelectComponentFor3D,
  onSelectWireForFocus,
}) => {
  if (!isOpen || !node) return null;

  // Find all wires connected to this component (either source or destination)
  const connectedWires = allWires.filter(
    (w) => w.fromNodeId === node.id || w.toNodeId === node.id
  );

  // Collect all unique pins from predefined node pins + actual connected wires
  const pinMetaMap = new Map<string, { label: string; description?: string; isPower?: boolean }>();
  if (node.pins && node.pins.length > 0) {
    node.pins.forEach((p) => {
      pinMetaMap.set(p.pin, { label: p.label || p.pin, description: p.description, isPower: p.isPower });
    });
  }

  // Also include any pin referenced by connected wires
  connectedWires.forEach((w) => {
    if (w.fromNodeId === node.id && !pinMetaMap.has(w.fromPin)) {
      pinMetaMap.set(w.fromPin, { label: `פין ${w.fromPin}`, description: w.signalName });
    }
    if (w.toNodeId === node.id && !pinMetaMap.has(w.toPin)) {
      pinMetaMap.set(w.toPin, { label: `פין ${w.toPin}`, description: w.signalName });
    }
  });

  // Build pinRows supporting multiple incoming/outgoing wires per pin
  const pinRows = Array.from(pinMetaMap.entries()).map(([pinId, meta]) => {
    const wiresOut = connectedWires.filter((w) => w.fromNodeId === node.id && w.fromPin === pinId);
    const wiresIn = connectedWires.filter((w) => w.toNodeId === node.id && w.toPin === pinId);
    const wireEntries = [
      ...wiresOut.map((w) => ({ wire: w, isSource: true })),
      ...wiresIn.map((w) => ({ wire: w, isSource: false })),
    ];

    return {
      pin: pinId,
      label: meta.label,
      description: meta.description,
      isPower: meta.isPower || wireEntries.some((e) => e.wire.signalType === 'Power'),
      wireEntries,
    };
  });

  // Calculate 3D model match
  const infer3DModel = (): InspectableModel => {
    const id = node.id.toLowerCase();
    const type = node.type.toLowerCase();
    if (id.includes('ecu') || id.includes('tcu') || id.includes('bcm') || id.includes('gateway') || id.includes('cluster') || id.includes('hvac')) {
      return 'ecu_module';
    }
    if (id.includes('fuse_block') || type.includes('fuse_block')) {
      return 'fuse_block';
    }
    if (id.includes('battery') || type.includes('battery')) {
      return 'battery_12v';
    }
    if (id.includes('ground') || id.includes('gnd') || type.includes('ground')) {
      return 'ground_chassis';
    }
    if (id.includes('radar') || id.includes('camera') || id.includes('sensor')) {
      return 'radar_sensor';
    }
    if (id.includes('obd') || id.includes('diagnostic')) {
      return 'obd2_connector';
    }
    if (type.includes('fuse')) {
      return 'fuse_ato_30';
    }
    return 'relay_iso_5pin';
  };

  const model3D = infer3DModel();
  const assembledCount = connectedWires.filter((w) => assembledWireIds.has(w.id)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs text-right" dir="rtl">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{node.name}</h3>
                <span className="font-mono text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  ID: {node.id}
                </span>
                {node.ratingAmps && (
                  <span className="font-mono text-xs text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                    דירוג: {node.fuseRatingAmps ? `${node.fuseRatingAmps}A Fuse` : `${node.ratingAmps}A`}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {node.subsystem} · מפת חיבורי רגליים ומוצא מוליכים (Pinout & Harness Assembly Map)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onSelectComponentFor3D(model3D);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-300 bg-sky-950/50 hover:bg-sky-900/70 border border-sky-500/30 rounded-lg transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>פתח בסדנת 3D</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress & Quick Stats Banner */}
        <div className="px-6 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">התקדמות הרכבת רכיב זה:</span>
            <span className="font-bold text-emerald-400 font-mono">
              {assembledCount} מתוך {connectedWires.length} מוליכים חוברו ({connectedWires.length > 0 ? Math.round((assembledCount / connectedWires.length) * 100) : 0}%)
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <span>סה"כ רגליים: {pinRows.length}</span>
            <span>·</span>
            <span>חוטים מחוברים: {connectedWires.length}</span>
          </div>
        </div>

        {/* Pinout Ledger Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-medium border-b border-slate-800 uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">רגל / פין</th>
                  <th className="py-2.5 px-3">תפקיד הרגל</th>
                  <th className="py-2.5 px-3">מזהה כבל</th>
                  <th className="py-2.5 px-3">כיוון ומוצא / יעד</th>
                  <th className="py-2.5 px-3">עובי וצבע</th>
                  <th className="py-2.5 px-3">זרם ופיוז</th>
                  <th className="py-2.5 px-3">נעל כבל וכלי</th>
                  <th className="py-2.5 px-3 text-center">סטטוס הרכבה</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {pinRows.map((row) => {
                  const hasWires = row.wireEntries.length > 0;
                  const allAssembled = hasWires && row.wireEntries.every((e) => assembledWireIds.has(e.wire.id));

                  if (!hasWires) {
                    return (
                      <tr key={row.pin} className="hover:bg-slate-900/40 transition-colors opacity-70">
                        <td className="py-2.5 px-3 font-bold text-amber-400/80 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded">
                            {row.pin}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 font-sans">
                          <div>{row.label}</div>
                          {row.description && <div className="text-[10px] text-slate-500">{row.description}</div>}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 italic">לא מחובר (פנוי)</td>
                        <td className="py-2.5 px-3 text-slate-600">—</td>
                        <td className="py-2.5 px-3 text-slate-600">—</td>
                        <td className="py-2.5 px-3 text-slate-600">—</td>
                        <td className="py-2.5 px-3 text-slate-600">—</td>
                        <td className="py-2.5 px-3 text-center text-slate-600">—</td>
                      </tr>
                    );
                  }

                  return row.wireEntries.map((entry, entryIdx) => {
                    const wire = entry.wire;
                    const isAssembled = assembledWireIds.has(wire.id);

                    return (
                      <tr
                        key={`${row.pin}-${wire.id}-${entryIdx}`}
                        className={`hover:bg-slate-900/60 transition-colors ${
                          isAssembled ? 'bg-emerald-950/15' : ''
                        }`}
                      >
                        {/* Pin ID */}
                        <td className="py-2.5 px-3 font-bold text-amber-400 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded">
                            {row.pin}
                          </span>
                          {row.wireEntries.length > 1 && (
                            <span className="mr-1 text-[9px] px-1 py-0.2 bg-purple-950 text-purple-300 border border-purple-700/50 rounded">
                              פין משותף ({entryIdx + 1}/{row.wireEntries.length})
                            </span>
                          )}
                        </td>

                        {/* Pin Label */}
                        <td className="py-2.5 px-3 text-slate-200 font-sans">
                          <div>{row.label}</div>
                          {row.description && (
                            <div className="text-[10px] text-slate-500 font-sans">{row.description}</div>
                          )}
                        </td>

                        {/* Wire ID */}
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => {
                              onSelectWireForFocus(wire.id);
                              onClose();
                            }}
                            className="font-bold text-sky-400 hover:text-sky-300 underline underline-offset-2"
                            title="לחץ להתמקדות בכבל זה בסרטוט"
                          >
                            {wire.wireNumber || wire.id}
                          </button>
                        </td>

                        {/* Direction and Origin / Destination */}
                        <td className="py-2.5 px-3 font-sans">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            {entry.isSource ? (
                              <>
                                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1 rounded">מוצא ➔</span>
                                <span className="font-semibold">{wire.toNodeId}</span>
                                <span className="text-slate-500 text-[10px] font-mono">[{wire.toPin}]</span>
                              </>
                            ) : (
                              <>
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1 rounded">מבוא ⬅</span>
                                <span className="font-semibold">{wire.fromNodeId}</span>
                                <span className="text-slate-500 text-[10px] font-mono">[{wire.fromPin}]</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Gauge & Color */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-slate-600 shadow-xs shrink-0"
                              style={{ backgroundColor: wire.color }}
                              title={wire.colorName}
                            />
                            <span className="text-slate-200">{wire.gaugeAwg} AWG</span>
                            <span className="text-slate-400 text-[10px]">({wire.colorName || wire.color})</span>
                          </div>
                        </td>

                        {/* Current & Fuse */}
                        <td className="py-2.5 px-3 text-slate-300">
                          <div>
                            <span>{wire.expectedCurrentAmps}A</span>
                            {wire.fuseRatingA ? (
                              <span className="text-slate-500 text-[10px]"> (פיוז: {wire.fuseRatingA}A)</span>
                            ) : null}
                          </div>
                        </td>

                        {/* Terminal & Tool */}
                        <td className="py-2.5 px-3 font-sans text-[11px] text-slate-400">
                          <div>
                            <div className="text-slate-300">Faston 6.3mm OB</div>
                            <div className="text-[10px] text-amber-400/90">כלי: SN-48B / B-Crimp</div>
                          </div>
                        </td>

                        {/* Assembly Checkbox */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => onToggleWireAssembled(wire.id)}
                            className={`px-3 py-1 rounded text-[11px] font-bold transition-all flex items-center justify-center gap-1 mx-auto ${
                              isAssembled
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isAssembled ? 'הורכב ✓' : 'סמן'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-400">
            הקלק על מזהה כבל כדי להדגיש אותו בסרטוט הראשי
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
          >
            סגור חלון
          </button>
        </div>
      </div>
    </div>
  );
};
