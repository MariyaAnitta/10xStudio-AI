"use client"

export default function OptimizationRoadmap() {

  const roadmapItems = [
    {
      title: "Reprice High-Volume Low-Margin Dishes",
      type: "Pricing Optimization",
      priority: "High",
      impact: "+4,200 OMR",
      timeline: "This Week"
    },
    {
      title: "Promote Puzzle Dishes into Stars",
      type: "Promotion Strategy",
      priority: "High",
      impact: "+3,100 OMR",
      timeline: "7–14 Days"
    },
    {
      title: "Launch Bundle Combo Offers",
      type: "Upsell Strategy",
      priority: "High",
      impact: "+2,900 OMR",
      timeline: "This Week"
    },
    {
      title: "Remove Low-Performing Duds",
      type: "Menu Simplification",
      priority: "Medium",
      impact: "+1,500 OMR",
      timeline: "2 Weeks"
    }
  ]

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Optimization Roadmap
        </h2>

        <p className="text-muted-foreground mt-2">
          Strategic execution plan to unlock projected
          profit improvement and operational efficiency.
        </p>
      </div>

      {/* Cards */}
      <div className="space-y-5">
        {roadmapItems.map((item, index) => (
          <div
            key={index}
            className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="grid lg:grid-cols-5 gap-6 items-center">

              {/* Title */}
              <div className="lg:col-span-2">
                <p className="text-sm text-muted-foreground">
                  Action Plan
                </p>

                <h3 className="text-lg font-semibold text-foreground mt-2">
                  {item.title}
                </h3>

                <p className="text-sm text-primary mt-2">
                  {item.type}
                </p>
              </div>

              {/* Priority */}
              <div>
                <p className="text-sm text-muted-foreground">
                  Priority
                </p>

                <p className={`font-semibold mt-2 ${
                  item.priority === "High"
                    ? "text-destructive"
                    : "text-yellow-500"
                }`}>
                  {item.priority}
                </p>
              </div>

              {/* Impact */}
              <div>
                <p className="text-sm text-muted-foreground">
                  Expected Gain
                </p>

                <p className="text-green-500 font-bold text-lg mt-2">
                  {item.impact}
                </p>
              </div>

              {/* Timeline */}
              <div>
                <p className="text-sm text-muted-foreground">
                  Timeline
                </p>

                <p className="text-foreground font-medium mt-2">
                  {item.timeline}
                </p>
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  )
}