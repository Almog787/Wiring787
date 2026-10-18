/**
 * HarnessMap Pro - Technical Domain Types & Standards
 * Standards: DIN 72551 (Automotive cables), SAE J1128, ISO 7588 (Automotive Relays)
 */

export type FuseStandard = 'ATO' | 'MINI' | 'MAXI' | 'AGC_GLASS';
export type RelayType = 'ISO_4PIN_SPST' | 'ISO_5PIN_SPDT' | 'MICRO_ISO';
export type TerminalFamily = 'FASTON_2_8' | 'FASTON_4_8' | 'FASTON_6_3' | 'RING_M4' | 'RING_M5' | 'RING_M6' | 'RING_M8' | 'SPADE_M4';
export type BarrelStyle = 'OPEN_BARREL_UNINSULATED' | 'CLOSED_BARREL_PREINSULATED';
export type CrimpStyle = 'B_F_CRIMP' | 'OVAL_INDENT' | 'HEX_CRIMP';

export interface WireGaugeSpec {
  awg: number;
  metricMm2: number;
  resistanceOhmPerM: number;
  maxContinuousAmpacity80C: number;
  maxContinuousAmpacity105C: number;
  recommendedMaxContinuousAmps: number;
  recommendedFuseMaxAmps: number;
}

export interface TerminalSpec {
  id: string;
  name: string;
  family: TerminalFamily;
  tabWidthMm?: number;
  studSize?: string;
  barrel: BarrelStyle;
  compatibleAwgMin: number;
  compatibleAwgMax: number;
  maxContinuousCurrentA: number;
  recommendedTool: string;
  crimpProfile: CrimpStyle;
  standardPartNumber: string;
  notes: string;
}

export interface CrimpToolSpec {
  id: string;
  model: string;
  manufacturer: string;
  crimpType: string;
  wireRangeAwg: string;
  supportedTerminals: string[];
  jawMarkings: string[];
  description: string;
}

export interface PinDefinition {
  pin: string; // e.g. "30", "85", "86", "87", "87a", "IN", "OUT", "+", "-"
  label: string;
  description: string;
  isPower: boolean;
  isCoilTrigger?: boolean;
  requiredTerminalFamily?: TerminalFamily;
}

export interface CircuitNode {
  id: string;
  type: 
    | 'relay_iso_5pin' 
    | 'relay_iso_4pin' 
    | 'relay_micro_iso' 
    | 'fuse_holder_ato' 
    | 'fuse_holder_mini' 
    | 'fuse_holder_maxi' 
    | 'fuse_block_6way' 
    | 'battery_source' 
    | 'switch_cockpit' 
    | 'load_device' 
    | 'ground_chassis'
    | 'module_electronic' // ECU, RC Receiver, CAN Node, etc.
    | 'switch_estop'
    | 'actuator_driver';
  name: string;
  category: 'relay' | 'protection' | 'source' | 'switch' | 'load' | 'module';
  subsystem?: string; // e.g. "הזנת כוח ראשית", "רשת תקשורת CAN", "בקרת מפעילים", "השבתת חירום"
  position: { x: number; y: number };
  ratingAmps?: number;
  fuseRatingAmps?: number;
  voltageV: number;
  loadResistanceOhm?: number;
  switchedOn?: boolean;
  customNotes?: string;
  pins?: PinDefinition[];
}

export interface WireConnection {
  id: string;
  wireNumber?: string; // e.g. "W-101"
  fromNodeId: string;
  fromPin: string;
  toNodeId: string;
  toPin: string;
  gaugeAwg: number;
  color: string;
  colorName: string;
  stripeColor?: string;
  lengthMm: number;
  fromTerminalId: string;
  toTerminalId: string;
  expectedCurrentAmps: number;
  fuseRatingA?: number;
  networkBus?: string; // e.g. "CAN0_HS_Powertrain", "POWER_FEED"
  twistedPairId?: string; // e.g. "TP-01"
  terminationResistor?: string; // e.g. "120 Ohm"
  signalName?: string;
  signalType?: 'Power' | 'Ground' | 'CAN_Network' | 'Discrete_Input' | 'Discrete_Output' | 'PWM' | 'Analog' | 'Shield' | 'General';
  subsystem?: string;
  notes?: string;
}

export interface ParsedWireRow {
  wireId: string;
  networkBus: string;
  signalName: string;
  fromModule: string;
  fromPin: string;
  toModule: string;
  toPin: string;
  wireGaugeAwg: number;
  primaryColor: string;
  stripeColor: string;
  twistedPairId: string;
  terminationResistor: string;
  currentRatingA: number;
  fuseRatingA: number;
  notes?: string;
}

export interface SafetySolution {
  id: string;
  title: string;
  description: string;
  actionType:
    | 'upsize_wire'
    | 'adjust_fuse'
    | 'upgrade_terminal'
    | 'derate_load'
    | 'configure_termination'
    | 'pair_twisted'
    | 'reassign_pin'
    | 'add_ground';
  newAwg?: number;
  newFuseAmps?: number;
  newTerminalId?: string;
  newExpectedCurrent?: number;
  newTerminationResistor?: string;
  newTwistedPairId?: string;
  newPin?: string;
  newWire?: Partial<WireConnection>;
}

export interface SafetyCheckViolation {
  id: string;
  wireId?: string;
  nodeId?: string;
  level: 'safe' | 'warning' | 'critical';
  title: string;
  message: string;
  technicalMetric: string;
  recommendedFix: string;
  solutions: SafetySolution[]; // At least 2 solutions for every violation
}

export interface BOMItem {
  id: string;
  category: 'Relays & Sockets' | 'Fuses & Holders' | 'Terminals' | 'Wire Conductors' | 'Tooling';
  partNumber: string;
  description: string;
  specification: string;
  quantity: number;
  unit: string;
  toolingRequired?: string;
}
