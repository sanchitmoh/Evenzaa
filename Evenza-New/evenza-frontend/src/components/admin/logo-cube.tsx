"use client"

import React, { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Box } from "@react-three/drei"
import * as THREE from "three"

function Cube() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(clock.getElapsedTime()) * 0.4
      meshRef.current.rotation.y = Math.cos(clock.getElapsedTime() * 0.7) * 0.8
    }
  })

  return (
    <Box ref={meshRef} args={[1, 1, 1]}>
      <meshStandardMaterial
        color="#7c3aed"
        emissive="#7c3aed"
        emissiveIntensity={0.5}
        metalness={0.8}
        roughness={0.2}
      />
    </Box>
  )
}

export default function LogoCube() {
  return (
    <Canvas
      camera={{ position: [0, 0, 3] }}
      style={{ background: "transparent" }}
      className="w-full h-full"
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Cube />
    </Canvas>
  )
}
