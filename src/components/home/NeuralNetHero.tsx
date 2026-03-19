/**
 * NeuralNetHero - 3D neural network visualization hero section.
 * Uses React Three Fiber for the WebGL scene with a text overlay on top.
 * Lazy-loads Three.js; falls back to a CSS gradient on mobile/low-power devices.
 */
import React, { Suspense, useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LayerConfig {
  label: string;
  nodeCount: number;
  x: number;
}

interface NodeData {
  position: THREE.Vector3;
  layerIndex: number;
}

interface ConnectionData {
  start: THREE.Vector3;
  end: THREE.Vector3;
  weight: number; // 0-1, affects opacity
}

interface ParticleData {
  connectionIndex: number;
  progress: number; // 0-1 along the connection
  speed: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LAYERS: LayerConfig[] = [
  { label: 'Input', nodeCount: 3, x: -9 },
  { label: 'Student Input', nodeCount: 4, x: -6 },
  { label: 'Pattern Recognition', nodeCount: 6, x: -3 },
  { label: 'Concept Mapping', nodeCount: 8, x: 0 },
  { label: 'Misconception Detection', nodeCount: 6, x: 3 },
  { label: 'Adaptive Path', nodeCount: 4, x: 6 },
  { label: 'Output', nodeCount: 3, x: 9 },
];

const COLORS = {
  cyan: new THREE.Color('#00d4ff'),
  magenta: new THREE.Color('#ff00ff'),
  purple: new THREE.Color('#8b5cf6'),
  pink: new THREE.Color('#ff6b9d'),
  violet: new THREE.Color('#bf5fff'),
};

const CONNECTION_COLORS = [COLORS.cyan, COLORS.magenta, COLORS.pink, COLORS.purple];

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

function buildNodes(): NodeData[] {
  const nodes: NodeData[] = [];
  LAYERS.forEach((layer, layerIndex) => {
    const count = layer.nodeCount;
    const ySpread = (count - 1) * 1.2;
    for (let i = 0; i < count; i++) {
      const y = -ySpread / 2 + i * 1.2;
      const z = (Math.random() - 0.5) * 1.5;
      nodes.push({ position: new THREE.Vector3(layer.x, y, z), layerIndex });
    }
  });
  return nodes;
}

function buildConnections(nodes: NodeData[]): ConnectionData[] {
  const conns: ConnectionData[] = [];
  for (let li = 0; li < LAYERS.length - 1; li++) {
    const fromNodes = nodes.filter((n) => n.layerIndex === li);
    const toNodes = nodes.filter((n) => n.layerIndex === li + 1);
    fromNodes.forEach((from) => {
      toNodes.forEach((to) => {
        conns.push({
          start: from.position,
          end: to.position,
          weight: 0.15 + Math.random() * 0.85,
        });
      });
    });
  }
  return conns;
}

// ---------------------------------------------------------------------------
// Scene sub-components
// ---------------------------------------------------------------------------

/** Glowing node spheres — middle layers pulse size, input/output are static size */
function Nodes({ nodes }: { nodes: NodeData[] }) {
  const lastLayer = LAYERS.length - 1;
  const middleNodes = useMemo(() => nodes.filter(n => n.layerIndex !== 0 && n.layerIndex !== lastLayer), [nodes, lastLayer]);
  const edgeNodes = useMemo(() => nodes.filter(n => n.layerIndex === 0 || n.layerIndex === lastLayer), [nodes, lastLayer]);

  return (
    <>
      <MiddleNodes nodes={middleNodes} />
      <EdgeNodes nodes={edgeNodes} />
    </>
  );
}

/** Middle layer nodes — cyan, size pulses */
function MiddleNodes({ nodes }: { nodes: NodeData[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = nodes.length;

  useEffect(() => {
    nodes.forEach((node, i) => {
      dummy.position.copy(node.position);
      dummy.scale.setScalar(0.18);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [nodes, dummy]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    nodes.forEach((node, i) => {
      dummy.position.copy(node.position);
      const pulse = 0.18 + 0.04 * Math.sin(t * 1.5 + i * 0.7);
      dummy.scale.setScalar(pulse);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color={COLORS.cyan} transparent opacity={1.0} />
    </instancedMesh>
  );
}

/** Input/Output nodes — neon violet, static size, brightness pulses */
function EdgeNodes({ nodes }: { nodes: NodeData[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = nodes.length;

  useEffect(() => {
    nodes.forEach((node, i) => {
      dummy.position.copy(node.position);
      dummy.scale.setScalar(0.18);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [nodes, dummy]);

  // Pulse the color brightness, not the size
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 0.7 + 0.3 * Math.sin(t * 2.0);
    if (matRef.current) {
      matRef.current.color.setRGB(
        0.75 * pulse,
        0.37 * pulse,
        1.0 * pulse
      );
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial ref={matRef} color={COLORS.violet} transparent opacity={1.0} />
    </instancedMesh>
  );
}

/** Glow halos around each node */
function NodeGlows({ nodes }: { nodes: NodeData[] }) {
  const lastLayer = LAYERS.length - 1;
  const middleNodes = useMemo(() => nodes.filter(n => n.layerIndex !== 0 && n.layerIndex !== lastLayer), [nodes, lastLayer]);
  const edgeNodes = useMemo(() => nodes.filter(n => n.layerIndex === 0 || n.layerIndex === lastLayer), [nodes, lastLayer]);

  return (
    <>
      <GlowGroup nodes={middleNodes} color={COLORS.cyan} />
      <EdgeGlowGroup nodes={edgeNodes} />
    </>
  );
}

/** Cyan glow for middle layers — size pulses */
function GlowGroup({ nodes, color }: { nodes: NodeData[]; color: THREE.Color }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = nodes.length;

  useEffect(() => {
    nodes.forEach((node, i) => {
      dummy.position.copy(node.position);
      dummy.scale.setScalar(0.45);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [nodes, dummy]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    nodes.forEach((node, i) => {
      dummy.position.copy(node.position);
      const pulse = 0.45 + 0.1 * Math.sin(t * 1.5 + i * 0.7);
      dummy.scale.setScalar(pulse);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} />
    </instancedMesh>
  );
}

/** Violet glow for input/output — static size, brightness pulses */
function EdgeGlowGroup({ nodes }: { nodes: NodeData[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = nodes.length;

  useEffect(() => {
    nodes.forEach((node, i) => {
      dummy.position.copy(node.position);
      dummy.scale.setScalar(0.5);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [nodes, dummy]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 0.15 + 0.2 * Math.sin(t * 2.0);
    if (matRef.current) {
      matRef.current.opacity = pulse;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial ref={matRef} color={COLORS.violet} transparent opacity={0.3} />
    </instancedMesh>
  );
}

/** Connection lines between layers */
function Connections({ connections }: { connections: ConnectionData[] }) {
  const linesRef = useRef<THREE.Group>(null!);

  const lineObjects = useMemo(() => {
    return connections.map((conn, i) => {
      const points = [conn.start, conn.end];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const color = CONNECTION_COLORS[i % CONNECTION_COLORS.length];
      const material = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: conn.weight * 0.55,
        linewidth: 1, // Note: WebGL limits this to 1 on most GPUs
      });
      return { geometry, material, key: i };
    });
  }, [connections]);

  return (
    <group ref={linesRef}>
      {lineObjects.map(({ geometry, material, key }) => (
        <primitive key={key} object={new THREE.Line(geometry, material)} />
      ))}
    </group>
  );
}

/** Flowing data particles along connections */
function DataParticles({ connections }: { connections: ConnectionData[] }) {
  const PARTICLE_COUNT = 120;
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initialize particle data
  const particles = useMemo<ParticleData[]>(() => {
    return Array.from({ length: PARTICLE_COUNT }, () => ({
      connectionIndex: Math.floor(Math.random() * connections.length),
      progress: Math.random(),
      speed: 0.15 + Math.random() * 0.35,
    }));
  }, [connections.length]);

  // Color array for particles
  const colorArray = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    particles.forEach((p, i) => {
      const color = CONNECTION_COLORS[p.connectionIndex % CONNECTION_COLORS.length];
      arr[i * 3] = color.r;
      arr[i * 3 + 1] = color.g;
      arr[i * 3 + 2] = color.b;
    });
    return arr;
  }, [particles]);

  useEffect(() => {
    if (meshRef.current.instanceColor) return;
    const colorAttr = new THREE.InstancedBufferAttribute(colorArray, 3);
    meshRef.current.instanceColor = colorAttr;
  }, [colorArray]);

  useFrame((_, delta) => {
    particles.forEach((p, i) => {
      p.progress += p.speed * delta;
      if (p.progress > 1) {
        p.progress = 0;
        p.connectionIndex = Math.floor(Math.random() * connections.length);
        // Update color
        const color = CONNECTION_COLORS[p.connectionIndex % CONNECTION_COLORS.length];
        if (meshRef.current.instanceColor) {
          meshRef.current.instanceColor.setXYZ(i, color.r, color.g, color.b);
          meshRef.current.instanceColor.needsUpdate = true;
        }
      }

      const conn = connections[p.connectionIndex];
      dummy.position.lerpVectors(conn.start, conn.end, p.progress);
      // Scale: fade in/out at edges
      const edgeFade = Math.sin(p.progress * Math.PI);
      dummy.scale.setScalar(0.1 * edgeFade);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
    </instancedMesh>
  );
}

/** Phase rectangles - semi-transparent outlines around each layer */
function PhaseRectangles({ nodes }: { nodes: NodeData[] }) {
  const rectangles = useMemo(() => {
    // Skip first (Input) and last (Output) layers — they're bare nodes
    return LAYERS.slice(1, -1).map((layer, idx) => {
      const li = idx + 1; // offset by 1 since we sliced
      const layerNodes = nodes.filter((n) => n.layerIndex === li);
      const ys = layerNodes.map((n) => n.position.y);
      const zs = layerNodes.map((n) => n.position.z);
      const minY = Math.min(...ys) - 0.6;
      const maxY = Math.max(...ys) + 0.6;
      const avgZ = zs.reduce((a, b) => a + b, 0) / zs.length;
      const height = maxY - minY;
      const width = 2.0;
      const centerY = (minY + maxY) / 2;
      return { x: layer.x, y: centerY, z: avgZ, width, height, label: layer.label };
    });
  }, [nodes]);

  return (
    <group>
      {rectangles.map((rect, i) => {
        const color = CONNECTION_COLORS[i % CONNECTION_COLORS.length];
        return (
          <group key={i} position={[rect.x, rect.y, rect.z - 0.5]}>
            <mesh>
              <planeGeometry args={[rect.width, rect.height]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={0.1}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Border using EdgesGeometry */}
            <lineSegments>
              <edgesGeometry args={[new THREE.PlaneGeometry(rect.width, rect.height)]} />
              <lineBasicMaterial color={color} transparent opacity={0.6} />
            </lineSegments>
          </group>
        );
      })}
    </group>
  );
}

/** Mouse parallax + breathing effect for the entire scene */
function SceneController() {
  const groupRef = useRef<THREE.Group>(null!);
  const mouse = useRef({ x: 0, y: 0 });
  const smoothMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  const { scene } = useThree();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Smooth mouse interpolation
    smoothMouse.current.x += (mouse.current.x - smoothMouse.current.x) * 0.03;
    smoothMouse.current.y += (mouse.current.y - smoothMouse.current.y) * 0.03;

    // Apply parallax rotation to the whole scene
    scene.rotation.y = smoothMouse.current.x * 0.08;
    scene.rotation.x = smoothMouse.current.y * 0.04;

    // Breathing effect
    const breathe = 1 + 0.015 * Math.sin(t * 0.5);
    scene.scale.setScalar(breathe);
  });

  return null;
}

/** The full Three.js scene */
function NeuralNetScene() {
  const nodes = useMemo(() => buildNodes(), []);
  const connections = useMemo(() => buildConnections(nodes), [nodes]);

  return (
    <>
      <SceneController />
      <ambientLight intensity={0.5} />
      <PhaseRectangles nodes={nodes} />
      <Connections connections={connections} />
      <Nodes nodes={nodes} />
      <NodeGlows nodes={nodes} />
      <DataParticles connections={connections} />
    </>
  );
}

// ---------------------------------------------------------------------------
// CSS fallback for mobile / low-power devices
// ---------------------------------------------------------------------------

function CSSFallback() {
  // Simplified 2D neural network using SVG for mobile
  // 5 layers: Input(3) → Hidden1(4) → Hidden2(5) → Hidden3(4) → Output(3)
  const mobileLayers = [
    { count: 3, color: '#bf5fff', label: 'Input' },
    { count: 4, color: '#00d4ff', label: 'Analysis' },
    { count: 5, color: '#00d4ff', label: 'Mapping' },
    { count: 4, color: '#00d4ff', label: 'Detection' },
    { count: 3, color: '#bf5fff', label: 'Output' },
  ];

  const svgW = 360;
  const svgH = 500;
  const layerSpacing = svgW / (mobileLayers.length + 1);
  const nodeRadius = 6;

  // Calculate node positions
  const nodePositions: { x: number; y: number; color: string; layer: number }[] = [];
  mobileLayers.forEach((layer, li) => {
    const x = layerSpacing * (li + 1);
    const totalH = (layer.count - 1) * 60;
    const startY = (svgH - totalH) / 2;
    for (let ni = 0; ni < layer.count; ni++) {
      nodePositions.push({ x, y: startY + ni * 60, color: layer.color, layer: li });
    }
  });

  // Build connections between adjacent layers
  const connections: { x1: number; y1: number; x2: number; y2: number; delay: number }[] = [];
  let connIdx = 0;
  mobileLayers.forEach((layer, li) => {
    if (li >= mobileLayers.length - 1) return;
    const nextLayer = mobileLayers[li + 1];
    const curNodes = nodePositions.filter((n) => n.layer === li);
    const nextNodes = nodePositions.filter((n) => n.layer === li + 1);
    curNodes.forEach((cn) => {
      nextNodes.forEach((nn) => {
        connections.push({ x1: cn.x, y1: cn.y, x2: nn.x, y2: nn.y, delay: connIdx * 0.05 });
        connIdx++;
      });
    });
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 30%, #0a1628 60%, #0a0a1a 100%)',
      }}
    >
      <style>{`
        @keyframes mobileNodePulse {
          0%, 100% { opacity: 0.7; filter: drop-shadow(0 0 4px currentColor); }
          50% { opacity: 1; filter: drop-shadow(0 0 12px currentColor); }
        }
        @keyframes mobileConnPulse {
          0%, 100% { opacity: 0.08; }
          50% { opacity: 0.25; }
        }
        @keyframes mobileParticle {
          0% { offset-distance: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
      `}</style>
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '400px',
          height: 'auto',
          maxHeight: '70vh',
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Connections */}
        {connections.map((c, i) => (
          <line
            key={`conn-${i}`}
            x1={c.x1}
            y1={c.y1}
            x2={c.x2}
            y2={c.y2}
            stroke="#00d4ff"
            strokeWidth={0.8}
            style={{
              animation: `mobileConnPulse ${2 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${c.delay}s`,
            }}
          />
        ))}

        {/* Data flow particles — a subset of connections */}
        {connections
          .filter((_, i) => i % 4 === 0)
          .map((c, i) => {
            const pathId = `particle-path-${i}`;
            return (
              <g key={`particle-${i}`}>
                <path
                  id={pathId}
                  d={`M${c.x1},${c.y1} L${c.x2},${c.y2}`}
                  fill="none"
                  stroke="none"
                />
                <circle
                  r={2.5}
                  fill="#00d4ff"
                  style={{
                    offsetPath: `path('M${c.x1},${c.y1} L${c.x2},${c.y2}')`,
                    animation: `mobileParticle ${2 + (i % 2)}s linear infinite`,
                    animationDelay: `${i * 0.3}s`,
                    filter: 'drop-shadow(0 0 3px #00d4ff)',
                  }}
                />
              </g>
            );
          })}

        {/* Phase rectangles around middle 3 layers */}
        {mobileLayers.slice(1, 4).map((layer, i) => {
          const li = i + 1;
          const layerNodes = nodePositions.filter((n) => n.layer === li);
          const x = layerNodes[0].x;
          const minY = Math.min(...layerNodes.map((n) => n.y));
          const maxY = Math.max(...layerNodes.map((n) => n.y));
          const pad = 20;
          return (
            <rect
              key={`phase-${i}`}
              x={x - pad}
              y={minY - pad}
              width={pad * 2}
              height={maxY - minY + pad * 2}
              rx={8}
              fill="rgba(0,212,255,0.05)"
              stroke="rgba(0,212,255,0.25)"
              strokeWidth={1}
            />
          );
        })}

        {/* Nodes */}
        {nodePositions.map((node, i) => (
          <g key={`node-${i}`}>
            {/* Glow halo */}
            <circle
              cx={node.x}
              cy={node.y}
              r={nodeRadius * 2.5}
              fill={node.color}
              opacity={0.15}
              style={{
                animation: `mobileNodePulse ${2 + (i % 3) * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
            {/* Core node */}
            <circle
              cx={node.x}
              cy={node.y}
              r={nodeRadius}
              fill={node.color}
              style={{
                color: node.color,
                animation: `mobileNodePulse ${2 + (i % 3) * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          </g>
        ))}

        {/* Layer labels */}
        {mobileLayers.map((layer, i) => {
          const x = layerSpacing * (i + 1);
          return (
            <text
              key={`label-${i}`}
              x={x}
              y={svgH - 20}
              textAnchor="middle"
              fill={layer.color}
              fontSize={9}
              fontWeight={500}
              letterSpacing="0.05em"
              opacity={0.7}
            >
              {layer.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

interface NeuralNetHeroProps {
  brand: {
    tagline: string;
    colors: { primary: string };
    name: string;
  };
  isAtlas: boolean;
}

export function NeuralNetHero({ brand, isAtlas }: NeuralNetHeroProps) {
  const [useWebGL, setUseWebGL] = useState(false);

  useEffect(() => {
    // Only enable WebGL on non-mobile devices with decent GPUs
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const hasWebGL = (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
      } catch {
        return false;
      }
    })();
    setUseWebGL(!isMobile && hasWebGL);
  }, []);

  return (
    <section className="relative" style={{ minHeight: '100vh' }}>
      {/* Background layer */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        {useWebGL ? (
          <Suspense fallback={<CSSFallback />}>
            <Canvas
              camera={{ position: [0, 0, 16], fov: 50 }}
              style={{ background: '#0a0a1a', pointerEvents: 'none' }}
              dpr={[1, 1.5]}
              gl={{ antialias: true, alpha: false }}
            >
              <NeuralNetScene />
            </Canvas>
          </Suspense>
        ) : (
          <CSSFallback />
        )}
      </div>

      {/* Gradient overlay for text readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background:
            'radial-gradient(ellipse at center, rgba(10,10,26,0.1) 0%, rgba(10,10,26,0.5) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Bottom fade — blends dark hero into whatever theme is below */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '120px',
          zIndex: 2,
          background: 'linear-gradient(to bottom, transparent, var(--ax-bg))',
          pointerEvents: 'none',
        }}
      />

      {/* Layer labels overlay — positioned to match 3D layer positions (hidden on mobile, SVG has its own) */}
      <div
        className="hidden sm:flex"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          pointerEvents: 'none',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: '8vh',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '80%',
            maxWidth: '900px',
          }}
        >
          {LAYERS.map((layer, i) => (
            <div
              key={i}
              style={{
                textAlign: 'center',
                fontSize: '0.65rem',
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color:
                  i === 0 || i === LAYERS.length - 1
                    ? 'rgba(191,95,255,0.7)'
                    : 'rgba(0,212,255,0.6)',
                maxWidth: '90px',
                lineHeight: 1.3,
              }}
            >
              {layer.label}
            </div>
          ))}
        </div>
      </div>

      {/* Headline — positioned in top third */}
      <div
        className="relative px-4"
        style={{ zIndex: 3, paddingTop: '10vh', textAlign: 'center' }}
      >
        <h1
          className="text-3xl sm:text-5xl lg:text-6xl font-bold"
          style={{ color: '#ffffff' }}
        >
          {brand.tagline}
        </h1>
        <p
          className="hidden sm:block"
          style={{
            marginTop: '0.75rem',
            fontSize: '0.85rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'rgba(0,212,255,0.6)',
          }}
        >
          Powered by Adaptive AI
        </p>
        {/* Compact mobile version */}
        <p
          className="block sm:hidden"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.7rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(0,212,255,0.5)',
          }}
        >
          Powered by Adaptive AI
        </p>
      </div>

    </section>
  );
}

// ---------------------------------------------------------------------------
// Description section — sits below the hero
// ---------------------------------------------------------------------------

interface DescriptionSectionProps {
  isAtlas: boolean;
  brandColor: string;
}

export function DescriptionSection({ isAtlas, brandColor }: DescriptionSectionProps) {
  return (
    <section
      style={{
        background: 'var(--ax-bg)',
        borderTop: '1px solid var(--ax-border)',
        padding: '2.5rem 1.5rem 4rem',
      }}
    >
      <div className="max-w-3xl mx-auto text-center">
        {/* Browse Catalog CTA */}
        <div style={{ marginBottom: '2.5rem' }}>
          <a
            href="#catalog"
            className="inline-flex items-center px-8 py-3 rounded-full font-medium transition-all"
            style={{
              background: 'rgba(139,92,246,0.15)',
              border: '1px solid rgba(139,92,246,0.5)',
              backdropFilter: 'blur(8px)',
              letterSpacing: '0.05em',
              color: 'var(--ax-text)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(139,92,246,0.3)';
              e.currentTarget.style.borderColor = 'rgba(139,92,246,0.8)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(139,92,246,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(139,92,246,0.15)';
              e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Browse Catalog
            <svg
              className="ml-2 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </a>
        </div>
        <p
          className="text-lg sm:text-xl leading-relaxed"
          style={{ color: 'var(--ax-text-secondary)' }}
        >
          {isAtlas ? (
            <>
              Mathematics textbooks that honor both truth and beauty. Rigorous content presented
              with clarity, rooted in the classical tradition.
            </>
          ) : (
            <>
              Complete mathematics programs powered by adaptive AI. Each course includes a digital
              textbook, video walkthroughs, thousands of practice problems, and a personal AI tutor
              that learns how you think. Powered by our Axiom Question Engine — 500+ templates with
              seeded randomization that generate unique problems for every student — and backed by a
              Student Knowledge State Model that tracks mastery across every concept, identifies
              misconceptions in real time, and builds a personalized path to success.
            </>
          )}
        </p>
      </div>
    </section>
  );
}
