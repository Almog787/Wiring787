/**
 * Automated Safety & Unit Verification Test Suite
 * Validates Ohm's Law, AWG Ampacity (SAE J1128/DIN 72551), and Crimp Matrix
 */

import { describe, it, expect } from 'vitest';
import {
  AWG_SPECS,
  TERMINAL_CATALOG,
  CRIMP_TOOLS,
  calculateVoltageDrop,
  calculateVoltageDropPercent,
  runSafetyChecks,
  getRecommendedAwg,
  generateBOM,
} from '../utils/safetyEngine';
import { CircuitNode, WireConnection } from '../types/harness';

describe('HarnessMap Pro Safety Engine & Electrical Physics', () => {
  describe('Ohm\'s Law & Conductor Voltage Drop Calculations', () => {
    it('accurately computes two-wire loop voltage drop according to conductor resistance', () => {
      // 10A through 2.0 meters of 14 AWG wire (R = 0.00828 Ohm/m)
      // V_drop = 2 * 2.0m * 10A * 0.00828 Ohm/m = 0.3312V
      const drop = calculateVoltageDrop(10, 2000, 14);
      expect(drop).toBeCloseTo(0.3312, 3);
    });

    it('correctly calculates percentage voltage drop on 12V and 24V automotive architectures', () => {
      const drop12V = calculateVoltageDropPercent(0.6, 12);
      expect(drop12V).toBe(5.0); // 5% drop

      const drop24V = calculateVoltageDropPercent(0.6, 24);
      expect(drop24V).toBe(2.5); // 2.5% drop
    });

    it('handles zero or negative system voltage without throwing divide-by-zero errors', () => {
      expect(calculateVoltageDropPercent(1.5, 0)).toBe(0);
      expect(calculateVoltageDropPercent(1.5, -12)).toBe(0);
    });
  });

  describe('AWG Ampacity Limits (DIN 72551 / SAE J1128)', () => {
    it('verifies standard cross-sections and continuous current ratings', () => {
      expect(AWG_SPECS[10].metricMm2).toBeCloseTo(5.26, 2);
      expect(AWG_SPECS[10].maxContinuousAmpacity80C).toBe(50);

      expect(AWG_SPECS[12].maxContinuousAmpacity80C).toBe(35);
      expect(AWG_SPECS[14].maxContinuousAmpacity80C).toBe(25);
      expect(AWG_SPECS[16].maxContinuousAmpacity80C).toBe(18);
      expect(AWG_SPECS[22].maxContinuousAmpacity80C).toBe(5);
    });

    it('recommends appropriate AWG for high continuous current loads', () => {
      expect(getRecommendedAwg(35, 1000, 12)).toBe(10);
      expect(getRecommendedAwg(20, 1000, 12)).toBe(14);
      expect(getRecommendedAwg(5, 1000, 12)).toBe(20);
    });
  });

  describe('Relay High-Current Pin & Safety Rule Violations', () => {
    it('flags CRITICAL hazard when 40A is connected to ISO Relay Pin 30 with 22 AWG wire', () => {
      const nodes: CircuitNode[] = [
        {
          id: 'relay-1',
          name: 'Main Aux Relay',
          type: 'relay_iso_5pin',
          category: 'relay',
          position: { x: 300, y: 200 },
          voltageV: 12,
          ratingAmps: 40,
        },
        {
          id: 'fuse-1',
          name: '40A ATO Fuse',
          type: 'fuse_holder_ato',
          category: 'protection',
          position: { x: 100, y: 200 },
          voltageV: 12,
          fuseRatingAmps: 40,
        },
      ];

      const wires: WireConnection[] = [
        {
          id: 'wire-crit-1',
          fromNodeId: 'fuse-1',
          fromPin: 'OUT',
          toNodeId: 'relay-1',
          toPin: '30', // High current feed pin
          gaugeAwg: 22, // Way too thin for 40A!
          color: '#DC2626',
          colorName: 'Red',
          lengthMm: 1200,
          fromTerminalId: 'FAST-63-OB-14-18',
          toTerminalId: 'FAST-63-OB-14-18',
          expectedCurrentAmps: 40,
        },
      ];

      const violations = runSafetyChecks(nodes, wires, 12);
      const criticals = violations.filter((v) => v.level === 'critical');
      expect(criticals.length).toBeGreaterThanOrEqual(1);

      // Verify specific prompt alert text
      const relayPinAlert = violations.find((v) => v.id.includes('relay-high-power'));
      expect(relayPinAlert).toBeDefined();
      expect(relayPinAlert?.recommendedFix).toContain('12/14 AWG');
      expect(relayPinAlert?.recommendedFix).toContain('Faston 6.3');
    });

    it('passes safely with green verification when 40A is wired with 10 AWG and matched 6.3mm Faston', () => {
      const nodes: CircuitNode[] = [
        {
          id: 'relay-1',
          name: 'Main Aux Relay',
          type: 'relay_iso_5pin',
          category: 'relay',
          position: { x: 300, y: 200 },
          voltageV: 12,
          ratingAmps: 40,
        },
      ];

      const wires: WireConnection[] = [
        {
          id: 'wire-safe-1',
          fromNodeId: 'relay-1',
          fromPin: '30',
          toNodeId: 'bat-1',
          toPin: '+',
          gaugeAwg: 10, // Heavy duty wire safe for 40A
          color: '#DC2626',
          colorName: 'Red',
          lengthMm: 800,
          fromTerminalId: 'FAST-63-OB-10-12',
          toTerminalId: 'RING-M8-OB',
          expectedCurrentAmps: 40,
        },
      ];

      const violations = runSafetyChecks(nodes, wires, 12);
      const criticals = violations.filter((v) => v.level === 'critical');
      expect(criticals.length).toBe(0);
    });

    it('flags critical coordination mismatch when fuse rating exceeds wire safe ampacity', () => {
      const nodes: CircuitNode[] = [
        {
          id: 'fuse-hazard',
          name: '50A MAXI Fuse',
          type: 'fuse_holder_maxi',
          category: 'protection',
          position: { x: 100, y: 100 },
          voltageV: 12,
          fuseRatingAmps: 50,
        },
      ];

      const wires: WireConnection[] = [
        {
          id: 'wire-fuse-mismatch',
          fromNodeId: 'fuse-hazard',
          fromPin: 'OUT',
          toNodeId: 'lamp-1',
          toPin: '+',
          gaugeAwg: 18, // 18 AWG max rating is 12A, fuse is 50A!
          color: '#F59E0B',
          colorName: 'Amber',
          lengthMm: 1000,
          fromTerminalId: 'FAST-63-OB-14-18',
          toTerminalId: 'FAST-48-OB',
          expectedCurrentAmps: 10,
        },
      ];

      const violations = runSafetyChecks(nodes, wires, 12);
      const fuseViolation = violations.find((v) => v.id.includes('fuse-wire-hazard'));
      expect(fuseViolation).toBeDefined();
      expect(fuseViolation?.level).toBe('critical');
    });
  });

  describe('Crimp & Tooling Matrix Compliance', () => {
    it('verifies Faston 6.3mm Open Barrel is paired with SN-48B / B-Crimp double fold', () => {
      const faston63 = TERMINAL_CATALOG['FAST-63-OB-14-18'];
      expect(faston63.crimpProfile).toBe('B_F_CRIMP');
      expect(faston63.recommendedTool).toContain('SN-48B');
      expect(faston63.tabWidthMm).toBe(6.3);
    });

    it('verifies Micro Faston 2.8mm is paired with SN-28B / PA-09', () => {
      const faston28 = TERMINAL_CATALOG['FAST-28-OB'];
      expect(faston28.tabWidthMm).toBe(2.8);
      expect(faston28.recommendedTool).toContain('PA-09');
    });

    it('verifies Pre-Insulated Closed Barrel terminals use Oval Indent crimp tools (LY-03BC)', () => {
      const yellowClosed = TERMINAL_CATALOG['FAST-63-CB-YEL'];
      expect(yellowClosed.barrel).toBe('CLOSED_BARREL_PREINSULATED');
      expect(yellowClosed.crimpProfile).toBe('OVAL_INDENT');
      expect(yellowClosed.recommendedTool).toContain('LY-03BC');
    });

    it('confirms the crimp tools catalog contains required tooling models', () => {
      const toolModels = CRIMP_TOOLS.map((t) => t.model);
      expect(toolModels.some((m) => m.includes('SN-48B'))).toBe(true);
      expect(toolModels.some((m) => m.includes('PA-09'))).toBe(true);
      expect(toolModels.some((m) => m.includes('LY-03BC'))).toBe(true);
    });
  });

  describe('BOM Generation Engine', () => {
    it('produces an accurate Bill of Materials with catalog part numbers, wire cut lengths, and tooling', () => {
      const nodes: CircuitNode[] = [
        {
          id: 'relay-1',
          name: 'ISO 5-Pin Relay',
          type: 'relay_iso_5pin',
          category: 'relay',
          position: { x: 200, y: 200 },
          voltageV: 12,
          ratingAmps: 40,
        },
        {
          id: 'fuse-1',
          name: '30A ATO Fuse',
          type: 'fuse_holder_ato',
          category: 'protection',
          position: { x: 100, y: 200 },
          voltageV: 12,
          fuseRatingAmps: 30,
        },
      ];

      const wires: WireConnection[] = [
        {
          id: 'w1',
          fromNodeId: 'fuse-1',
          fromPin: 'OUT',
          toNodeId: 'relay-1',
          toPin: '30',
          gaugeAwg: 12,
          color: '#DC2626',
          colorName: 'Red',
          lengthMm: 1500,
          fromTerminalId: 'FAST-63-OB-10-12',
          toTerminalId: 'FAST-63-OB-10-12',
          expectedCurrentAmps: 25,
        },
      ];

      const bom = generateBOM(nodes, wires);
      expect(bom.length).toBeGreaterThan(0);

      // Must include Relay, Fuse, Terminals, Wire, and Tooling
      const categories = new Set(bom.map((b) => b.category));
      expect(categories.has('Relays & Sockets')).toBe(true);
      expect(categories.has('Fuses & Holders')).toBe(true);
      expect(categories.has('Terminals')).toBe(true);
      expect(categories.has('Wire Conductors')).toBe(true);
      expect(categories.has('Tooling')).toBe(true);
    });
  });
});
