/**
 * HarnessMap Pro - Procedural 3D Component Models
 * Conforms to Three.js Craft Guidelines:
 * - 3–12 Part Procedural Assemblies (THREE.Group)
 * - Calibrated PBR metalness/roughness variance
 * - Procedural canvas textures for pin markings and fuse ratings
 * - Zero external asset / 404 dependencies
 */

import * as THREE from 'three';
import { getFuseColor } from './safetyEngine';

// Pre-allocated scratch helpers to avoid GC in animation tick
export const _scratchVec3 = new THREE.Vector3();
export const _scratchColor = new THREE.Color();

/**
 * Helper to generate procedural text label texture
 */
function createLabelTexture(
  text: string,
  subtext?: string,
  bgColor = '#1e293b',
  textColor = '#ffffff',
  accentColor = '#f59e0b'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 512, 512);

  // Border outline
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 12;
  ctx.strokeRect(16, 16, 480, 480);

  // Accent bar
  ctx.fillStyle = accentColor;
  ctx.fillRect(32, 32, 448, 16);

  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 72px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(text, 256, 230);

  if (subtext) {
    ctx.font = '500 36px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(subtext, 256, 330);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Contact Shadow Disc
 */
export function createContactShadow(radius = 2.0, opacity = 0.45): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.85)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0.3)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const geo = new THREE.PlaneGeometry(radius * 2, radius * 2);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.005;
  return mesh;
}

/**
 * 1. Standard Automotive ISO 5-Pin SPDT Relay (12V 40A)
 * 10-Part Procedural Group with Exploded View Support
 */
