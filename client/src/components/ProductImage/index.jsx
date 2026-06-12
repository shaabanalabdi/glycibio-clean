import { useState } from "react"
import { resolveImageUrl } from "@utils/imageUrl"
import { buildSrcset, SRCSET_PRESETS } from "@utils/imageSrcset"

// Wrapper <img> responsive avec :
//   - srcset / sizes (preset card / gallery / thumb / cartItem)
//   - fallback gracieux si l'image 404 (rend `fallback` ou null)
//   - les attributs width/height pour reserver la place (no CLS)
export const ProductImage = ({
    url,
    alt,
    preset = "card",
    fallback = null,
    width,
    height,
    ...rest
}) => {
    const [broken, setBroken] = useState(false)

    if (!url || broken) return fallback

    const config = SRCSET_PRESETS[preset] || SRCSET_PRESETS.card
    const srcset = buildSrcset(url, config)

    return (
        <img
            src={resolveImageUrl(url)}
            srcSet={srcset || undefined}
            sizes={srcset ? config.sizes : undefined}
            alt={alt}
            width={width}
            height={height}
            onError={() => setBroken(true)}
            {...rest}
        />
    )
}
