/**
 * Automated Unit Tests for Wire Schedule CSV/Table Parser
 */

import { describe, it, expect } from 'vitest';
import { parseWireScheduleTable, USER_SAMPLE_WIRE_SCHEDULE, inferSubsystem } from '../utils/csvWireParser';

describe('Wire Schedule Table Parser & Subsystem Generator', () => {
  it('correctly parses the 42-wire automotive network sample table into components and wires', () => {
    const result = parseWireScheduleTable(USER_SAMPLE_WIRE_SCHEDULE);

    expect(result.rawRowsCount).toBe(42);
    expect(result.wires.length).toBe(42);
    expect(result.nodes.length).toBeGreaterThanOrEqual(15);

    // Verify CAN0 high-speed wire W-101 (22 AWG, ECU -> OBD2, 120 Ohm termination)
    const w101 = result.wires.find((w) => w.wireNumber === 'W-101');
    expect(w101).toBeDefined();
    expect(w101?.fromNodeId).toBe('ECU_Engine_Control');
    expect(w101?.toNodeId).toBe('OBD2_Diagnostic');
    expect(w101?.gaugeAwg).toBe(22);
    expect(w101?.twistedPairId).toBe('TP-01');
    expect(w101?.terminationResistor).toBe('120 Ohm');

    // Verify Power Feed wire W-601 (14 AWG, 25A current, 20A fuse)
    const w601 = result.wires.find((w) => w.wireNumber === 'W-601');
    expect(w601).toBeDefined();
    expect(w601?.networkBus).toBe('POWER_FEED');
    expect(w601?.expectedCurrentAmps).toBe(25);
    expect(w601?.fuseRatingA).toBe(20);

    // Verify Ground wire W-701 (14 AWG, GROUND_CHASSIS)
    const w701 = result.wires.find((w) => w.wireNumber === 'W-701');
    expect(w701).toBeDefined();
    expect(w701?.networkBus).toBe('GROUND_CHASSIS');
    expect(w701?.signalType).toBe('Ground');
  });

  it('correctly partitions components into automotive Hebrew Subsystems', () => {
    const result = parseWireScheduleTable(USER_SAMPLE_WIRE_SCHEDULE);
    expect(result.subsystems.length).toBeGreaterThanOrEqual(5);

    // Check subsystem classification
    expect(inferSubsystem('Main_Battery_12V')).toContain('הזנת כוח');
    expect(inferSubsystem('Emergency_Stop_Button')).toContain('חירום');
    expect(inferSubsystem('CAN0_HS_Powertrain')).toContain('הנעה ובקרה');
    expect(inferSubsystem('CAN1_MS_Body')).toContain('מרכב ונוחות');
    expect(inferSubsystem('CAN2_Infotainment')).toContain('בידור ומולטימדיה');
    expect(inferSubsystem('CAN3_ADAS_Safety')).toContain('בטיחות וחיישני ADAS');
  });

  it('handles tab-separated tables and custom user column formats', () => {
    const tsvData = `Wire_ID\tSource_Component\tSource_Pin\tDestination_Component\tDestination_Pin\tSignal_Name\tSignal_Type\tWire_Gauge_AWG\tWire_Color\tNotes
W-10\tSensor_ECU\tPin_A\tDashboard_Display\tPin_B\tSpeed_Pulse\tPulse\t22\tBLU\tHigh speed pulse`;

    const result = parseWireScheduleTable(tsvData);
    expect(result.wires.length).toBe(1);
    expect(result.wires[0].wireNumber).toBe('W-10');
    expect(result.wires[0].fromNodeId).toBe('Sensor_ECU');
    expect(result.wires[0].toNodeId).toBe('Dashboard_Display');
    expect(result.wires[0].gaugeAwg).toBe(22);
  });
});
