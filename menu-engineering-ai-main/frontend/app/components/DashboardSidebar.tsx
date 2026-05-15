"use client"

type Props = {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const tabs = [
  {
    id: "dashboard",
    label: "Executive Dashboard",
    icon: "📊"
  },
  {
    id: "roadmap",
    label: "Optimization Roadmap",
    icon: "🚀"
  },
  {
    id: "matrix",
    label: "Menu Matrix",
    icon: "⭐"
  },
  {
    id: "charts",
    label: "Revenue Analytics",
    icon: "📈"
  },
  {
    id: "insights",
    label: "AI Insights",
    icon: "🤖"
  },
  {
    id: "table",
    label: "Dish-Level Table",
    icon: "📋"
  },
  {
    id: "video-studio",
    label: "Video Ad Studio",
    icon: "🎬"
  }
]

export default function DashboardSidebar({
  activeTab,
  setActiveTab
}: Props) {
  return (
    <div className="w-72 h-screen bg-card border-r border-border p-6 sticky top-0 shrink-0 transition-colors duration-300">

      {/* Header */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-foreground leading-tight">
          Menu Engineering AI
        </h2>

        <p className="text-muted-foreground text-sm mt-2">
          Executive Control Center
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="space-y-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full text-left px-4 py-4 rounded-xl border transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-primary/10 border-primary/30 text-primary shadow-sm"
                : "bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl shrink-0">
                {tab.icon}
              </span>

              <span className="font-medium leading-relaxed">
                {tab.label}
              </span>
            </div>
          </button>
        ))}
      </div>

    </div>
  )
}