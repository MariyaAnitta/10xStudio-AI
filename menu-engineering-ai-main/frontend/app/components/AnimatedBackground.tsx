"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const particles: Particle[] = []

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2)

        // Slightly stronger for visibility on light bg
        ctx.fillStyle = "rgba(139, 92, 246, 0.65)"
        ctx.fill()
      })

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)

            // Subtle but visible
            ctx.strokeStyle = "rgba(139, 92, 246, 0.15)"
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }

      requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">

      {/* Keep background consistent with your app */}
      <div className="absolute inset-0 bg-app-bg transition-colors duration-300" />

      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 opacity-90"
      />

      {/* Floating Triangle */}
      <motion.div
        className="absolute opacity-90"
        style={{
          width: 0,
          height: 0,
          borderLeft: "40px solid transparent",
          borderRight: "40px solid transparent",
          borderBottom: "70px solid rgba(139,92,246,0.35)",
          left: "65%",
          top: "25%"
        }}
        animate={{
          y: [0, 40, 0],
          rotate: [0, 20, 0]
        }}
        transition={{
          duration: 14,
          repeat: Infinity
        }}
      />

      {/* Floating Square */}
      <motion.div
        className="absolute w-16 h-16 bg-purple-500 opacity-70 rounded-lg"
        style={{ left: "20%", top: "70%" }}
        animate={{
          y: [0, -40, 0],
          rotate: [0, 90, 0]
        }}
        transition={{
          duration: 12,
          repeat: Infinity
        }}
      />

    </div>
  )
}