export function buildIsoRelayModel(exploded = 0): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ISO_Relay_Group';

  // Base materials with distinct PBR physical properties
  const casingMat = new THREE.MeshStandardMaterial({
    color: 0x161c24, // High-impact PA66 nylon black
    roughness: 0.65,
    metalness: 0.1,
  });

  const basePlateMat = new THREE.MeshStandardMaterial({
    color: 0x0f1318,
    roughness: 0.75,
    metalness: 0.05,
  });

  const brassPinMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Polished brass / tin plated
    roughness: 0.22,
    metalness: 0.88,
  });

  const copperCoilMat = new THREE.MeshStandardMaterial({
    color: 0xb85d19, // Enameled copper magnet wire
    roughness: 0.35,
    metalness: 0.75,
  });

  const ironCoreMat = new THREE.MeshStandardMaterial({
    color: 0x5a6578, // Soft iron core
    roughness: 0.4,
    metalness: 0.85,
  });

  const silverContactMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee, // AgNi silver nickel alloy
    roughness: 0.15,
    metalness: 0.95,
  });

  // Part 1: Outer Protective Casing (Separates upwards when exploded)
  const caseGeo = new THREE.BoxGeometry(2.4, 2.6, 2.4);
  const caseMesh = new THREE.Mesh(caseGeo, casingMat);
  caseMesh.castShadow = true;
  caseMesh.receiveShadow = true;
  caseMesh.position.y = 2.1 + exploded * 2.2;
  group.add(caseMesh);

  // Stamped ISO label on casing
  const labelTex = createLabelTexture('ISO RELAY', '12V 40A / 30A', '#111827', '#ffffff', '#06b6d4');
  const labelGeo = new THREE.PlaneGeometry(1.8, 1.8);
  const labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true });
  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.position.set(0, 2.1 + exploded * 2.2, 1.205);
  group.add(labelMesh);

  // Part 2: Terminal Base Plate (Stays grounded)
  const baseGeo = new THREE.BoxGeometry(2.5, 0.4, 2.5);
  const baseMesh = new THREE.Mesh(baseGeo, basePlateMat);
  baseMesh.position.y = 0.5;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Part 3: Bobbin & Copper Coil Winding
  const bobbinGroup = new THREE.Group();
  bobbinGroup.position.y = 1.3 + exploded * 0.8;

  // Coil core
  const coreGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 16);
  const coreMesh = new THREE.Mesh(coreGeo, ironCoreMat);
  bobbinGroup.add(coreMesh);

  // Copper Wire Winding cylinder
  const coilGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.0, 24);
  const coilMesh = new THREE.Mesh(coilGeo, copperCoilMat);
  bobbinGroup.add(coilMesh);

  // Part 4: Armature Lever & Moving Contact
  const armGeo = new THREE.BoxGeometry(0.12, 1.2, 0.45);
  const armMesh = new THREE.Mesh(armGeo, ironCoreMat);
  armMesh.position.set(0.65, 0.1, 0);
  bobbinGroup.add(armMesh);

  // Part 5: Silver Contact Buttons (AgNi 0.15)
  const contactBtnGeo = new THREE.SphereGeometry(0.1, 12, 12);
  const contactBtn = new THREE.Mesh(contactBtnGeo, silverContactMat);
  contactBtn.position.set(0.72, 0.5, 0);
  bobbinGroup.add(contactBtn);

  group.add(bobbinGroup);

  // Part 6-10: Standard 6.3mm (1/4") Faston Male Blade Pins
  // Pin 30 (Feed), Pin 85 (Coil -), Pin 86 (Coil +), Pin 87 (NO), Pin 87a (NC)
  const pinSpecs = [
    { label: '30', pos: [0, -0.2, 0.65], rot: 0 },
    { label: '87', pos: [0, -0.2, -0.65], rot: 0 },
    { label: '87a', pos: [0, -0.2, 0], rot: Math.PI / 2 },
    { label: '85', pos: [-0.65, -0.2, 0], rot: Math.PI / 2 },
    { label: '86', pos: [0.65, -0.2, 0], rot: Math.PI / 2 },
  ];

  const pinGeo = new THREE.BoxGeometry(0.08, 0.9, 0.63); // 6.3mm standard blade width
  for (const pin of pinSpecs) {
    const pinMesh = new THREE.Mesh(pinGeo, brassPinMat);
    pinMesh.position.set(pin.pos[0], pin.pos[1] - exploded * 0.4, pin.pos[2]);
    pinMesh.rotation.y = pin.rot;
    pinMesh.castShadow = true;
    group.add(pinMesh);

    // Stamped pin label beneath base
    const pinLabelTex = createLabelTexture(pin.label, '', '#0f172a', '#38bdf8', '#38bdf8');
    const pGeo = new THREE.PlaneGeometry(0.35, 0.35);
    const pMat = new THREE.MeshBasicMaterial({ map: pinLabelTex, transparent: true });
    const pMesh = new THREE.Mesh(pGeo, pMat);
    pMesh.rotation.x = Math.PI / 2;
    pMesh.position.set(pin.pos[0] * 1.3, 0.28, pin.pos[2] * 1.3);
    group.add(pMesh);
  }

  // Part 11: Top Mounting Bracket with M6 Bolt Hole
  const bracketGeo = new THREE.BoxGeometry(0.15, 0.8, 1.2);
  const bracketMesh = new THREE.Mesh(bracketGeo, basePlateMat);
  bracketMesh.position.set(-1.25, 2.8 + exploded * 2.2, 0);
  group.add(bracketMesh);

  // Ground shadow
  group.add(createContactShadow(2.4, 0.5));
  return group;
}

/**
 * 2. Automotive Blade Fuse (ATO/ATC, MINI, MAXI)
 * Translucent colored housing with visible zinc melting bridge
 */
