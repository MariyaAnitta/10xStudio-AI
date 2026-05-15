"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from "recharts"

type ChartItem = {
  name: string
  value: number
}

type Props = {
  revenueChart?: ChartItem[]
  categoryDistribution?: ChartItem[]
}

const LIGHT_PIE_COLORS = [
  "#22c55e", // Stars
  "#eab308", // Plowhorses
  "#3b82f6", // Puzzles
  "#ef4444"  // Duds
]

const DARK_PIE_COLORS = [
  "#4ade80", // Stars
  "#facc15", // Plowhorses
  "#60a5fa", // Puzzles
  "#f87171"  // Duds
]

export default function RevenueCharts({
  revenueChart = [],
  categoryDistribution = []
}: Props) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const safeRevenueChart =
    revenueChart.length > 0
      ? revenueChart
      : [{ name: "No Data", value: 0 }]

  const safeCategoryDistribution =
    categoryDistribution.length > 0
      ? categoryDistribution
      : [{ name: "No Data", value: 1 }]

  const isDark = resolvedTheme === "dark"
  const gridStroke = isDark ? "#334155" : "#e2e8f0"
  const textStroke = isDark ? "#94a3b8" : "#64748b"
  const tooltipBg = isDark ? "#1e293b" : "#ffffff"
  const tooltipBorder = isDark ? "#334155" : "#e2e8f0"
  const tooltipText = isDark ? "#f8fafc" : "#0f172a"
  const pieColors = isDark ? DARK_PIE_COLORS : LIGHT_PIE_COLORS

  if (!mounted) {
    return (
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-[500px]" />
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-[500px]" />
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">

      {/* -------------------------------- */}
      {/* Revenue by Dish */}
      {/* -------------------------------- */}

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden transition-colors duration-300">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Revenue by Dish
          </h2>

          <p className="text-muted-foreground text-sm mt-1">
            Top-performing dishes by revenue contribution
          </p>
        </div>

        <div className="overflow-x-auto">
          <BarChart
            width={520}
            height={360}
            data={safeRevenueChart}
            margin={{
              top: 10,
              right: 20,
              left: 0,
              bottom: 90
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridStroke}
              vertical={false}
            />

            <XAxis
              dataKey="name"
              stroke={textStroke}
              tick={{
                fill: textStroke,
                fontSize: 12
              }}
              angle={-11}
              textAnchor="end"
              interval={0}
            />

            <YAxis
              stroke={textStroke}
              tick={{
                fill: textStroke,
                fontSize: 12
              }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: "10px",
                color: tooltipText
              }}
              labelStyle={{
                color: tooltipText,
                fontWeight: 600
              }}
            />

            <Legend
              verticalAlign="bottom"
              wrapperStyle={{
                paddingTop: "20px",
                color: textStroke
              }}
            />

            <Bar
              dataKey="value"
              name="Revenue (OMR)"
              fill="#8b5cf6"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </div>
      </div>

      {/* -------------------------------- */}
      {/* Category Distribution */}
      {/* -------------------------------- */}

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden transition-colors duration-300">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Category Distribution
          </h2>

          <p className="text-muted-foreground text-sm mt-1">
            Stars vs Plowhorses vs Puzzles vs Duds
          </p>
        </div>

        <div className="flex justify-center">
          <PieChart width={500} height={360}>
            <Pie
              data={safeCategoryDistribution}
              dataKey="value"
              nameKey="name"
              outerRadius={110}
              innerRadius={55}
              paddingAngle={3}
              label={{ fill: textStroke, fontSize: 12 }}
            >
              {safeCategoryDistribution.map((entry, index) => (
                <Cell
                  key={index}
                  fill={pieColors[index % pieColors.length]}
                />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: "10px",
                color: tooltipText
              }}
            />

            <Legend
              wrapperStyle={{
                color: textStroke,
                paddingTop: "10px"
              }}
            />
          </PieChart>
        </div>
      </div>

    </div>
  )
}