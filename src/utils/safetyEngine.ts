/**
 * HarnessMap Pro - Electrical Safety Engine & Verification Logic
 * Conforms to DIN 72551 & SAE J1128 Automotive Wiring Standards
 */

import {
  WireGaugeSpec,
  TerminalSpec,
  CrimpToolSpec,
  PinDefinition,
  CircuitNode,
  WireConnection,
  SafetyCheckViolation,
  BOMItem,
} from '../types/harness';

/**
 * Standard AWG Copper Conductor Specifications (Automotive TXL / GXL grade)
 */
export const AWG_SPECS: Record<number, WireGaugeSpec> = {
  10: {
    awg: 10,
    metricMm2: 5.26,
    resistanceOhmPerM: 0.00328,
    maxContinuousAmpacity80C: 50,
    maxContinuousAmpacity105C: 60,
    recommendedMaxContinuousAmps: 45,
    recommendedFuseMaxAmps: 50,
  },
  12: {
    awg: 12,
    metricMm2: 3.31,
    resistanceOhmPerM: 0.00521,
    maxContinuousAmpacity80C: 35,
    maxContinuousAmpacity105C: 45,
    recommendedMaxContinuousAmps: 30,
    recommendedFuseMaxAmps: 35,
  },
  14: {
    awg: 14,
    metricMm2: 2.08,
    resistanceOhmPerM: 0.00828,
    maxContinuousAmpacity80C: 25,
    maxContinuousAmpacity105C: 32,
    recommendedMaxContinuousAmps: 20,
    recommendedFuseMaxAmps: 25,
  },
  16: {
    awg: 16,
    metricMm2: 1.31,
    resistanceOhmPerM: 0.01317,
    maxContinuousAmpacity80C: 18,
    maxContinuousAmpacity105C: 22,
    recommendedMaxContinuousAmps: 15,
    recommendedFuseMaxAmps: 15,
  },
  18: {
    awg: 18,
    metricMm2: 0.82,
    resistanceOhmPerM: 0.02095,
    maxContinuousAmpacity80C: 12,
    maxContinuousAmpacity105C: 16,
    recommendedMaxContinuousAmps: 10,
    recommendedFuseMaxAmps: 10,
  },
  20: {
    awg: 20,
    metricMm2: 0.52,
    resistanceOhmPerM: 0.03331,
    maxContinuousAmpacity80C: 8,
    maxContinuousAmpacity105C: 11,
    recommendedMaxContinuousAmps: 7,
    recommendedFuseMaxAmps: 7.5,
  },
  22: {
    awg: 22,
    metricMm2: 0.33,
    resistanceOhmPerM: 0.05296,
    maxContinuousAmpacity80C: 5,
    maxContinuousAmpacity105C: 7,
    recommendedMaxContinuousAmps: 4,
    recommendedFuseMaxAmps: 5,
  },
  24: {
    awg: 24,
    metricMm2: 0.20,
    resistanceOhmPerM: 0.08422,
    maxContinuousAmpacity80C: 3,
    maxContinuousAmpacity105C: 4.5,
    recommendedMaxContinuousAmps: 2.5,
    recommendedFuseMaxAmps: 3,
  },
};

/**
 * Standard Faston & Stud Terminal Catalog Specifications
 */
