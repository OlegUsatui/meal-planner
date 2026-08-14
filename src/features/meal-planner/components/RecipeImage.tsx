import { useEffect, useState } from 'react'

export function RecipeImage({ blob, url: sourceUrl, alt, className }: { blob?: Blob; url?: string; alt: string; className: string }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    const next = sourceUrl ?? (blob ? URL.createObjectURL(blob) : '')
    setUrl(next)
    return () => { if (next.startsWith('blob:')) URL.revokeObjectURL(next) }
  }, [blob, sourceUrl])
  return url ? <img src={url} alt={alt} className={className} /> : <span className={`${className} image-placeholder`} aria-hidden="true">🍲</span>
}
