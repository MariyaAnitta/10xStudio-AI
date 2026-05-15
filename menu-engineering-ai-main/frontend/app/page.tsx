"use client"

import { useState, useEffect } from "react"

import Navbar from "./components/Navbar"
import MenuForm from "./components/MenuForm"
import LoadingScreen from "./components/LoadingScreen"
import DishSelector from "./components/DishSelector"
import Toast from "./components/Toast"
import AnimatedBackground from "./components/AnimatedBackground"

import MenuGenerating from "./components/MenuGenerating"
import MenuEditor from "./components/MenuEditor"

export default function Home() {

  const [page, setPage] = useState<
    "form" | "loading" | "select" | "generating" | "menu"
  >("form")

  const [form, setForm] = useState({
    restaurantName: "",
    details: "",
    cuisine: ""
  })

  const [dishes, setDishes] = useState<string[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [menu, setMenu] = useState<any[]>([])

  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [showToast])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setPage("loading")

    try {
      const res = await fetch("http://127.0.0.1:8000/suggest-dishes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json()
      setDishes(data.dishes)
      setPage("select")
    } catch (err) {
      console.error("Fetch error in handleSubmit:", err);
      alert("Failed to connect to backend at http://localhost:8000. Please ensure the backend is running.");
      setPage("form");
    }
  }

  function toggleDish(dish: string) {

    if (selected.includes(dish)) {
      setSelected(selected.filter(d => d !== dish))
    } else {
      if (selected.length < 10) {
        setSelected([...selected, dish])
      }

      if (selected.length === 9) {
        setShowToast(true)
      }
    }
  }

  async function generateMenu() {

    if (selected.length !== 10) return

    setPage("generating")

    try {
      const res = await fetch("http://127.0.0.1:8000/generate-menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dishes: selected
        })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`HTTP error! status: ${res.status}, message: ${JSON.stringify(errorData)}`);
      }

      const data = await res.json()

      setMenu(data.menu)
      setPage("menu")
    } catch (err) {
      console.error("Fetch error in generateMenu:", err);
      alert("Failed to generate menu. Check console for details.");
      setPage("select");
    }
  }

  return (

    <div className="min-h-screen bg-app-bg text-foreground transition-colors duration-300">

      <Navbar />

      {/* FORM PAGE */}

      {page === "form" && (

        <div className="relative z-10 flex justify-center gap-20 mt-24 px-6">

          <MenuForm
            form={form}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
          />

          <div className="max-w-xl flex flex-col">

            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm w-fit border border-primary/20">
              ✨ AI Powered
            </span>

            <h1 className="text-5xl font-bold mt-6 leading-tight text-foreground">
              Generate Your Personalized Restaurant Menu⚡
            </h1>

            <p className="text-muted-foreground mt-6 text-lg">
              Enter your restaurant preferences and our AI will suggest dishes
              tailored to your cuisine type, dietary requirements, and unique style.
            </p>

            <div className="flex flex-col gap-6 mt-10">

              {/* CARD 1 */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex gap-4 items-start transition-colors duration-300">

                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary text-xl">
                  ✨
                </div>

                <div>
                  <h3 className="font-semibold text-lg text-foreground">
                    AI-Powered Recommendations
                  </h3>

                  <p className="text-muted-foreground text-sm mt-1">
                    Leveraging the 10xDS AI engine to analyze cuisines and preferences
                    for hyper-personalized dish suggestions.
                  </p>
                </div>

              </div>

              {/* CARD 2 */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex gap-4 items-start transition-colors duration-300">

                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary text-xl">
                  👨‍🍳
                </div>

                <div>
                  <h3 className="font-semibold text-lg text-foreground">
                    10x Menu Creation
                  </h3>

                  <p className="text-muted-foreground text-sm mt-1">
                    Select from 20 recommendations to build your perfect 10-dish menu.
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>

      )}

      {page === "loading" && <LoadingScreen />}

      {page === "select" && (
        <DishSelector
          dishes={dishes}
          selected={selected}
          toggleDish={toggleDish}
          generateMenu={generateMenu}
        />
      )}

      {page === "generating" && <MenuGenerating />}

      {page === "menu" && <MenuEditor menu={menu} />}

      {showToast && <Toast />}

    </div>
  )
}