import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

/* ── Rotating wireframe icosahedron "city globe" ── */
function CityGlobe() {
  const meshRef = useRef();
  const geo = useMemo(() => new THREE.IcosahedronGeometry(2.2, 3), []);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.12;
      meshRef.current.rotation.x += delta * 0.04;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geo}>
      <meshBasicMaterial
        color="#4f46e5"
        wireframe
        opacity={0.25}
        transparent
      />
    </mesh>
  );
}

/* ── Inner glowing sphere ─────────────────────── */
function GlowSphere() {
  const meshRef = useRef();
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y -= 0.008;
      const s = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.04;
      meshRef.current.scale.setScalar(s);
    }
  });
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.8, 32, 32]} />
      <meshBasicMaterial color="#06b6d4" wireframe opacity={0.08} transparent />
    </mesh>
  );
}

/* ── Star field particles ─────────────────────── */
function StarField({ count = 2000 }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      arr[i] = (Math.random() - 0.5) * 40;
    }
    return arr;
  }, [count]);

  const pointsRef = useRef();
  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.015;
      pointsRef.current.rotation.x += delta * 0.005;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#818cf8"
        size={0.04}
        sizeAttenuation
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

/* ── Orbit rings ──────────────────────────────── */
function OrbitRing({ radius, speed, color, tilt = 0 }) {
  const ref = useRef();
  const geo = useMemo(() => new THREE.TorusGeometry(radius, 0.008, 8, 80), [radius]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * speed;
  });

  return (
    <mesh ref={ref} geometry={geo} rotation={[tilt, 0, 0]}>
      <meshBasicMaterial color={color} opacity={0.3} transparent />
    </mesh>
  );
}

/* ── Main exported Scene ──────────────────────── */
export default function Scene3D({ className = '' }) {
  return (
    <div className={`canvas-overlay ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.5} />
        <StarField />
        <CityGlobe />
        <GlowSphere />
        <OrbitRing radius={3.2} speed={0.15} color="#4f46e5" tilt={0.4} />
        <OrbitRing radius={3.8} speed={-0.08} color="#06b6d4" tilt={1.1} />
        <OrbitRing radius={4.5} speed={0.05} color="#7c3aed" tilt={0.8} />
      </Canvas>
    </div>
  );
}
