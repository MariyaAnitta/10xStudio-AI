"use client"

import { useState, useMemo, useEffect } from "react"
import VisualModal from "./VisualModal"

type DishRow = {
  dish_name?: string
  number_sold?: number
  revenue?: number
  profit?: number
  profit_margin?: number
  category?: string
}

type Props = {
  rows?: DishRow[]
  setActiveTab?: (tab: string) => void
  setInitialVideoPrompt?: (prompt: string) => void
}

export default function DishLevelTable({ rows = [], setActiveTab, setInitialVideoPrompt }: Props) {
  const [selectedDish, setSelectedDish] = useState<DishRow | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const safeRows =
    rows.length > 0
      ? rows
      : [
          {
            dish_name: "No Data Available",
            number_sold: 0,
            revenue: 0,
            profit: 0,
            profit_margin: 0,
            category: "-"
          }
        ]

  // Calculate averages for the visual intelligence layer
  const [auditStatuses, setAuditStatuses] = useState<Record<string, any>>({})

  // Fetch audit status for all dishes on mount
  useEffect(() => {
    const fetchStatuses = async () => {
      const newStatuses: Record<string, any> = {}
      for (const row of safeRows) {
        if (!row.dish_name || row.dish_name === "No Data Available") continue
        try {
          const res = await fetch(`http://127.0.0.1:8000/get-dish-audit/${encodeURIComponent(row.dish_name)}`)
          const data = await res.json()
          if (data.status !== "not_found" && !data.error) {
            newStatuses[row.dish_name] = data
          }
        } catch (err) {
          console.error(`Error fetching status for ${row.dish_name}:`, err)
        }
      }
      setAuditStatuses(newStatuses)
    }

    if (safeRows.length > 0 && safeRows[0].dish_name !== "No Data Available") {
      fetchStatuses()
    }
  }, [safeRows])

  const { avgOrders, avgViews } = useMemo(() => {
    if (safeRows.length === 0) return { avgOrders: 0, avgViews: 0 }
    const totalOrders = safeRows.reduce((acc, row) => acc + (row.number_sold || 0), 0)
    const avg = totalOrders / safeRows.length
    return {
      avgOrders: avg,
      avgViews: avg * 1.5 // Proxy for views
    }
  }, [safeRows])

  const formatValue = (
    value?: number,
    suffix = ""
  ) => {
    if (value === undefined || value === null) {
      return `0${suffix}`
    }
    return `${value.toLocaleString()}${suffix}`
  }

  const getCategoryStyle = (category?: string) => {
    switch (category) {
      case "Star":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "Puzzle":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "Plowhorse":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "Dud":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const handleDishClick = (row: DishRow) => {
    if (row.dish_name === "No Data Available") return
    setSelectedDish(row)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Modal */}
      {selectedDish && (
        <VisualModal 
          dish={selectedDish}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          avgOrders={avgOrders}
          avgViews={avgViews}
          setActiveTab={setActiveTab}
          setInitialVideoPrompt={setInitialVideoPrompt}
        />
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Dish-Level Performance Table
        </h2>
        <p className="text-muted-foreground mt-2">
          Detailed profitability and sales analysis for each menu item. Click a dish to run Visual Intelligence.
        </p>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-4 text-foreground font-semibold">Dish Name</th>
                <th className="text-left px-6 py-4 text-foreground font-semibold">Number Sold</th>
                <th className="text-left px-6 py-4 text-foreground font-semibold">Revenue (OMR)</th>
                <th className="text-left px-6 py-4 text-foreground font-semibold">Profit (OMR)</th>
                <th className="text-left px-6 py-4 text-foreground font-semibold">Profit Margin %</th>
                <th className="text-left px-6 py-4 text-foreground font-semibold">Category</th>
                <th className="text-left px-6 py-4 text-foreground font-semibold">Visual Audit</th>
              </tr>
            </thead>
            <tbody>
              {safeRows.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-border hover:bg-muted/30 transition group"
                >
                  <td 
                    className="px-6 py-4 text-foreground font-medium cursor-pointer hover:text-primary transition-colors flex items-center gap-2"
                    onClick={() => handleDishClick(row)}
                  >
                    {row.dish_name}
                    <span className="opacity-0 group-hover:opacity-100 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-tighter transition-opacity">
                      Analyze
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{formatValue(row.number_sold)}</td>
                  <td className="px-6 py-4 text-muted-foreground">{formatValue(row.revenue)}</td>
                  <td className="px-6 py-4 text-muted-foreground">{formatValue(row.profit)}</td>
                  <td className="px-6 py-4 text-muted-foreground">{formatValue(row.profit_margin, "%")}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs border font-medium ${getCategoryStyle(row.category)}`}>
                      {row.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {row.dish_name && auditStatuses[row.dish_name] ? (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-bold text-green-500">
                          Score: {auditStatuses[row.dish_name].audit_results?.ai_visual_score?.overall_score || "8"}/10
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Not Audited
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}