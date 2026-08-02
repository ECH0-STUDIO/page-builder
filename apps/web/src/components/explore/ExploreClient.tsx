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
    <section className="section_explore">
      <div className="padding-section-medium" />
      <div className="padding-global">
        <div className="container-large">
          <div className="features_header">
            <div className="max-title is-42rem">
              <h1 className="text-align-center">{labels.title}</h1>
            </div>
          </div>

          <div className="spacer-medium" />

          <div className="explore-filters">
            <div className="explore-field">
              <label htmlFor="explore-q">{labels.search}</label>
              <input
                id="explore-q"
                type="search"
                className="form_input w-input"
                value={q}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={labels.search}
              />
            </div>

            <div className="explore-field">
              <label htmlFor="explore-city">{labels.city}</label>
              <select
                id="explore-city"
                className="form_input w-input"
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
                className="form_input w-input"
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
                className="form_input w-input"
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
                className="form_input w-input"
                value={sort}
                onChange={(e) => onSortChange(e.target.value === 'za' ? 'za' : 'az')}
              >
                <option value="az">{labels.sortAz}</option>
                <option value="za">{labels.sortZa}</option>
              </select>
            </div>
          </div>

          <div className="spacer-medium" />

          {businesses.length === 0 ? (
            <div className="explore-empty text-align-center text-color-secondary">
              {labels.noResults}
            </div>
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
                  <article key={biz.id} className="problem-card explore-card">
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
                        <h2 className="h5">{biz.name}</h2>
                        {categoryLabel ? (
                          <p className="text-sm text-color-secondary">{categoryLabel}</p>
                        ) : null}
                      </div>
                    </div>

                    {location ? (
                      <p className="text-sm text-color-secondary">{location}</p>
                    ) : null}

                    {biz.tags && biz.tags.length > 0 ? (
                      <div className="explore-tags">
                        {biz.tags.slice(0, 6).map((t) => (
                          <span key={t} className="tag-item">
                            <div>{labels.tagLabels[t] ?? t}</div>
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <a
                      className="button w-inline-block explore-cta"
                      href={biz.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="button_mask">
                        <div className="button_text">{labels.visitWebsite}</div>
                      </div>
                    </a>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <div className="padding-section-medium" />

      <style>{`
        .explore-filters {
          display: grid;
          grid-template-columns: 1.4fr repeat(4, minmax(0, 1fr));
          gap: 0.75rem;
        }
        @media (max-width: 991px) {
          .explore-filters { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 479px) {
          .explore-filters { grid-template-columns: 1fr; }
        }
        .explore-field label {
          display: block;
          margin-bottom: 0.35rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-color-secondary, #5c5c5c);
        }
        .explore-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
        }
        @media (max-width: 991px) {
          .explore-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 479px) {
          .explore-grid { grid-template-columns: 1fr; }
        }
        .explore-card {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          height: 100%;
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
          background: #f4f4f4;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-weight: 700;
          font-size: 0.95rem;
          color: #5c5c5c;
        }
        .explore-logo-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .explore-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }
        .explore-tags .tag-item {
          font-size: 0.72rem;
        }
        .explore-cta {
          margin-top: auto;
          align-self: flex-start;
        }
        .explore-empty {
          padding: 3rem 1rem;
          border: 1px dashed rgba(0,0,0,0.12);
          border-radius: 1rem;
        }
      `}</style>
    </section>
  )
}
