import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

import AnimatedBackground from "./components/AnimatedBackground"
import NeoChatbot from "./components/NeoChatbot"
import { ThemeProvider } from "./components/ThemeProvider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "10xMenu.AI",
  description: "AI-powered restaurant intelligence platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="relative min-h-screen overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {/* GLOBAL BACKGROUND */}
          <div className="fixed inset-0 z-0">
            <AnimatedBackground />
          </div>

          {/* MAIN CONTENT */}
          <div className="relative z-10">
            {children}
          </div>

          {/* CHATBOT */}
          <NeoChatbot />
        </ThemeProvider>
      </body>
    </html>
  )
}