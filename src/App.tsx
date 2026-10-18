/**
 * HarnessMap Pro - Main Application Entry & Workspace (Hebrew Edition)
 * Conforms to Universal Frontend Design Constitution:
 * - Strict 3-zone Top Bar Contract
 * - Zero-pill metadata discipline
 * - 60-30-10 color allocation
 * - 100% pure client-side zero-backend architecture
 * - Hebrew RTL interface with Netlist table import & subsystem partitioning
 */

import React, { useState, useMemo } from 'react';
import {
  CircuitNode,
  WireConnection,
  SafetyCheckViolation,
  SafetySolution,
  BOMItem,
} from './types/harness';
import { runSafetyChecks, generateBOM } from './utils/safetyEngine';
import { parseWireScheduleTable, USER_SAMPLE_WIRE_SCHEDULE } from './utils/csvWireParser';
import { SchematicCanvas } from './components/SchematicCanvas';
import { ThreeWorkbench, InspectableModel } from './components/ThreeWorkbench';
import { CrimpMatrixTable } from './components/CrimpMatrixTable';
import { BOMExportModal } from './components/BOMExportModal';
import { SafetyDiagnosticsModal } from './components/SafetyDiagnosticsModal';
import { KnowledgeBaseDrawer } from './components/KnowledgeBaseDrawer';
import { WireScheduleImporterModal } from './components/WireScheduleImporterModal';
import {
  Zap,
  UploadCloud,
  FileSpreadsheet,
  ShieldCheck,
  BookOpen,
  Sparkles,
  Layers,
} from 'lucide-react';

// Default Automotive 42-wire network schedule provided in user specification
const DEFAULT_HARNESS = parseWireScheduleTable(USER_SAMPLE_WIRE_SCHEDULE);

