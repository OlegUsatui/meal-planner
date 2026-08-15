import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { spawn } from 'node:child_process'

if (existsSync('.env.local')) loadEnvFile('.env.local')

const command = process.platform === 'win32' ? 'vercel.cmd' : 'vercel'
const port = process.env.MEAL_PLANNER_PORT ?? '3000'
const args = ['dev', '--listen', port, '--yes']
if (process.env.VERCEL_TOKEN) args.push('--token', process.env.VERCEL_TOKEN)
const child = spawn(command, args, {
  env: process.env,
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  process.exit(code ?? 1)
})
