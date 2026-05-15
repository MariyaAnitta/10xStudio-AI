"use client"

type Props = {
  categories: {
    stars: any[]
    plowhorses: any[]
    puzzles: any[]
    duds: any[]
  }
}

export default function MenuMatrix({ categories }: Props) {

  const sections = [
    {
      title: "Stars",
      subtitle: "High Profit • High Popularity",
      items: categories?.stars || [],
      dot: "bg-green-500",
      border: "border-green-200"
    },
    {
      title: "Plowhorses",
      subtitle: "Low Profit • High Popularity",
      items: categories?.plowhorses || [],
      dot: "bg-yellow-500",
      border: "border-yellow-200"
    },
    {
      title: "Puzzles",
      subtitle: "High Profit • Low Popularity",
      items: categories?.puzzles || [],
      dot: "bg-blue-500",
      border: "border-blue-200"
    },
    {
      title: "Duds",
      subtitle: "Low Profit • Low Popularity",
      items: categories?.duds || [],
      dot: "bg-red-500",
      border: "border-red-200"
    }
  ]

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Menu Engineering Matrix
        </h2>

        <p className="text-muted-foreground mt-2">
          Categorization of menu items based on profitability and popularity.
        </p>
      </div>

      {/* Matrix Grid */}
      <div className="grid lg:grid-cols-2 gap-6">

        {sections.map((section, index) => (
          <div
            key={index}
            className={`bg-card border ${section.border} rounded-2xl p-6 shadow-sm transition-colors duration-300`}
          >

            {/* Title with indicator */}
            <div className="mb-4 flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${section.dot}`} />

              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {section.title}
                </h3>

                <p className="text-sm text-muted-foreground mt-1">
                  {section.subtitle}
                </p>
              </div>
            </div>

            {/* Items list */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scroll">

              {section.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No items available
                </p>
              ) : (
                section.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground hover:bg-accent transition"
                  >
                    {item.name}
                  </div>
                ))
              )}

            </div>

          </div>
        ))}

      </div>

    </div>
  )
}