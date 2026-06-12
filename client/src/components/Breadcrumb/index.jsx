import "./style.scss"
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useEffect } from "react";

const SITE_BASE = "https://glycibio.fr";

// items = [{ label, href? }] — le dernier item est generalement la page courante (sans href)
export const Breadcrumb = ({ items }) => {
    // JSON-LD BreadcrumbList (SEO Rich Results)
    useEffect(() => {
        if (!items || items.length === 0) return undefined;
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.setAttribute("data-id", "breadcrumb-jsonld");
        script.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: items.map((it, idx) => ({
                "@type": "ListItem",
                position: idx + 1,
                name: it.label,
                item: it.href ? `${SITE_BASE}${it.href}` : undefined,
            })),
        });
        document.head.appendChild(script);
        return () => {
            if (script.parentNode) script.parentNode.removeChild(script);
        };
    }, [items]);

    if (!items || items.length === 0) return null;

    return (
        <nav className="breadcrumb" aria-label="Fil d'Ariane">
            <ol>
                {items.map((it, idx) => {
                    const isLast = idx === items.length - 1;
                    return (
                        <li key={idx} className="breadcrumb__item">
                            {it.href && !isLast ? (
                                <Link to={it.href}>{it.label}</Link>
                            ) : (
                                <span aria-current={isLast ? "page" : undefined}>{it.label}</span>
                            )}
                            {!isLast && <ChevronRight size={14} className="breadcrumb__sep" aria-hidden="true" />}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};
