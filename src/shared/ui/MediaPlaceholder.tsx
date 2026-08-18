import { useEffect, useState, type ImgHTMLAttributes, type ReactNode } from 'react'

type MediaPlaceholderProps = {
  src?: string
  alt: string
  fallback?: ReactNode
  fallbackLabel?: string
  className?: string
} & Pick<ImgHTMLAttributes<HTMLImageElement>, 'loading' | 'decoding'>

export function MediaPlaceholder({ src, alt, fallback, fallbackLabel, className = '', loading, decoding }: MediaPlaceholderProps) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  if (src && !failed) return <img src={src} alt={alt} className={className} loading={loading} decoding={decoding} onError={() => setFailed(true)} />
  return <span className={`${className} image-placeholder`.trim()} role={fallbackLabel ? 'img' : undefined} aria-label={fallbackLabel} aria-hidden={fallbackLabel ? undefined : 'true'}>{fallback}</span>
}
