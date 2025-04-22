import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(request: Request) {
  const { question } = await request.json()
  console.log(`[API] Received question: ${question}`)

  // Resolve the Python script one level up from your frontend directory
  const scriptPath = path.resolve(process.cwd(), '..', 'query.py')
  console.log(`[API] Executing Python script at: ${scriptPath}`)

  return new Promise<NextResponse>((resolve) => {
    const py = spawn('python', [scriptPath], {
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