export const TERMINAL_CATALOG: Record<string, TerminalSpec> = {
  'FAST-63-OB-14-18': {
    id: 'FAST-63-OB-14-18',
    name: 'Faston 6.3mm (1/4") Open Barrel',
    family: 'FASTON_6_3',
    tabWidthMm: 6.3,
    barrel: 'OPEN_BARREL_UNINSULATED',
    compatibleAwgMin: 14,
    compatibleAwgMax: 18,
    maxContinuousCurrentA: 35,
    recommendedTool: 'SN-48B / HT-225',
    crimpProfile: 'B_F_CRIMP',
    standardPartNumber: 'TE / AMP 42100-2',
    notes: 'The industry standard for ISO relay sockets and ATO/ATC fuse blocks.',
  },
  'FAST-63-OB-10-12': {
    id: 'FAST-63-OB-10-12',
    name: 'Faston 6.3mm Heavy-Duty Open Barrel',
    family: 'FASTON_6_3',
    tabWidthMm: 6.3,
    barrel: 'OPEN_BARREL_UNINSULATED',
    compatibleAwgMin: 10,
    compatibleAwgMax: 12,
    maxContinuousCurrentA: 45,
    recommendedTool: 'SN-48B (4.0mm² slot)',
    crimpProfile: 'B_F_CRIMP',
    standardPartNumber: 'TE / AMP 63011-2',
    notes: 'High-current locking tab for 40A/50A ISO relay power feeds.',
  },
  'FAST-63-CB-YEL': {
    id: 'FAST-63-CB-YEL',
    name: 'Faston 6.3mm Insulated Yellow',
    family: 'FASTON_6_3',
    tabWidthMm: 6.3,
    barrel: 'CLOSED_BARREL_PREINSULATED',
    compatibleAwgMin: 10,
    compatibleAwgMax: 12,
    maxContinuousCurrentA: 40,
    recommendedTool: 'LY-03BC / SN-02C',
    crimpProfile: 'OVAL_INDENT',
    standardPartNumber: '3M Scotchlok 80-6100-01',
    notes: 'Pre-insulated with internal brass sleeve and yellow PVC shroud.',
  },
  'FAST-63-CB-BLU': {
    id: 'FAST-63-CB-BLU',
    name: 'Faston 6.3mm Insulated Blue',
    family: 'FASTON_6_3',
    tabWidthMm: 6.3,
    barrel: 'CLOSED_BARREL_PREINSULATED',
    compatibleAwgMin: 14,
    compatibleAwgMax: 16,
    maxContinuousCurrentA: 25,
    recommendedTool: 'LY-03BC / SN-02C',
    crimpProfile: 'OVAL_INDENT',
    standardPartNumber: '3M Scotchlok 80-6100-02',
    notes: 'Common quick-disconnect for 15-20A accessory circuits.',
  },
  'FAST-48-OB': {
    id: 'FAST-48-OB',
    name: 'Faston 4.8mm (0.187") Open Barrel',
    family: 'FASTON_4_8',
    tabWidthMm: 4.8,
    barrel: 'OPEN_BARREL_UNINSULATED',
    compatibleAwgMin: 16,
    compatibleAwgMax: 20,
    maxContinuousCurrentA: 20,
    recommendedTool: 'SN-48B / PA-09',
    crimpProfile: 'B_F_CRIMP',
    standardPartNumber: 'Molex 19001-0003',
    notes: 'Intermediate size for dashboard rocker switches and mini relays.',
  },
  'FAST-28-OB': {
    id: 'FAST-28-OB',
    name: 'Faston 2.8mm (0.110") Micro Open Barrel',
    family: 'FASTON_2_8',
    tabWidthMm: 2.8,
    barrel: 'OPEN_BARREL_UNINSULATED',
    compatibleAwgMin: 20,
    compatibleAwgMax: 24,
    maxContinuousCurrentA: 10,
    recommendedTool: 'SN-28B / PA-09',
    crimpProfile: 'B_F_CRIMP',
    standardPartNumber: 'TE / AMP 160655-2',
    notes: 'Micro ISO relay coils, sensors, and electronic control modules.',
  },
  'RING-M6-OB': {
    id: 'RING-M6-OB',
    name: 'Ring Terminal M6 (1/4") Power Stud',
    family: 'RING_M6',
    studSize: 'M6',
    barrel: 'OPEN_BARREL_UNINSULATED',
    compatibleAwgMin: 10,
    compatibleAwgMax: 14,
    maxContinuousCurrentA: 55,
    recommendedTool: 'SN-48B / Heavy Ratchet',
    crimpProfile: 'B_F_CRIMP',
    standardPartNumber: 'Delphi / Aptiv 12015869',
    notes: 'Direct battery connection, alternator feed, and high-amp ground.',
  },
  'RING-M5-CB': {
    id: 'RING-M5-CB',
    name: 'Ring Terminal M5 (#10) Pre-Insulated',
    family: 'RING_M5',
    studSize: 'M5',
    barrel: 'CLOSED_BARREL_PREINSULATED',
    compatibleAwgMin: 14,
    compatibleAwgMax: 16,
    maxContinuousCurrentA: 25,
    recommendedTool: 'LY-03BC / SN-02WF',
    crimpProfile: 'OVAL_INDENT',
    standardPartNumber: 'Panduit PV14-10R-C',
    notes: 'Chassis ground connection and auxiliary fuse box terminal.',
  },
  'RING-M8-OB': {
    id: 'RING-M8-OB',
    name: 'Ring Terminal M8 (5/16") Battery Stud',
    family: 'RING_M8',
    studSize: 'M8',
    barrel: 'OPEN_BARREL_UNINSULATED',
    compatibleAwgMin: 10,
    compatibleAwgMax: 12,
    maxContinuousCurrentA: 75,
    recommendedTool: 'Heavy Ratchet Crimper',
    crimpProfile: 'HEX_CRIMP',
    standardPartNumber: 'QuickCable 400405',
    notes: 'Main distribution block and MAXI fuse master power feed.',
  },
};

/**
 * Standard Crimping Tools Knowledge Base
 */
