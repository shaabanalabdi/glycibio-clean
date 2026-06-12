import { useId, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { resolveImageUrl } from "@utils/imageUrl.js"
import { buildSrcset, SRCSET_PRESETS } from "@utils/imageSrcset.js"

// Carousel simple : pas de dependance externe.
// images = [{ url, alt? }] - la 1ere doit etre l'image principale.
//
// Accessibilite :
//   - role="tablist" + role="tab" sur les vignettes
//   - role="tabpanel" + aria-labelledby sur l'image principale
//   - aria-selected sur la vignette active
//   - Navigation au clavier (ArrowLeft / ArrowRight / Home / End)
//   - Swipe tactile (seuil 50px) sur l'image principale
export const ProductGallery = ({ images, productName }) => {
    const baseId = useId()
    const [active, setActive] = useState(0)
    const [brokenIdx, setBrokenIdx] = useState(() => new Set())
    const touchStartX = useRef(null)
    const total = images.length

    if (total === 0) {
        return <div className="product-page__placeholder">Image indisponible</div>
    }

    const markBroken = (idx) => setBrokenIdx((prev) => {
        if (prev.has(idx)) return prev
        const next = new Set(prev)
        next.add(idx)
        return next
    })

    const goTo = (idx) => setActive(((idx % total) + total) % total)
    const go = (delta) => goTo(active + delta)

    const handleKey = (e) => {
        if (total <= 1) return
        if (e.key === "ArrowLeft") { e.preventDefault(); go(-1) }
        else if (e.key === "ArrowRight") { e.preventDefault(); go(1) }
        else if (e.key === "Home") { e.preventDefault(); goTo(0) }
        else if (e.key === "End") { e.preventDefault(); goTo(total - 1) }
    }

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX
    }
    const handleTouchEnd = (e) => {
        if (touchStartX.current === null || total <= 1) return
        const dx = e.changedTouches[0].clientX - touchStartX.current
        touchStartX.current = null
        if (Math.abs(dx) < 50) return       // seuil anti-tap
        go(dx < 0 ? 1 : -1)
    }

    const current = images[active]
    const mainBroken = brokenIdx.has(active)
    const panelId = `${baseId}-panel`
    const tabId = (idx) => `${baseId}-tab-${idx}`

    return (
        <div
            className="product-gallery"
            onKeyDown={handleKey}
        >
            <div
                className="product-gallery__main"
                role="tabpanel"
                id={panelId}
                aria-labelledby={tabId(active)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {mainBroken ? (
                    <div className="product-page__placeholder">Image indisponible</div>
                ) : (
                    <img
                        src={resolveImageUrl(current.url)}
                        srcSet={buildSrcset(current.url, SRCSET_PRESETS.gallery) || undefined}
                        sizes={SRCSET_PRESETS.gallery.sizes}
                        alt={current.alt || productName}
                        width="1280"
                        height="1280"
                        loading={active === 0 ? "eager" : "lazy"}
                        fetchPriority={active === 0 ? "high" : undefined}
                        onError={() => markBroken(active)}
                        draggable={false}
                    />
                )}
                {total > 1 && (
                    <>
                        <button
                            type="button"
                            className="product-gallery__nav product-gallery__nav--prev"
                            onClick={() => go(-1)}
                            aria-label="Image precedente"
                        >
                            <ChevronLeft size={22} />
                        </button>
                        <button
                            type="button"
                            className="product-gallery__nav product-gallery__nav--next"
                            onClick={() => go(1)}
                            aria-label="Image suivante"
                        >
                            <ChevronRight size={22} />
                        </button>
                    </>
                )}
            </div>

            {total > 1 && (
                <div className="product-gallery__thumbs" role="tablist" aria-label="Vignettes du produit">
                    {images.map((img, idx) => (
                        <button
                            type="button"
                            key={idx}
                            id={tabId(idx)}
                            role="tab"
                            aria-selected={idx === active}
                            aria-controls={panelId}
                            tabIndex={idx === active ? 0 : -1}
                            className={`product-gallery__thumb ${idx === active ? "product-gallery__thumb--active" : ""}`}
                            onClick={() => setActive(idx)}
                        >
                            {brokenIdx.has(idx) ? (
                                <span className="product-gallery__thumb-fallback" aria-hidden="true">—</span>
                            ) : (
                                <img
                                    src={resolveImageUrl(img.url)}
                                    srcSet={buildSrcset(img.url, SRCSET_PRESETS.thumb) || undefined}
                                    sizes={SRCSET_PRESETS.thumb.sizes}
                                    alt=""
                                    width="120"
                                    height="120"
                                    loading="lazy"
                                    decoding="async"
                                    onError={() => markBroken(idx)}
                                />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
