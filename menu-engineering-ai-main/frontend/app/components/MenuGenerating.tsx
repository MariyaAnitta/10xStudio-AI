export default function MenuGenerating() {

  return (

    <div className="relative z-10 flex flex-col items-center justify-center mt-20 transition-colors duration-300 min-h-[50vh]">

      {/* Loader */}
      <div className="w-80 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg">

        <div className="animate-spin w-8 h-8 border-4 border-white/30 border-t-white rounded-full"></div>

      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold mt-8 text-foreground">
        Creating your personalized menu...
      </h2>

      {/* Description */}
      <p className="text-muted-foreground mt-2 text-center max-w-md">
        Your personalized menu will be created within minutes. Stay tuned.
      </p>

      {/* Highlight */}
      <p className="text-primary mt-4 text-sm font-medium">
        ✨ Generating dish prices and images
      </p>

    </div>

  )

}