"use client"

type Props = {
  insights?: {
    executive_summary?: string
    pricing_recommendations?: string[]
    promotion_opportunities?: string[]
    removal_recommendations?: string[]
    bundle_opportunities?: string[]
  }
}

export default function AIInsightsPanel({ insights }: Props) {

  const Section = ({
    title,
    items,
    icon,
    color
  }: {
    title: string
    items?: string[]
    icon: string
    color: string
  }) => {

    if (!items || items.length === 0) return null

    return (
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm transition-colors duration-300">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-xl">
            {icon}
          </div>

          <h3 className={`text-lg font-semibold ${color}`}>
            {title}
          </h3>
        </div>

        {/* Items */}
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-muted/30 border border-border rounded-xl p-4 text-sm text-foreground leading-relaxed"
            >
              • {item}
            </div>
          ))}
        </div>

      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* ================================= */}
      {/* EXECUTIVE BRIEF (TOP SECTION) */}
      {/* ================================= */}

      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm transition-colors duration-300">

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl text-primary">
            🤖
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Executive Intelligence Brief
            </h2>

            <p className="text-sm text-muted-foreground">
              AI-powered executive decision summary
            </p>
          </div>
        </div>

        {/* Summary Box */}
        <div className="bg-muted/30 border border-border rounded-xl p-5 mt-4 text-foreground leading-relaxed">
          {insights?.executive_summary || "No insights available"}
        </div>

        {/* Quick Highlights */}
        <div className="grid md:grid-cols-3 gap-4 mt-6">

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Immediate Action</p>
            <p className="font-semibold text-foreground mt-1">
              Reprice low-margin dishes
            </p>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Top Opportunity</p>
            <p className="font-semibold text-foreground mt-1">
              Convert Puzzles to Stars
            </p>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Revenue Unlock</p>
            <p className="font-bold text-primary text-lg mt-1">
              +12,500 OMR
            </p>
          </div>

        </div>
      </div>

      {/* ================================= */}
      {/* MAIN INSIGHT SECTIONS */}
      {/* ================================= */}

      <div className="grid md:grid-cols-2 gap-6">

        <Section
          title="Pricing Recommendations"
          items={insights?.pricing_recommendations}
          icon="💰"
          color="text-blue-600"
        />

        <Section
          title="Promotion Opportunities"
          items={insights?.promotion_opportunities}
          icon="📈"
          color="text-green-600"
        />

        <Section
          title="Removal Recommendations"
          items={insights?.removal_recommendations}
          icon="⚠️"
          color="text-red-600"
        />

        <Section
          title="Bundle Opportunities"
          items={insights?.bundle_opportunities}
          icon="🧩"
          color="text-purple-600"
        />

      </div>

    </div>
  )
}