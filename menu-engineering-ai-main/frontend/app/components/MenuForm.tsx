type Props = { 
  form: any
  handleChange: any
  handleSubmit: any
}

export default function MenuForm({ form, handleChange, handleSubmit }: Props) {

  return (

    <div className="bg-card p-8 rounded-xl border border-border shadow-sm max-w-[520px] w-full transition-colors duration-300">

      <h2 className="font-semibold text-lg mb-2 text-foreground">
        Create Your Menu
      </h2>

      <p className="text-muted-foreground text-sm mb-6">
        Enter your restaurant details to generate personalized dish recommendations
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Restaurant Name */}
        <div>
          <label className="text-sm font-medium text-foreground">
            Restaurant Name
          </label>

          <input
            name="restaurantName"
            onChange={handleChange}
            className="w-full mt-1 p-2.5 rounded-md bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Cuisine */}
        <div>
          <label className="text-sm font-medium text-foreground">
            Cuisine Type
          </label>

          <select
            name="cuisine"
            onChange={handleChange}
            className="w-full mt-1 p-2.5 rounded-md bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option className="bg-card">Select cuisine type</option>
            <option className="bg-card">Indian Cuisine</option>
            <option className="bg-card">Italian Cuisine</option>
            <option className="bg-card">Emirati Cuisine</option>
            <option className="bg-card">Indo-Chinese</option>
          </select>
        </div>

        {/* Preferences */}
        <div>
          <label className="text-sm font-medium text-foreground">
            Additional Preferences
          </label>

          <input
            name="details"
            onChange={handleChange}
            placeholder="e.g. Vegetarian options"
            className="w-full mt-1 p-2.5 rounded-md bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Button */}
        <button className="mt-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-medium hover:opacity-90 transition shadow-sm">
          ✨ Generate Menu
        </button>

      </form>

    </div>

  )

}