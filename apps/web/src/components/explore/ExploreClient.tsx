'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { ExploreBusiness } from '@/lib/explore-directory'
import { BUSINESS_CATEGORIES, BUSINESS_TAGS } from '@/lib/constants'
import { VIETNAM_CITIES } from '@/lib/vietnam-cities'

const CITY_STORAGE_KEY = 'eatery_explore_city'

export type ExploreLabels = {
  title: string
  search: string
  city: string
  category: string
  tags: string
  sort: string
  sortAz: string
  sortZa: string
  visitWebsite: string
  noResults: string
  allCities: string
  allCategories: string
  allTags: string
  categoryLabels: Record<string, string>
  tagLabels: Record<string, string>
}

type Props = {
  businesses: ExploreBusiness[]
  citiesFromData: string[]
  initialFilters: {
    q: string
    city: string
    category: string
    tag: string
    sort: 'az' | 'za'
  }
  labels: ExploreLabels
  loginUrl: string
}

function buildQuery(filters: {
  q: string
  city: string
  category: string
  tag: string
  sort: 'az' | 'za'
}): string {
  const params = new URLSearchParams()
  if (filters.q.trim()) params.set('q', filters.q.trim())
  if (filters.city) params.set('city', filters.city)
  if (filters.category) params.set('category', filters.category)
  if (filters.tag) params.set('tag', filters.tag)
  if (filters.sort === 'za') params.set('sort', 'za')
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export function ExploreClient({
  businesses,
  citiesFromData,
  initialFilters,
  labels,
  loginUrl,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const [q, setQ] = useState(initialFilters.q)
  const [city, setCity] = useState(initialFilters.city)
  const [category, setCategory] = useState(initialFilters.category)
  const [tag, setTag] = useState(initialFilters.tag)
  const [sort, setSort] = useState<'az' | 'za'>(initialFilters.sort)
  const appliedCachedCity = useRef(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cityOptions = useMemo(() => {
    const set = new Set<string>([...VIETNAM_CITIES, ...citiesFromData])
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' }),
    )
  }, [citiesFromData])

  function replaceFilters(next: {
    q: string
    city: string
    category: string
    tag: string
    sort: 'az' | 'za'
  }) {
    const href = `${pathname}${buildQuery(next)}`
    startTransition(() => {
      router.replace(href, { scroll: false })
    })
  }

  // Apply cached city once when URL has no city
  useEffect(() => {
    if (appliedCachedCity.current) return
    appliedCachedCity.current = true
    if (initialFilters.city) return
    try {
      const cached = localStorage.getItem(CITY_STORAGE_KEY)?.trim()
      if (!cached) return
      setCity(cached)
      replaceFilters({
        q: initialFilters.q,
        city: cached,
        category: initialFilters.category,
        tag: initialFilters.tag,
        sort: initialFilters.sort,
      })
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, [])

  // Sync local state when server props change (e.g. browser back)
  useEffect(() => {
    setQ(initialFilters.q)
    setCity(initialFilters.city)
    setCategory(initialFilters.category)
    setTag(initialFilters.tag)
    setSort(initialFilters.sort)
  }, [initialFilters.q, initialFilters.city, initialFilters.category, initialFilters.tag, initialFilters.sort])

  function onSearchChange(value: string) {
    setQ(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      replaceFilters({ q: value, city, category, tag, sort })
    }, 300)
  }

  function onCityChange(value: string) {
    setCity(value)
    try {
      if (value) localStorage.setItem(CITY_STORAGE_KEY, value)
      else localStorage.removeItem(CITY_STORAGE_KEY)
    } catch {
      /* ignore */
    }
    replaceFilters({ q, city: value, category, tag, sort })
  }

  function onCategoryChange(value: string) {
    setCategory(value)
    replaceFilters({ q, city, category: value, tag, sort })
  }

  function onTagChange(value: string) {
    setTag(value)
    replaceFilters({ q, city, category, tag: value, sort })
  }

  function onSortChange(value: 'az' | 'za') {
    setSort(value)
    replaceFilters({ q, city, category, tag, sort: value })
  }

  return (
    <div className="explore-page">
      <style>{`
        .explore-page {
          --explore-accent: #a0f4d8;
          --explore-ink: #131313;
          --explore-muted: #5c5c5c;
          --explore-border: #e6e6e6;
          --explore-bg: #f7faf8;
          font-family: Inter, "Helvetica Neue", Helvetica, Arial, sans-serif;
          color: var(--explore-ink);
          background:
            radial-gradient(1200px 500px at 10% -10%, rgba(160, 244, 216, 0.45), transparent 55%),
            radial-gradient(900px 400px at 90% 0%, rgba(19, 19, 19, 0.04), transparent 50%),
            var(--explore-bg);
          min-height: 100vh;
        }
        .explore-page * { box-sizing: border-box; }
        .explore-page a { color: inherit; text-decoration: none; }
        .explore-header {
          position: sticky;
          top: 0;
          z-index: 20;
          backdrop-filter: blur(10px);
          background: rgba(247, 250, 248, 0.88);
          border-bottom: 1px solid var(--explore-border);
        }
        .explore-header-inner {
          max-width: 1120px;
          margin: 0 auto;
          padding: 0.9rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .explore-logo img { height: 28px; width: auto; display: block; }
        .explore-nav {
          display: flex;
          align-items: center;
          gap: 1.1rem;
          flex-wrap: wrap;
          font-size: 0.9rem;
          font-weight: 500;
        }
        .explore-nav a { opacity: 0.8; transition: opacity .15s ease; }
        .explore-nav a:hover { opacity: 1; }
        .explore-nav a.is-active {
          opacity: 1;
          border-bottom: 2px solid var(--explore-accent);
          padding-bottom: 2px;
        }
        .explore-main {
          max-width: 1120px;
          margin: 0 auto;
          padding: 2.25rem 1.25rem 4rem;
        }
        .explore-title {
          font-size: clamp(1.75rem, 3vw, 2.4rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          margin: 0 0 1.5rem;
          line-height: 1.15;
        }
        .explore-filters {
          display: grid;
          grid-template-columns: 1.4fr repeat(4, minmax(0, 1fr));
          gap: 0.75rem;
          margin-bottom: 1.75rem;
        }
        @media (max-width: 900px) {
          .explore-filters { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 560px) {
          .explore-filters { grid-template-columns: 1fr; }
          .explore-nav { gap: 0.75rem; font-size: 0.82rem; }
        }
        .explore-field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .explore-field label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--explore-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .explore-field input,
        .explore-field select {
          appearance: none;
          width: 100%;
          border: 1px solid var(--explore-border);
          background: #fff;
          color: var(--explore-ink);
          border-radius: 10px;
          padding: 0.7rem 0.85rem;
          font: inherit;
          font-size: 0.92rem;
          outline: none;
          transition: border-color .15s ease, box-shadow .15s ease;
        }
        .explore-field input:focus,
        .explore-field select:focus {
          border-color: #7ad9b8;
          box-shadow: 0 0 0 3px rgba(160, 244, 216, 0.55);
        }
        .explore-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
        }
        @media (max-width: 900px) {
          .explore-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 560px) {
          .explore-grid { grid-template-columns: 1fr; }
        }
        .explore-card {
          background: #fff;
          border: 1px solid var(--explore-border);
          border-radius: 16px;
          padding: 1.1rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }
        .explore-card:hover {
          transform: translateY(-2px);
          border-color: #c9efe0;
          box-shadow: 0 10px 28px rgba(19, 19, 19, 0.06);
        }
        .explore-card-top {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }
        .explore-logo-box {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          background: linear-gradient(145deg, #eefaf5, #f4f4f4);
          border: 1px solid var(--explore-border);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--explore-muted);
        }
        .explore-logo-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .explore-card h2 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          line-height: 1.25;
        }
        .explore-meta {
          margin: 0.2rem 0 0;
          font-size: 0.82rem;
          color: var(--explore-muted);
        }
        .explore-location {
          margin: 0;
          font-size: 0.86rem;
          color: var(--explore-muted);
          line-height: 1.4;
        }
        .explore-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }
        .explore-chip {
          font-size: 0.72rem;
          font-weight: 600;
          padding: 0.22rem 0.55rem;
          border-radius: 999px;
          background: rgba(160, 244, 216, 0.35);
          color: var(--explore-ink);
        }
        .explore-cta {
          margin-top: auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.65rem 0.9rem;
          border-radius: 10px;
          background: var(--explore-ink);
          color: #fff !important;
          font-size: 0.88rem;
          font-weight: 600;
          transition: background .15s ease, transform .15s ease;
        }
        .explore-cta:hover { background: #000; transform: translateY(-1px); }
        .explore-empty {
          text-align: center;
          padding: 3.5rem 1rem;
          color: var(--explore-muted);
          border: 1px dashed var(--explore-border);
          border-radius: 16px;
          background: rgba(255,255,255,0.65);
        }
      `}</style>

      <header className="explore-header">
        <div className="explore-header-inner">
          <a href="/" className="explore-logo" aria-label="Eateryvn">
            <img src="/marketing/images/logo-full.webp" alt="Eateryvn" />
          </a>
          <nav className="explore-nav" aria-label="Explore">
            <a href="/features">Features</a>
            <a href="/pricing">Pricing</a>
            <a href="/explore" className="is-active" aria-current="page">
              Explore
            </a>
            <a href={loginUrl}>Login</a>
          </nav>
        </div>
      </header>

      <main className="explore-main">
        <h1 className="explore-title">{labels.title}</h1>

        <div className="explore-filters">
          <div className="explore-field">
            <label htmlFor="explore-q">{labels.search}</label>
            <input
              id="explore-q"
              type="search"
              value={q}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={labels.search}
            />
          </div>

          <div className="explore-field">
            <label htmlFor="explore-city">{labels.city}</label>
            <select
              id="explore-city"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
            >
              <option value="">{labels.allCities}</option>
              {cityOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="explore-field">
            <label htmlFor="explore-category">{labels.category}</label>
            <select
              id="explore-category"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              <option value="">{labels.allCategories}</option>
              {BUSINESS_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {labels.categoryLabels[c.value] ?? c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="explore-field">
            <label htmlFor="explore-tag">{labels.tags}</label>
            <select
              id="explore-tag"
              value={tag}
              onChange={(e) => onTagChange(e.target.value)}
            >
              <option value="">{labels.allTags}</option>
              {BUSINESS_TAGS.map((t) => (
                <option key={t} value={t}>
                  {labels.tagLabels[t] ?? t}
                </option>
              ))}
            </select>
          </div>

          <div className="explore-field">
            <label htmlFor="explore-sort">{labels.sort}</label>
            <select
              id="explore-sort"
              value={sort}
              onChange={(e) => onSortChange(e.target.value === 'za' ? 'za' : 'az')}
            >
              <option value="az">{labels.sortAz}</option>
              <option value="za">{labels.sortZa}</option>
            </select>
          </div>
        </div>

        {businesses.length === 0 ? (
          <div className="explore-empty">{labels.noResults}</div>
        ) : (
          <div className="explore-grid">
            {businesses.map((biz) => {
              const categoryKey = biz.category?.[0]
              const categoryLabel = categoryKey
                ? labels.categoryLabels[categoryKey] ?? categoryKey
                : null
              const location = [biz.address, biz.city].filter(Boolean).join(', ')
              const initials = biz.name.slice(0, 2).toUpperCase()

              return (
                <article key={biz.id} className="explore-card">
                  <div className="explore-card-top">
                    <div className="explore-logo-box">
                      {biz.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={biz.logo_url} alt="" />
                      ) : (
                        initials
                      )}
                    </div>
                    <div>
                      <h2>{biz.name}</h2>
                      {categoryLabel ? (
                        <p className="explore-meta">{categoryLabel}</p>
                      ) : null}
                    </div>
                  </div>

                  {location ? <p className="explore-location">{location}</p> : null}

                  {biz.tags && biz.tags.length > 0 ? (
                    <div className="explore-tags">
                      {biz.tags.slice(0, 6).map((t) => (
                        <span key={t} className="explore-chip">
                          {labels.tagLabels[t] ?? t}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <a
                    className="explore-cta"
                    href={biz.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {labels.visitWebsite}
                  </a>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
