"use client"

import { useState, useRef, useEffect } from "react"

type Message = {
  role: "user" | "bot"
  text: string
}

export default function NeoChatbot() {

  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Have doubts about your menu? Ask Neo."
    }
  ])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])


  async function sendMessage() {

    if (!input.trim()) return

    const userMessage: Message = {
      role: "user",
      text: input
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {

      const res = await fetch("http://127.0.0.1:8000/ask-rag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: userMessage.text
        })
      })

      const data = await res.json()

      const botMessage: Message = {
        role: "bot",
        text: data.answer
      }

      setMessages(prev => [...prev, botMessage])

    } catch (error) {

      const errorMessage: Message = {
        role: "bot",
        text: "Error contacting AI assistant."
      }

      setMessages(prev => [...prev, errorMessage])
    }

    setLoading(false)
  }


  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      sendMessage()
    }
  }


  return (
    <>

      {/* Floating Ask Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 z-50 hover:opacity-90"
        >
          💬 Ask Me
        </button>
      )}


      {/* Chat Window */}
      {open && (

        <div className="fixed bottom-6 right-6 w-[95vw] sm:w-[380px] h-[520px] bg-card rounded-2xl shadow-2xl flex flex-col border border-border z-50 transition-all duration-300">

          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 flex justify-between items-center rounded-t-2xl">

            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <span className="font-semibold">Neo AI Assistant</span>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="text-white text-lg hover:rotate-90 transition-transform duration-300"
            >
              ✕
            </button>

          </div>


          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">

            {messages.map((msg, i) => (

              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >

                <div
                  className={`max-w-[75%] px-4 py-2 rounded-xl text-sm shadow-sm ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  <div className="whitespace-pre-line">
                    {msg.text}
                  </div>
                </div>

              </div>

            ))}


            {/* Typing animation */}
            {loading && (

              <div className="flex justify-start">

                <div className="bg-card border border-border px-4 py-2 rounded-xl flex gap-1 shadow-sm">

                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>

                </div>

              </div>

            )}

            <div ref={messagesEndRef}></div>

          </div>


          {/* Input */}
          <div className="border-t border-border p-3 flex gap-2 bg-card rounded-b-2xl">

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your menu..."
              className="flex-1 bg-muted/50 border border-border text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-muted-foreground"
            />

            <button
              onClick={sendMessage}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 rounded-lg hover:opacity-90 transition-opacity"
            >
              ➤
            </button>

          </div>

        </div>

      )}

    </>
  )
}