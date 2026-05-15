"use client"

interface Props {
  dishes: string[]
  selected: string[]
  toggleDish: (dish: string) => void
  generateMenu: () => void
}

export default function DishSelector({
  dishes,
  selected,
  toggleDish,
  generateMenu
}: Props) {

  function unselectAll() {
    selected.forEach(dish => toggleDish(dish))
  }

  return (

    <div className="relative z-10 max-w-6xl mx-auto mt-20 px-6 text-foreground transition-colors duration-300">

      {/* Title */}
      <div className="text-center mb-10">

        <h1 className="text-4xl font-bold text-foreground">
          Select Your Dishes
        </h1>

        <p className="text-muted-foreground mt-2">
          Choose up to 10 dishes for your final menu
        </p>

      </div>


      {/* Dish Grid */}
      <div className="grid grid-cols-4 gap-6">

        {dishes.map((dish) => {

          const isSelected = selected.includes(dish)

          return (

            <div
              key={dish}
              onClick={() => toggleDish(dish)}
              className={`
                flex items-center gap-3
                border rounded-xl px-4 py-4 cursor-pointer
                transition hover:shadow-md

                ${isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card"}
              `}
            >

              <input
                type="checkbox"
                checked={isSelected}
                readOnly
                className="accent-primary"
              />

              <span className="text-foreground font-medium">
                {dish}
              </span>

            </div>

          )

        })}

      </div>


      {/* Bottom Buttons */}
      <div className="flex justify-center gap-6 mt-12">

        <button
          onClick={unselectAll}
          className="border border-border px-6 py-2 rounded-lg hover:bg-muted transition text-muted-foreground"
        >
          Unselect All
        </button>


        <button
          onClick={generateMenu}
          disabled={selected.length !== 10}
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-lg shadow disabled:opacity-40 transition"
        >
          Confirm Selection
        </button>

      </div>

    </div>

  )

}