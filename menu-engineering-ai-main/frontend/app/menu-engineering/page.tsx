"use client"

import Navbar from "../components/Navbar"
import AnimatedBackground from "../components/AnimatedBackground"
import FileUploadBox from "../components/FileUploadBox"

export default function MenuEngineeringPage() {
  return (
    <div className="min-h-screen bg-app-bg text-foreground transition-colors duration-300">
      
      <Navbar />

      <div className="relative z-10 px-6 py-16 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* -------------------------------- */}
          {/* Left Side Content */}
          {/* -------------------------------- */}

          <div className="flex flex-col">

            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm w-fit border border-primary/20">
              📊 Menu Engineering AI
            </span>

            <h1 className="text-5xl font-bold mt-6 leading-tight text-foreground">
              Upload Your Menu Performance Data
            </h1>

            <p className="text-muted-foreground mt-6 text-lg leading-relaxed">
              Upload your restaurant sales data in Excel or CSV format and let
              our analytics engine calculate profitability, classify dishes,
              and generate AI-powered recommendations for revenue growth.
            </p>

            <div className="flex flex-col gap-6 mt-10">

              {/* Card 1 */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex gap-4 items-start transition-colors duration-300">

                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary text-xl">
                  📈
                </div>

                <div>
                  <h3 className="font-semibold text-lg text-foreground">
                    Dish-Level Performance Analysis
                  </h3>

                  <p className="text-muted-foreground text-sm mt-1">
                    Calculate revenue, profit, contribution margin, and menu
                    mix percentage for every menu item.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex gap-4 items-start transition-colors duration-300">

                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary text-xl">
                  ⭐
                </div>

                <div>
                  <h3 className="font-semibold text-lg text-foreground">
                    Menu Engineering Classification
                  </h3>

                  <p className="text-muted-foreground text-sm mt-1">
                    Automatically classify dishes into Stars, Plowhorses,
                    Puzzles, and Duds with executive recommendations.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* -------------------------------- */}
          {/* Right Side Upload Box */}
          {/* -------------------------------- */}

          <FileUploadBox />

        </div>
      </div>
    </div>
  )
}