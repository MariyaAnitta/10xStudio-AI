"use client"

type LoadingScreenProps = {
  title?: string
  subtitle?: string
}

export default function LoadingScreen({
  title = "Processing your request...",
  subtitle = "Please wait while we prepare your results"
}: LoadingScreenProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 transition-colors duration-300">

      <div className="relative z-10 w-full max-w-2xl text-center">

        {/* Progress Bar Shell */}
        <div className="w-full h-20 rounded-full bg-primary flex items-center justify-center shadow-lg">

          {/* Spinner */}
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />

        </div>

        {/* Main Title */}
        <h2 className="mt-10 text-3xl font-bold text-foreground">
          {title}
        </h2>

        {/* Subtitle */}
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          {subtitle}
        </p>

        {/* Premium Footer */}
        <div className="mt-8 text-primary font-medium">
          ✨ Processing your preferences
        </div>
      </div>
    </div>
  )
}