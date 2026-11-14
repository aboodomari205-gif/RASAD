import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { AdditiveBlending, BackSide, Color, Group, MathUtils, SRGBColorSpace } from 'three';
import type { MutableRefObject } from 'react';

export type EarthInteraction = { yaw: number; tilt: number; dragging: boolean; paused: boolean; invalidate: () => void };
type SceneProps = { interaction: MutableRefObject<EarthInteraction>; entering: boolean; onReady: () => void; onComplete: () => void; onLost: () => void; onInvalidate: (invalidate: () => void) => void };
const rimVertex = `varying vec3 vNormal; varying vec3 vView; void main(){ vec4 p=modelViewMatrix*vec4(position,1.0); vNormal=normalize(normalMatrix*normal); vView=normalize(-p.xyz); gl_Position=projectionMatrix*p; }`;
const rimFragment = `varying vec3 vNormal; varying vec3 vView; void main(){ float rim=pow(1.0-abs(dot(normalize(vNormal),normalize(vView))),3.6); gl_FragColor=vec4(vec3(0.20,0.53,0.80),rim*0.52); }`;
function Planet({ interaction, entering, onReady, onComplete, onLost, onInvalidate }: SceneProps) {
  const sourceTexture = useTexture('/earth/blue-marble-2048.png');
  const earth = useRef<Group>(null);
  const idle = useRef(-1.12);
  const elapsed = useRef(0);
  const completed = useRef(false);
  const { camera, invalidate, gl, size } = useThree();
  const texture = useMemo(() => {
    const owned = sourceTexture.clone(); owned.colorSpace = SRGBColorSpace;
    owned.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy()); owned.needsUpdate = true; return owned;
  }, [sourceTexture, gl]);
  useEffect(() => () => texture.dispose(), [texture]);
  const mobile = size.width < 760;
  const center = mobile ? [0.45, 0.75, 0] as const : [1.65, 0, 0] as const;
  useEffect(() => {
    onInvalidate(invalidate);
    onReady();
    const lost = (event: Event) => { event.preventDefault(); onLost(); };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => { onInvalidate(() => {}); gl.domElement.removeEventListener('webglcontextlost', lost); };
  }, [gl, invalidate, onReady, onLost, onInvalidate]);
  // Demand renderer: at most 30 requested frames/sec, zero while the tab is hidden.
  useEffect(() => {
    const timer = window.setInterval(() => { if (!document.hidden && (!interaction.current.paused || interaction.current.dragging || entering)) invalidate(); }, 1000 / 30);
    return () => clearInterval(timer);
  }, [invalidate, interaction, entering]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.06);
    if (earth.current) {
      if (!interaction.current.dragging && !interaction.current.paused && !entering) idle.current += dt * 0.018;
      earth.current.rotation.y = interaction.current.paused ? idle.current + interaction.current.yaw : MathUtils.damp(earth.current.rotation.y, idle.current + interaction.current.yaw, 4, dt);
      earth.current.rotation.x = interaction.current.paused ? interaction.current.tilt : MathUtils.damp(earth.current.rotation.x, interaction.current.tilt, 4, dt);
    }
    if (entering && !completed.current) {
      elapsed.current = Math.min(1.35, elapsed.current + dt);
      const t = elapsed.current / 1.35;
      const ease = t * t * (3 - 2 * t);
      camera.position.set(MathUtils.lerp(0, center[0] * .76, ease), MathUtils.lerp(0, center[1] * .6, ease), MathUtils.lerp(mobile ? 7.7 : 6.9, 3.25, ease));
      camera.lookAt(center[0] * ease, center[1] * ease, 0);
      if (t === 1) { completed.current = true; onComplete(); }
    }
  });
  return <>
    <ambientLight intensity={0.52} />
    <directionalLight position={[-3, 3, 5]} intensity={2.7} color="#d8e7ff" />
    <group position={center} rotation={[0, 0, .12]}>
      <group ref={earth} rotation={[0, -1.12, 0]}>
        <mesh><sphereGeometry args={[2.15, 80, 48]} /><meshStandardMaterial map={texture} roughness={1} metalness={0} /></mesh>
      </group>
      <mesh scale={1.018}><sphereGeometry args={[2.15, 64, 40]} /><shaderMaterial vertexShader={rimVertex} fragmentShader={rimFragment} transparent blending={AdditiveBlending} side={BackSide} depthWrite={false} /></mesh>
    </group>
    <Starfield />
  </>;
}
function Starfield() {
  const positions = useMemo(() => {
    const points = new Float32Array(240 * 3);
    let seed = 83;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < points.length; i += 3) { points[i] = (random() - .5) * 32; points[i + 1] = (random() - .5) * 20; points[i + 2] = -7 - random() * 12; }
    return points;
  }, []);
  return <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial color="#a9bbc9" size={.018} transparent opacity={.48} sizeAttenuation depthWrite={false} /></points>;
}
export default function EarthScene(props: SceneProps) {
  return <Canvas className="earth-canvas" frameloop="demand" dpr={[1, 1.35]} camera={{ position: [0, 0, window.innerWidth < 760 ? 7.7 : 6.9], fov: 43, near: .1, far: 60 }} gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }} onCreated={({ gl }) => { gl.setClearColor(new Color('#060b13'), 0); }}><Planet {...props} /></Canvas>;
}