export const CRIMP_TOOLS: CrimpToolSpec[] = [
  {
    id: 'TOOL-SN48B',
    model: 'SN-48B / HT-225',
    manufacturer: 'IWISS / Hanlong',
    crimpType: 'Dual B-Crimp / F-Crimp (Conductor + Insulation Wings)',
    wireRangeAwg: '14 - 26 AWG (0.14 - 1.5 / 2.5 mm²)',
    supportedTerminals: ['Faston 6.3mm Open Barrel', 'Faston 4.8mm Open Barrel', 'Weather-Pack', 'Ring Open Barrel'],
    jawMarkings: ['0.5 mm²', '1.0 mm²', '1.5 mm²', '2.5 mm²'],
    description: 'High-precision ratcheting crimper with EDM wire EDM cut jaws for factory-grade open-barrel B/F crimps.',
  },
  {
    id: 'TOOL-SN28B',
    model: 'SN-28B / PA-09',
    manufacturer: 'IWISS / Engineer Inc.',
    crimpType: 'Micro Open-Barrel Precision Crimp',
    wireRangeAwg: '20 - 28 AWG (0.08 - 0.5 mm²)',
    supportedTerminals: ['Faston 2.8mm Micro', 'JST', 'DuPont', 'Molex Micro-Fit'],
    jawMarkings: ['1.0 mm', '1.4 mm', '1.6 mm', '1.9 mm'],
    description: 'Micro crimp pliers designed for low-current signal terminals and micro-ISO relay coil connections.',
  },
  {
    id: 'TOOL-LY03BC',
    model: 'LY-03BC / SN-02C',
    manufacturer: 'Opt / IWISS',
    crimpType: 'Oval / Indent Double-Crimp for Insulated Shrouds',
    wireRangeAwg: '10 - 22 AWG (0.5 - 6.0 mm²)',
    supportedTerminals: ['Pre-Insulated Faston 6.3/4.8mm', 'Pre-Insulated Ring & Fork Terminals'],
    jawMarkings: ['Red (0.5-1.5)', 'Blue (1.5-2.5)', 'Yellow (4.0-6.0)'],
    description: 'Color-coded ratchet crimper that compresses the copper ferrule and provides mechanical strain relief on the PVC sleeve.',
  },
];

/**
 * Standard ISO Relay Pinout Rules (ISO 7588-1)
 */
export const ISO_RELAY_PINS: PinDefinition[] = [
  {
    pin: '30',
    label: 'Main Power Feed',
    description: 'High-current battery or fused power input. Requires minimum 12-14 AWG for 30A-40A circuits.',
    isPower: true,
    requiredTerminalFamily: 'FASTON_6_3',
  },
  {
    pin: '85',
    label: 'Coil Ground / Trigger (-)',
    description: 'Relay electromagnetic coil return to ground or switched negative trigger (0.15A - 0.25A load).',
    isPower: false,
    isCoilTrigger: true,
    requiredTerminalFamily: 'FASTON_6_3',
  },
  {
    pin: '86',
    label: 'Coil Positive (+)',
    description: '12V/24V ignition or toggle switch trigger to energize the coil (0.15A - 0.25A load).',
    isPower: false,
    isCoilTrigger: true,
    requiredTerminalFamily: 'FASTON_6_3',
  },
  {
    pin: '87',
    label: 'Normally Open (NO) Output',
    description: 'High-current output switched ON when coil is energized (e.g. driving aux lights, fans, fuel pumps).',
    isPower: true,
    requiredTerminalFamily: 'FASTON_6_3',
  },
  {
    pin: '87a',
    label: 'Normally Closed (NC) Output',
    description: 'High-current output connected to Pin 30 when coil is unpowered (5-pin SPDT relays only).',
    isPower: true,
    requiredTerminalFamily: 'FASTON_6_3',
  },
];

/**
 * Fuse Holder Pinout
 */
export const FUSE_HOLDER_PINS: PinDefinition[] = [
  {
    pin: 'IN',
    label: 'Fuse Input (Feed)',
    description: 'Hot wire input directly from battery or upstream junction.',
    isPower: true,
    requiredTerminalFamily: 'FASTON_6_3',
  },
  {
    pin: 'OUT',
    label: 'Fuse Output (Protected)',
    description: 'Protected power feed routed to relay pin 30 or directly to branch circuits.',
    isPower: true,
    requiredTerminalFamily: 'FASTON_6_3',
  },
];

/**
 * Calculate round-trip voltage drop across a wire conductor
 * V = 2 * (L / 1000) * I * R
 */
export function calculateVoltageDrop(currentAmps: number, lengthMm: number, awg: number): number {
  const spec = AWG_SPECS[awg] || AWG_SPECS[16];
  const lengthMeters = lengthMm / 1000;
  // Two-wire circuit loop (supply + ground return)
  return 2 * lengthMeters * currentAmps * spec.resistanceOhmPerM;
}

/**
 * Calculate percentage voltage drop
 */
export function calculateVoltageDropPercent(voltageDrop: number, systemVoltage: number): number {
  if (systemVoltage <= 0) return 0;
  return (voltageDrop / systemVoltage) * 100;
}

/**
 * Perform comprehensive electrical safety validation across all harness wires and nodes
 */
