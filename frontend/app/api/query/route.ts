import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(request: Request) {
  const { question } = await request.json()
  console.log(`[API] Received question: ${question}`)

  // Path is correct but we need to fix the Python executable
  const scriptPath = '/app/query.py'
  console.log(`[API] Executing Python script at: ${scriptPath}`)

  // Use the correct Python path on Heroku
  const pythonPath = process.env.NODE_ENV === 'production' 
    ? '/app/.heroku/python/bin/python' // Heroku Python path
    : 'python' // Local Python command

  console.log(`[API] Using Python executable: ${pythonPath}`)

  return new Promise<NextResponse>((resolve) => {
    const py = spawn(pythonPath, [scriptPath], {
      cwd: process.cwd(),
      env: { ...process.env },
    })

    let out = ''
    let err = ''

    py.stdout.on('data', (d) => (out += d.toString()))
    py.stderr.on('data', (d) => (err += d.toString()))

    py.on('close', (code) => {
      if (code !== 0) {
        console.log(`[API] Error from Python: ${err.trim()}`)
        resolve(
          NextResponse.json({ error: err.trim() }, { status: 500 })
        )
      } else {
        console.log(`[API] Sending response: ${out.trim()}`)
        resolve(NextResponse.json({ answer: out.trim() }))
      }
    })

    py.stdin.write(question + '\n')
    py.stdin.end()
  })
}
