"use client"

type Props = {
  summary?: {
    total_revenue?: number
    total_profit?: number
    gross_margin_percent?: number
    food_cost_percent?: number
    best_performing_dish?: string
    worst_performing_dish?: string
    revenue_opportunity_score?: number
    ai_health_score?: number
  }
}

export default function KPISection({ summary }: Props) {

  const formatValue = (
    value: number | string | undefined,
    suffix = ""
  ) => {
    if (value === undefined || value === null) {
      return `0${suffix}`
    }

    if (typeof value === "number") {
      return `${value.toLocaleString()}${suffix}`
    }

    return `${value}${suffix}`
  }

  const getScoreColor = (score?: number) => {
    if (!score) return "text-gray-400"

    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"

    return "text-red-600"
  }

  const getScoreLabel = (score?: number) => {
    if (!score) return "Not Available"

    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"

    return "Needs Attention"
  }

  const cards = [
    {
      title: "Total Revenue",
      value: formatValue(summary?.total_revenue, " OMR"),
      subtitle: "Overall sales generated",
      icon: "💰"
    },
    {
      title: "Total Profit",
      value: formatValue(summary?.total_profit, " OMR"),
      subtitle: "Net profitability",
      icon: "📈"
    },
    {
      title: "Gross Margin",
      value: formatValue(summary?.gross_margin_percent, "%"),
      subtitle: "Profitability ratio",
      icon: "📊"
    },
    {
      title: "Food Cost %",
      value: formatValue(summary?.food_cost_percent, "%"),
      subtitle: "Cost efficiency",
      icon: "🍽️"
    },
    {
      title: "Best Performing Dish",
      value: summary?.best_performing_dish || "N/A",
      subtitle: "Highest profit item",
      icon: "⭐"
    },
    {
      title: "Worst Performing Dish",
      value: summary?.worst_performing_dish || "N/A",
      subtitle: "Lowest profit item",
      icon: "⚠️"
    },
    {
      title: "Revenue Opportunity",
      value: formatValue(
        summary?.revenue_opportunity_score,
        "/100"
      ),
      subtitle: "Growth potential",
      icon: "🚀",
      highlight: getScoreColor(
        summary?.revenue_opportunity_score
      )
    },
    {
      title: "Restaurant Health Score",
      value: formatValue(
        summary?.ai_health_score,
        "/100"
      ),
      subtitle: "Executive performance index",
      icon: "🤖",
      highlight: getScoreColor(
        summary?.ai_health_score
      ),
      score: summary?.ai_health_score
    }
  ]

  return (
    <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">

              <p className="text-muted-foreground text-sm font-medium">
                {card.title}
              </p>

              <h3
                className={`text-2xl font-bold mt-3 leading-tight ${
                  card.highlight || "text-foreground"
                }`}
              >
                {card.value}
              </h3>

              <p className="text-muted-foreground text-sm mt-4">
                {card.subtitle}
              </p>

              {card.score && (
                <div className="mt-4">

                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${card.score}%`
                      }}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    {getScoreLabel(card.score)}
                  </p>
                </div>
              )}

            </div>

            <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl shrink-0">
              {card.icon}
            </div>

          </div>
        </div>
      ))}
    </div>
  )
}