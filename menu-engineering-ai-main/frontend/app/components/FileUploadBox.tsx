"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import LoadingScreen from "./LoadingScreen"

export default function FileUploadBox() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")

  const loadingSteps = [
    "Uploading performance file...",
    "Calculating profitability metrics...",
    "Classifying dishes into Stars / Plowhorses / Puzzles / Duds...",
    "Running menu engineering analysis...",
    "Generating AI executive recommendations...",
    "Finalizing executive dashboard..."
  ]

  const [currentStep, setCurrentStep] = useState(0)

  const handleFileSelect = (file: File | null) => {
    if (!file) return

    const allowedExtensions = [".xlsx", ".xls", ".csv"]
    const fileName = file.name.toLowerCase()

    const isValid = allowedExtensions.some((ext) =>
      fileName.endsWith(ext)
    )

    if (!isValid) {
      setError("Please upload Excel or CSV files only.")
      return
    }

    setError("")
    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first.")
      return
    }

    setError("")
    setIsUploading(true)
    setCurrentStep(0)

    let stepIndex = 0

    const progressInterval = setInterval(() => {
      stepIndex++
      if (stepIndex < loadingSteps.length) {
        setCurrentStep(stepIndex)
      }
    }, 1800)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch(
        "http://127.0.0.1:8000/analyze-menu-engineering",
        {
          method: "POST",
          body: formData
        }
      )

      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error("Backend processing failed")
      }

      const result = await response.json()

      localStorage.setItem(
        "menuEngineeringDashboard",
        JSON.stringify(result)
      )

      setCurrentStep(loadingSteps.length - 1)

      setTimeout(() => {
        router.push("/menu-engineering/dashboard")
      }, 700)
    } catch (err) {
      clearInterval(progressInterval)

      console.error(err)

      setError(
        "Failed to analyze menu performance. Please try again."
      )

      setIsUploading(false)
    }
  }

  if (isUploading) {
    return (
      <LoadingScreen
        title="Generating Executive Menu Intelligence..."
        subtitle={loadingSteps[currentStep]}
      />
    )
  }

  return (
    <div className="w-full max-w-xl">

      <div className="rounded-3xl border border-border bg-card shadow-sm p-8 transition-colors duration-300">

        {/* Upload Zone */}
        <div
          className={`
            relative
            rounded-3xl
            border
            border-dashed
            transition-all
            duration-300
            p-10
            text-center
            ${
              dragActive
                ? "border-primary bg-primary/10"
                : "border-border bg-muted/30"
            }
          `}
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => {
            setDragActive(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            setDragActive(false)

            const file = e.dataTransfer.files?.[0]
            handleFileSelect(file)
          }}
        >
          <div className="space-y-5">

            <div className="text-6xl text-muted-foreground">
              ↑
            </div>

            <div>
              <h3 className="text-2xl font-bold text-foreground">
                Drop your file here
              </h3>

              <p className="text-muted-foreground text-base mt-2">
                or click to browse
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 flex-wrap">

              <div className="px-5 py-3 rounded-xl bg-muted border border-border text-foreground font-medium">
                .xlsx
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 rounded-xl bg-secondary hover:bg-accent border border-border text-foreground font-semibold transition"
              >
                Browse File
              </button>
            </div>

            {selectedFile && (
              <div className="pt-4">
                <p className="text-primary font-medium">
                  Selected: {selectedFile.name}
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) =>
                handleFileSelect(
                  e.target.files?.[0] || null
                )
              }
            />
          </div>
        </div>

        {/* Analyze Button (UNCHANGED logic, but use semantic color if possible, keep orange for branding?) */}
        <button
          onClick={handleUpload}
          className="w-full mt-8 bg-[#ff6a00] hover:bg-[#ff7a1a] transition-all duration-300 text-white font-bold text-xl py-5 rounded-2xl shadow-lg"
        >
          Analyze Menu Performance
        </button>

        {/* Supported Formats */}
        <div className="mt-8 rounded-2xl border border-border bg-muted/50 p-6">
          <h4 className="text-foreground font-semibold text-lg mb-3">
            Supported Formats
          </h4>

          <p className="text-muted-foreground">
            • .xlsx (Excel)
            <br />
            • .xls
            <br />
            • .csv
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/10 px-5 py-4">
            <p className="text-destructive text-sm">
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}