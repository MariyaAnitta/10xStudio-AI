"use client"

import dynamic from "next/dynamic"
import KPISection from "./KPISection"
import MenuMatrix from "./MenuMatrix"
import AIInsightsPanel from "./AIInsightsPanel"

const RevenueCharts = dynamic(
  () => import("./RevenueCharts"),
  {
    ssr: false
  }
)

type Props = {
  dashboardData: any
}

export default function MenuEngineeringDashboard({
  dashboardData
}: Props) {
  /*
    Real backend-driven dashboard
    No hardcoded mock values
    No UI downgrade
  */

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

  const aiInsights = dashboardData?.ai_insights || {
    executive_summary: "",
    pricing_recommendations: [],
    promotion_opportunities: [],
    removal_recommendations: [],
    bundle_opportunities: []
  }

  return (
    <div className="space-y-10">

      {/* -------------------------------- */}
      {/* Hero Section */}
      {/* -------------------------------- */}

      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-sm font-medium">
          📊 Executive Dashboard
        </div>

        <h1 className="text-5xl font-bold leading-tight text-white">
          Menu Engineering Intelligence Center
        </h1>

        <p className="text-gray-400 text-xl max-w-4xl leading-relaxed">
          Analyze profitability, identify revenue opportunities,
          optimize pricing strategy, and take action using
          AI-powered restaurant intelligence.
        </p>
      </div>

      {/* -------------------------------- */}
      {/* KPI Cards */}
      {/* -------------------------------- */}

      <KPISection summary={summary} />

      {/* -------------------------------- */}
      {/* Menu Matrix */}
      {/* -------------------------------- */}

      <MenuMatrix categories={categories} />

      {/* -------------------------------- */}
      {/* Revenue Charts */}
      {/* -------------------------------- */}

      <RevenueCharts
        revenueChart={revenueChart}
        categoryDistribution={categoryDistribution}
      />

      {/* -------------------------------- */}
      {/* AI Executive Insights */}
      {/* -------------------------------- */}

      <AIInsightsPanel insights={aiInsights} />

    </div>
  )
}