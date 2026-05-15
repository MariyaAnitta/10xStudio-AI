"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { useEffect, useState } from "react"

export default function Navbar() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <div className="w-full flex justify-between items-center px-10 py-4 bg-app-bg border-b border-border sticky top-0 z-50 transition-colors duration-300">

      {/* -------------------------------- */}
      {/* Logo + Brand */}
      {/* -------------------------------- */}

      <Link
        href="/menu-engineering"
        className="flex items-center gap-3"
      >

        {/* Inline SVG Logo */}
        <div className="w-10 h-10">
          <svg
            viewBox="0 0 32 32"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="32" height="32" rx="8" fill="#8b5cf6" />
            <circle cx="16" cy="16" r="8" fill="white" fillOpacity="0.9" />
          </svg>
        </div>

        <span className="text-lg font-semibold text-foreground tracking-tight">
          10xMenu.AI
        </span>

      </Link>

      {/* -------------------------------- */}
      {/* Navigation */}
      {/* -------------------------------- */}

      <div className="flex items-center gap-8">

        <div className="flex items-center gap-8 text-sm font-medium text-muted-foreground">

          <Link
            href="/menu-engineering"
            className="cursor-pointer hover:text-primary transition"
          >
            Home
          </Link>

          <span className="cursor-pointer hover:text-primary transition">
            Features
          </span>

          <span className="cursor-pointer hover:text-primary transition">
            About
          </span>

        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-secondary hover:bg-accent transition-all duration-300 border border-border shadow-sm flex items-center justify-center min-w-[40px] min-h-[40px]"
          aria-label="Toggle Theme"
        >
          {mounted ? (
            resolvedTheme === "dark" ? (
              <Sun size={18} className="text-primary animate-in fade-in zoom-in duration-300" />
            ) : (
              <Moon size={18} className="text-primary animate-in fade-in zoom-in duration-300" />
            )
          ) : (
            <div className="w-[18px] h-[18px]" />
          )}
        </button>

      </div>

    </div>
  )
}