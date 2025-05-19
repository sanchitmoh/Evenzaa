"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export default function MissileLaunch() {
  const [launchStage, setLaunchStage] = useState(0)
  const [dots, setDots] = useState(".")

  // Control the launch sequence
  useEffect(() => {
    if (launchStage < 3) {
      const timer = setTimeout(
        () => {
          setLaunchStage(launchStage + 1)
        },
        launchStage === 0 ? 1000 : 800,
      )
      return () => clearTimeout(timer)
    }
  }, [launchStage])

  // Animate the loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : "."))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-[500px] bg-gradient-to-b from-gray-900 to-black overflow-hidden">
      {/* Stars background */}
      <div className="absolute inset-0">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Launch pad */}
      <div className="absolute bottom-0 w-full flex justify-center">
        <div className="relative w-40 h-20 bg-gray-800 rounded-t-lg flex justify-center">
          <div className="absolute -left-10 -right-10 h-4 bottom-10 bg-gray-700"></div>

          {/* Launch tower */}
          <div className="absolute -left-16 bottom-0 w-4 h-60 bg-gray-700 flex flex-col items-center">
            <div className="w-20 h-3 bg-gray-600 absolute top-10 left-4"></div>
            <div className="w-20 h-3 bg-gray-600 absolute top-30 left-4"></div>
            <div className="w-20 h-3 bg-gray-600 absolute top-50 left-4"></div>
          </div>
        </div>
      </div>

      {/* Missile */}
      <motion.div
        className="absolute z-10 flex flex-col items-center"
        initial={{ y: 180 }}
        animate={{
          y: launchStage === 0 ? 180 : launchStage === 1 ? 170 : launchStage === 2 ? 100 : -300,
        }}
        transition={{
          duration: launchStage === 3 ? 3 : 0.5,
          ease: launchStage === 3 ? "easeIn" : "easeInOut",
        }}
      >
        {/* Missile nose */}
        <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[20px] border-l-transparent border-r-transparent border-b-gray-400"></div>

        {/* Missile body */}
        <div className="w-20 h-40 bg-gradient-to-b from-gray-300 to-gray-400 rounded-lg"></div>

        {/* Missile fins */}
        <div className="relative w-full">
          <div className="absolute -left-5 top-0 w-5 h-15 bg-gray-500 skew-y-[30deg]"></div>
          <div className="absolute -right-5 top-0 w-5 h-15 bg-gray-500 skew-y-[-30deg]"></div>
        </div>

        {/* Exhaust flames */}
        {launchStage > 0 && (
          <motion.div className="relative w-16 h-20 mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div
              className="absolute top-0 left-0 right-0 w-full h-full"
              animate={{
                height: [20, 40, 30, 50],
                width: [16, 20, 18, 22],
              }}
              transition={{
                duration: 0.3,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            >
              <div className="w-full h-full bg-gradient-to-t from-yellow-600 via-orange-500 to-red-500 rounded-b-full"></div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      {/* Smoke/clouds effect */}
      {launchStage > 0 && (
        <div className="absolute bottom-20 z-0">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-gray-300/70"
              style={{
                width: Math.random() * 40 + 20,
                height: Math.random() * 40 + 20,
                left: (Math.random() - 0.5) * 100,
              }}
              initial={{
                y: 0,
                opacity: 0,
                scale: 0.5,
              }}
              animate={{
                y: Math.random() * 100 + 50,
                x: (Math.random() - 0.5) * 100,
                opacity: [0, 0.7, 0],
                scale: [0.5, 1.5, 2],
              }}
              transition={{
                duration: Math.random() * 2 + 2,
                delay: Math.random() * 0.5,
                repeat: launchStage > 1 ? Number.POSITIVE_INFINITY : 0,
                repeatDelay: Math.random() * 1,
              }}
            />
          ))}
        </div>
      )}

      {/* Launch countdown/status */}
      <div className="absolute bottom-5 w-full text-center">
        <motion.div
          className="text-white font-mono text-xl"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
        >
          {launchStage === 0 && "PREPARING LAUNCH SEQUENCE..."}
          {launchStage === 1 && "IGNITION INITIATED..."}
          {launchStage === 2 && "LIFTOFF!"}
          {launchStage === 3 && "MISSILE DEPLOYED"}
        </motion.div>
        <motion.div
          className="text-cyan-400 font-mono mt-4 text-lg"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
        >
          Please wait, ticket is generating{dots}
        </motion.div>
      </div>
    </div>
  )
}
