"use client"

import React, { useRef, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Sphere, OrbitControls } from "@react-three/drei"
import * as THREE from "three"

function Particles() {
  const particlesRef = useRef<THREE.Points>(null)
  
  useFrame(({ clock }) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.x = clock.getElapsedTime() * 0.05
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.075
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={1000}
          array={new Float32Array(
            Array.from({ length: 3000 }, () => (Math.random() - 0.5) * 20)
          )}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        sizeAttenuation
        color="#8b5cf6"
        transparent
        opacity={0.8}
      />
    </points>
  )
}

function AnimatedSpheres() {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.1
    }
  })

  return (
    <group ref={groupRef}>
      <Sphere position={[-4, -2, -10]} args={[1, 16, 16]}>
        <meshStandardMaterial
          color="#8b5cf6"
          wireframe
          emissive="#8b5cf6"
          emissiveIntensity={0.3}
        />
      </Sphere>
      <Sphere position={[5, 2, -5]} args={[0.7, 16, 16]}>
        <meshStandardMaterial
          color="#7c3aed"
          wireframe
          emissive="#7c3aed"
          emissiveIntensity={0.5}
        />
      </Sphere>
      <Sphere position={[2, -3, -7]} args={[0.5, 16, 16]}>
        <meshStandardMaterial
          color="#6d28d9"
          wireframe
          emissive="#6d28d9"
          emissiveIntensity={0.5}
        />
      </Sphere>
    </group>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Particles />
      <AnimatedSpheres />
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        enableRotate={false} 
        autoRotate 
        autoRotateSpeed={0.5}
      />
    </>
  )
}

export default function ThreeDBackground() {
  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [0, 0, 10] }}>
        <color attach="background" args={["#09090b"]} />
        <fog attach="fog" args={["#09090b", 5, 20]} />
        <Scene />
      </Canvas>
    </div>
  )
} 