export function buildBladeFuseModel(fuseType: 'ATO' | 'MINI' | 'MAXI', amps: number, exploded = 0): THREE.Group {
  const group = new THREE.Group();
  group.name = `Blade_Fuse_${fuseType}_${amps}A`;

  // Scale based on fuse family
  const scale = fuseType === 'MAXI' ? 1.6 : fuseType === 'MINI' ? 0.75 : 1.1;

  // Polycarbonate body color corresponding to industry standard
  const colorHex = getFuseColorHex(amps);
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    roughness: 0.18,
    metalness: 0.05,
    transmission: 0.85, // Transparent housing to inspect fuse element!
    ior: 1.52,
    thickness: 0.6,
    transparent: true,
    opacity: 0.9,
  });

  const zincBladeMat = new THREE.MeshStandardMaterial({
    color: 0xc8ced6, // Zinc alloy / silver tin
    roughness: 0.25,
    metalness: 0.88,
  });

  const bridgeMat = new THREE.MeshStandardMaterial({
    color: 0xd8dde4,
    roughness: 0.2,
    metalness: 0.92,
  });

  // Part 1: Upper Translucent Body Housing
  const bodyGeo = new THREE.BoxGeometry(1.9 * scale, 1.4 * scale, 0.5 * scale);
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.position.y = (1.5 + exploded * 1.5) * scale;
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // Part 2: Stamped Amperage Text on Top
  const colorStr = '#' + colorHex.toString(16).padStart(6, '0');
  const stampTex = createLabelTexture(`${amps}`, 'AMPS', colorStr, '#ffffff', '#ffffff');
  const stampGeo = new THREE.PlaneGeometry(1.0 * scale, 0.4 * scale);
  const stampMat = new THREE.MeshBasicMaterial({ map: stampTex, transparent: true });
  const stampMesh = new THREE.Mesh(stampGeo, stampMat);
  stampMesh.rotation.x = -Math.PI / 2;
  stampMesh.position.set(0, (2.21 + exploded * 1.5) * scale, 0);
  group.add(stampMesh);

  // Part 3 & 4: Left & Right Stamped Blades
  const bladeGeo = new THREE.BoxGeometry(0.55 * scale, 1.6 * scale, 0.08 * scale);

  const leftBlade = new THREE.Mesh(bladeGeo, zincBladeMat);
  leftBlade.position.set(-0.55 * scale, (0.8 - exploded * 0.4) * scale, 0);
  leftBlade.castShadow = true;
  group.add(leftBlade);

  const rightBlade = new THREE.Mesh(bladeGeo, zincBladeMat);
  rightBlade.position.set(0.55 * scale, (0.8 - exploded * 0.4) * scale, 0);
  rightBlade.castShadow = true;
  group.add(rightBlade);

  // Part 5: Calibrated S-Curve Melting Fuse Link (visible inside translucent window)
  const linkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.35 * scale, 1.4 * scale, 0),
    new THREE.Vector3(-0.15 * scale, 1.6 * scale, 0),
    new THREE.Vector3(0.0 * scale, 1.35 * scale, 0),
    new THREE.Vector3(0.15 * scale, 1.6 * scale, 0),
    new THREE.Vector3(0.35 * scale, 1.4 * scale, 0),
  ]);
  const linkGeo = new THREE.TubeGeometry(linkCurve, 20, 0.03 * scale, 8, false);
  const linkMesh = new THREE.Mesh(linkGeo, bridgeMat);
  group.add(linkMesh);

  // Contact shadow
  group.add(createContactShadow(1.8 * scale, 0.4));
  return group;
}

/**
 * 3. Faston 6.3mm Quick-Disconnect Terminal & Crimp Cross-Section Model
 * Detailed 3-part open-barrel F-crimp showing conductor strands & insulation grip
 */
