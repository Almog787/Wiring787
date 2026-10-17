/**
 * HarnessMap Pro - Automotive Wire Schedule Parser & Network Bus Partitioning
 * Complete client-side parsing for multi-bus harnesses, twisted pairs, and fuse coordination.
 */

import { CircuitNode, WireConnection, ParsedWireRow, PinDefinition } from '../types/harness';

export interface ParseResult {
  nodes: CircuitNode[];
  wires: WireConnection[];
  subsystems: string[];
  rawRowsCount: number;
}

/**
 * Clean hex / color name helper
 */
export function normalizeColor(colorStr: string): string {
  if (!colorStr || colorStr === '#NONE' || colorStr === 'NONE') return '';
  if (colorStr.startsWith('#')) return colorStr;
  const named: Record<string, string> = {
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    RED: '#FF0000',
    GREEN: '#00FF00',
    BLUE: '#0000FF',
    YELLOW: '#FFFF00',
    ORANGE: '#FFA500',
    PURPLE: '#800080',
    CYAN: '#00FFFF',
    NAVY: '#000080',
    BROWN: '#A52A2A',
  };
  return named[colorStr.toUpperCase()] || colorStr;
}

/**
 * Map Network_Bus to Hebrew Subsystem Array
 */
export function mapBusToSubsystem(bus: string): string {
  const b = bus.toUpperCase();
  if (b.includes('CAN0') || b.includes('POWERTRAIN')) {
    return 'רשת הנעה ובקרה (Powertrain CAN0)';
  }
  if (b.includes('CAN1') || b.includes('BODY')) {
    return 'רשת מרכב ונוחות (Body CAN1)';
  }
  if (b.includes('CAN2') || b.includes('INFOTAINMENT')) {
    return 'רשת בידור ומולטימדיה (Infotainment CAN2)';
  }
  if (b.includes('CAN3') || b.includes('ADAS') || b.includes('SAFETY')) {
    return 'רשת בטיחות וחיישני ADAS (CAN3)';
  }
  if (b.includes('LIN')) {
    return 'רשתות LIN תת-מערכתיות';
  }
  if (b.includes('POWER') || b.includes('FEED') || b.includes('BATTERY')) {
    return 'הזנת כוח ופיוזים ראשיים (Power Feed)';
  }
  if (b.includes('GROUND') || b.includes('CHASSIS') || b.includes('GND')) {
    return 'נקודות הארקת שלדה (Ground Chassis)';
  }
  return bus || 'מערך אותות כללי';
}

export function inferSubsystem(nameOrBus: string): string {
  const b = nameOrBus.toUpperCase();
  if (b.includes('CAN0') || b.includes('POWERTRAIN')) {
    return 'רשת הנעה ובקרה (Powertrain CAN0)';
  }
  if (b.includes('CAN1') || b.includes('BODY')) {
    return 'רשת מרכב ונוחות (Body CAN1)';
  }
  if (b.includes('CAN2') || b.includes('INFOTAINMENT')) {
    return 'רשת בידור ומולטימדיה (Infotainment CAN2)';
  }
  if (b.includes('CAN3') || b.includes('ADAS') || b.includes('SAFETY')) {
    return 'רשת בטיחות וחיישני ADAS (CAN3)';
  }
  if (b.includes('LIN')) {
    return 'רשתות LIN תת-מערכתיות';
  }
  const lower = nameOrBus.toLowerCase();
  if (lower.includes('battery') || lower.includes('feed') || lower.includes('fuse') || lower.includes('power') || lower.includes('מצבר') || lower.includes('כוח')) {
    return 'הזנת כוח ופיוזים ראשיים (Power Feed)';
  }
  if (lower.includes('stop') || lower.includes('emergency') || lower.includes('חירום')) {
    return 'מעגל השבתת חירום (Safety Critical E-Stop)';
  }
  if (lower.includes('steering') || lower.includes('actuator') || lower.includes('throttle') || lower.includes('היגוי')) {
    return 'בקרת מפעילים והיגוי (Actuator & Steering)';
  }
  return mapBusToSubsystem(nameOrBus);
}

