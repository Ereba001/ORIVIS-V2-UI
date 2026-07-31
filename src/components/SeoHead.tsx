import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { getMeta, site } from "../seo/seo.config"
import type { PageMeta } from "../seo/seo.config"

interface SeoHeadProps {
  meta?: Partial<PageMeta>
  jsonLd?: Record<string, unknown>[]
}

function upsert(
  tag: string,
  id: string,
  attrs: Record<string, string>,
  text?: string,
): HTMLElement {
  const existing = document.getElementById(id)
  if (existing) existing.remove()
  const el = document.createElement(tag)
  el.id = id
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v)
  }
  if (text !== undefined) el.textContent = text
  document.head.appendChild(el)
  return el
}

export default function SeoHead({ meta: extraMeta, jsonLd }: SeoHeadProps) {
  const location = useLocation()

  const baseMeta = getMeta(location.pathname)
  const merged: PageMeta = { ...baseMeta, ...extraMeta }
  const title = merged.title
  const canonical = merged.canonical ?? `${site.url}${location.pathname}`
  const ogImage = merged.ogImage ?? site.defaultOgImage
  const ogTitle = merged.ogTitle ?? title
  const ogDesc = merged.ogDescription ?? merged.description

  useEffect(() => {
    document.title = title
  }, [title])

  useEffect(() => {
    const ns = `seo-${location.pathname.replace(/\//g, "-") || "home"}`

    upsert("meta", `${ns}-desc`, { name: "description", content: merged.description })

    if (merged.keywords) {
      upsert("meta", `${ns}-kw`, { name: "keywords", content: merged.keywords })
    }

    if (merged.noindex) {
      upsert("meta", `${ns}-noindex`, { name: "robots", content: "noindex, nofollow" })
    }

    upsert("link", `${ns}-canonical`, { rel: "canonical", href: canonical })

    upsert("meta", `${ns}-og-title`, { property: "og:title", content: ogTitle })
    upsert("meta", `${ns}-og-desc`, { property: "og:description", content: ogDesc })
    upsert("meta", `${ns}-og-image`, { property: "og:image", content: ogImage })
    upsert("meta", `${ns}-og-url`, { property: "og:url", content: canonical })
    upsert("meta", `${ns}-og-type`, { property: "og:type", content: "website" })
    upsert("meta", `${ns}-og-site`, { property: "og:site_name", content: site.name })
    upsert("meta", `${ns}-og-locale`, { property: "og:locale", content: site.locale })

    upsert("meta", `${ns}-tw-card`, { name: "twitter:card", content: "summary_large_image" })
    upsert("meta", `${ns}-tw-site`, { name: "twitter:site", content: site.twitterHandle })
    upsert("meta", `${ns}-tw-title`, { name: "twitter:title", content: ogTitle })
    upsert("meta", `${ns}-tw-desc`, { name: "twitter:description", content: ogDesc })
    upsert("meta", `${ns}-tw-image`, { name: "twitter:image", content: ogImage })

    if (jsonLd && jsonLd.length > 0) {
      upsert(
        "script",
        `${ns}-jsonld`,
        { type: "application/ld+json" },
        JSON.stringify(jsonLd.length === 1 ? jsonLd[0] : jsonLd),
      )
    }

    return () => {
      const head = document.head
      const prefix = `${ns}-`
      const toRemove: Element[] = []
      for (let i = 0; i < head.children.length; i++) {
        const child = head.children[i]
        if (child.id?.startsWith(prefix)) toRemove.push(child)
      }
      toRemove.forEach((el) => el.remove())
    }
  }, [location.pathname])

  return null
}
