import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(request: Request) {
  const { question } = await request.json()
  console.log(`[API] Received question: ${question}`)

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
        console.log(`[API] Python output: ${out.trim()}`)
        resolve(NextResponse.json({ answer: out.trim() }))
      }
    })

    py.stdin.write(question + '\n')
    py.stdin.end()
  })
}
