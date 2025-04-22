'use client'

import { useState } from 'react'
import ChatInput from '@/components/chat-input'

type Message = { from: 'user' | 'assistant'; text: string }

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  const handleSend = async (msg: string, personalized: boolean) => {
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
        <div className="h-64 overflow-auto bg-white p-4 rounded-lg shadow">
          {messages.map((m, i) => (
            <div key={i} className={`${m.from === 'user' ? 'text-right' : 'text-left'} mb-2`}>
              <span className={`${m.from === 'user' ? 'bg-blue-100' : 'bg-gray-100'} inline-block p-2 rounded-lg`}> {m.text} </span>
            </div>
          ))}
        </div>
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  )
}
