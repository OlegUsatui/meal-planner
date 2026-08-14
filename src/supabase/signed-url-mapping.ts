export interface SignedUrlResult {
  path: string | null
  signedUrl: string | null
  error?: string | null
}

export function mapSignedUrls(paths: string[], results: SignedUrlResult[] | null | undefined): Map<string, string> {
  const mapped = new Map<string, string>()
  for (const result of results ?? []) {
    if (result.path && result.signedUrl && !result.error) mapped.set(result.path, result.signedUrl)
  }
  for (const path of paths) {
    if (!mapped.has(path)) mapped.set(path, '')
  }
  return mapped
}
