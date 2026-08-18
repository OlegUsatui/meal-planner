import { useEffect, useState } from 'react'
import { Soup } from 'lucide-react'
import { MediaPlaceholder } from '../../../shared/ui/MediaPlaceholder'

export function RecipeImage({ blob, url: sourceUrl, alt, className }: { blob?: Blob; url?: string; alt: string; className: string }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    const next = sourceUrl ?? (blob ? URL.createObjectURL(blob) : '')
    setUrl(next)
    return () => { if (next.startsWith('blob:')) URL.revokeObjectURL(next) }
  }, [blob, sourceUrl])
  return <MediaPlaceholder src={url} alt={alt} className={className} fallback={<Soup aria-hidden="true" />} />
}
