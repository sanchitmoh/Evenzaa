"use client"

import { Canvas } from "@react-three/fiber"
import { Environment } from "@react-three/drei"
import { useEffect, useState } from "react"
import ThreeDScene from "./three-d-scene"

export default function ThreeDBackground() {
  const [mounted, setMounted] = useState(false)

  // Only render the Canvas on the client side after component is mounted
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) {
    return <div className="w-full h-full bg-zinc-900"></div>
  }

  return (
    <Canvas>
      <ThreeDScene />
      <Environment preset="city" />
    </Canvas>
  )
}
