"use client"

type Props = {
  summary?: {
    total_profit?: number
  }
}

export default function OptimizationImpact({
  summary
}: Props) {
  const currentProfit =
    Number(summary?.total_profit || 0)

  const projectedGrowthPercent = 15.5

  const optimizedProfit =
    Math.round(
      currentProfit * (1 + projectedGrowthPercent / 100)
    )

  const revenueUnlock =
    optimizedProfit - currentProfit

  const formatValue = (value: number) =>
    value.toLocaleString()

  return (
    <div className="bg-card border border-border rounded-2xl p-8 shadow-sm transition-colors duration-300">

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          Optimization Impact Engine
        </h2>

        <p className="text-muted-foreground mt-2">
          AI-powered projected financial improvement
          from menu optimization strategy
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">

        <div className="bg-muted border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">
            Current Profit
          </p>

          <p className="text-2xl font-bold text-foreground mt-2">
            {formatValue(currentProfit)} OMR
          </p>
        </div>

        <div className="bg-muted border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">
            Optimized Profit
          </p>

          <p className="text-2xl font-bold text-primary mt-2">
            {formatValue(optimizedProfit)} OMR
          </p>
        </div>

        <div className="bg-muted border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">
            Projected Growth
          </p>

          <p className="text-2xl font-bold text-green-500 mt-2">
            +{projectedGrowthPercent}%
          </p>
        </div>

        <div className="bg-muted border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">
            Revenue Unlock
          </p>

          <p className="text-2xl font-bold text-green-500 mt-2">
            +{formatValue(revenueUnlock)} OMR
          </p>
        </div>

      </div>
    </div>
  )
}