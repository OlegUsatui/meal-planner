import { useEffect, useState } from 'react'
import { MediaPlaceholder } from '../../../shared/ui/MediaPlaceholder'
import { FoodIllustration } from '../../../shared/ui/FoodIllustration'

export function RecipeImage({ blob, url: sourceUrl, alt, className }: { blob?: Blob; url?: string; alt: string; className: string }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    const next = sourceUrl ?? (blob ? URL.createObjectURL(blob) : '')
    setUrl(next)
    return () => { if (next.startsWith('blob:')) URL.revokeObjectURL(next) }
  }, [blob, sourceUrl])
  return <MediaPlaceholder src={url} alt={alt} className={`${className} recipe-media-4x3`} fallback={<FoodIllustration variant="meal" />} />
}
