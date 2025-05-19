"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Sphere, Box } from "@react-three/drei"
import * as THREE from "three"

export default function ThreeDScene() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.1
    }
  })

  return (
    <group ref={groupRef}>
      {/* Generate a smaller grid of spheres for better performance */}
      {Array.from({ length: 5 }).map((_, i) =>
        Array.from({ length: 5 }).map((_, j) => (
          <Sphere
            key={`${i}-${j}`}
            args={[0.05, 16, 16]}
            position={[
              (i - 2) * 2 + Math.sin(i * 0.5) * 0.5,
              (j - 2) * 2 + Math.cos(j * 0.5) * 0.5,
              Math.sin(i * j * 0.1) * 2,
            ]}
          >
            <meshStandardMaterial
              color={new THREE.Color().setHSL((i + j) * 0.02, 0.8, 0.5)}
              emissive={new THREE.Color().setHSL((i + j) * 0.02, 0.8, 0.2)}
              emissiveIntensity={0.5}
            />
          </Sphere>
        )),
      )}

      {/* Add fewer floating boxes for better performance */}
      {Array.from({ length: 10 }).map((_, i) => (
        <Box
          key={`box-${i}`}
          args={[0.2, 0.2, 0.2]}
          position={[Math.sin(i * 0.5) * 8, Math.cos(i * 0.3) * 8, Math.sin(i * 0.7) * 8]}
          rotation={[i * 0.5, i * 0.3, 0]}
        >
          <meshStandardMaterial color={new THREE.Color().setHSL(i * 0.05, 0.8, 0.5)} transparent opacity={0.7} />
        </Box>
      ))}
    </group>
  )
}
