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
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 30%, #0a1628 60%, #0a0a1a 100%)',
        backgroundSize: '400% 400%',
        animation: 'neuralGradient 12s ease infinite',
      }}
    >
      <style>{`
        @keyframes neuralGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      {/* Decorative dots */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.15 }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: i % 3 === 0 ? '#00d4ff' : i % 3 === 1 ? '#ff00ff' : '#8b5cf6',
              left: `${5 + (i * 37) % 90}%`,
              top: `${10 + (i * 23) % 80}%`,
              animation: `neuralDotPulse ${2 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes neuralDotPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.8); }
        }
      `}</style>
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

      {/* Layer labels overlay — positioned to match 3D layer positions */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          pointerEvents: 'none',
          display: 'flex',
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
        className="relative"
        style={{ zIndex: 3, paddingTop: '12vh', textAlign: 'center' }}
      >
        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-bold"
          style={{ color: '#ffffff' }}
        >
          {brand.tagline}
        </h1>
        <p
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
      </div>

      {/* CTA — positioned above the layer labels */}
      <div
        style={{
          position: 'absolute',
          bottom: '14vh',
          width: '100%',
          textAlign: 'center',
          zIndex: 3,
        }}
      >
        <a
          href="#catalog"
          className="inline-flex items-center px-8 py-3 rounded-full text-white font-medium transition-all"
          style={{
            background: 'rgba(139,92,246,0.15)',
            border: '1px solid rgba(139,92,246,0.5)',
            backdropFilter: 'blur(8px)',
            letterSpacing: '0.05em',
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
        background: '#0a0a1a',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '4rem 1.5rem',
      }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <p
          className="text-lg sm:text-xl leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.8)' }}
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
              that learns how you think — identifying misconceptions, tracking mastery, and building
              a personalized path to success.
            </>
          )}
        </p>
      </div>
    </section>
  );
}