export function buildFastonCrimpModel(wireAwg = 14, showCrossSection = false): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Faston_Crimp_Assembly';

  const brassTerminalMat = new THREE.MeshStandardMaterial({
    color: 0xd9a84e, // Polished tin-plated brass
    roughness: 0.28,
    metalness: 0.85,
  });

  const copperStrandMat = new THREE.MeshStandardMaterial({
    color: 0xc86428, // Pure electrolytic copper strands
    roughness: 0.3,
    metalness: 0.8,
  });

  const insulationMat = new THREE.MeshStandardMaterial({
    color: 0xcc2222, // Automotive Cross-linked TXL insulation (Red)
    roughness: 0.5,
    metalness: 0.05,
  });

  // Part 1: Faston Female Receptacle (Front box with folded spring curls)
  const boxOuterGeo = new THREE.BoxGeometry(1.6, 0.45, 0.8);
  const boxMesh = new THREE.Mesh(boxOuterGeo, brassTerminalMat);
  boxMesh.position.set(-1.2, 0.35, 0);
  boxMesh.castShadow = true;
  group.add(boxMesh);

  // Center detent locking dimple
  const dimpleGeo = new THREE.SphereGeometry(0.12, 12, 12);
  const dimpleMesh = new THREE.Mesh(dimpleGeo, brassTerminalMat);
  dimpleMesh.position.set(-1.2, 0.58, 0);
  group.add(dimpleMesh);

  // Part 2: Conductor Crimp Zone (B-Crimp / F-Crimp Double Curled Wings)
  const crimpCurlGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.9, 16, 1, false, 0, Math.PI * 1.4);
  const crimpWingLeft = new THREE.Mesh(crimpCurlGeo, brassTerminalMat);
  crimpWingLeft.rotation.z = Math.PI / 2;
  crimpWingLeft.position.set(0.1, 0.38, -0.15);
  crimpWingLeft.castShadow = true;
  group.add(crimpWingLeft);

  const crimpWingRight = new THREE.Mesh(crimpCurlGeo, brassTerminalMat);
  crimpWingRight.rotation.z = Math.PI / 2;
  crimpWingRight.rotation.y = Math.PI;
  crimpWingRight.position.set(0.1, 0.38, 0.15);
  crimpWingRight.castShadow = true;
  group.add(crimpWingRight);

  // Part 3: Compressed Multi-Strand Copper Wire Bundle
  const strandCount = wireAwg <= 12 ? 37 : 19;
  const strandRadius = wireAwg <= 12 ? 0.035 : 0.025;
  const wireGroup = new THREE.Group();

  for (let i = 0; i < strandCount; i++) {
    const angle = (i / strandCount) * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 0.22;
    const sGeo = new THREE.CylinderGeometry(strandRadius, strandRadius, 1.8, 8);
    const sMesh = new THREE.Mesh(sGeo, copperStrandMat);
    sMesh.rotation.z = Math.PI / 2;
    sMesh.position.set(0.6, 0.32 + Math.sin(angle) * r, Math.cos(angle) * r);
    wireGroup.add(sMesh);
  }
  group.add(wireGroup);

  // Part 4: Insulation Crimp Wings (Mechanical Strain Relief)
  const insCrimpGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.8, 16, 1, false, 0, Math.PI * 1.5);
  const insCrimpMesh = new THREE.Mesh(insCrimpGeo, brassTerminalMat);
  insCrimpMesh.rotation.z = Math.PI / 2;
  insCrimpMesh.position.set(1.1, 0.42, 0);
  insCrimpMesh.castShadow = true;
  group.add(insCrimpMesh);

  // Part 5: TXL Insulated Conductor Cable
  const cableGeo = new THREE.CylinderGeometry(0.42, 0.42, 1.6, 20);
  const cableMesh = new THREE.Mesh(cableGeo, insulationMat);
  cableMesh.rotation.z = Math.PI / 2;
  cableMesh.position.set(2.1, 0.42, 0);
  cableMesh.castShadow = true;
  group.add(cableMesh);

  // Cross-Section Inspection Cutaway Plane
  if (showCrossSection) {
    const cutawayGeo = new THREE.RingGeometry(0.05, 0.55, 32);
    const cutawayMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
    });
    const cutawayMesh = new THREE.Mesh(cutawayGeo, cutawayMat);
    cutawayMesh.rotation.y = Math.PI / 2;
    cutawayMesh.position.set(0.1, 0.38, 0);
    group.add(cutawayMesh);
  }

  group.add(createContactShadow(2.6, 0.45));
  return group;
}

function getFuseColorHex(amps: number): number {
  switch (amps) {
    case 5:
      return 0xd2b48c; // Tan
    case 7.5:
      return 0x8b4513; // Brown
    case 10:
      return 0xdc2626; // Red
    case 15:
      return 0x2563eb; // Blue
    case 20:
      return 0xeab308; // Yellow
    case 25:
      return 0xf1f5f9; // Clear/White
    case 30:
      return 0x16a34a; // Green
    case 40:
      return 0xf97316; // Amber / Orange
    case 50:
      return 0xb91c1c; // Deep Red
    case 80:
      return 0xffffff; // White
    default:
      return 0x0284c7;
  }
}

/**
 * 4. Electronic Control Unit (ECU / TCU / BCM Module)
 * Cast aluminum heatsink casing with multi-pin header receptacle & connector pins
 */
