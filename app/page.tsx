'use client'

import { useState, useEffect, useRef } from 'react'
import ChatInput from '@/components/chatbox-ui'
import { motion, AnimatePresence } from 'framer-motion'
import CourseCard, { CourseData } from '@/components/CourseCard'

type Message = { 
  from: 'user' | 'assistant'
  text: string
  courses?: CourseData[]
  timestamp: number
}

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSentFirstMessage, setHasSentFirstMessage] = useState(false)
  const [currentCourses, setCurrentCourses] = useState<CourseData[] | undefined>(undefined)
  const lastMessageTimestampRef = useRef<number>(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Update courses whenever messages change
  useEffect(() => {
    if (messages.length === 0) return;
    
    // Find the last assistant message with courses
    let newestTimestamp = lastMessageTimestampRef.current;
    let newestCourses: CourseData[] | undefined = undefined;
    
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.from === 'assistant' && message.timestamp > newestTimestamp) {
        // Update the newest timestamp even if there are no courses
        newestTimestamp = message.timestamp;
        
        // If this message has courses, keep track of them
        if (message.courses && message.courses.length > 0) {
          newestCourses = message.courses;
        } else {
          // If the newest message has no courses, clear the display
          newestCourses = undefined;
        }
        
        // We found the newest message, so we can stop looking
        break;
      }
    }
    
    // Update the ref and state
    lastMessageTimestampRef.current = newestTimestamp;
    setCurrentCourses(newestCourses);
  }, [messages]);

  const handleSend = async (msg: string, personalized: boolean) => {
    if (!hasSentFirstMessage) {
      // Start transition animation
      setIsTransitioning(true);
      
      // Wait for animation to complete before changing the state
      setTimeout(() => {
        setHasSentFirstMessage(true);
        setIsTransitioning(false);
      }, 600);
    }
    
    const timestamp = Date.now();
    setMessages((m) => [...m, { from: 'user', text: msg, timestamp }])
    setLoading(true)
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: msg })
      })
      const { answer, error } = await res.json()
      
      const responseTimestamp = Date.now();
      if (error) {
        setMessages((m) => [...m, { 
          from: 'assistant', 
          text: `Error: ${error}`,
          timestamp: responseTimestamp
        }])
      } else {
        // Try to parse the answer as JSON
        try {
          let parsedAnswer;
          try {
            parsedAnswer = JSON.parse(answer);
          } catch (e) {
            // Sometimes there might be debug logs before the JSON
            // Try to find the JSON part (starts with {"text":)
            const jsonStartIndex = answer.lastIndexOf('{"text":');
            if (jsonStartIndex >= 0) {
              parsedAnswer = JSON.parse(answer.substring(jsonStartIndex));
            } else {
              throw e; // Re-throw if we can't find valid JSON
            }
          }
          
          if (parsedAnswer && parsedAnswer.text) {
            setMessages((m) => [...m, { 
              from: 'assistant', 
              text: parsedAnswer.text,
              courses: parsedAnswer.courses && parsedAnswer.courses.length > 0 ? parsedAnswer.courses : undefined,
              timestamp: responseTimestamp
            }])
          } else {
            throw new Error('Invalid JSON structure');
          }
        } catch (e) {
          console.log('Error parsing answer as JSON:', e);
          // If not JSON, just use the raw answer
          setMessages((m) => [...m, { 
            from: 'assistant', 
            text: answer,
            timestamp: responseTimestamp
          }])
        }
      }
    } catch (e) {
      console.error('Network or parsing error:', e);
      setMessages((m) => [...m, { 
        from: 'assistant', 
        text: 'Network or processing error',
        timestamp: Date.now()
      }])
    } finally {
      setLoading(false)
    }
  }

  // Control delayed animation of chat content
  const [showChatContent, setShowChatContent] = useState(false);
  
  // When transitioning state or messages change, manage visibility of chat content
  useEffect(() => {
    if (isTransitioning) {
      setShowChatContent(false);
    } else if (hasSentFirstMessage && messages.length > 0) {
      // Delay showing chat content until the transition animation completes
      const timer = setTimeout(() => {
        setShowChatContent(true);
      }, 200); // Reduced from 300ms to 200ms for faster appearance
      
      return () => clearTimeout(timer);
    }
  }, [isTransitioning, hasSentFirstMessage, messages]);
  
  // Logo elements that will be reused to maintain consistency
  const logoTitle = (
    <>
      <span className="text-slate-800">Cal</span>
      <span className="text-blue-600">GPT</span>
    </>
  )

  const bearEmoji = (
    <motion.div 
      whileHover={{ rotate: 10 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <span>🐻</span>
    </motion.div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-blue-50 font-sans overflow-hidden">
      <AnimatePresence>
        {/* Initial centered content - Animates out on first message */}
        {!hasSentFirstMessage && !isTransitioning && (
          <motion.div 
            className="flex flex-col justify-center items-center absolute inset-0 z-10 bg-blue-50"
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
            }}
          >
            <motion.div 
              className="mb-6 mt-[-80px]"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div 
                className="flex items-center justify-center gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                layoutId="calgpt-logo"
              >
                <h1 className="text-5xl font-extrabold tracking-tight">{logoTitle}</h1>
                <span className="text-4xl">{bearEmoji}</span>
              </motion.div>
              
              <motion.p 
                className="text-xl text-slate-600 text-center mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                Schedule your classes better with AI
              </motion.p>
            </motion.div>
            
            {/* Chat input for initial screen */}
            <div className="w-full max-w-xl px-4">
              <motion.div layoutId="chat-input">
                <ChatInput onSend={handleSend} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Fixed Chat Input at the top - Animates in after first message */}
      <motion.div 
        className="sticky top-0 z-20 bg-blue-50 pt-4 pb-2 px-4 md:pt-6 mt-2 md:mt-0"
        initial={!hasSentFirstMessage && !isTransitioning ? { opacity: 0 } : { opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-xl mx-auto">
          {/* Small CalGPT logo - only visible after first message */}
          {(hasSentFirstMessage || isTransitioning) && (
            <motion.div 
              className="flex items-center justify-center gap-1 mb-2"
              layoutId="calgpt-logo"
            >
              <h3 className="text-lg font-bold tracking-tight">{logoTitle}</h3>
              <span className="text-lg">{bearEmoji}</span>
            </motion.div>
          )}
          
          {/* Chat input for transitioned state */}
          {(hasSentFirstMessage || isTransitioning) && (
            <motion.div layoutId="chat-input">
              <ChatInput onSend={handleSend} />
            </motion.div>
          )}
        </div>
      </motion.div>
      
      {/* Main Content Area */}
      <div className="flex-1 p-4 pb-28 pt-4">
        <div className="max-w-xl mx-auto flex flex-col gap-4">
          {/* Chat Messages */}
          <AnimatePresence>
            {(messages.length > 0) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ 
                  opacity: showChatContent ? 1 : 0, 
                  height: showChatContent ? 'auto' : 0,
                  transition: {
                    opacity: { duration: 0.3, delay: 0.05 },
                    height: { duration: 0.4 }
                  }
                }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden bg-white rounded-3xl shadow-md border-0"
              >
                <div className="h-auto max-h-96 overflow-auto p-4">
                  {messages.map((m, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: showChatContent ? 1 : 0, 
                        y: showChatContent ? 0 : 20 
                      }}
                      transition={{ 
                        duration: 0.25, 
                        delay: showChatContent ? 0.1 + i * 0.08 : 0 
                      }}
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
                      animate={{ opacity: showChatContent ? 1 : 0 }}
                      transition={{ duration: 0.25 }}
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

          {/* Course Cards Section */}
          <AnimatePresence mode="wait">
            {currentCourses && currentCourses.length > 0 && showChatContent ? (
              <motion.div 
                key="course-cards"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ 
                  duration: 0.4, 
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.15 // Reduced from 0.2 to 0.15
                }}
                className="w-full bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm p-3"
              >
                <h3 className="text-xs text-blue-600 font-medium px-2 mb-2">Related Courses</h3>
                <div className="space-y-1 px-1">
                  {currentCourses.map((course, idx) => (
                    <CourseCard key={`${course.id}-${idx}`} course={course} />
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
