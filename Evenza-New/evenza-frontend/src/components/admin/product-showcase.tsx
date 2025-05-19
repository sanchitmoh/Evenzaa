"use client"

import React, { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { PerspectiveCamera, Box, Sphere, Torus, OrbitControls } from "@react-three/drei"
import * as THREE from "three"

function ProductScene() {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.2
    }
  })

  return (
    <group ref={groupRef}>
      {/* Central product */}
      <group position={[0, 0, 0]}>
        <Box args={[2, 0.2, 2]} position={[0, -0.5, 0]}>
          <meshStandardMaterial color="#27272a" /> {/* Base plate */}
        </Box>
        
        <Torus args={[0.8, 0.2, 16, 32]} position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial 
            color="#8b5cf6" 
            metalness={0.7} 
            roughness={0.2} 
            emissive="#8b5cf6" 
            emissiveIntensity={0.2}
          />
        </Torus>
        
        <Sphere args={[0.4, 32, 32]} position={[0, 0.2, 0]}>
          <meshStandardMaterial 
            color="#d8b4fe" 
            metalness={0.8} 
            roughness={0.1}
            emissive="#d8b4fe"
            emissiveIntensity={0.3}
          />
        </Sphere>
      </group>
      
      {/* Orbiting items */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i * Math.PI) / 2
        const radius = 2.5
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        
        return (
          <group key={i} position={[x, 0, z]}>
            <Box args={[0.5, 0.5, 0.5]} position={[0, 0, 0]} rotation={[Math.PI/4, Math.PI/4, 0]}>
              <meshStandardMaterial 
                color="#a78bfa" 
                metalness={0.6} 
                roughness={0.3}
                emissive="#a78bfa"
                emissiveIntensity={0.2} 
              />
            </Box>
          </group>
        )
      })}
      
      {/* Floor grid */}
      <gridHelper args={[20, 20, "#6d28d9", "#3f3f46"]} position={[0, -1, 0]} />
    </group>
  )
}

export default function ProductShowcase() {
  return (
    <div className="h-full w-full">
      <Canvas>
        <color attach="background" args={["#1c1c1f"]} />
        <fog attach="fog" args={["#1c1c1f", 5, 15]} />
        <ambientLight intensity={0.4} />
        <spotLight position={[5, 5, 5]} angle={0.3} penumbra={1} intensity={1} castShadow />
        <ProductScene />
        <OrbitControls 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 2} 
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.5}
        />
        <PerspectiveCamera makeDefault position={[0, 2, 5]} />
      </Canvas>
    </div>
  )
}
