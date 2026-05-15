"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import Navbar from "../../components/Navbar"
import AnimatedBackground from "../../components/AnimatedBackground"
import DashboardShell from "../../components/DashboardShell"

export default function DashboardPage() {
  const router = useRouter()

  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      /*
        Read saved backend response from localStorage
        Must match FileUploadBox.tsx exactly
      */

      const savedData = localStorage.getItem(
        "menuEngineeringDashboard"
      )

      /*
        If no data found → redirect back to upload page
      */

      if (!savedData) {
        console.log(
          "No dashboard data found → redirecting to upload page"
        )

        router.push("/menu-engineering")
        return
      }

      const parsedData = JSON.parse(savedData)

      console.log(
        "Loaded Real Dashboard Data:",
        parsedData
      )

      /*
        Basic validation
        Prevent broken UI / undefined crashes
      */

      if (
        !parsedData ||
        !parsedData.summary ||
        !parsedData.categories
      ) {
        console.log(
          "Invalid dashboard data → redirecting"
        )

        router.push("/menu-engineering")
        return
      }

      setDashboardData(parsedData)
    } catch (error) {
      console.error(
        "Dashboard load error:",
        error
      )

      router.push("/menu-engineering")
    } finally {
      setLoading(false)
    }
  }, [router])

  /*
    Premium loading state
    No UI downgrade
  */

  if (loading) {
    return (
      <div className="min-h-screen relative bg-[#020617] text-white">
        <AnimatedBackground />
        <Navbar />

        <div className="relative z-10 flex items-center justify-center min-h-[80vh] px-6">
          <div className="bg-[#0f172a]/80 backdrop-blur-md border border-[#1e293b] rounded-2xl p-10 shadow-xl w-full max-w-xl text-center">

            <div className="text-5xl mb-4">
              📊
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">
              Loading Executive Dashboard
            </h2>

            <p className="text-gray-400 text-base">
              Preparing your menu engineering intelligence...
            </p>

          </div>
        </div>
      </div>
    )
  }

  /*
    Final safety fallback
  */

  if (!dashboardData) {
    return null
  }

  return (
    <div className="min-h-screen relative bg-[#020617] text-white">
      <AnimatedBackground />
      <Navbar />

      <div className="relative z-10">
        <DashboardShell
          dashboardData={dashboardData}
        />
      </div>
    </div>
  )
}