export function buildEcuModuleModel(label = 'ECU ENGINE CONTROL', pinCount = 26): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ECU_Module_Group';

  const aluminumMat = new THREE.MeshStandardMaterial({
    color: 0x475569, // Anodized cast aluminum
    roughness: 0.35,
    metalness: 0.85,
  });

  const finMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.45,
    metalness: 0.75,
  });

  const connectorPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Glass-filled PBT black plastic
    roughness: 0.7,
    metalness: 0.1,
  });

  const goldPinMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Gold / brass plated contact pins
    roughness: 0.2,
    metalness: 0.9,
  });

  // Main aluminum casing
  const bodyGeo = new THREE.BoxGeometry(3.6, 0.9, 2.8);
  const bodyMesh = new THREE.Mesh(bodyGeo, aluminumMat);
  bodyMesh.position.y = 0.55;
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // Ribbed cooling heatsink fins on top
  for (let i = -1.3; i <= 1.3; i += 0.32) {
    const finGeo = new THREE.BoxGeometry(0.1, 0.28, 2.6);
    const finMesh = new THREE.Mesh(finGeo, finMat);
    finMesh.position.set(i, 1.05, 0);
    finMesh.castShadow = true;
    group.add(finMesh);
  }

  // Multi-pin automotive connector header pocket
  const pocketGeo = new THREE.BoxGeometry(2.4, 0.65, 0.9);
  const pocketMesh = new THREE.Mesh(pocketGeo, connectorPlasticMat);
  pocketMesh.position.set(0, 0.55, 1.5);
  pocketMesh.castShadow = true;
  group.add(pocketMesh);

  // Dual row of connector header pins (J1-01 to J1-26)
  const pinsPerRow = Math.ceil(pinCount / 2);
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < pinsPerRow; c++) {
      const pinX = -0.9 + (c / (pinsPerRow - 1)) * 1.8;
      const pinY = 0.45 + r * 0.22;
      const pinGeo = new THREE.BoxGeometry(0.045, 0.045, 0.35);
      const pinMesh = new THREE.Mesh(pinGeo, goldPinMat);
      pinMesh.position.set(pinX, pinY, 1.85);
      group.add(pinMesh);
    }
  }

  // Stamped aluminum label badge
  const labelTex = createLabelTexture(label, 'BOSCH / DELPHI CAN2.0B AUTO-SPEC', '#0f172a', '#f8fafc', '#38bdf8');
  const labelGeo = new THREE.PlaneGeometry(2.2, 1.2);
  const labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true });
  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.rotation.x = -Math.PI / 2;
  labelMesh.position.set(0, 1.2, 0);
  group.add(labelMesh);

  group.add(createContactShadow(3.2, 0.5));
  return group;
}

/**
 * 5. Modular 6-Way Fuse Distribution Block
 * Black nylon body with 6 color-coded ATO fuses and output Faston blade terminals
 */
export function buildFuseBlockModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Fuse_Block_Group';

  const basePlasticMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.6,
    metalness: 0.15,
  });

  const brassTerminalMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.25,
    metalness: 0.85,
  });

  // Base fuse block housing
  const baseGeo = new THREE.BoxGeometry(4.2, 0.7, 2.2);
  const baseMesh = new THREE.Mesh(baseGeo, basePlasticMat);
  baseMesh.position.y = 0.35;
  baseMesh.castShadow = true;
  group.add(baseMesh);

  // Main high-current input power feed stud M8
  const studGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 16);
  const studMesh = new THREE.Mesh(studGeo, brassTerminalMat);
  studMesh.position.set(-1.6, 0.8, 0);
  studMesh.castShadow = true;
  group.add(studMesh);

  // Hex Nut on stud
  const nutGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.25, 6);
  const nutMesh = new THREE.Mesh(nutGeo, brassTerminalMat);
  nutMesh.position.set(-1.6, 0.6, 0);
  group.add(nutMesh);

  // 6 fuse positions with colored ATO fuses and output terminal tabs (F-01 to F-06)
  const fuseAmps = [20, 30, 40, 50, 15, 7.5];
  for (let i = 0; i < 6; i++) {
    const x = -0.9 + i * 0.48;
    const fuseSub = buildBladeFuseModel('ATO', fuseAmps[i], 0);
    fuseSub.scale.set(0.42, 0.42, 0.42);
    fuseSub.position.set(x, 0.85, 0);
    group.add(fuseSub);

    // Output male Faston 6.3mm tab along bottom edge
    const tabGeo = new THREE.BoxGeometry(0.12, 0.4, 0.04);
    const tabMesh = new THREE.Mesh(tabGeo, brassTerminalMat);
    tabMesh.position.set(x, 0.25, 1.25);
    group.add(tabMesh);
  }

  // Cover label
  const labelTex = createLabelTexture('POWER FUSE BLOCK', '12V / 24V DC MAX 150A', '#18181b', '#f8fafc', '#ef4444');
  const labelGeo = new THREE.PlaneGeometry(1.6, 0.6);
  const labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true });
  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.rotation.x = -Math.PI / 2;
  labelMesh.position.set(0.2, 0.71, 0.7);
  group.add(labelMesh);

  group.add(createContactShadow(3.0, 0.45));
  return group;
}

