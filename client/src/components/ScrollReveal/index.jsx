import { useEffect, useRef, useState } from "react"

// ScrollReveal : revele un bloc avec un subtil fade + lift quand il
// entre dans le viewport. Une fois revele, l'animation ne se rejoue pas.
// Respecte prefers-reduced-motion : apparition immediate sans animation.
export const ScrollReveal = ({
    children,
    as = "div",
    delay = 0,
    className = "",
    ...rest
}) => {
    const Tag = as
    const ref = useRef(null)
    const [visible, setVisible] = useState(() => {
        if (typeof window === "undefined") return true        // SSR : deja revele
        if (typeof IntersectionObserver === "undefined") return true
        return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    })

    useEffect(() => {
        const node = ref.current
        if (!node || visible) return
        if (typeof IntersectionObserver === "undefined") {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- fallback sans IntersectionObserver
            setVisible(true)
            return
        }
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true)
                    observer.disconnect()
                }
            },
            { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
        )
        observer.observe(node)
        return () => observer.disconnect()
    }, [visible])

    return (
        <Tag
            ref={ref}
            className={`scroll-reveal ${visible ? "scroll-reveal--visible" : ""} ${className}`}
            style={delay ? { transitionDelay: `${delay}ms` } : undefined}
            {...rest}
        >
            {children}
        </Tag>
    )
}