export function runSafetyChecks(
  nodes: CircuitNode[],
  wires: WireConnection[],
  systemVoltage = 12
): SafetyCheckViolation[] {
  const violations: SafetyCheckViolation[] = [];
  const nodeMap = new Map<string, CircuitNode>(nodes.map((n) => [n.id, n]));

  // Check each wire connection
  for (const wire of wires) {
    const fromNode = nodeMap.get(wire.fromNodeId);
    const toNode = nodeMap.get(wire.toNodeId);
    const spec = AWG_SPECS[wire.gaugeAwg] || AWG_SPECS[16];
    const isIsoPowerPin =
      (fromNode?.category === 'relay' && (wire.fromPin === '30' || wire.fromPin === '87' || wire.fromPin === '87a')) ||
      (toNode?.category === 'relay' && (wire.toPin === '30' || wire.toPin === '87' || wire.toPin === '87a'));

    // Check 1: AWG Ampacity Overload
    if (wire.expectedCurrentAmps > spec.maxContinuousAmpacity80C) {
      const recAwg = getRecommendedAwg(wire.expectedCurrentAmps);
      const recSpec = AWG_SPECS[recAwg] || AWG_SPECS[10];
      violations.push({
        id: `overload-${wire.id}`,
        wireId: wire.id,
        level: 'critical',
        title: 'סכנת שריפה: עומס יתר חמור על המוליך',
        message: `מוליך ${wire.gaugeAwg} AWG (${spec.metricMm2} מ"מ²) נושא זרם של ${wire.expectedCurrentAmps}A העולה על הסף התקני (${spec.maxContinuousAmpacity80C}A). סכנת התחממות והמסת בידוד.`,
        technicalMetric: `זרם: ${wire.expectedCurrentAmps}A | כושר נשיאה תקני: ${spec.maxContinuousAmpacity80C}A`,
        recommendedFix: `שדרוג מוליך ל-${recAwg} AWG לפחות עם נעל כבל מתאימה.`,
        solutions: [
          {
            id: `sol-upsize-${wire.id}`,
            title: `פתרון א': שדרוג המוליך ל-${recAwg} AWG`,
            description: `הגדלת קוטר הנחושת ל-${recSpec.metricMm2} מ"מ² בעל כושר נשיאה של ${recSpec.maxContinuousAmpacity80C}A`,
            actionType: 'upsize_wire',
            newAwg: recAwg,
            newTerminalId: recAwg <= 12 ? 'FAST-63-OB-10-12' : 'FAST-63-OB-14-18',
          },
          {
            id: `sol-derate-${wire.id}`,
            title: `פתרון ב': הפחתת זרם העבודה המרבי ל-${spec.recommendedMaxContinuousAmps}A`,
            description: `הגבלת צריכת הזרם של המעגל לרמה בטוחה שתמנע התחממות של מוליך ה-${wire.gaugeAwg} AWG הקיים`,
            actionType: 'derate_load',
            newExpectedCurrent: spec.recommendedMaxContinuousAmps,
          },
        ],
      });
    } else if (wire.expectedCurrentAmps > spec.recommendedMaxContinuousAmps) {
      const recAwg = getRecommendedAwg(wire.expectedCurrentAmps);
      violations.push({
        id: `warn-ampacity-${wire.id}`,
        wireId: wire.id,
        level: 'warning',
        title: 'חריגה ממקדם ביטחון תרמי (80% Derating)',
        message: `מוליך ${wire.gaugeAwg} AWG פועל בעומס ${wire.expectedCurrentAmps}A הקרוב לסף המרבי ומפחית את מקדם הביטחון בתא מנוע חם.`,
        technicalMetric: `עומס: ${wire.expectedCurrentAmps}A | גבול מומלץ: ${spec.recommendedMaxContinuousAmps}A`,
        recommendedFix: `מומלץ לשדרג ל-${recAwg} AWG לשמירה על אורך חיים ממושך.`,
        solutions: [
          {
            id: `sol-warn-upsize-${wire.id}`,
            title: `פתרון א': שדרוג לעובי מוליך ${recAwg} AWG`,
            description: `מתן מקדם ביטחון של מעל 25% לעמידות בחום תא מנוע לפי תקן SAE J1128`,
            actionType: 'upsize_wire',
            newAwg: recAwg,
          },
          {
            id: `sol-warn-derate-${wire.id}`,
            title: `פתרון ב': הפחתת הזרם הרציף ל-${spec.recommendedMaxContinuousAmps}A`,
            description: `הגבלת זרם הצרכן לסף העבודה הרציף המומלץ של החוט הקיים`,
            actionType: 'derate_load',
            newExpectedCurrent: spec.recommendedMaxContinuousAmps,
          },
        ],
      });
    }

    // Check 2: Relay High-Current Pin Sizing (Prompt Specific: 40A on thin 20/22 AWG)
    if (isIsoPowerPin && wire.expectedCurrentAmps >= 20 && wire.gaugeAwg >= 18) {
      violations.push({
        id: `relay-high-power-${wire.id}`,
        wireId: wire.id,
        nodeId: fromNode?.category === 'relay' ? fromNode.id : toNode?.id,
        level: 'critical',
        title: 'חוסר תאימות: זרם ממסר גבוה על מוליך דק',
        message: `פין ממסר ראשי (פין ${wire.fromPin === '30' || wire.fromPin === '87' ? wire.fromPin : wire.toPin}) הנושא ${wire.expectedCurrentAmps}A מחובר לחוט דק ${wire.gaugeAwg} AWG. פינים 30 ו-87 בממסר 30A/40A דורשים חוט עבה מינימום 12/14 AWG ונעל כבל Faston 6.3 מ"מ מתאימה.`,
        technicalMetric: `עומס קו: ${wire.expectedCurrentAmps}A | עובי נוכחי: ${wire.gaugeAwg} AWG`,
        recommendedFix: 'זרם גבוה (20A-40A) דורש חוט עבה מינימום 12/14 AWG ונעל כבל Faston 6.3 מ"מ מתאימה.',
        solutions: [
          {
            id: `sol-relay-fix-12-${wire.id}`,
            title: `פתרון א': שדרוג לחוט 12 AWG ונעל כבל Faston 6.3 מ"מ פתוחה`,
            description: `עמידה מלאה בתקן ISO 7588 לממסרי כוח 40A עם לחיצת F-Crimp תקנית`,
            actionType: 'upsize_wire',
            newAwg: 12,
            newTerminalId: 'FAST-63-OB-10-12',
          },
          {
            id: `sol-relay-fix-14-${wire.id}`,
            title: `פתרון ב': שדרוג לחוט 14 AWG ונעל Faston 6.3 מ"מ (עבור זרם עד 25A)`,
            description: `מתאים למעגלי עזר בינוניים עד 25A עם נעל Faston תקנית`,
            actionType: 'upsize_wire',
            newAwg: 14,
            newTerminalId: 'FAST-63-OB-14-18',
          },
        ],
      });
    }

    // Check 3: Current exceeds Fuse Rating on protected wire
    const wireFuseA = wire.fuseRatingA || 0;
    if (wireFuseA > 0 && wire.expectedCurrentAmps > wireFuseA) {
      const recFuse = wire.expectedCurrentAmps <= 25 ? 30 : wire.expectedCurrentAmps <= 35 ? 40 : 60;
      violations.push({
        id: `fuse-blown-hazard-${wire.id}`,
        wireId: wire.id,
        level: 'critical',
        title: 'זרם הצרכן עולה על דירוג הפיוז (שריפת פיוז מובטחת)',
        message: `הזרם הצפוי בקו (${wire.expectedCurrentAmps}A) עולה על ערך הפיוז (${wireFuseA}A). הפיוז יקפוץ מיד עם הפעלת הצרכן.`,
        technicalMetric: `זרם: ${wire.expectedCurrentAmps}A | פיוז: ${wireFuseA}A`,
        recommendedFix: `הגדלת הפיוז ל-${recFuse}A לפחות או הפחתת זרם הצרכן.`,
        solutions: [
          {
            id: `sol-fuse-up-${wire.id}`,
            title: `פתרון א': שדרוג הפיוז ל-${recFuse}A (מקדם ביטחון)`,
            description: `התאמת ערך הפיוז לעבודה יציבה בעומס רציף של ${wire.expectedCurrentAmps}A ללא קפיצות שווא`,
            actionType: 'adjust_fuse',
            newFuseAmps: recFuse,
          },
          {
            id: `sol-fuse-down-current-${wire.id}`,
            title: `פתרון ב': הגבלת זרם הצרכן ל-${Math.round(wireFuseA * 0.8)}A`,
            description: `הפחתת צריכת העומס ל-80% מערך הפיוז הקיים (${wireFuseA}A) להגנה מושלמת`,
            actionType: 'derate_load',
            newExpectedCurrent: Math.round(wireFuseA * 0.8),
          },
        ],
      });
    }

    // Check 4: Terminal Size Compatibility with Conductor
    const fromTerm = TERMINAL_CATALOG[wire.fromTerminalId];
    if (fromTerm) {
      if (wire.gaugeAwg < fromTerm.compatibleAwgMin || wire.gaugeAwg > fromTerm.compatibleAwgMax) {
        const correctTerm = wire.gaugeAwg <= 12 ? 'FAST-63-OB-10-12' : 'FAST-63-OB-14-18';
        violations.push({
          id: `term-mismatch-from-${wire.id}`,
          wireId: wire.id,
          level: 'warning',
          title: 'אי-התאמה בין נעל הכבל לעובי המוליך',
          message: `נעל הכבל ${fromTerm.name} מיועדת ל-${fromTerm.compatibleAwgMin}-${fromTerm.compatibleAwgMax} AWG, אך המוליך הוא ${wire.gaugeAwg} AWG. לחיצה לא מותאמת תגרום לשליפת חוט או התנגדות מגע גבוהה.`,
          technicalMetric: `חוט: ${wire.gaugeAwg} AWG | טווח נעל: ${fromTerm.compatibleAwgMin}-${fromTerm.compatibleAwgMax} AWG`,
          recommendedFix: `החלפת נעל הכבל לדגם המתאים לעובי ${wire.gaugeAwg} AWG.`,
          solutions: [
            {
              id: `sol-term-match-${wire.id}`,
              title: `פתרון א': החלפת נעל כבל לדגם מותאם ל-${wire.gaugeAwg} AWG`,
              description: `התקנת נעל כבל Faston 6.3 מ"מ בעלת חבית לחיצה תקנית`,
              actionType: 'upgrade_terminal',
              newTerminalId: correctTerm,
            },
            {
              id: `sol-wire-to-term-${wire.id}`,
              title: `פתרון ב': התאמת עובי החוט ל-${fromTerm.compatibleAwgMin} AWG`,
              description: `שינוי עובי המוליך כדי שיתאים במדויק לחבית של נעל הכבל הקיימת`,
              actionType: 'upsize_wire',
              newAwg: fromTerm.compatibleAwgMin,
            },
          ],
        });
      }
    }

    // Check 5: Voltage Drop
    const vDrop = calculateVoltageDrop(wire.expectedCurrentAmps, wire.lengthMm, wire.gaugeAwg);
    const vDropPct = calculateVoltageDropPercent(vDrop, systemVoltage);
    if (vDropPct > 5) {
      const recAwg = getRecommendedAwg(wire.expectedCurrentAmps, wire.lengthMm, systemVoltage);
      violations.push({
        id: `vdrop-severe-${wire.id}`,
        wireId: wire.id,
        level: 'warning',
        title: 'מפל מתח חריג בקו (> 5%)',
        message: `מפל מתח של ${vDrop.toFixed(2)}V (${vDropPct.toFixed(1)}%) לאורך המוליך (${wire.lengthMm} מ"מ). עלול לגרום לתת-מתח, עמעום אורות או כיבוי בקרים.`,
        technicalMetric: `מפל מתח: ${vDropPct.toFixed(1)}% (${vDrop.toFixed(2)}V במערכת ${systemVoltage}V)`,
        recommendedFix: `הגדלת שטח חתך המוליך ל-${recAwg} AWG לפחות.`,
        solutions: [
          {
            id: `sol-drop-upsize-${wire.id}`,
            title: `פתרון א': שדרוג מוליך ל-${recAwg} AWG להפחתת התנגדות`,
            description: `הורדת מפל המתח אל מתחת ל-3% לשמירה על מתח תקין בצרכן`,
            actionType: 'upsize_wire',
            newAwg: recAwg,
          },
          {
            id: `sol-drop-derate-${wire.id}`,
            title: `פתרון ב': הפחתת זרם הפעולה הרציף`,
            description: `הורדת העומס ב-30% להקטנת מפל המתח על הקו הקיים`,
            actionType: 'derate_load',
            newExpectedCurrent: Math.round(wire.expectedCurrentAmps * 0.7),
          },
        ],
      });
    }
  }

  // Check 6: Fuse Coordination on Protected Circuits
  const fuseNodes = nodes.filter((n) => n.category === 'protection');
  for (const fuse of fuseNodes) {
    const connectedWires = wires.filter((w) => w.fromNodeId === fuse.id || w.toNodeId === fuse.id);
    const fuseAmps = fuse.fuseRatingAmps || fuse.ratingAmps || 20;

    for (const wire of connectedWires) {
      const spec = AWG_SPECS[wire.gaugeAwg] || AWG_SPECS[16];
      if (fuseAmps > spec.maxContinuousAmpacity80C) {
        const recAwg = getRecommendedAwg(fuseAmps);
        violations.push({
          id: `fuse-wire-hazard-${fuse.id}-${wire.id}`,
          nodeId: fuse.id,
          wireId: wire.id,
          level: 'critical',
          title: 'פיוז אינו מגן על המוליך (סכנת שריפה בקצר)',
          message: `דירוג הפיוז (${fuseAmps}A) גבוה מכושר ההולכה המרבי של חוט ${wire.gaugeAwg} AWG (${spec.maxContinuousAmpacity80C}A). בעת קצר החוט יישרף לפני שהפיוז ייפתח!`,
          technicalMetric: `פיוז: ${fuseAmps}A | גבול מוליך בטוח: ${spec.maxContinuousAmpacity80C}A`,
          recommendedFix: `הקטנת הפיוז ל-${spec.recommendedFuseMaxAmps}A לכל היותר, או שדרוג החוט ל-${recAwg} AWG.`,
          solutions: [
            {
              id: `sol-fuse-down-${wire.id}`,
              title: `פתרון א': הקטנת הפיוז ל-${spec.recommendedFuseMaxAmps}A`,
              description: `הבטחה שהפיוז ייפתח בבטחה לפני הגעה לטמפרטורת התכה של המוליך`,
              actionType: 'adjust_fuse',
              newFuseAmps: spec.recommendedFuseMaxAmps,
            },
            {
              id: `sol-wire-up-for-fuse-${wire.id}`,
              title: `פתרון ב': שדרוג המוליך ל-${recAwg} AWG`,
              description: `התאמת כושר ההולכה של החוט לעמידה במלוא זרם הפיוז (${fuseAmps}A)`,
              actionType: 'upsize_wire',
              newAwg: recAwg,
            },
          ],
        });
      }
    }
  }

  return violations;
}

