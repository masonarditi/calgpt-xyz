"use client"

import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Lock, Send } from "lucide-react"
import React, { useState, useEffect } from "react"
import { motion, useReducedMotion } from "framer-motion"

export default function ChatInput({ onSend }: { onSend: (msg: string, personalized: boolean) => void }) {
  const [input, setInput] = useState("")
  const [personalized, setPersonalized] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(true)
  const prefersReducedMotion = useReducedMotion()

  const placeholders = [
    "Who are the alumni working in artificial intelligence at Google?",
    "What courses should I take for a career in fintech?",
    "Which professors have research experience in quantum computing?",
    "Are there any alumni who founded successful startups?",
    "What internship opportunities exist for computer science majors?",
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setIsPlaceholderVisible(false)
      setTimeout(() => {
        setPlaceholderIndex((i) => (i + 1) % placeholders.length)
        setIsPlaceholderVisible(true)
      }, 200)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleSend = () => {
    if (input.trim()) {
      onSend(input.trim(), personalized)
      setInput("")
    }
  }

  return (
    <motion.div 
      className="w-full max-w-xl mx-auto bg-white rounded-2xl border border-slate-300 shadow-sm p-0 flex flex-col"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1],
        delay: 0.2
      }}
    >
      <div className="relative w-full flex items-center">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholders[placeholderIndex]}
          className="pl-4 pr-12 py-6 text-base bg-transparent border-none placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
          style={{
            opacity: isPlaceholderVisible ? 1 : 0,
            transition: "opacity 300ms ease-in-out",
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <div className="absolute right-2 bottom-2">
          <Button
            type="button"
            size="icon"
            className="bg-slate-200 text-slate-700 shadow-none hover:bg-slate-300 transition-colors duration-200"
            disabled={!input}
            onClick={handleSend}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
      <motion.div 
        className="flex items-center px-3 pb-3 pt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        <Switch
          checked={personalized}
          onCheckedChange={setPersonalized}
          className="mr-2"
          id="personalized-switch"
        />
        <label htmlFor="personalized-switch" className="flex items-center gap-1 text-sm text-slate-500 cursor-pointer select-none">
          Personalized <Lock className="w-3 h-3" />
        </label>
      </motion.div>
    </motion.div>
  )
}