import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(request: Request) {
  const { question, chatHistory } = await request.json()
  console.log(`[API] Received question: ${question}`)
  console.log(`[API] Chat history length: ${chatHistory?.length || 0}`)

  // We're already in the project root, so just grab query.py here
  const scriptPath = path.join(process.cwd(), 'query.py')
  console.log(`[API] Executing Python script at: ${scriptPath}`)

  return new Promise<NextResponse>((resolve) => {
    const py = spawn('python', [scriptPath], {
      cwd: process.cwd(),
      env: process.env,
    })

    let out = ''
    let err = ''

    py.stdout.on('data', (d) => (out += d.toString()))
    py.stderr.on('data', (d) => (err += d.toString()))

    py.on('close', (code) => {
      if (code !== 0) {
        console.error(`[API] Python error: ${err.trim()}`)
        resolve(NextResponse.json({ error: err.trim() }, { status: 500 }))
      } else {
        const output = out.trim()
        console.log(`[API] Python output: ${output.substring(0, 200)}${output.length > 200 ? '...' : ''}`)
        
        // Try to determine if the output is JSON
        try {
          // Check if the output has a JSON structure (ignoring debug logs)
          const jsonStartIndex = output.lastIndexOf('{"text":')
          if (jsonStartIndex >= 0) {
            const jsonOutput = output.substring(jsonStartIndex)
            JSON.parse(jsonOutput) // Validate JSON
            console.log(`[API] Detected and parsed JSON output`)
            resolve(NextResponse.json({ answer: jsonOutput }))
          } else {
            console.log(`[API] Output is not JSON, returning as plain text`)
            resolve(NextResponse.json({ answer: output }))
          }
        } catch (e) {
          console.log(`[API] Error parsing JSON: ${e}. Returning plain text`)
          resolve(NextResponse.json({ answer: output }))
        }
      }
    })

    // Send question and chat history to Python script in JSON format
    const inputData = JSON.stringify({
      question,
      chatHistory: chatHistory || []
    })
    py.stdin.write(inputData + '\n')
    py.stdin.end()
  })
}