/**
 * 6. 12V Automotive Heavy Battery Source
 * High-current lead-acid / AGM battery with brass (+) and (-) terminal posts
 */
export function buildBatterySourceModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Battery_Source_Group';

  const casingMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.65,
    metalness: 0.1,
  });

  const lidMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.55,
    metalness: 0.15,
  });

  const redMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.35,
    metalness: 0.4,
  });

  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.35,
    metalness: 0.4,
  });

  const leadTerminalMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Cast lead alloy
    roughness: 0.3,
    metalness: 0.85,
  });

  // Main battery case
  const caseGeo = new THREE.BoxGeometry(3.2, 2.2, 1.8);
  const caseMesh = new THREE.Mesh(caseGeo, casingMat);
  caseMesh.position.y = 1.1;
  caseMesh.castShadow = true;
  group.add(caseMesh);

  // Top lid
  const lidGeo = new THREE.BoxGeometry(3.3, 0.25, 1.9);
  const lidMesh = new THREE.Mesh(lidGeo, lidMat);
  lidMesh.position.y = 2.3;
  lidMesh.castShadow = true;
  group.add(lidMesh);

  // Positive Terminal post (+)
  const posCollarGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.15, 16);
  const posCollar = new THREE.Mesh(posCollarGeo, redMat);
  posCollar.position.set(-1.0, 2.5, 0);
  group.add(posCollar);

  const posPostGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.45, 16);
  const posPost = new THREE.Mesh(posPostGeo, leadTerminalMat);
  posPost.position.set(-1.0, 2.7, 0);
  posPost.castShadow = true;
  group.add(posPost);

  // Negative Terminal post (-)
  const negCollarGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.15, 16);
  const negCollar = new THREE.Mesh(negCollarGeo, blackMat);
  negCollar.position.set(1.0, 2.5, 0);
  group.add(negCollar);

  const negPostGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.45, 16);
  const negPost = new THREE.Mesh(negPostGeo, leadTerminalMat);
  negPost.position.set(1.0, 2.7, 0);
  negPost.castShadow = true;
  group.add(negPost);

  // Front Warning & Spec label
  const labelTex = createLabelTexture('MAIN BATTERY 12V', '850 CCA · 75 Ah AGM', '#1e293b', '#ffffff', '#ef4444');
  const labelGeo = new THREE.PlaneGeometry(2.4, 1.4);
  const labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true });
  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.position.set(0, 1.1, 0.91);
  group.add(labelMesh);

  group.add(createContactShadow(2.8, 0.5));
  return group;
}

/**
 * 7. Chassis Ground Stud & Ring Terminal Ground Point
 * Steel welded chassis bolt with copper ring terminals and star lock washer
 */
