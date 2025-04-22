// app/page.tsx
'use client'

import { useState } from 'react'
import {
  ChatInput,
  ChatInputTextArea,
  ChatInputSubmit,
} from '@/components/ui/chat-input'

type Message = { from: 'user' | 'assistant'; text: string }

export default function HomePage() {
  const [value, setValue] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!value.trim()) return
    console.log(`[Frontend] Sending question: ${value}`)
    setMessages((prev) => [...prev, { from: 'user', text: value }])
    setLoading(true)

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: value }),
      })
      const { answer, error } = await res.json()
      const responseText = error ? `Error: ${error}` : answer
      console.log(`[Frontend] Received response: ${responseText}`)
      setMessages((prev) => [
        ...prev,
        { from: 'assistant', text: responseText },
      ])
    } catch (e) {
      console.log(`[Frontend] Network error: ${e}`)
      setMessages((prev) => [
        ...prev,
        { from: 'assistant', text: 'Network error' },
      ])
    } finally {
      setLoading(false)
      setValue('')
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md mb-4 h-64 overflow-auto bg-white rounded-lg p-2 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`p-2 rounded ${
                m.from === 'user' ? 'bg-blue-100' : 'bg-gray-100'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <ChatInput
        variant="default"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onSubmit={handleSubmit}
        loading={loading}
        onStop={() => setLoading(false)}
      >
        <ChatInputTextArea placeholder="Ask about courses..." />
        <ChatInputSubmit />
      </ChatInput>
    </div>
  )
}
