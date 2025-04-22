'use client'

import { useState } from 'react'
import ChatInput from '@/components/chatbox-ui'
import { motion, AnimatePresence } from 'framer-motion'

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
    <div className="container mx-auto flex items-center justify-center min-h-screen">
      <div className="w-full max-w-xl flex flex-col gap-6">
        <AnimatePresence>
          {(hasSentFirstMessage || messages.length > 0) && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden bg-white rounded-lg shadow"
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
                    <span className={`${m.from === 'user' ? 'bg-blue-100' : 'bg-gray-100'} inline-block p-2 rounded-lg`}>
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
                    <span className="bg-gray-100 inline-block p-2 rounded-lg">
                      <span className="inline-block w-12 h-4 bg-gray-200 animate-pulse rounded"></span>
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
        >
          <ChatInput onSend={handleSend} />
        </motion.div>
      </div>
    </div>
  )
}
