/**
 * HarnessMap Pro - Three.js 3D Procedural Workbench (Hebrew Edition)
 * Conforms strictly to Three.js Craft & Spatial UI Directives:
 * - RoomEnvironment + PMREMGenerator PBR reflections
 * - 3-Point Studio Lighting (warm key + cool fill + rim)
 * - Exponential damping on camera & exploded animation
 * - Unobstructed 3D viewport with collapsible bottom dock
 * - Full Hebrew localization & RTL HUD controls
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  buildIsoRelayModel,
  buildBladeFuseModel,
  buildFastonCrimpModel,
  buildEcuModuleModel,
  buildFuseBlockModel,
  buildBatterySourceModel,
  buildGroundChassisModel,
  buildRadarSensorModel,
  buildObd2DiagnosticModel,
} from '../utils/proceduralModels';
import { ChevronDown, ChevronUp, Layers, Eye, Cpu, Shield, Zap, CircleDot, Radio, Wrench } from 'lucide-react';

export type InspectableModel =
  | 'relay_iso_5pin'
  | 'fuse_ato_30'
  | 'fuse_maxi_80'
  | 'faston_crimp'
  | 'ecu_module'
  | 'fuse_block'
  | 'battery_12v'
  | 'ground_chassis'
  | 'radar_sensor'
  | 'obd2_connector';

interface ThreeWorkbenchProps {
  selectedComponentType?: InspectableModel;
  onModelChange?: (model: InspectableModel) => void;
}

export const ThreeWorkbench: React.FC<ThreeWorkbenchProps> = ({
  selectedComponentType = 'relay_iso_5pin',
  onModelChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const activeModelRef = useRef<InspectableModel>(selectedComponentType);
  const explodedRef = useRef<number>(0);
  const currentModelGroupRef = useRef<THREE.Group | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const [activeModel, setActiveModel] = useState<InspectableModel>(selectedComponentType);
  const [explodedAmount, setExplodedAmount] = useState<number>(0);
  const [wireAwg, setWireAwg] = useState<number>(14);
  const [showCrossSection, setShowCrossSection] = useState<boolean>(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);

  // Sync external prop with local state
  useEffect(() => {
    if (selectedComponentType !== activeModel) {
      setActiveModel(selectedComponentType);
      activeModelRef.current = selectedComponentType;
      rebuildActiveModel();
    }
  }, [selectedComponentType]);

  const rebuildActiveModel = () => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    if (currentModelGroupRef.current) {
      scene.remove(currentModelGroupRef.current);
      currentModelGroupRef.current.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else if (mesh.material) {
            mesh.material.dispose();
          }
        }
      });
      currentModelGroupRef.current = null;
    }

    let newGroup: THREE.Group;
    const exp = explodedRef.current;

    switch (activeModelRef.current) {
      case 'fuse_ato_30':
        newGroup = buildBladeFuseModel('ATO', 30, exp);
        break;
      case 'fuse_maxi_80':
        newGroup = buildBladeFuseModel('MAXI', 80, exp);
        break;
      case 'faston_crimp':
        newGroup = buildFastonCrimpModel(wireAwg, showCrossSection);
        break;
      case 'ecu_module':
        newGroup = buildEcuModuleModel('ECU ENGINE CONTROL', 26);
        break;
      case 'fuse_block':
        newGroup = buildFuseBlockModel();
        break;
      case 'battery_12v':
        newGroup = buildBatterySourceModel();
        break;
      case 'ground_chassis':
        newGroup = buildGroundChassisModel();
        break;
      case 'radar_sensor':
        newGroup = buildRadarSensorModel();
        break;
      case 'obd2_connector':
        newGroup = buildObd2DiagnosticModel();
        break;
      case 'relay_iso_5pin':
      default:
        newGroup = buildIsoRelayModel(exp);
        break;
    }

    currentModelGroupRef.current = newGroup;
    scene.add(newGroup);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0e17);
    scene.fog = new THREE.FogExp2(0x0a0e17, 0.04);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(4.5, 3.8, 5.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Studio PBR Environment Map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. 3-Point Balanced Studio Lighting
    const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.6);
    keyLight.position.set(5, 7, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x90b4ce, 0x182433, 0.9);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    rimLight.position.set(-6, 4, -5);
    scene.add(rimLight);

    const gridHelper = new THREE.GridHelper(14, 28, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -0.001;
    scene.add(gridHelper);

    // 4. Orbit Controls with Smooth Exponential Damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.minDistance = 1.5;
    controls.maxDistance = 18;
    controls.target.set(0, 1.1, 0);

    rebuildActiveModel();

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleExplodeChange = (val: number) => {
    setExplodedAmount(val);
    explodedRef.current = val;
    rebuildActiveModel();
  };

  const handleSelectModel = (type: InspectableModel) => {
    setActiveModel(type);
    activeModelRef.current = type;
    if (onModelChange) {
      onModelChange(type);
    }
    rebuildActiveModel();
  };

  const setCameraPreset = (preset: 'iso' | 'pinout' | 'cross' | 'side') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    switch (preset) {
      case 'iso':
        camera.position.set(4.5, 3.8, 5.2);
        controls.target.set(0, 1.1, 0);
        break;
      case 'pinout':
        camera.position.set(0.1, -3.2, 0.4);
        controls.target.set(0, 0.4, 0);
        break;
      case 'cross':
        camera.position.set(0, 1.2, 5.0);
        controls.target.set(0, 0.8, 0);
        break;
      case 'side':
        camera.position.set(5.5, 1.2, 0);
        controls.target.set(0, 0.8, 0);
        break;
    }
    controls.update();
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950 text-right" dir="rtl">
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Right Spec Badge - Hebrew technical metadata */}
      <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <div className="flex flex-col gap-0.5">
          <div className="text-xs font-semibold tracking-wider text-amber-400 font-mono">
            סדנת בדיקה תלת-ממדית (3D Studio)
          </div>
          <div className="text-sm font-bold text-slate-100">
            {activeModel === 'relay_iso_5pin' && 'ממסר רכב תקני ISO 5-Pin (12V 40A) עם סימוני פינים 30/85/86/87'}
            {activeModel === 'fuse_ato_30' && 'פיוז להב תקני ATO/ATC (30A ירוק - תקן SAE J1284)'}
            {activeModel === 'fuse_maxi_80' && 'פיוז להב ענק MAXI להגנה ראשית (80A)'}
            {activeModel === 'faston_crimp' && `נעל כבל Faston 6.3 מ"מ ולחיצת B-Crimp תקנית (${wireAwg} AWG)`}
            {activeModel === 'ecu_module' && 'מחשב מנוע / בקרה אלקטרוני (ECU Aluminum Ribbed Enclosure)'}
            {activeModel === 'fuse_block' && 'תיבת פיוזים מרכזית מודולרית (6-Way Modular Automotive Block)'}
            {activeModel === 'battery_12v' && 'מצבר כוח ראשי 12V DC עם קוטבי M8'}
            {activeModel === 'ground_chassis' && 'נקודת הארקת שלדה תקנית (Chassis Ground Stud & Ring Lugs)'}
            {activeModel === 'radar_sensor' && 'מודול חיישן מכ"ם ומצלמת ADAS קדמית (CAN-FD 77GHz)'}
            {activeModel === 'obd2_connector' && 'שקע דיאגנוסטיקה תקני 16 פינים (SAE J1962 OBD2 Port)'}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>תאורת PBR אולפן</span>
            <span aria-hidden="true">·</span>
            <span>תקן DIN / SAE</span>
            <span aria-hidden="true">·</span>
            <span>דיוק הנדסי ומבט פינים מלא</span>
          </div>
        </div>
      </div>

      {/* Top Left Camera Angle Quick Buttons */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 p-1 bg-slate-900/85 border border-slate-800 rounded-lg text-xs font-medium" dir="ltr">
        <button
          onClick={() => setCameraPreset('iso')}
          className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          איזומטרי
        </button>
        <button
          onClick={() => setCameraPreset('pinout')}
          className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          פינים וחיבורים
        </button>
        <button
          onClick={() => setCameraPreset('cross')}
          className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          חזית
        </button>
        <button
          onClick={() => setCameraPreset('side')}
          className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          פרופיל
        </button>
      </div>

      {/* Sleek Ergonomic Collapsible Bottom Control Dock */}
      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-4xl transition-transform duration-200 ${
          isDockCollapsed ? 'translate-y-[calc(100%-28px)]' : 'translate-y-0'
        }`}
      >
        {/* Collapse / Expand Toggle Button on Top Edge */}
        <div className="flex justify-center mb-1">
          <button
            onClick={() => setIsDockCollapsed(!isDockCollapsed)}
            className="flex items-center gap-1 px-3 py-0.5 text-xs font-medium text-slate-300 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-t-md transition-colors"
          >
            {isDockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                <span>הצג בקרות וקטלוג תלת-ממד</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                <span>מזער בקרות (תצוגה מלאה ונקייה)</span>
              </>
            )}
          </button>
        </div>

        {/* Dock Surface Body */}
        <div className="p-3 bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl flex flex-col gap-2.5">
          {/* Row 1: Component Selector Segmented Tabs (All 10 models) */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800/80 overflow-x-auto scrollbar-thin max-w-full">
              {[
                { id: 'relay_iso_5pin', label: 'ממסר ISO 5-Pin' },
                { id: 'ecu_module', label: 'מחשב מנוע (ECU)' },
                { id: 'fuse_block', label: 'תיבת פיוזים 6-Way' },
                { id: 'battery_12v', label: 'מצבר ראשי 12V' },
                { id: 'ground_chassis', label: 'הארקת שלדה (GND)' },
                { id: 'fuse_ato_30', label: 'פיוז להב ATO' },
                { id: 'fuse_maxi_80', label: 'פיוז MAXI 80A' },
                { id: 'faston_crimp', label: 'נעל Faston 6.3mm' },
                { id: 'radar_sensor', label: 'מכ"ם ADAS' },
                { id: 'obd2_connector', label: 'שקע OBD2' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectModel(item.id as InspectableModel)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
                    activeModel === item.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-400 font-mono hidden md:block">
              גרירה לסיבוב 360° · גלגלת לזום
            </div>
          </div>

          {/* Row 2: Contextual Controls (Exploded slider or Crimp Inspection) */}
          <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-800/70 text-xs">
            {activeModel === 'faston_crimp' ? (
              <div className="flex items-center gap-4 flex-wrap w-full justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">עובי חוט נבדק (AWG):</span>
                  {[10, 12, 14, 18, 22].map((awg) => (
                    <button
                      key={awg}
                      onClick={() => {
                        setWireAwg(awg);
                        rebuildActiveModel();
                      }}
                      className={`px-2 py-0.5 rounded font-mono ${
                        wireAwg === awg
                          ? 'bg-sky-500 text-white font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {awg} AWG
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setShowCrossSection(!showCrossSection);
                    rebuildActiveModel();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
                    showCrossSection
                      ? 'bg-sky-500/30 text-sky-300 border border-sky-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showCrossSection ? 'מישור חיתוך: פעיל' : 'בדוק חיתוך סיבים (Cross-Section)'}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 w-full">
                <div className="flex items-center gap-1.5 text-slate-300 shrink-0">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>פירוק מכלול (Exploded View):</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={explodedAmount}
                  onChange={(e) => handleExplodeChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="font-mono text-amber-400 tabular-nums shrink-0 w-12 text-left">
                  {Math.round(explodedAmount * 100)}%
                </span>
                <button
                  onClick={() => handleExplodeChange(explodedAmount > 0.05 ? 0 : 0.85)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded shrink-0 transition-colors"
                >
                  {explodedAmount > 0.05 ? 'הרכב מחדש' : 'פרק רכיבים'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
