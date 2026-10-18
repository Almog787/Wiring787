/**
 * HarnessMap Pro - 2D Interactive Schematic & Step-by-Step Assembly Studio (Hebrew Edition)
 * Features:
 * - Uncrowded, spacious technical layout with generous spacing between subsystems
 * - Pin-level anchor routing: wires connect to exact physical pin sockets on components
 * - Interactive Step-by-Step Assembly Guide (מדריך הרכבה צעד-אחר-צעד עם מוצא ויעד לכל כבל)
 * - Pinout map and origin/destination display on every component card
 * - Hover & click wire isolation / focus mode (dims other wires)
 * - Minimizable Alerts Bar with 2+ solutions per violation and 1-click automatic fix
 * - Subsystem / Sub-harness array partitioning (חלוקה למערכים שונים)
 */

import React, { useState, useMemo } from 'react';
import {
  CircuitNode,
  WireConnection,
  SafetyCheckViolation,
  SafetySolution,
} from '../types/harness';
import {
  Zap,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  Flame,
  ChevronDown,
  ChevronUp,
  Layers,
  Activity,
  Info,
  Wrench,
  Download,
  Filter,
  Eye,
  Check,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Play,
  CheckCircle,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { InspectableModel } from './ThreeWorkbench';
import { ComponentPinoutModal } from './ComponentPinoutModal';

interface SchematicCanvasProps {
  nodes: CircuitNode[];
  wires: WireConnection[];
  violations: SafetyCheckViolation[];
  subsystems: string[];
  activeSubsystemFilter: string;
  onSelectSubsystemFilter: (subsystem: string) => void;
  onUpdateNodes: (nodes: CircuitNode[]) => void;
  onUpdateWires: (wires: WireConnection[]) => void;
  onSelectComponentFor3D: (model: InspectableModel) => void;
  systemVoltage: number;
  onApplySolution?: (violation: SafetyCheckViolation, solution: SafetySolution) => void;
  onApplyAllFixes?: () => void;
  onExportCorrectedCSV?: () => void;
}

export const SchematicCanvas: React.FC<SchematicCanvasProps> = ({
  nodes,
  wires,
  violations,
  subsystems,
  activeSubsystemFilter,
  onSelectSubsystemFilter,
  onUpdateNodes,
  onUpdateWires,
  onSelectComponentFor3D,
  systemVoltage,
  onApplySolution,
  onApplyAllFixes,
  onExportCorrectedCSV,
}) => {
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [hoveredWireId, setHoveredWireId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isAlertsMinimized, setIsAlertsMinimized] = useState<boolean>(true);
  const [alertsFilter, setAlertsFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [lastFixedViolationId, setLastFixedViolationId] = useState<string | null>(null);

  // Step-by-Step Assembly Guide State
  const [currentAssemblyStep, setCurrentAssemblyStep] = useState<number>(0);
  const [assembledWireIds, setAssembledWireIds] = useState<Set<string>>(new Set());
  const [isAssemblyGuideOpen, setIsAssemblyGuideOpen] = useState<boolean>(true);

  // Component Pinout Modal State
  const [pinoutModalNode, setPinoutModalNode] = useState<CircuitNode | null>(null);

  // Toggle wire assembled status
  const handleToggleWireAssembled = (wireId: string) => {
    setAssembledWireIds((prev) => {
      const next = new Set(prev);
      if (next.has(wireId)) {
        next.delete(wireId);
      } else {
        next.add(wireId);
      }
      return next;
    });
  };

  // Toggle cockpit / E-stop switch state
  const handleToggleNodeSwitch = (nodeId: string) => {
    const updated = nodes.map((n) => {
      if (n.id === nodeId) {
        return { ...n, switchedOn: !n.switchedOn };
      }
      return n;
    });
    onUpdateNodes(updated);
  };

  // Local fallback solution applier
  const handleExecuteSolution = (violation: SafetyCheckViolation, solution: SafetySolution) => {
    if (onApplySolution) {
      onApplySolution(violation, solution);
    } else {
      if (violation.wireId) {
        const updatedWires = wires.map((w) => {
          if (w.id === violation.wireId) {
            const next = { ...w };
            if (solution.newAwg !== undefined) next.gaugeAwg = solution.newAwg;
            if (solution.newTerminalId) {
              next.fromTerminalId = solution.newTerminalId;
              next.toTerminalId = solution.newTerminalId;
            }
            if (solution.newFuseAmps !== undefined) next.fuseRatingA = solution.newFuseAmps;
            if (solution.newExpectedCurrent !== undefined) next.expectedCurrentAmps = solution.newExpectedCurrent;
            return next;
          }
          return w;
        });
        onUpdateWires(updatedWires);
      }

      if (violation.nodeId) {
        const updatedNodes = nodes.map((n) => {
          if (n.id === violation.nodeId) {
            const next = { ...n };
            if (solution.newFuseAmps !== undefined) {
              next.fuseRatingAmps = solution.newFuseAmps;
              next.ratingAmps = solution.newFuseAmps;
            }
            return next;
          }
          return n;
        });
        onUpdateNodes(updatedNodes);
      }
    }

    setLastFixedViolationId(violation.id);
    setTimeout(() => setLastFixedViolationId(null), 2500);
  };

  // Batch Auto Fix
  const handleBatchAutoFix = () => {
    if (onApplyAllFixes) {
      onApplyAllFixes();
    }
  };

  // Induce Demo Hazard
  const handleTriggerHazardDemo = () => {
    const updated = wires.map((w, idx) => {
      if (idx === 0 || w.wireNumber === 'W-101' || w.wireNumber === 'W-601') {
        return { ...w, gaugeAwg: 22, expectedCurrentAmps: 35, fuseRatingA: 15 };
      }
      return w;
    });
    onUpdateWires(updated);
  };

  // Filter nodes and wires according to active subsystem
  const visibleNodes = useMemo(() => {
    if (activeSubsystemFilter === 'ALL') return nodes;
    return nodes.filter((n) => n.subsystem === activeSubsystemFilter);
  }, [nodes, activeSubsystemFilter]);

  const visibleWires = useMemo(() => {
    if (activeSubsystemFilter === 'ALL') return wires;
    const nodeIds = new Set(visibleNodes.map((n) => n.id));
    return wires.filter((w) => nodeIds.has(w.fromNodeId) || nodeIds.has(w.toNodeId));
  }, [wires, visibleNodes, activeSubsystemFilter]);

  // Spatial placement calculation: Generous spacing between columns & rows
  const { nodePositionMap, canvasWidth, canvasHeight } = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const subsystemOrder = subsystems;

    let maxRowAcrossCols = 0;
    subsystemOrder.forEach((sub, colIdx) => {
      const subNodes = nodes.filter((n) => n.subsystem === sub);
      const colX = 50 + colIdx * 350; // 350px column pitch for spaciousness

      subNodes.forEach((node, rowIdx) => {
        const rowY = 40 + rowIdx * 320; // 320px vertical pitch
        map.set(node.id, { x: colX, y: rowY });
        if (rowIdx > maxRowAcrossCols) maxRowAcrossCols = rowIdx;
      });
    });

    const w = Math.max(1200, subsystemOrder.length * 360 + 100);
    const h = Math.max(900, (maxRowAcrossCols + 1) * 330 + 150);

    return { nodePositionMap: map, canvasWidth: w, canvasHeight: h };
  }, [nodes, subsystems]);

  // Precise Pin Anchor Port Calculation
  // Calculates the exact (x, y) coordinates of each pin socket on a node's border
  const getPinPortCoord = (nodeId: string, pinId: string, isFromNode: boolean): { x: number; y: number } => {
    const pos = nodePositionMap.get(nodeId) || { x: 50, y: 50 };
    const node = nodes.find((n) => n.id === nodeId);
    const pins = node?.pins || [];
    const pinIndex = pins.findIndex((p) => p.pin === pinId);
    const cardWidth = 280;

    // Pin sockets along left edge (for inputs) and right edge (for outputs)
    const pinYOffset = pinIndex >= 0 ? 80 + (pinIndex % 8) * 22 : 90;

    if (isFromNode) {
      // Source pin connects from the right edge
      return { x: pos.x + cardWidth, y: pos.y + pinYOffset };
    } else {
      // Destination pin connects into the left edge
      return { x: pos.x, y: pos.y + pinYOffset };
    }
  };

  const criticalViolations = violations.filter((v) => v.level === 'critical');
  const warningViolations = violations.filter((v) => v.level === 'warning');

  const filteredViolations = useMemo(() => {
    if (alertsFilter === 'CRITICAL') return criticalViolations;
    if (alertsFilter === 'WARNING') return warningViolations;
    return violations;
  }, [violations, alertsFilter, criticalViolations, warningViolations]);

  // Current wire in assembly step
  const currentStepWire = wires[currentAssemblyStep] || wires[0];
  const activeFocusWireId = selectedWireId || hoveredWireId || (isAssemblyGuideOpen ? currentStepWire?.id : null);

  const selectedWire = useMemo(() => {
    if (!activeFocusWireId) return null;
    return wires.find((w) => w.id === activeFocusWireId) || null;
  }, [wires, activeFocusWireId]);

  // Infer 3D model for component
  const inferComponentModel = (node: CircuitNode): InspectableModel => {
    const id = node.id.toLowerCase();
    const type = node.type.toLowerCase();
    if (id.includes('ecu') || id.includes('tcu') || id.includes('bcm') || id.includes('gateway') || id.includes('cluster') || id.includes('hvac')) {
      return 'ecu_module';
    }
    if (id.includes('fuse_block') || type.includes('fuse_block')) return 'fuse_block';
    if (id.includes('battery') || type.includes('battery')) return 'battery_12v';
    if (id.includes('ground') || id.includes('gnd') || type.includes('ground')) return 'ground_chassis';
    if (id.includes('radar') || id.includes('camera') || id.includes('sensor')) return 'radar_sensor';
    if (id.includes('obd') || id.includes('diagnostic')) return 'obd2_connector';
    if (type.includes('fuse')) return 'fuse_ato_30';
    return 'relay_iso_5pin';
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 select-none overflow-hidden text-right font-sans" dir="rtl">
      {/* =========================================================================
          Top Control & Subsystem Bar
          ========================================================================= */}
      <div className="flex flex-col border-b border-slate-800 bg-slate-900/90 shrink-0 z-20">
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/60">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>סרטוט סכמטי מרווח ומדריך הרכבה</span>
            <span className="text-slate-400 font-mono text-[11px]">({systemVoltage}V DC · {nodes.length} רכיבים · {wires.length} מוליכים)</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Assembly Wizard Drawer */}
            <button
              onClick={() => setIsAssemblyGuideOpen(!isAssemblyGuideOpen)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                isAssemblyGuideOpen
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>מדריך הרכבה צעד-אחר-צעד ({assembledWireIds.size}/{wires.length})</span>
            </button>

            {violations.length > 0 ? (
              <button
                onClick={handleBatchAutoFix}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 rounded-md transition-colors shadow-xs"
                title="תיקון מיידי של כל ההתראות"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>תיקון כל ההתראות אוטומטית ({violations.length})</span>
              </button>
            ) : (
              <button
                onClick={handleTriggerHazardDemo}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-600/30 rounded-md transition-colors"
                title="סימולציית אזהרת עומס יתר"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>הדגם תקלה: חוט 22 AWG בעומס 35A</span>
              </button>
            )}

            {onExportCorrectedCSV && (
              <button
                onClick={onExportCorrectedCSV}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-sky-300 bg-sky-950/40 hover:bg-sky-900/50 border border-sky-600/30 rounded-md transition-colors"
                title="הורדת טבלת ה-CSV המתוקנת של הצמה"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">הורד CSV מתוקן</span>
              </button>
            )}
          </div>
        </div>

        {/* Subsystem Partition Selector Tabs ("חלוקה למערכים שונים") */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-950/90 overflow-x-auto text-xs font-medium scrollbar-thin">
          <div className="flex items-center gap-1 text-slate-400 pl-2 shrink-0">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>חלוקה למערכים:</span>
          </div>
          <button
            onClick={() => onSelectSubsystemFilter('ALL')}
            className={`px-3 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeSubsystemFilter === 'ALL'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            כל המערכים ({nodes.length} רכיבים · {wires.length} חוטים)
          </button>

          {subsystems.map((sub) => {
            const count = nodes.filter((n) => n.subsystem === sub).length;
            const isSelected = activeSubsystemFilter === sub;
            return (
              <button
                key={sub}
                onClick={() => onSelectSubsystemFilter(sub)}
                className={`px-3 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
                }`}
              >
                <span>{sub}</span>
                <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            Interactive Step-by-Step Harness Assembly Guide Header
            "וככה להתקדם בהרכבה: איזה כבל מגיע לאיזה רגל ומה המוצא שלו"
            ========================================================================= */}
        {isAssemblyGuideOpen && currentStepWire && (
          <div className="px-4 py-2.5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-t border-slate-800 flex items-center justify-between gap-4 text-xs">
            {/* Step & Wire Identity */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 font-bold">שלב הרכבה {currentAssemblyStep + 1} מתוך {wires.length}:</span>
                <span className="font-mono font-black text-white px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded text-sm">
                  {currentStepWire.wireNumber}
                </span>
              </div>

              {/* Origin ➔ Destination Exact Legs */}
              <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800">
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 text-[11px]">מוצא:</span>
                  <strong className="text-white font-mono">{currentStepWire.fromNodeId}</strong>
                  <span className="text-amber-400 font-mono font-bold bg-slate-900 px-1 rounded">[רגל {currentStepWire.fromPin}]</span>
                </div>
                <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 text-[11px]">יעד:</span>
                  <strong className="text-white font-mono">{currentStepWire.toNodeId}</strong>
                  <span className="text-emerald-400 font-mono font-bold bg-slate-900 px-1 rounded">[רגל {currentStepWire.toPin}]</span>
                </div>
              </div>
            </div>

            {/* Wire Specification & Tooling */}
            <div className="hidden lg:flex items-center gap-3 text-slate-300 text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-slate-500 inline-block shrink-0"
                  style={{ backgroundColor: currentStepWire.color }}
                />
                <span>{currentStepWire.gaugeAwg} AWG</span>
                <span className="text-slate-400">({currentStepWire.colorName})</span>
              </div>
              {currentStepWire.twistedPairId && currentStepWire.twistedPairId !== 'NONE' && (
                <span className="text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-500/30">
                  שזור: {currentStepWire.twistedPairId}
                </span>
              )}
              <span className="text-amber-300">Faston 6.3mm · כלי: SN-48B</span>
            </div>

            {/* Step Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setCurrentAssemblyStep((prev) => Math.max(0, prev - 1))}
                disabled={currentAssemblyStep === 0}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white"
                title="כבל קודם"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleToggleWireAssembled(currentStepWire.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition-all ${
                  assembledWireIds.has(currentStepWire.id)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-amber-500/30'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{assembledWireIds.has(currentStepWire.id) ? 'הורכב בהצלחה ✓' : 'סמן כהורכב'}</span>
              </button>

              <button
                onClick={() => {
                  const node = nodes.find((n) => n.id === currentStepWire.fromNodeId);
                  if (node) onSelectComponentFor3D(inferComponentModel(node));
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md font-medium"
              >
                <Sliders className="w-3 h-3 text-sky-400" />
                <span>הצג ב-3D</span>
              </button>

              <button
                onClick={() => setCurrentAssemblyStep((prev) => Math.min(wires.length - 1, prev + 1))}
                disabled={currentAssemblyStep === wires.length - 1}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white"
                title="כבל הבא"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          Main SVG Schematic Canvas Area
          ========================================================================= */}
      <div className="relative flex-1 overflow-auto bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:28px_28px] p-8 text-left" dir="ltr">
        <div
          className="relative mx-auto"
          style={{
            minWidth: `${canvasWidth}px`,
            minHeight: `${canvasHeight}px`,
          }}
        >
          {/* Subsystem Column Header Lanes */}
          <div className="absolute inset-0 flex pointer-events-none opacity-50">
            {subsystems.map((sub, idx) => (
              <div
                key={sub}
                className="border-r border-dashed border-slate-800/80 px-4 pt-2"
                style={{ width: '350px' }}
              >
                <div className="text-[11px] font-mono font-bold text-amber-400/80 uppercase tracking-wider truncate mb-2">
                  {sub}
                </div>
              </div>
            ))}
          </div>

          {/* SVG Connection Wires with Pin-to-Pin Anchoring */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: `${canvasWidth}px`, minHeight: `${canvasHeight}px` }}>
            <defs>
              <filter id="glow-focused" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {visibleWires.map((wire, idx) => {
              // Calculate exact source and destination pin socket positions!
              const p1 = getPinPortCoord(wire.fromNodeId, wire.fromPin, true);
              const p2 = getPinPortCoord(wire.toNodeId, wire.toPin, false);

              const x1 = p1.x;
              const y1 = p1.y;
              const x2 = p2.x;
              const y2 = p2.y;

              // Curvature control points
              const dx = Math.abs(x2 - x1);
              const cx1 = x1 + Math.max(60, dx * 0.4);
              const cy1 = y1;
              const cx2 = x2 - Math.max(60, dx * 0.4);
              const cy2 = y2;

              const isHazardWire = violations.some((v) => v.wireId === wire.id && v.level === 'critical');
              const isWarningWire = violations.some((v) => v.wireId === wire.id && v.level === 'warning');
              const isFocused = activeFocusWireId === wire.id;
              const isDimmed = activeFocusWireId !== null && !isFocused;
              const isAssembled = assembledWireIds.has(wire.id);

              const strokeColor = isFocused ? '#FACC15' : isHazardWire ? '#EF4444' : isWarningWire ? '#F59E0B' : wire.color;
              const strokeWidth = isFocused ? 5.5 : wire.gaugeAwg <= 12 ? 4.0 : wire.gaugeAwg <= 16 ? 3.0 : 2.0;

              return (
                <g
                  key={wire.id}
                  className="cursor-pointer pointer-events-auto"
                  onClick={() => setSelectedWireId(wire.id === selectedWireId ? null : wire.id)}
                  onMouseEnter={() => setHoveredWireId(wire.id)}
                  onMouseLeave={() => setHoveredWireId(null)}
                >
                  {/* Outer wire path */}
                  <path
                    d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={isHazardWire ? '6 3' : isAssembled ? 'none' : 'none'}
                    strokeLinecap="round"
                    className="transition-all duration-150"
                    style={{
                      opacity: isFocused ? 1.0 : isDimmed ? 0.12 : 0.85,
                    }}
                    filter={isFocused ? 'url(#glow-focused)' : undefined}
                  />

                  {/* Pin Socket Circles on endpoints */}
                  <circle cx={x1} cy={y1} r={isFocused ? 5.5 : 3.5} fill={strokeColor} stroke="#0f172a" strokeWidth={1.5} />
                  <circle cx={x2} cy={y2} r={isFocused ? 5.5 : 3.5} fill={strokeColor} stroke="#0f172a" strokeWidth={1.5} />

                  {/* Wire ID & Leg Label badge along center of wire */}
                  <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}>
                    <rect
                      x="-44"
                      y="-12"
                      width="88"
                      height="22"
                      rx="5"
                      fill="#0f172a"
                      stroke={isFocused ? '#facc15' : isHazardWire ? '#ef4444' : '#334155'}
                      strokeWidth={isFocused ? '2' : '1'}
                      style={{ opacity: isDimmed ? 0.2 : 1.0 }}
                    />
                    <text
                      x="0"
                      y="3.5"
                      fill={isHazardWire ? '#ef4444' : isFocused ? '#facc15' : '#f8fafc'}
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                      style={{ opacity: isDimmed ? 0.2 : 1.0 }}
                    >
                      {wire.wireNumber} · {wire.gaugeAwg}G {isAssembled ? '✓' : ''}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Render Component Cards with Complete Pin Matrix */}
          {visibleNodes.map((node) => {
            const isRelay = node.category === 'relay' || node.type.includes('relay');
            const isFuse = node.category === 'protection' || node.type.includes('fuse');
            const isSelected = selectedNodeId === node.id;
            const hasNodeViolation = violations.some((v) => v.nodeId === node.id);

            // Wires connected to this node
            const nodeWires = wires.filter((w) => w.fromNodeId === node.id || w.toNodeId === node.id);
            const isNodeInFocus = selectedWire && (selectedWire.fromNodeId === node.id || selectedWire.toNodeId === node.id);

            return (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={`absolute w-72 rounded-2xl border-2 transition-all shadow-2xl ${
                  isNodeInFocus
                    ? 'border-amber-400 bg-slate-900/95 ring-4 ring-amber-500/25 z-10'
                    : isSelected
                    ? 'border-sky-400 bg-slate-900/95 ring-2 ring-sky-500/20 z-10'
                    : hasNodeViolation
                    ? 'border-red-500/80 bg-slate-900/90'
                    : 'border-slate-800 bg-slate-900/90 hover:border-slate-600'
                }`}
                style={{
                  left: `${nodePositionMap.get(node.id)?.x || 50}px`,
                  top: `${nodePositionMap.get(node.id)?.y || 50}px`,
                }}
              >
                {/* Component Header */}
                <div className="p-3 border-b border-slate-800 bg-slate-950/60 rounded-t-2xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white truncate max-w-[170px]" title={node.name}>
                      {node.name}
                    </span>
                    {node.ratingAmps && (
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        {node.fuseRatingAmps ? `${node.fuseRatingAmps}A Fuse` : `${node.ratingAmps}A`}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="truncate">{node.id}</span>
                    <span className="text-sky-400 font-sans">{node.subsystem?.split('(')[0]}</span>
                  </div>
                </div>

                {/* Pin Matrix Ledger: Exactly which wire arrives to which leg, and what its origin/destination is */}
                <div className="p-2.5 space-y-1.5 max-h-56 overflow-y-auto scrollbar-thin">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>חיבורי רגליים (Pin Map):</span>
                    <span className="text-slate-500 font-mono text-[9px]">{nodeWires.length} מחוברים</span>
                  </div>

                  {node.pins && node.pins.length > 0 ? (
                    node.pins.slice(0, 8).map((pinDef) => {
                      const wireOut = nodeWires.find((w) => w.fromNodeId === node.id && w.fromPin === pinDef.pin);
                      const wireIn = nodeWires.find((w) => w.toNodeId === node.id && w.toPin === pinDef.pin);
                      const activeWire = wireOut || wireIn;
                      const isSource = Boolean(wireOut);
                      const isWireActive = activeWire && activeFocusWireId === activeWire.id;

                      return (
                        <div
                          key={pinDef.pin}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeWire) setSelectedWireId(activeWire.id);
                          }}
                          className={`p-1.5 rounded-lg border text-[10.5px] transition-all cursor-pointer ${
                            isWireActive
                              ? 'bg-amber-500/15 border-amber-500/50 text-white ring-1 ring-amber-400'
                              : activeWire
                              ? 'bg-slate-950/70 border-slate-800/80 text-slate-300 hover:border-slate-600'
                              : 'bg-slate-950/30 border-dashed border-slate-800 text-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between font-mono">
                            <span className="font-bold text-amber-400">רגל {pinDef.pin}:</span>
                            {activeWire ? (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-slate-600 inline-block"
                                  style={{ backgroundColor: activeWire.color }}
                                />
                                <span className="font-bold text-sky-300">{activeWire.wireNumber}</span>
                                <span className="text-slate-500 text-[9.5px]">({activeWire.gaugeAwg}G)</span>
                              </div>
                            ) : (
                              <span className="text-slate-600 text-[10px]">פנוי</span>
                            )}
                          </div>

                          {/* Where it came from or where it goes */}
                          {activeWire && (
                            <div className="text-[10px] text-slate-400 mt-0.5 truncate font-sans flex items-center gap-1">
                              {isSource ? (
                                <>
                                  <span className="text-amber-400 font-bold">מוצא ➔</span>
                                  <span>{activeWire.toNodeId}</span>
                                  <span className="text-slate-500 font-mono">[{activeWire.toPin}]</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-emerald-400 font-bold">מבוא ⬅</span>
                                  <span>{activeWire.fromNodeId}</span>
                                  <span className="text-slate-500 font-mono">[{activeWire.fromPin}]</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    // Default pins for standard relay
                    <div className="text-[11px] text-slate-400 font-mono space-y-1">
                      <div className="flex items-center justify-between bg-slate-950 px-2 py-1 rounded">
                        <span className="text-red-400 font-bold">Pin 30 (Feed 12V):</span>
                        <span className="text-slate-300">הזנת כוח 40A</span>
                      </div>
                      <div className="flex items-center justify-between bg-slate-950 px-2 py-1 rounded">
                        <span className="text-amber-400 font-bold">Pin 87 (NO Out):</span>
                        <span className="text-slate-300">יציאה ממותגת</span>
                      </div>
                      <div className="flex items-center justify-between bg-slate-950 px-2 py-1 rounded">
                        <span className="text-sky-400 font-bold">Pin 86 (Trigger +):</span>
                        <span className="text-slate-300">פיקוד סליל</span>
                      </div>
                      <div className="flex items-center justify-between bg-slate-950 px-2 py-1 rounded">
                        <span className="text-emerald-400 font-bold">Pin 85 (GND -):</span>
                        <span className="text-slate-300">הארקת סליל</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="p-2 border-t border-slate-800 bg-slate-950/60 rounded-b-2xl flex items-center justify-between text-[11px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPinoutModalNode(node);
                    }}
                    className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-semibold"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>מפת רגליים מלאה</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectComponentFor3D(inferComponentModel(node));
                    }}
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>בדוק ב-3D</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Wire Inspector Bar (if wire clicked or focused) */}
      {selectedWire && (
        <div className="border-t border-slate-800 bg-slate-900/98 px-5 py-2.5 flex items-center justify-between text-xs z-30 shrink-0 shadow-2xl">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-slate-950 bg-amber-400 px-2.5 py-0.5 rounded text-sm">
                {selectedWire.wireNumber}
              </span>
              <span className="text-white font-bold text-sm">{selectedWire.signalName}</span>
            </div>

            {/* Path details */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
              <span className="text-amber-400 font-bold">מוצא:</span>
              <span className="text-white font-mono font-bold">{selectedWire.fromNodeId}</span>
              <span className="text-amber-300 font-mono">[רגל {selectedWire.fromPin}]</span>
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-emerald-400 font-bold">יעד:</span>
              <span className="text-white font-mono font-bold">{selectedWire.toNodeId}</span>
              <span className="text-emerald-300 font-mono">[רגל {selectedWire.toPin}]</span>
            </div>

            {/* Physical wire details */}
            <div className="flex items-center gap-2 text-slate-300 font-mono">
              <span
                className="w-3.5 h-3.5 rounded-full border border-slate-500 inline-block shrink-0"
                style={{ backgroundColor: selectedWire.color }}
              />
              <span>{selectedWire.gaugeAwg} AWG</span>
              <span>·</span>
              <span>עומס: {selectedWire.expectedCurrentAmps}A</span>
              {selectedWire.fuseRatingA ? <span>(פיוז: {selectedWire.fuseRatingA}A)</span> : null}
              {selectedWire.twistedPairId && selectedWire.twistedPairId !== 'NONE' && (
                <span className="text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-500/30">
                  שזור: {selectedWire.twistedPairId} {selectedWire.terminationResistor ? `(${selectedWire.terminationResistor})` : ''}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToggleWireAssembled(selectedWire.id)}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                assembledWireIds.has(selectedWire.id)
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {assembledWireIds.has(selectedWire.id) ? 'הורכב ✓' : 'סמן כהורכב'}
            </button>
            <button
              onClick={() => setSelectedWireId(null)}
              className="text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800"
            >
              סגור
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          Minimizable Alerts Bar
          ========================================================================= */}
      <div className="border-t border-slate-800 bg-slate-900 shrink-0 transition-all z-20">
        <div className="flex items-center justify-between px-4 py-2 select-none bg-slate-900 hover:bg-slate-850 transition-colors">
          <div
            onClick={() => setIsAlertsMinimized(!isAlertsMinimized)}
            className="flex items-center gap-2.5 text-xs cursor-pointer flex-1"
          >
            {criticalViolations.length > 0 ? (
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
            ) : warningViolations.length > 0 ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            )}

            <span className="font-bold text-white">
              בקרת בטיחות תקנית (DIN 72551 & SAE J1128):
            </span>

            {criticalViolations.length > 0 ? (
              <span className="font-mono text-xs text-red-400 font-bold bg-red-950/60 px-2 py-0.5 rounded border border-red-500/40">
                {criticalViolations.length} התראות קריטיות (עומס יתר / סכנת שריפה)
              </span>
            ) : null}

            {warningViolations.length > 0 ? (
              <span className="font-mono text-xs text-amber-400 font-medium bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
                {warningViolations.length} אזהרות תרמיות / מפל מתח
              </span>
            ) : null}

            {violations.length === 0 && (
              <span className="font-mono text-xs text-emerald-400 font-medium bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                כל 42 מוליכי הצמה, הפיוזים ונעלי הכבל תקינים ומאומתים
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isAlertsMinimized && violations.length > 0 && (
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => setAlertsFilter('ALL')}
                  className={`px-2 py-0.5 rounded transition-colors ${alertsFilter === 'ALL' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  הכל ({violations.length})
                </button>
                <button
                  onClick={() => setAlertsFilter('CRITICAL')}
                  className={`px-2 py-0.5 rounded transition-colors ${alertsFilter === 'CRITICAL' ? 'bg-red-900/60 text-red-300 font-bold' : 'text-slate-400 hover:text-red-300'}`}
                >
                  קריטי ({criticalViolations.length})
                </button>
                <button
                  onClick={() => setAlertsFilter('WARNING')}
                  className={`px-2 py-0.5 rounded transition-colors ${alertsFilter === 'WARNING' ? 'bg-amber-900/60 text-amber-300 font-bold' : 'text-slate-400 hover:text-amber-300'}`}
                >
                  אזהרות ({warningViolations.length})
                </button>
              </div>
            )}

            {violations.length > 0 && (
              <button
                onClick={handleBatchAutoFix}
                className="px-2.5 py-1 text-xs font-bold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 rounded transition-colors"
                title="תיקון מיידי של כל ההתראות"
              >
                תקן הכל אוטומטית
              </button>
            )}

            <button
              onClick={() => setIsAlertsMinimized(!isAlertsMinimized)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
            >
              <span>{isAlertsMinimized ? 'הרחב פתרונות' : 'מזער התראות'}</span>
              {isAlertsMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Violations with 2 Solutions each */}
        {!isAlertsMinimized && filteredViolations.length > 0 && (
          <div className="px-4 pb-3 max-h-60 overflow-y-auto space-y-2.5 border-t border-slate-800/80 pt-2">
            {filteredViolations.map((v) => (
              <div
                key={v.id}
                className={`p-3 rounded-xl border text-xs transition-all ${
                  v.level === 'critical'
                    ? 'bg-red-950/30 border-red-500/40 text-red-100'
                    : 'bg-amber-950/30 border-amber-500/40 text-amber-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-2.5">
                    {v.level === 'critical' ? (
                      <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-white text-[13px] flex items-center gap-2">
                        <span>{v.title}</span>
                        {v.wireId && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-900 border border-slate-700 rounded text-slate-300">
                            חוט: {v.wireId}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-300 text-xs mt-0.5 leading-relaxed">{v.message}</div>
                      <div className="font-mono text-[11px] text-amber-300 mt-1">
                        מדד טכני: <strong>{v.technicalMetric}</strong>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${
                    v.level === 'critical' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}>
                    {v.level === 'critical' ? 'סיכון קריטי' : 'אזהרת תקן'}
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800/80 bg-slate-950/40 p-2.5 rounded-lg">
                  <div className="text-[11px] font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-amber-400" />
                    <span>בחר פתרון לתיקון אוטומטי (לפחות 2 פתרונות מוצעים):</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {v.solutions.map((sol, solIdx) => (
                      <div
                        key={sol.id}
                        className="flex flex-col justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-700/80 hover:border-amber-500/50 transition-colors"
                      >
                        <div>
                          <div className="font-bold text-white text-[11px] mb-1 flex items-center gap-1.5">
                            <span className="text-amber-400">{solIdx === 0 ? 'פתרון א\' (מומלץ):' : 'פתרון ב\' (חלופי):'}</span>
                            <span className="truncate">{sol.title.replace(/פתרון [א'ב']:?\s*/, '')}</span>
                          </div>
                          <p className="text-[10.5px] text-slate-400 leading-tight mb-2">
                            {sol.description}
                          </p>
                        </div>

                        <button
                          onClick={() => handleExecuteSolution(v, sol)}
                          className={`w-full py-1 px-2.5 rounded text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 ${
                            solIdx === 0
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                              : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-600'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>החל פתרון זה אוטומטית</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Component Full Pinout Ledger Modal */}
      <ComponentPinoutModal
        isOpen={Boolean(pinoutModalNode)}
        onClose={() => setPinoutModalNode(null)}
        node={pinoutModalNode}
        allWires={wires}
        assembledWireIds={assembledWireIds}
        onToggleWireAssembled={handleToggleWireAssembled}
        onSelectComponentFor3D={onSelectComponentFor3D}
        onSelectWireForFocus={(wireId) => setSelectedWireId(wireId)}
      />
    </div>
  );
};
