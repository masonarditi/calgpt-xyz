import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import { existsSync } from 'fs'

export async function POST(request: Request) {
  const { question } = await request.json()
  console.log(`[API] Received question: ${question}`)

  const scriptPath = '/app/query.py'
  console.log(`[API] Executing Python script at: ${scriptPath}`)

  // Try multiple possible Python paths
  const possiblePythonPaths = [
    'python3',
    'python',
    '/usr/bin/python3',
    '/usr/bin/python',
    '/usr/local/bin/python3',
    '/usr/local/bin/python'
  ]

  // Log the environment for debugging
  console.log(`[API] Environment PATH: ${process.env.PATH}`)
  
  return new Promise<NextResponse>((resolve) => {
    // Choose the first Python path
    const pythonPath = possiblePythonPaths[0]
    console.log(`[API] Trying Python executable: ${pythonPath}`)
    
    try {
      const py = spawn(pythonPath, [scriptPath], {
        cwd: process.cwd(),
        env: { ...process.env },
      })

      let out = ''
      let err = ''

      py.stdout.on('data', (d) => (out += d.toString()))
      py.stderr.on('data', (d) => (err += d.toString()))

      py.on('error', (error) => {
        console.log(`[API] Spawn error: ${error.message}`)
        resolve(NextResponse.json({ error: `Python execution error: ${error.message}` }, { status: 500 }))
      })

      py.on('close', (code) => {
        if (code !== 0) {
          console.log(`[API] Error from Python: ${err.trim()}`)
          resolve(NextResponse.json({ error: err.trim() }, { status: 500 }))
        } else {
          console.log(`[API] Sending response: ${out.trim()}`)
          resolve(NextResponse.json({ answer: out.trim() }))
        }
      })

      py.stdin.write(question + '\n')
      py.stdin.end()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.log(`[API] Try/catch error: ${errorMessage}`);
      resolve(NextResponse.json({ error: `Failed to execute Python: ${errorMessage}` }, { status: 500 }));
    }
  })
}
