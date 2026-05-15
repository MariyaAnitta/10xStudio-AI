"use client"

import { useState } from "react"
import dynamic from "next/dynamic"

import KPISection from "./KPISection"
import MenuMatrix from "./MenuMatrix"
import AIInsightsPanel from "./AIInsightsPanel"
import DishLevelTable from "./DishLevelTable"
import VideoStudio from "./VideoStudio"
import DashboardSidebar from "./DashboardSidebar"
import OptimizationImpact from "./OptimizationImpact"
import OptimizationRoadmap from "./OptimizationRoadmap"

const RevenueCharts = dynamic(
  () => import("./RevenueCharts"),
  { ssr: false }
)

type Props = {
  dashboardData: any
}

export default function DashboardShell({
  dashboardData
}: Props) {

  const [activeTab, setActiveTab] = useState("dashboard")
  const [initialVideoPrompt, setInitialVideoPrompt] = useState("")

  const summary = dashboardData?.summary || {}

  const categories = dashboardData?.categories || {
    stars: [],
    plowhorses: [],
    puzzles: [],
    duds: []
  }

  const revenueChart = dashboardData?.revenue_chart || []

  const categoryDistribution =
    dashboardData?.category_distribution || []

  const aiInsights =
    dashboardData?.ai_insights || {
      executive_summary: "",
      pricing_recommendations: [],
      promotion_opportunities: [],
      removal_recommendations: [],
      bundle_opportunities: []
    }

  const dishTable =
    dashboardData?.dish_level_data || []

  const renderContent = () => {
    switch (activeTab) {

      case "dashboard":
        return (
          <div className="space-y-10">

            {/* Hero Section */}
            <div className="space-y-5">

              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-primary/20 bg-primary/10 text-primary text-sm font-medium">
                📊 Executive Dashboard
              </div>

              <h1 className="text-4xl font-bold leading-tight text-foreground">
                Menu Engineering Intelligence Center
              </h1>

              <p className="text-muted-foreground text-lg max-w-3xl leading-relaxed">
                Analyze profitability, identify revenue opportunities,
                optimize pricing strategy, and take action using
                AI-powered restaurant intelligence.
              </p>
            </div>

            {/* KPI + Optimization */}
            <div className="space-y-8">
              <KPISection summary={summary} />

              <OptimizationImpact
                summary={summary}
              />
            </div>

          </div>
        )

      case "roadmap":
        return <OptimizationRoadmap />

      case "matrix":
        return <MenuMatrix categories={categories} />

      case "charts":
        return (
          <RevenueCharts
            revenueChart={revenueChart}
            categoryDistribution={categoryDistribution}
          />
        )

      case "insights":
        return <AIInsightsPanel insights={aiInsights} />

      case "table":
        return (
          <DishLevelTable 
            rows={dishTable} 
            setActiveTab={setActiveTab} 
            setInitialVideoPrompt={setInitialVideoPrompt}
          />
        )

      case "video-studio":
        return <VideoStudio initialPrompt={initialVideoPrompt} />

      default:
        return (
          <div className="space-y-8">
            <KPISection summary={summary} />

            <OptimizationImpact summary={summary} />
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-app-bg text-foreground transition-colors duration-300">

      <div className="flex">

        {/* Sidebar */}
        <div className="sticky top-0 h-screen shrink-0">
          <DashboardSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 px-10 py-10 overflow-x-hidden overflow-y-auto">
          {renderContent()}
        </div>

      </div>

    </div>
  )
}