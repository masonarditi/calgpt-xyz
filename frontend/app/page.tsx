'use client'

import { useState, useRef } from 'react'
import ChatInput from '@/components/chatbox-ui'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

type Message = { from: 'user' | 'assistant'; text: string }

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSentFirstMessage, setHasSentFirstMessage] = useState(false)

  const handleSend = async (msg: string, personalized: boolean) => {
    if (!hasSentFirstMessage) {
      setHasSentFirstMessage(true)
    }
    
    setMessages((m) => [...m, { from: 'user', text: msg }])
    setLoading(true)
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: msg })
      })
      const { answer, error } = await res.json()
      setMessages((m) => [...m, { from: 'assistant', text: error ? `Error: ${error}` : answer }])
    } catch {
      setMessages((m) => [...m, { from: 'assistant', text: 'Network error' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50 p-4 font-sans">
      {!hasSentFirstMessage && (
        <motion.div 
          className="text-center mb-16 space-y-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.7, 
            ease: [0.22, 1, 0.36, 1],
            staggerChildren: 0.1
          }}
        >
          <motion.div 
            className="flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-5xl font-extrabold text-slate-800 tracking-tight">Cal<span className="text-blue-600">GPT</span></h1>
            <motion.div 
              whileHover={{ rotate: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <span className="text-4xl">🐻</span>
            </motion.div>
          </motion.div>
          
          <motion.p 
            className="text-xl text-slate-600 max-w-md font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Schedule your classes better with AI
          </motion.p>
        </motion.div>
      )}
      
      <div className={`w-full max-w-xl flex flex-col gap-6 ${hasSentFirstMessage ? '' : 'mt-0'}`}>
        <AnimatePresence>
          {(hasSentFirstMessage || messages.length > 0) && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden bg-white rounded-3xl shadow-md"
            >
              <div className="h-64 overflow-auto p-4">
                {messages.map((m, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                    className={`${m.from === 'user' ? 'text-right' : 'text-left'} mb-2`}
                  >
                    <span className={`${m.from === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'} inline-block p-3 rounded-2xl ${m.from === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
                      {m.text}
                    </span>
                  </motion.div>
                ))}
                {loading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-left mb-2"
                  >
                    <span className="bg-gray-100 inline-block p-3 rounded-2xl rounded-tl-sm">
                      <span className="inline-flex space-x-1">
                        <span className="h-2 w-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="h-2 w-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="h-2 w-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </span>
                    </span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.div
          layout
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={`${!hasSentFirstMessage ? 'filter drop-shadow-xl' : ''}`}
        >
          <ChatInput onSend={handleSend} />
        </motion.div>
      </div>
    </div>
  )
}