export function buildGroundChassisModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Ground_Chassis_Group';

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x64748b, // Galvanized automotive sheet metal
    roughness: 0.3,
    metalness: 0.85,
  });

  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xc27a38, // Tin-plated copper ring terminal
    roughness: 0.25,
    metalness: 0.8,
  });

  const blackWireMat = new THREE.MeshStandardMaterial({
    color: 0x09090b, // Black ground cable
    roughness: 0.5,
    metalness: 0.05,
  });

  // Chassis steel mounting plate
  const plateGeo = new THREE.BoxGeometry(2.4, 0.15, 2.4);
  const plateMesh = new THREE.Mesh(plateGeo, steelMat);
  plateMesh.position.y = 0.08;
  plateMesh.receiveShadow = true;
  group.add(plateMesh);

  // Threaded ground stud M8
  const studGeo = new THREE.CylinderGeometry(0.16, 0.16, 1.6, 20);
  const studMesh = new THREE.Mesh(studGeo, steelMat);
  studMesh.position.y = 0.9;
  studMesh.castShadow = true;
  group.add(studMesh);

  // Hex Nut M8 on top
  const nutGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 6);
  const nutMesh = new THREE.Mesh(nutGeo, steelMat);
  nutMesh.position.y = 1.35;
  nutMesh.castShadow = true;
  group.add(nutMesh);

  // 3 Stacked Ring Terminals (GND-01, GND-02, GND-03)
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const ringGeo = new THREE.RingGeometry(0.18, 0.45, 24);
    const ringMesh = new THREE.Mesh(ringGeo, copperMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.25 + i * 0.12;
    group.add(ringMesh);

    // Cable extending outward
    const cableGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 12);
    const cableMesh = new THREE.Mesh(cableGeo, blackWireMat);
    cableMesh.rotation.z = Math.PI / 2;
    cableMesh.rotation.y = angle;
    cableMesh.position.set(Math.cos(angle) * 0.8, 0.25 + i * 0.12, Math.sin(angle) * 0.8);
    cableMesh.castShadow = true;
    group.add(cableMesh);
  }

  group.add(createContactShadow(2.0, 0.4));
  return group;
}

/**
 * 8. Forward Radar Sensor / ADAS Camera Module
 */
export function buildRadarSensorModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Radar_Sensor_Group';

  const housingMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.5,
    metalness: 0.3,
  });

  const radomeMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.2,
    metalness: 0.1,
  });

  const bracketMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.3,
    metalness: 0.8,
  });

  // Main square sensor body
  const bodyGeo = new THREE.BoxGeometry(2.0, 1.8, 1.0);
  const bodyMesh = new THREE.Mesh(bodyGeo, housingMat);
  bodyMesh.position.y = 1.1;
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // Front dome / lens
  const domeGeo = new THREE.CylinderGeometry(0.7, 0.8, 0.25, 32);
  const domeMesh = new THREE.Mesh(domeGeo, radomeMat);
  domeMesh.rotation.x = Math.PI / 2;
  domeMesh.position.set(0, 1.1, 0.6);
  group.add(domeMesh);

  // 4-pin weatherpack sealed connector header at bottom
  const connGeo = new THREE.BoxGeometry(0.8, 0.5, 0.5);
  const connMesh = new THREE.Mesh(connGeo, housingMat);
  connMesh.position.set(0, 0.2, 0);
  group.add(connMesh);

  // Stamped label
  const labelTex = createLabelTexture('77GHz RADAR', 'CAN-FD ADAS SENSOR', '#0f172a', '#38bdf8', '#0284c7');
  const labelGeo = new THREE.PlaneGeometry(1.4, 0.6);
  const labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true });
  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.position.set(0, 1.5, 0.51);
  group.add(labelMesh);

  group.add(createContactShadow(2.2, 0.4));
  return group;
}

/**
 * 9. Standard 16-Pin OBD2 Diagnostic Port (SAE J1962)
 */
export function buildObd2DiagnosticModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'OBD2_Diagnostic_Group';

  const blackNylonMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.65,
    metalness: 0.1,
  });

  const goldPinMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.2,
    metalness: 0.9,
  });

  // Trapezoidal body
  const bodyGeo = new THREE.BoxGeometry(2.8, 1.2, 1.4);
  const bodyMesh = new THREE.Mesh(bodyGeo, blackNylonMat);
  bodyMesh.position.y = 0.8;
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // 16 Pin Cavities in 2 rows of 8
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 8; c++) {
      const x = -0.95 + (c / 7) * 1.9;
      const y = 0.65 + r * 0.35;
      const pinCavityGeo = new THREE.BoxGeometry(0.12, 0.12, 0.2);
      const pinMesh = new THREE.Mesh(pinCavityGeo, goldPinMat);
      pinMesh.position.set(x, y, 0.71);
      group.add(pinMesh);
    }
  }

  // Label
  const labelTex = createLabelTexture('OBD-II PORT', 'SAE J1962 / CAN BUS', '#18181b', '#f8fafc', '#10b981');
  const labelGeo = new THREE.PlaneGeometry(1.8, 0.4);
  const labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true });
  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.rotation.x = -Math.PI / 2;
  labelMesh.position.set(0, 1.41, 0);
  group.add(labelMesh);

  group.add(createContactShadow(2.4, 0.4));
  return group;
}

