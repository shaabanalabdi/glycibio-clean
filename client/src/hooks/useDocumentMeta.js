import { useEffect } from 'react';

// Mise a jour de <title>, meta description, canonical, Open Graph et JSON-LD
// directement dans le <head>. Adapte au SPA (Vite + React Router).
// En production, prevoir un SSR/SSG pour que Googlebot lise ces meta
// au premier render. En attendant, ce hook reste utile pour le partage
// social cote client (Facebook scrape la page apres render).

const setOrCreateMeta = (selector, attrName, attrValue, content) => {
  if (!content) return null;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
  return el;
};

const setOrCreateLink = (rel, href) => {
  if (!href) return null;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
  return el;
};

const setOrCreateJsonLd = (id, payload) => {
  if (!payload) return null;
  let el = document.head.querySelector(`script[type="application/ld+json"][data-id="${id}"]`);
  if (!el) {
    el = document.createElement('script');
    el.setAttribute('type', 'application/ld+json');
    el.setAttribute('data-id', id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(payload);
  return el;
};

export const useDocumentMeta = ({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = 'website',
  jsonLd,
  noIndex = false,
} = {}) => {
  useEffect(() => {
    if (title) document.title = title;
    // Canonical auto-référent par défaut : empêche les pages sans canonical
    // explicite de retomber sur la racine via le <link> statique d'index.html
    // (corrige le warning Lighthouse "canonical points to the root URL").
    const canonicalHref = canonical
      || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : null);
    const desc = setOrCreateMeta('meta[name="description"]', 'name', 'description', description);
    const can = setOrCreateLink('canonical', canonicalHref);
    const ogt = setOrCreateMeta('meta[property="og:title"]', 'property', 'og:title', ogTitle || title);
    const ogd = setOrCreateMeta('meta[property="og:description"]', 'property', 'og:description', ogDescription || description);
    const ogi = setOrCreateMeta('meta[property="og:image"]', 'property', 'og:image', ogImage);
    const ogu = setOrCreateMeta('meta[property="og:url"]', 'property', 'og:url', canonicalHref);
    const ogty = setOrCreateMeta('meta[property="og:type"]', 'property', 'og:type', ogType);
    const robots = noIndex
      ? setOrCreateMeta('meta[name="robots"]', 'name', 'robots', 'noindex, nofollow')
      : null;
    const ld = jsonLd ? setOrCreateJsonLd('page-jsonld', jsonLd) : null;

    return () => {
      // Le JSON-LD et la meta robots sont specifiques a la page : on les retire
      if (ld && ld.parentNode) ld.parentNode.removeChild(ld);
      if (robots && robots.parentNode) robots.parentNode.removeChild(robots);
      void desc; void can; void ogt; void ogd; void ogi; void ogu; void ogty;
    };
  }, [title, description, canonical, ogTitle, ogDescription, ogImage, ogType, jsonLd, noIndex]);
};