/**
 * Infer component category & visual styling
 */
function inferModuleType(name: string): { type: CircuitNode['type']; category: CircuitNode['category']; titleHe: string } {
  const lower = name.toLowerCase();

  if (lower.includes('fuse') || lower.includes('פיוז')) {
    return { type: 'fuse_block_6way', category: 'protection', titleHe: 'תיבת פיוזים מרכזית (Fuse Block)' };
  }
  if (lower.includes('battery') || lower.includes('מצבר')) {
    return { type: 'battery_source', category: 'source', titleHe: 'מצבר ראשי 12V' };
  }
  if (lower.includes('ground') || lower.includes('gnd') || lower.includes('הארקה')) {
    return { type: 'ground_chassis', category: 'source', titleHe: 'נקודת הארקת שלדה (GND)' };
  }
  if (lower.includes('relay') || lower.includes('ממסר')) {
    return { type: 'relay_iso_5pin', category: 'relay', titleHe: 'ממסר כוח ראשי (ISO Relay)' };
  }
  if (lower.includes('ecu')) {
    return { type: 'module_electronic', category: 'module', titleHe: 'מחשב מנוע (ECU Engine Control)' };
  }
  if (lower.includes('tcu')) {
    return { type: 'module_electronic', category: 'module', titleHe: 'מחשב גיר (TCU Transmission)' };
  }
  if (lower.includes('abs') || lower.includes('brake')) {
    return { type: 'module_electronic', category: 'module', titleHe: 'יחידת בלימה ובקרת יציבות (ABS/ESP)' };
  }
  if (lower.includes('eps') || lower.includes('steering')) {
    return { type: 'actuator_driver', category: 'load', titleHe: 'הגה כוח חשמלי (EPS Power Steering)' };
  }
  if (lower.includes('bcm')) {
    return { type: 'module_electronic', category: 'module', titleHe: 'בקר מרכב מרכזי (BCM Body Control)' };
  }
  if (lower.includes('gateway')) {
    return { type: 'module_electronic', category: 'module', titleHe: 'שער תקשורת מרכזי (Central Gateway)' };
  }
  if (lower.includes('radar')) {
    return { type: 'module_electronic', category: 'module', titleHe: 'חיישן מכ"ם קדמי (Forward Radar)' };
  }
  if (lower.includes('camera')) {
    return { type: 'module_electronic', category: 'module', titleHe: 'מצלמת ADAS קדמית' };
  }
  if (lower.includes('airbag') || lower.includes('srs')) {
    return { type: 'module_electronic', category: 'module', titleHe: 'יחידת כריות אוויר (Airbag SRS)' };
  }
  if (lower.includes('infotainment') || lower.includes('cluster') || lower.includes('head_unit')) {
    return { type: 'module_electronic', category: 'module', titleHe: 'מערכת מולטימדיה / לוח מחוונים' };
  }
  return { type: 'module_electronic', category: 'module', titleHe: name.replace(/_/g, ' ') };
}

/**
 * Resilient CSV/TSV table row splitter
 */