/**
 * Determine recommended AWG for a given current load and length
 */
export function getRecommendedAwg(currentAmps: number, lengthMm = 1500, systemVoltage = 12): number {
  const gauges = [24, 22, 20, 18, 16, 14, 12, 10];
  for (const awg of gauges) {
    const spec = AWG_SPECS[awg];
    if (spec.recommendedMaxContinuousAmps >= currentAmps) {
      const drop = calculateVoltageDrop(currentAmps, lengthMm, awg);
      const dropPct = calculateVoltageDropPercent(drop, systemVoltage);
      if (dropPct <= 3.0) {
        return awg;
      }
    }
  }
  return 10;
}

/**
 * Generate a complete, categorized Manufacturing Bill of Materials (BOM)
 */
export function generateBOM(nodes: CircuitNode[], wires: WireConnection[]): BOMItem[] {
  const bom: BOMItem[] = [];

  // 1. Relays & Sockets
  const relayCounts: Record<string, number> = {};
  for (const n of nodes) {
    if (n.category === 'relay') {
      const key = `${n.type}-${n.ratingAmps || 40}`;
      relayCounts[key] = (relayCounts[key] || 0) + 1;
    }
  }
  for (const [key, count] of Object.entries(relayCounts)) {
    const is5Pin = key.includes('5pin');
    const isMicro = key.includes('micro');
    bom.push({
      id: `bom-relay-${key}`,
      category: 'Relays & Sockets',
      partNumber: isMicro ? 'BOSCH 0332207304' : is5Pin ? 'TE V23234-A0001-X032' : 'TE V23234-A0004-X051',
      description: isMicro
        ? 'Micro-ISO 12V 25A Automotive Relay (Plug-in)'
        : is5Pin
        ? 'Standard ISO 5-Pin SPDT 12V 40A Relay with Bracket'
        : 'Standard ISO 4-Pin SPST 12V 40A Relay with Bracket',
      specification: is5Pin ? 'Contacts: 30, 85, 86, 87, 87a (12V 40A/30A)' : 'Contacts: 30, 85, 86, 87 (12V 40A)',
      quantity: count,
      unit: 'pcs',
      toolingRequired: 'N/A (Plug-in socket mount)',
    });
    // Add Relay Socket Base
    bom.push({
      id: `bom-socket-${key}`,
      category: 'Relays & Sockets',
      partNumber: isMicro ? 'APTIV 12065863' : 'TE 1393310-4',
      description: isMicro ? 'Micro ISO Modular Relay Socket Base' : '5-Pin ISO Interlocking Relay Socket Housing',
      specification: 'High-temp PA66 nylon accepting 6.3mm Faston terminals with locking tang',
      quantity: count,
      unit: 'pcs',
      toolingRequired: 'Faston terminal extraction pick',
    });
  }

  // 2. Fuses & Fuse Holders
  const fuseCounts: Record<string, { count: number; rating: number; type: string }> = {};
  for (const n of nodes) {
    if (n.category === 'protection') {
      const rating = n.fuseRatingAmps || n.ratingAmps || 20;
      const key = `${n.type}-${rating}`;
      if (!fuseCounts[key]) {
        fuseCounts[key] = { count: 0, rating, type: n.type };
      }
      fuseCounts[key].count += 1;
    }
  }
  for (const [, item] of Object.entries(fuseCounts)) {
    const isAto = item.type.includes('ato');
    const isMini = item.type.includes('mini');
    const isMaxi = item.type.includes('maxi');
    bom.push({
      id: `bom-fuse-${item.type}-${item.rating}`,
      category: 'Fuses & Holders',
      partNumber: isMaxi
        ? `LITTELFUSE 0MAX0${item.rating}ZX`
        : isMini
        ? `LITTELFUSE 0MIN0${item.rating < 10 ? '0' + item.rating : item.rating}ZX`
        : `LITTELFUSE 0ATO0${item.rating < 10 ? '0' + item.rating : item.rating}ZX`,
      description: isMaxi
        ? `MAXI Blade Fuse ${item.rating}A (High-Power Main Feed)`
        : isMini
        ? `MINI Blade Fuse ${item.rating}A (Compact Automotive)`
        : `ATO/ATC Standard Blade Fuse ${item.rating}A`,
      specification: `Fast-Acting Automotive Fuse, 32V DC, Color code: ${getFuseColor(item.rating)}`,
      quantity: item.count,
      unit: 'pcs',
    });

    bom.push({
      id: `bom-holder-${item.type}-${item.rating}`,
      category: 'Fuses & Holders',
      partNumber: isMaxi ? 'LITTELFUSE MAHN0001Z' : 'LITTELFUSE FHAC0001ZX',
      description: isMaxi
        ? 'Heavy-Duty MAXI Inline Fuse Holder with Splash-proof Cap'
        : 'Waterproof ATO/ATC Inline Fuse Holder with Rubber Cover',
      specification: isMaxi ? '8-10 AWG leads, rated up to 80A' : '12-14 AWG wire leads, IP67 sealed',
      quantity: item.count,
      unit: 'pcs',
    });
  }

  // 3. Terminals
  const terminalCounts: Record<string, number> = {};
  for (const w of wires) {
    if (w.fromTerminalId) {
      terminalCounts[w.fromTerminalId] = (terminalCounts[w.fromTerminalId] || 0) + 1;
    }
    if (w.toTerminalId) {
      terminalCounts[w.toTerminalId] = (terminalCounts[w.toTerminalId] || 0) + 1;
    }
  }
  for (const [termId, qty] of Object.entries(terminalCounts)) {
    const spec = TERMINAL_CATALOG[termId];
    if (spec) {
      bom.push({
        id: `bom-term-${termId}`,
        category: 'Terminals',
        partNumber: spec.standardPartNumber,
        description: spec.name,
        specification: `${spec.barrel === 'OPEN_BARREL_UNINSULATED' ? 'Open Barrel (Uninsulated)' : 'Pre-Insulated Closed'} for ${spec.compatibleAwgMin}-${spec.compatibleAwgMax} AWG (${spec.tabWidthMm ? spec.tabWidthMm + 'mm tab' : spec.studSize + ' stud'})`,
        quantity: qty,
        unit: 'pcs',
        toolingRequired: spec.recommendedTool,
      });
    }
  }

  // 4. Wire Conductors
  const wireLengthByAwg: Record<number, { lengthMm: number; count: number }> = {};
  for (const w of wires) {
    if (!wireLengthByAwg[w.gaugeAwg]) {
      wireLengthByAwg[w.gaugeAwg] = { lengthMm: 0, count: 0 };
    }
    wireLengthByAwg[w.gaugeAwg].lengthMm += w.lengthMm;
    wireLengthByAwg[w.gaugeAwg].count += 1;
  }
  for (const [awgStr, data] of Object.entries(wireLengthByAwg)) {
    const awg = Number(awgStr);
    const spec = AWG_SPECS[awg];
    const lengthM = (data.lengthMm / 1000).toFixed(2);
    bom.push({
      id: `bom-wire-${awg}`,
      category: 'Wire Conductors',
      partNumber: `TXL-${awg}AWG-STRANDED`,
      description: `${awg} AWG Automotive Thin-Wall Cross-Linked Polyethylene Wire (TXL)`,
      specification: `Cross-section: ${spec.metricMm2} mm², Temp rating: -40°C to +125°C, SAE J1128 compliant. Cut count: ${data.count} leads`,
      quantity: Number(lengthM),
      unit: 'meters',
      toolingRequired: 'Automatic Wire Stripper (0.5 - 6.0 mm²)',
    });
  }

  // 5. Crimp Tooling
  const requiredTools = new Set<string>();
  for (const term of bom.filter((b) => b.category === 'Terminals')) {
    if (term.toolingRequired) {
      requiredTools.add(term.toolingRequired);
    }
  }
  for (const toolDesc of requiredTools) {
    const matchedTool = CRIMP_TOOLS.find((t) => toolDesc.includes(t.model.split(' ')[0]));
    bom.push({
      id: `bom-tool-${toolDesc}`,
      category: 'Tooling',
      partNumber: matchedTool ? matchedTool.model : toolDesc,
      description: matchedTool ? matchedTool.description : 'Precision Ratchet Crimping Plier',
      specification: matchedTool ? `${matchedTool.crimpType} (${matchedTool.wireRangeAwg})` : toolDesc,
      quantity: 1,
      unit: 'tool',
    });
  }

  return bom;
}

export function getFuseColor(amps: number): string {
  switch (amps) {
    case 1:
      return 'Black';
    case 2:
      return 'Gray';
    case 3:
      return 'Violet';
    case 4:
      return 'Pink';
    case 5:
      return 'Tan';
    case 7.5:
      return 'Brown';
    case 10:
      return 'Red';
    case 15:
      return 'Blue';
    case 20:
      return 'Yellow';
    case 25:
      return 'Clear / White';
    case 30:
      return 'Green';
    case 40:
      return 'Amber / Orange';
    case 50:
      return 'Red (MAXI)';
    case 60:
      return 'Blue (MAXI)';
    case 70:
      return 'Brown (MAXI)';
    case 80:
      return 'White (MAXI)';
    case 100:
      return 'Purple (MAXI)';
    default:
      return 'Standard';
  }
}
