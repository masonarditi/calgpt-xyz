"use client"

import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Lock, Send, Search, AlertCircle } from "lucide-react"
import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function ChatInput({ onSend }: { onSend: (msg: string, personalized: boolean) => void }) {
  const [input, setInput] = useState("")
  const [personalized, setPersonalized] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const placeholders = [
    "What engineering classes have exactly a B average?",
    "Show me easy math classes with a high average",
    "What history classes still have open seats?",
    "Show me a dance class with open seats",
    "What is the meaning of life?",
  ]

  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const validateQuery = (query: string): boolean => {
    // Clear any existing error message
    setErrorMessage(null)
    
    // Trim the input to remove whitespace
    const trimmedQuery = query.trim()
    
    // Check if query is too short
    if (trimmedQuery.length < 3) {
      setErrorMessage("Please enter a more detailed question")
      return false
    }
    
    // Check if query is too vague
    const vaguePhrases = ["help", "classes", "search", "find", "show me", "give me"]
    if (vaguePhrases.some(phrase => trimmedQuery.toLowerCase() === phrase)) {
      setErrorMessage("Please be more specific about what you're looking for")
      return false
    }
    
    // Check if query contains some context
    const contextWords = ["class", "course", "classes", "courses", "average", "grade", "open seats", "available"]
    if (!contextWords.some(word => trimmedQuery.toLowerCase().includes(word))) {
      setErrorMessage("Please include keywords like 'class', 'course', 'grade', or 'seats'")
      return false
    }
    
    return true
  }

  const handleSend = () => {
    if (input.trim()) {
      if (validateQuery(input)) {
        onSend(input.trim(), personalized)
        setInput("")
      }
    }
  }

  return (
    <motion.div 
      className="w-full max-w-xl mx-auto bg-white rounded-full border border-slate-200 shadow-md p-1 px-2 flex flex-col"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1],
        delay: 0.2
      }}
    >
      <div className="relative w-full flex items-center">
        <div className="absolute left-3 text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholders[placeholderIndex]}
          className="pl-10 pr-12 py-6 text-base bg-transparent border-none placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full"
          style={{
            opacity: isPlaceholderVisible ? 1 : 0,
            transition: "opacity 300ms ease-in-out",
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <div className="absolute right-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              type="button"
              size="icon"
              className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition-colors duration-200 rounded-full w-10 h-10"
              disabled={!input}
              onClick={handleSend}
            >
              <Send className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>
      
      <AnimatePresence>
        {errorMessage && (
          <motion.div 
            className="flex items-center px-3 py-2 mt-1 bg-amber-50 text-amber-700 text-xs rounded-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {personalized && (
        <motion.div 
          className="flex items-center px-3 pb-2 pt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-1 text-xs text-blue-500">
            <Lock className="w-3 h-3" />
            <span>Personalized results enabled</span>
          </div>
        </motion.div>
      )}
      
      <motion.div 
        className="flex items-center justify-end px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        style={{ height: 0, overflow: 'hidden', margin: 0 }}
      >
        <div className="flex items-center gap-1 text-xs text-slate-400 cursor-pointer select-none" onClick={() => setPersonalized(!personalized)}>
          <span>{personalized ? 'Disable' : 'Enable'} personalized results</span>
          <Switch
            checked={personalized}
            onCheckedChange={setPersonalized}
            className="ml-1"
            id="personalized-switch"
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
