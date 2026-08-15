export type ServerEnvironment = Record<string, string | undefined>

export function serverEnvironment(): ServerEnvironment {
  const runtime = globalThis as unknown as { process?: { env?: ServerEnvironment } }
  return runtime.process?.env ?? {}
}