export default function App() {
  const [activeTab, setActiveTab] = useState<'split' | 'schematic' | 'workbench3d' | 'matrix'>('split');
  const [nodes, setNodes] = useState<CircuitNode[]>(DEFAULT_HARNESS.nodes);
  const [wires, setWires] = useState<WireConnection[]>(DEFAULT_HARNESS.wires);
  const [subsystems, setSubsystems] = useState<string[]>(DEFAULT_HARNESS.subsystems);
  const [activeSubsystemFilter, setActiveSubsystemFilter] = useState<string>('ALL');
  const [selected3DModel, setSelected3DModel] = useState<InspectableModel>('relay_iso_5pin');
  const [systemVoltage, setSystemVoltage] = useState<number>(12);

  // Modals & Drawer state
  const [isBOMModalOpen, setIsBOMModalOpen] = useState<boolean>(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [isHandbookOpen, setIsHandbookOpen] = useState<boolean>(false);
  const [isImporterOpen, setIsImporterOpen] = useState<boolean>(false);

  // Real-time pure client-side safety calculation
  const violations: SafetyCheckViolation[] = useMemo(() => {
    return runSafetyChecks(nodes, wires, systemVoltage);
  }, [nodes, wires, systemVoltage]);

  // Real-time BOM calculation
  const bomItems: BOMItem[] = useMemo(() => {
    return generateBOM(nodes, wires);
  }, [nodes, wires]);

  // Load User's Netlist Sample Table from prompt directly
  const handleLoadSampleTable = () => {
    const parsed = parseWireScheduleTable(USER_SAMPLE_WIRE_SCHEDULE);
    setNodes(parsed.nodes);
    setWires(parsed.wires);
    setSubsystems(parsed.subsystems);
    setActiveSubsystemFilter('ALL');
    setSelected3DModel('relay_iso_5pin');
  };

  // Import handler from modal
  const handleImportTable = (newNodes: CircuitNode[], newWires: WireConnection[], newSubsystems: string[]) => {
    setNodes(newNodes);
    setWires(newWires);
    setSubsystems(newSubsystems);
    setActiveSubsystemFilter('ALL');
  };

  // 1-Click Apply Solution from Violation Card
  const handleApplySolution = (violation: SafetyCheckViolation, solution: SafetySolution) => {
    let currentWires = [...wires];
    let currentNodes = [...nodes];

    if (violation.wireId) {
      currentWires = currentWires.map((w) => {
        if (w.id === violation.wireId) {
          const updated = { ...w };
          if (solution.newAwg !== undefined) updated.gaugeAwg = solution.newAwg;
          if (solution.newTerminalId) {
            updated.fromTerminalId = solution.newTerminalId;
            updated.toTerminalId = solution.newTerminalId;
          }
          if (solution.newFuseAmps !== undefined) updated.fuseRatingA = solution.newFuseAmps;
          if (solution.newExpectedCurrent !== undefined) updated.expectedCurrentAmps = solution.newExpectedCurrent;
          if (solution.newTerminationResistor !== undefined) updated.terminationResistor = solution.newTerminationResistor;
          if (solution.newTwistedPairId !== undefined) updated.twistedPairId = solution.newTwistedPairId;
          if (solution.newPin !== undefined) {
            if (updated.fromNodeId === violation.nodeId) updated.fromPin = solution.newPin;
            else updated.toPin = solution.newPin;
          }
          return updated;
        }
        return w;
      });
    }

    // If solution is for a CAN bus termination (where violation might not target a single wireId)
    if (solution.actionType === 'configure_termination' && solution.newTerminationResistor) {
      const busName = violation.id.replace('can-term-zero-', '').replace('can-term-one-', '').replace('can-term-excess-', '');
      const busWires = currentWires.filter((w) => w.networkBus === busName);
      if (busWires.length >= 2) {
        if (solution.newTerminationResistor === 'NONE') {
          // Remove from intermediate wires
          currentWires = currentWires.map((w) => {
            if (w.networkBus === busName) {
              return { ...w, terminationResistor: 'NONE' };
            }
            return w;
          });
        } else {
          // Set on first and last wire
          const firstWireId = busWires[0].id;
          const lastWireId = busWires[busWires.length - 1].id;
          currentWires = currentWires.map((w) => {
            if (w.id === firstWireId || w.id === lastWireId) {
              return { ...w, terminationResistor: solution.newTerminationResistor! };
            }
            return w;
          });
        }
      }
    }

    // If solution adds a ground wire
    if (solution.actionType === 'add_ground' && solution.newWire) {
      const gndWire: WireConnection = {
        id: `w-gnd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        wireNumber: `W-GND-${currentWires.length + 1}`,
        fromNodeId: solution.newWire.fromNodeId || 'Chassis_Ground_Point_1',
        fromPin: solution.newWire.fromPin || 'GND-01',
        toNodeId: solution.newWire.toNodeId || violation.nodeId || '',
        toPin: solution.newWire.toPin || 'GND-01',
        gaugeAwg: solution.newWire.gaugeAwg || 14,
        color: '#000000',
        colorName: 'Black',
        lengthMm: 1200,
        fromTerminalId: 'RING-M8-OB',
        toTerminalId: 'FAST-63-OB-14-18',
        expectedCurrentAmps: solution.newWire.expectedCurrentAmps || 10,
        signalName: 'GND_RETURN',
        signalType: 'Ground',
        networkBus: 'GROUND_CHASSIS',
        subsystem: 'נקודות הארקת שלדה (Ground Chassis)',
        notes: 'Dedicated ground return lead for safe circuit operation',
      };
      currentWires.push(gndWire);
    }

    if (violation.nodeId) {
      currentNodes = currentNodes.map((n) => {
        if (n.id === violation.nodeId) {
          const updated = { ...n };
          if (solution.newFuseAmps !== undefined) {
            updated.fuseRatingAmps = solution.newFuseAmps;
            updated.ratingAmps = solution.newFuseAmps;
          }
          return updated;
        }
        return n;
      });
    }

    setWires(currentWires);
    setNodes(currentNodes);
  };

  // Batch Auto-Fix All Violations
  const handleApplyAllFixes = () => {
    let currentWires = [...wires];
    let currentNodes = [...nodes];

    for (const v of violations) {
      const sol = v.solutions[0];
      if (!sol) continue;

      if (v.wireId) {
        currentWires = currentWires.map((w) => {
          if (w.id === v.wireId) {
            const updated = { ...w };
            if (sol.newAwg !== undefined) updated.gaugeAwg = sol.newAwg;
            if (sol.newTerminalId) {
              updated.fromTerminalId = sol.newTerminalId;
              updated.toTerminalId = sol.newTerminalId;
            }
            if (sol.newFuseAmps !== undefined) updated.fuseRatingA = sol.newFuseAmps;
            if (sol.newExpectedCurrent !== undefined) updated.expectedCurrentAmps = sol.newExpectedCurrent;
            if (sol.newTerminationResistor !== undefined) updated.terminationResistor = sol.newTerminationResistor;
            if (sol.newTwistedPairId !== undefined) updated.twistedPairId = sol.newTwistedPairId;
            if (sol.newPin !== undefined) {
              if (updated.fromNodeId === v.nodeId) updated.fromPin = sol.newPin;
              else updated.toPin = sol.newPin;
            }
            return updated;
          }
          return w;
        });
      }

      if (sol.actionType === 'configure_termination' && sol.newTerminationResistor) {
        const busName = v.id.replace('can-term-zero-', '').replace('can-term-one-', '').replace('can-term-excess-', '');
        const busWires = currentWires.filter((w) => w.networkBus === busName);
        if (busWires.length >= 2) {
          const firstWireId = busWires[0].id;
          const lastWireId = busWires[busWires.length - 1].id;
          currentWires = currentWires.map((w) => {
            if (w.id === firstWireId || w.id === lastWireId) {
              return { ...w, terminationResistor: sol.newTerminationResistor! };
            }
            return w;
          });
        }
      }

      if (sol.actionType === 'add_ground' && sol.newWire) {
        const gndWire: WireConnection = {
          id: `w-gnd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          wireNumber: `W-GND-${currentWires.length + 1}`,
          fromNodeId: sol.newWire.fromNodeId || 'Chassis_Ground_Point_1',
          fromPin: sol.newWire.fromPin || 'GND-01',
          toNodeId: sol.newWire.toNodeId || v.nodeId || '',
          toPin: sol.newWire.toPin || 'GND-01',
          gaugeAwg: sol.newWire.gaugeAwg || 14,
          color: '#000000',
          colorName: 'Black',
          lengthMm: 1200,
          fromTerminalId: 'RING-M8-OB',
          toTerminalId: 'FAST-63-OB-14-18',
          expectedCurrentAmps: sol.newWire.expectedCurrentAmps || 10,
          signalName: 'GND_RETURN',
          signalType: 'Ground',
          networkBus: 'GROUND_CHASSIS',
          subsystem: 'נקודות הארקת שלדה (Ground Chassis)',
          notes: 'Dedicated ground return lead',
        };
        currentWires.push(gndWire);
      }

      if (v.nodeId) {
        currentNodes = currentNodes.map((n) => {
          if (n.id === v.nodeId) {
            const updated = { ...n };
            if (sol.newFuseAmps !== undefined) {
              updated.fuseRatingAmps = sol.newFuseAmps;
              updated.ratingAmps = sol.newFuseAmps;
            }
            return updated;
          }
          return n;
        });
      }
    }

    setWires(currentWires);
    setNodes(currentNodes);
  };

  // Client-Side CSV Export of Validated & Corrected Harness
  const handleExportCorrectedCSV = () => {
    const header = 'Wire_ID,Network_Bus,Signal_Name,From_Module,From_Pin,To_Module,To_Pin,Wire_Gauge_AWG,Primary_Color,Stripe_Color,Twisted_Pair_ID,Termination_Resistor_Ohm,Current_Rating_A,Fuse_Rating_A\n';
    const rows = wires
      .map(
        (w) =>
          `${w.wireNumber || w.id},${w.networkBus || 'GENERAL'},${w.signalName || 'Signal'},${w.fromNodeId},${w.fromPin},${w.toNodeId},${w.toPin},${w.gaugeAwg} AWG,${w.colorName || w.color},${w.stripeColor || '#NONE'},${w.twistedPairId || 'NONE'},${w.terminationResistor || 'NONE'},${w.expectedCurrentAmps}A,${w.fuseRatingA ? `${w.fuseRatingA}A` : 'NONE'}`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'harnessmap_corrected_schedule.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans text-right" dir="rtl">
      {/* =========================================================================
          Top Bar Contract: Zone 1 (Wordmark) — Zone 2 (Nav Links) — Zone 3 (Action)
          ========================================================================= */}
      <header className="flex items-center justify-between gap-6 px-6 py-3 border-b border-slate-800 bg-slate-900/90 shrink-0 select-none z-30">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black">
              ⚡
            </div>
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0">
              HarnessMap Pro
            </span>
          </div>

          {/* Unboxed Metadata (Zero-pill discipline) */}
          <div className="hidden xl:flex items-center gap-2 text-xs text-slate-400">
            <span aria-hidden="true">·</span>
            <span>מודול ממסרים, פיוזים ונעלי כבל</span>
            <span aria-hidden="true">·</span>
            <span>תקני DIN 72551 & SAE J1128</span>
            <span aria-hidden="true">·</span>
            <span>עיבוד מקומי 100% Client-Side</span>
          </div>
        </div>

        {/* Zone 2: Navigation tabs in Hebrew */}
        <nav className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('split')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'split'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            סטודיו משולב (2D + 3D)
          </button>
          <button
            onClick={() => setActiveTab('schematic')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'schematic'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            סרטוט סכמטי ומערכים
          </button>
          <button
            onClick={() => setActiveTab('workbench3d')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'workbench3d'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            סדנת בדיקה 3D
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'matrix'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            מטריצת לחיצה וכלים
          </button>
        </nav>

        {/* Zone 3: Primary actions (Import table, BOM, CI diagnostics) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* 1-Click Load Table from Prompt */}
          <button
            onClick={handleLoadSampleTable}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="טען או אפס לטבלת 42 מוליכי הרשת וההספק של הרכב"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>איפוס לטבלת 42 חוטים</span>
          </button>

          {/* Import Custom Table Button */}
          <button
            onClick={() => setIsImporterOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-300 bg-sky-950/40 hover:bg-sky-900/60 border border-sky-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="העלאת קבצי CSV/TSV ועיבוד 100% בצד לקוח"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>ייבא טבלה / קובץ</span>
          </button>

          {/* Export Corrected CSV */}
          <button
            onClick={handleExportCorrectedCSV}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="הורדת טבלת חיווט מתוקנת (CSV) עם המוליכים והפיוזים התקניים"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>הורד CSV מתוקן</span>
          </button>

          <button
            onClick={() => setIsDiagnosticsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="בדיקות יחידה וסימולטור CI/CD (16 בדיקות תקן)"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">בדיקות CI</span>
          </button>

          <button
            onClick={() => setIsHandbookOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">מדריך תקנים</span>
          </button>

          <button
            onClick={() => setIsBOMModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>הפקת BOM</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          Main Workspace Grid / Views
          ========================================================================= */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'split' && (
          <div className="w-full h-full grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-800">
            <SchematicCanvas
              nodes={nodes}
              wires={wires}
              violations={violations}
              subsystems={subsystems}
              activeSubsystemFilter={activeSubsystemFilter}
              onSelectSubsystemFilter={setActiveSubsystemFilter}
              onUpdateNodes={setNodes}
              onUpdateWires={setWires}
              onSelectComponentFor3D={setSelected3DModel}
              systemVoltage={systemVoltage}
              onApplySolution={handleApplySolution}
              onApplyAllFixes={handleApplyAllFixes}
              onExportCorrectedCSV={handleExportCorrectedCSV}
            />
            <ThreeWorkbench
              selectedComponentType={selected3DModel}
              onModelChange={setSelected3DModel}
            />
          </div>
        )}

        {activeTab === 'schematic' && (
          <div className="w-full h-full">
            <SchematicCanvas
              nodes={nodes}
              wires={wires}
              violations={violations}
              subsystems={subsystems}
              activeSubsystemFilter={activeSubsystemFilter}
              onSelectSubsystemFilter={setActiveSubsystemFilter}
              onUpdateNodes={setNodes}
              onUpdateWires={setWires}
              onSelectComponentFor3D={(m) => {
                setSelected3DModel(m);
                setActiveTab('workbench3d');
              }}
              systemVoltage={systemVoltage}
              onApplySolution={handleApplySolution}
              onApplyAllFixes={handleApplyAllFixes}
              onExportCorrectedCSV={handleExportCorrectedCSV}
            />
          </div>
        )}

        {activeTab === 'workbench3d' && (
          <div className="w-full h-full">
            <ThreeWorkbench
              selectedComponentType={selected3DModel}
              onModelChange={setSelected3DModel}
            />
          </div>
        )}

        {activeTab === 'matrix' && (
          <div className="w-full h-full">
            <CrimpMatrixTable />
          </div>
        )}
      </main>

      {/* =========================================================================
          Modals & Slide-out Drawers
          ========================================================================= */}
      <WireScheduleImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImportComplete={handleImportTable}
      />

      <BOMExportModal
        isOpen={isBOMModalOpen}
        onClose={() => setIsBOMModalOpen(false)}
        bomItems={bomItems}
        projectName="צמת רכב תעשייתית - 42 מוליכי רשת (CAN/LIN/POWER/GND)"
      />

      <SafetyDiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />

      <KnowledgeBaseDrawer
        isOpen={isHandbookOpen}
        onClose={() => setIsHandbookOpen(false)}
      />
    </div>
  );
}