function splitTableRow(rowText: string): string[] {
  if (rowText.includes('\t')) {
    return rowText.split('\t').map((c) => c.trim());
  }

  const matches: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < rowText.length; i++) {
    const char = rowText[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      matches.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  matches.push(current.trim());
  return matches;
}

/**
 * Parse wire schedule table text into structured nodes and wires
 */
export function parseWireScheduleTable(rawContent: string): ParseResult {
  const lines = rawContent
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#') && !l.startsWith('//'));

  if (lines.length === 0) {
    return { nodes: [], wires: [], subsystems: [], rawRowsCount: 0 };
  }

  // Column header index detection with fallback
  let headerIndex = -1;
  const colMap: Record<string, number> = {
    wireId: 0,
    networkBus: 1,
    signalName: 2,
    fromModule: 3,
    fromPin: 4,
    toModule: 5,
    toPin: 6,
    wireGaugeAwg: 7,
    primaryColor: 8,
    stripeColor: 9,
    twistedPairId: 10,
    terminationResistor: 11,
    currentRatingA: 12,
    fuseRatingA: 13,
  };

  for (let i = 0; i < Math.min(lines.length, 3); i++) {
    const rawCols = splitTableRow(lines[i]);
    const cols = rawCols.map((c) => c.toLowerCase().replace(/[\s_-]/g, ''));
    if (
      cols.some((c) => c.includes('wire') || c.includes('network') || c.includes('bus') || c.includes('from') || c.includes('source'))
    ) {
      headerIndex = i;
      cols.forEach((col, idx) => {
        if (col.includes('wireid') || col === 'wire' || col === 'id') {
          colMap.wireId = idx;
        } else if (col.includes('network') || col.includes('bus')) {
          colMap.networkBus = idx;
        } else if (col === 'signalname' || (col.includes('signal') && !col.includes('type'))) {
          colMap.signalName = idx;
        } else if (col.includes('term') || col.includes('resistor') || col.includes('נגד')) {
          colMap.terminationResistor = idx;
        } else if (col.includes('twist') || col.includes('pair') || col.includes('שזור')) {
          colMap.twistedPairId = idx;
        } else if (col.includes('current') || col.includes('זרם') || col.includes('amp')) {
          colMap.currentRatingA = idx;
        } else if (col.includes('fuse') || col.includes('פיוז') || col.includes('נתיך')) {
          colMap.fuseRatingA = idx;
        } else if (col.includes('from') || col.includes('source') || col.includes('מקור')) {
          if (col.includes('pin') || col.includes('פין')) colMap.fromPin = idx;
          else colMap.fromModule = idx;
        } else if (col.startsWith('to') || col.includes('dest') || col.includes('destination') || col.includes('יעד')) {
          if (col.includes('pin') || col.includes('פין')) colMap.toPin = idx;
          else colMap.toModule = idx;
        } else if (col.includes('awg') || col.includes('gauge') || col.includes('עובי')) {
          colMap.wireGaugeAwg = idx;
        } else if (col.includes('stripe') || col.includes('פס')) {
          colMap.stripeColor = idx;
        } else if (col.includes('primary') || col.includes('color') || col.includes('צבע')) {
          colMap.primaryColor = idx;
        }
      });
      break;
    }
  }

  const dataLines = headerIndex >= 0 ? lines.slice(headerIndex + 1) : lines;
  const parsedRows: ParsedWireRow[] = [];

  for (const line of dataLines) {
    const cells = splitTableRow(line);
    if (cells.length < 5) continue;

    const wireId = cells[colMap.wireId] || `W-${parsedRows.length + 1}`;
    const networkBus = cells[colMap.networkBus] || 'CAN0_HS_Powertrain';
    const signalName = cells[colMap.signalName] || 'Signal';
    const fromModule = cells[colMap.fromModule] || 'Module_A';
    const fromPin = cells[colMap.fromPin] || '1';
    const toModule = cells[colMap.toModule] || 'Module_B';
    const toPin = cells[colMap.toPin] || '1';

    // Parse AWG (e.g. "22 AWG" -> 22)
    const rawAwg = cells[colMap.wireGaugeAwg] || '22';
    const awgVal = parseInt(rawAwg.replace(/[^0-9]/g, ''), 10) || 22;

    const primaryColor = cells[colMap.primaryColor] || '#00FF00';
    const stripeColor = cells[colMap.stripeColor] || '#NONE';
    const twistedPairId = cells[colMap.twistedPairId] || 'NONE';
    const terminationResistor = cells[colMap.terminationResistor] || 'NONE';

    // Parse Current (e.g. "25A" -> 25)
    const rawCurrent = cells[colMap.currentRatingA] || '3';
    const currentA = parseFloat(rawCurrent.replace(/[^0-9.]/g, '')) || 3;

    // Parse Fuse (e.g. "20A" -> 20, "NONE" -> 0)
    const rawFuse = cells[colMap.fuseRatingA] || '0';
    const fuseA = rawFuse.toUpperCase().includes('NONE') ? 0 : parseFloat(rawFuse.replace(/[^0-9.]/g, '')) || 0;

    parsedRows.push({
      wireId,
      networkBus,
      signalName,
      fromModule,
      fromPin,
      toModule,
      toPin,
      wireGaugeAwg: awgVal,
      primaryColor,
      stripeColor,
      twistedPairId,
      terminationResistor,
      currentRatingA: currentA,
      fuseRatingA: fuseA,
    });
  }

  // Extract unique modules
  const moduleMap = new Map<string, { pins: Set<string>; busSet: Set<string> }>();

  for (const row of parsedRows) {
    if (!moduleMap.has(row.fromModule)) {
      moduleMap.set(row.fromModule, { pins: new Set(), busSet: new Set() });
    }
    moduleMap.get(row.fromModule)!.pins.add(row.fromPin);
    moduleMap.get(row.fromModule)!.busSet.add(row.networkBus);

    if (!moduleMap.has(row.toModule)) {
      moduleMap.set(row.toModule, { pins: new Set(), busSet: new Set() });
    }
    moduleMap.get(row.toModule)!.pins.add(row.toPin);
    moduleMap.get(row.toModule)!.busSet.add(row.networkBus);
  }

  // Group modules by primary bus for clean spatial placement
  const busGroupMap = new Map<string, string[]>();
  for (const [moduleName, data] of moduleMap.entries()) {
    const primaryBus = Array.from(data.busSet)[0] || 'GENERAL';
    const subName = mapBusToSubsystem(primaryBus);
    if (!busGroupMap.has(subName)) {
      busGroupMap.set(subName, []);
    }
    busGroupMap.get(subName)!.push(moduleName);
  }

  const subsystems = Array.from(busGroupMap.keys());
  const nodes: CircuitNode[] = [];

  let colIndex = 0;
  for (const [subsystemName, moduleList] of busGroupMap.entries()) {
    const colX = 40 + colIndex * 260;

    moduleList.forEach((modName, rowIdx) => {
      const info = inferModuleType(modName);
      const pinsList: PinDefinition[] = Array.from(moduleMap.get(modName)!.pins).map((pinName) => ({
        pin: pinName,
        label: pinName,
        description: `Pin ${pinName}`,
        isPower: pinName.toLowerCase().includes('out') || pinName.toLowerCase().includes('pos') || pinName === '12V',
        requiredTerminalFamily: 'FASTON_6_3',
      }));

      nodes.push({
        id: modName,
        name: info.titleHe,
        type: info.type,
        category: info.category,
        subsystem: subsystemName,
        position: { x: colX, y: 50 + rowIdx * 170 },
        voltageV: 12,
        ratingAmps: modName.includes('Fuse') ? 50 : modName.includes('EPS') ? 60 : 30,
        pins: pinsList,
        customNotes: `מערך: ${subsystemName}`,
      });
    });

    colIndex++;
  }

  // Build WireConnections
  const wires: WireConnection[] = parsedRows.map((row, idx) => {
    const subName = mapBusToSubsystem(row.networkBus);
    const hexColor = normalizeColor(row.primaryColor) || '#00FF00';
    const isGround = row.networkBus.toUpperCase().includes('GROUND') || row.networkBus.toUpperCase().includes('GND') || row.signalName.toUpperCase().includes('GND');
    const isPowerFeed = !isGround && (row.networkBus.toUpperCase().includes('POWER') || row.signalName.toUpperCase().includes('BATTERY') || (row.wireGaugeAwg <= 14 && !row.networkBus.toUpperCase().includes('CAN')));

    return {
      id: `w-${idx + 1}-${row.wireId}`,
      wireNumber: row.wireId,
      fromNodeId: row.fromModule,
      fromPin: row.fromPin,
      toNodeId: row.toModule,
      toPin: row.toPin,
      gaugeAwg: row.wireGaugeAwg,
      color: hexColor,
      colorName: row.primaryColor,
      stripeColor: normalizeColor(row.stripeColor),
      lengthMm: 1000 + (idx % 5) * 350,
      fromTerminalId: row.wireGaugeAwg <= 12 ? 'FAST-63-OB-10-12' : 'FAST-63-OB-14-18',
      toTerminalId: row.wireGaugeAwg <= 12 ? 'FAST-63-OB-10-12' : 'FAST-63-OB-14-18',
      expectedCurrentAmps: row.currentRatingA,
      fuseRatingA: row.fuseRatingA,
      networkBus: row.networkBus,
      twistedPairId: row.twistedPairId,
      terminationResistor: row.terminationResistor,
      signalName: row.signalName,
      signalType: isGround ? 'Ground' : isPowerFeed ? 'Power' : 'CAN_Network',
      subsystem: subName,
      notes: `Twisted Pair: ${row.twistedPairId} | Term: ${row.terminationResistor}`,
    };
  });

  return {
    nodes,
    wires,
    subsystems,
    rawRowsCount: parsedRows.length,
  };
}

/**
 * Authoritative 42-wire automotive network table provided by the user
 */
export const USER_SAMPLE_WIRE_SCHEDULE = `Wire_ID,Network_Bus,Signal_Name,From_Module,From_Pin,To_Module,To_Pin,Wire_Gauge_AWG,Primary_Color,Stripe_Color,Twisted_Pair_ID,Termination_Resistor_Ohm,Current_Rating_A,Fuse_Rating_A
W-101,CAN0_HS_Powertrain,CAN0_HIGH,ECU_Engine_Control,J1-01,OBD2_Diagnostic,Pin-06,22 AWG,#FFFF00,#NONE,TP-01,120 Ohm,3A,5A
W-102,CAN0_HS_Powertrain,CAN0_LOW,ECU_Engine_Control,J1-02,OBD2_Diagnostic,Pin-14,22 AWG,#0000FF,#NONE,TP-01,120 Ohm,3A,5A
W-103,CAN0_HS_Powertrain,CAN0_HIGH,ECU_Engine_Control,J1-01,TCU_Transmission,P1-03,22 AWG,#FFFF00,#NONE,TP-02,NONE,3A,5A
W-104,CAN0_HS_Powertrain,CAN0_LOW,ECU_Engine_Control,J1-02,TCU_Transmission,P1-04,22 AWG,#0000FF,#NONE,TP-02,NONE,3A,5A
W-105,CAN0_HS_Powertrain,CAN0_HIGH,TCU_Transmission,P1-03,ABS_ESP_Brake_Unit,A1-08,22 AWG,#FFFF00,#NONE,TP-03,NONE,3A,5A
W-106,CAN0_HS_Powertrain,CAN0_LOW,TCU_Transmission,P1-04,ABS_ESP_Brake_Unit,A1-09,22 AWG,#0000FF,#NONE,TP-03,NONE,3A,5A
W-107,CAN0_HS_Powertrain,CAN0_HIGH,ABS_ESP_Brake_Unit,A1-08,EPS_Electric_Power_Steering,E1-01,22 AWG,#FFFF00,#NONE,TP-04,120 Ohm,3A,5A
W-108,CAN0_HS_Powertrain,CAN0_LOW,ABS_ESP_Brake_Unit,A1-09,EPS_Electric_Power_Steering,E1-02,22 AWG,#0000FF,#NONE,TP-04,120 Ohm,3A,5A
W-201,CAN1_MS_Body,CAN1_HIGH,BCM_Body_Control,B2-12,Cluster_Dashboard,C1-04,22 AWG,#00FF00,#WHITE,TP-05,120 Ohm,3A,5A
W-202,CAN1_MS_Body,CAN1_LOW,BCM_Body_Control,B2-13,Cluster_Dashboard,C1-05,22 AWG,#00FF00,#BLACK,TP-05,120 Ohm,3A,5A
W-203,CAN1_MS_Body,CAN1_HIGH,BCM_Body_Control,B2-12,HVAC_Climate_Control,H1-01,22 AWG,#00FF00,#WHITE,TP-06,NONE,3A,5A
W-204,CAN1_MS_Body,CAN1_LOW,BCM_Body_Control,B2-13,HVAC_Climate_Control,H1-02,22 AWG,#00FF00,#BLACK,TP-06,NONE,3A,5A
W-205,CAN1_MS_Body,CAN1_HIGH,HVAC_Climate_Control,H1-01,DDM_Driver_Door_Module,D1-07,22 AWG,#00FF00,#WHITE,TP-07,NONE,3A,5A
W-206,CAN1_MS_Body,CAN1_LOW,HVAC_Climate_Control,H1-02,DDM_Driver_Door_Module,D1-08,22 AWG,#00FF00,#BLACK,TP-07,NONE,3A,5A
W-207,CAN1_MS_Body,CAN1_HIGH,DDM_Driver_Door_Module,D1-07,PDM_Passenger_Door_Module,P1-07,22 AWG,#00FF00,#WHITE,TP-08,120 Ohm,3A,5A
W-208,CAN1_MS_Body,CAN1_LOW,DDM_Driver_Door_Module,D1-08,PDM_Passenger_Door_Module,P1-08,22 AWG,#00FF00,#BLACK,TP-08,120 Ohm,3A,5A
W-301,CAN2_Infotainment,CAN2_HIGH,Central_Gateway_Module,G1-10,Infotainment_Head_Unit,I1-02,22 AWG,#FFA500,#NONE,TP-09,120 Ohm,3A,5A
W-302,CAN2_Infotainment,CAN2_LOW,Central_Gateway_Module,G1-11,Infotainment_Head_Unit,I1-03,22 AWG,#800080,#NONE,TP-09,120 Ohm,3A,5A
W-303,CAN2_Infotainment,CAN2_HIGH,Infotainment_Head_Unit,I1-02,DSP_Audio_Amplifier,A2-01,22 AWG,#FFA500,#NONE,TP-10,NONE,3A,5A
W-304,CAN2_Infotainment,CAN2_LOW,Infotainment_Head_Unit,I1-03,DSP_Audio_Amplifier,A2-02,22 AWG,#800080,#NONE,TP-10,NONE,3A,5A
W-305,CAN2_Infotainment,CAN2_HIGH,DSP_Audio_Amplifier,A2-01,Telematics_GPS_Module,T1-05,22 AWG,#FFA500,#NONE,TP-11,120 Ohm,3A,5A
W-306,CAN2_Infotainment,CAN2_LOW,DSP_Audio_Amplifier,A2-02,Telematics_GPS_Module,T1-06,22 AWG,#800080,#NONE,TP-11,120 Ohm,3A,5A
W-401,CAN3_ADAS_Safety,CAN3_HIGH,Forward_Radar_Sensor,R1-01,Central_Gateway_Module,G2-01,22 AWG,#00FFFF,#NONE,TP-12,120 Ohm,3A,5A
W-402,CAN3_ADAS_Safety,CAN3_LOW,Forward_Radar_Sensor,R1-02,Central_Gateway_Module,G2-02,22 AWG,#000080,#NONE,TP-12,120 Ohm,3A,5A
W-403,CAN3_ADAS_Safety,CAN3_HIGH,Central_Gateway_Module,G2-01,Front_Camera_ADAS,C2-01,22 AWG,#00FFFF,#NONE,TP-13,NONE,3A,5A
W-404,CAN3_ADAS_Safety,CAN3_LOW,Central_Gateway_Module,G2-02,Front_Camera_ADAS,C2-02,22 AWG,#000080,#NONE,TP-13,NONE,3A,5A
W-405,CAN3_ADAS_Safety,CAN3_HIGH,Front_Camera_ADAS,C2-01,Airbag_SRS_Module,S1-03,22 AWG,#00FFFF,#NONE,TP-14,120 Ohm,3A,5A
W-406,CAN3_ADAS_Safety,CAN3_LOW,Front_Camera_ADAS,C2-02,Airbag_SRS_Module,S1-04,22 AWG,#000080,#NONE,TP-14,120 Ohm,3A,5A
W-501,LIN0_SubNetwork,LIN_BUS,BCM_Body_Control,B3-01,Rain_Light_Sensor,RL-01,24 AWG,#A52A2A,#NONE,NONE,NONE,2A,3A
W-502,LIN1_SubNetwork,LIN_BUS,DDM_Driver_Door_Module,D2-04,Power_Window_Master_Switch,W1-01,24 AWG,#A52A2A,#WHITE,NONE,NONE,2A,3A
W-503,LIN2_SubNetwork,LIN_BUS,HVAC_Climate_Control,H2-05,Blower_Motor_Resistor,B1-02,24 AWG,#A52A2A,#BLUE,NONE,NONE,2A,3A
W-601,POWER_FEED,BATTERY_12V,Fuse_Block_Main,F-01_Out,ECU_Engine_Control,J1-25,14 AWG,#FF0000,#NONE,NONE,NONE,25A,20A
W-602,POWER_FEED,BATTERY_12V,Fuse_Block_Main,F-02_Out,BCM_Body_Control,B1-01,12 AWG,#FF0000,#NONE,NONE,NONE,40A,30A
W-603,POWER_FEED,BATTERY_12V,Fuse_Block_Main,F-03_Out,ABS_ESP_Brake_Unit,A1-01,10 AWG,#FF0000,#NONE,NONE,NONE,50A,40A
W-604,POWER_FEED,BATTERY_12V,Fuse_Block_Main,F-04_Out,EPS_Electric_Power_Steering,E1-10,10 AWG,#FF0000,#NONE,NONE,NONE,60A,50A
W-605,POWER_FEED,BATTERY_12V,Fuse_Block_Main,F-05_Out,Infotainment_Head_Unit,I1-01,16 AWG,#FF0000,#NONE,NONE,NONE,15A,15A
W-606,POWER_FEED,BATTERY_12V,Fuse_Block_Main,F-06_Out,Forward_Radar_Sensor,R1-05,18 AWG,#FF0000,#NONE,NONE,NONE,10A,7.5A
W-701,GROUND_CHASSIS,GND_MAIN,Chassis_Ground_Point_1,GND-01,ECU_Engine_Control,J1-26,14 AWG,#000000,#NONE,NONE,NONE,25A,NONE
W-702,GROUND_CHASSIS,GND_MAIN,Chassis_Ground_Point_1,GND-02,BCM_Body_Control,B1-02,12 AWG,#000000,#NONE,NONE,NONE,40A,NONE
W-703,GROUND_CHASSIS,GND_MAIN,Chassis_Ground_Point_2,GND-03,ABS_ESP_Brake_Unit,A1-02,10 AWG,#000000,#NONE,NONE,NONE,50A,NONE
W-704,GROUND_CHASSIS,GND_MAIN,Chassis_Ground_Point_2,GND-04,EPS_Electric_Power_Steering,E1-11,10 AWG,#000000,#NONE,NONE,NONE,60A,NONE
W-705,GROUND_CHASSIS,GND_MAIN,Chassis_Ground_Point_3,GND-05,Infotainment_Head_Unit,I1-08,16 AWG,#000000,#NONE,NONE,NONE,15A,NONE`;
