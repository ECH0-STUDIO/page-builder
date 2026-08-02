import type { SupportedLocale } from '@/i18n/locale'
import type { ExploreBusiness } from '@/lib/explore-directory'
import { escapeHtml } from '@/lib/marketing-blog-html'
import { BUSINESS_CATEGORIES, BUSINESS_TAGS } from '@/lib/constants'
import { marketingPathForLocale } from '@/lib/marketing-locale'

export type ExploreRenderLabels = {
  title: string
  metaDescription: string
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

export type ExploreFilters = {
  q: string
  city: string
  category: string
  tag: string
  sort: 'az' | 'za'
}

function buildQuery(path: string, filters: ExploreFilters, locale: SupportedLocale): string {
  const params = new URLSearchParams()
  if (filters.q.trim()) params.set('q', filters.q.trim())
  if (filters.city) params.set('city', filters.city)
  if (filters.category) params.set('category', filters.category)
  if (filters.tag) params.set('tag', filters.tag)
  if (filters.sort === 'za') params.set('sort', 'za')
  const qs = params.toString()
  const base = marketingPathForLocale(path, locale)
  return qs ? `${base}?${qs}` : base
}

function buildBusinessCard(
  biz: ExploreBusiness,
  labels: ExploreRenderLabels,
): string {
  const categoryKey = biz.category?.[0]
  const categoryLabel = categoryKey
    ? labels.categoryLabels[categoryKey] ?? categoryKey
    : ''
  const location = [biz.address, biz.city].filter(Boolean).join(', ')
  const initials = escapeHtml(biz.name.slice(0, 2).toUpperCase())
  const logo = biz.logo_url
    ? `<img src="${escapeHtml(biz.logo_url)}" loading="lazy" alt="" class="img">`
    : `<div class="explore-logo-fallback">${initials}</div>`

  const tagChips = (biz.tags ?? [])
    .slice(0, 6)
    .map(
      (t) =>
        `<div class="tag-item"><div>${escapeHtml(labels.tagLabels[t] ?? t)}</div></div>`,
    )
    .join('')

  return `<article class="problem-card explore-card">
  <div class="explore-card-top">
    <div class="explore-logo-box">${logo}</div>
    <div>
      <h2 class="h5">${escapeHtml(biz.name)}</h2>
      ${categoryLabel ? `<div class="text-sm text-color-secondary">${escapeHtml(categoryLabel)}</div>` : ''}
    </div>
  </div>
  ${location ? `<div class="text-sm text-color-secondary">${escapeHtml(location)}</div>` : ''}
  ${tagChips ? `<div class="explore-tags">${tagChips}</div>` : ''}
  <a href="${escapeHtml(biz.websiteUrl)}" target="_blank" rel="noopener noreferrer" class="button w-inline-block explore-cta">
    <div class="button_mask">
      <div class="button_text">${escapeHtml(labels.visitWebsite)}</div>
    </div>
  </a>
</article>`
}

const EXPLORE_SECTION_RE =
  /<section id="features"[\s\S]*?<\/section>\s*(?=<section class="footer")/i

const EXPLORE_STYLES = `<style id="explore-page-styles">
.explore-filters {
  display: grid;
  grid-template-columns: 1.4fr repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
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
  text-transform: uppercase;
  letter-spacing: 0.04em;
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
}
.explore-logo-box .img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.explore-logo-fallback {
  font-weight: 700;
  font-size: 0.95rem;
  color: #5c5c5c;
}
.explore-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.explore-tags .tag-item { font-size: 0.72rem; }
.explore-cta { margin-top: auto; align-self: flex-start; }
.explore-empty {
  padding: 3rem 1rem;
  border: 1px dashed rgba(0,0,0,0.12);
  border-radius: 1rem;
}
</style>`

const EXPLORE_SCRIPT = `<script id="explore-page-script">
(function () {
  var CITY_KEY = 'eatery_explore_city';
  var form = document.getElementById('explore-filters-form');
  if (!form) return;
  var qInput = form.querySelector('[name="q"]');
  var citySelect = form.querySelector('[name="city"]');
  var timer = null;

  try {
    if (citySelect && !citySelect.value) {
      var cached = localStorage.getItem(CITY_KEY);
      if (cached) {
        citySelect.value = cached;
        form.requestSubmit();
        return;
      }
    }
  } catch (e) {}

  if (citySelect) {
    citySelect.addEventListener('change', function () {
      try {
        if (citySelect.value) localStorage.setItem(CITY_KEY, citySelect.value);
        else localStorage.removeItem(CITY_KEY);
      } catch (e) {}
      form.requestSubmit();
    });
  }

  form.querySelectorAll('select:not([name="city"])').forEach(function (el) {
    el.addEventListener('change', function () { form.requestSubmit(); });
  });

  if (qInput) {
    qInput.addEventListener('input', function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () { form.requestSubmit(); }, 300);
    });
  }
})();
</script>`

export function renderExplorePageHtml(
  baseHtml: string,
  businesses: ExploreBusiness[],
  cityOptions: string[],
  filters: ExploreFilters,
  labels: ExploreRenderLabels,
  locale: SupportedLocale,
): string {
  const action = marketingPathForLocale('/explore', locale)

  const cityOptionsHtml = cityOptions
    .map(
      (c) =>
        `<option value="${escapeHtml(c)}"${filters.city === c ? ' selected' : ''}>${escapeHtml(c)}</option>`,
    )
    .join('')

  const categoryOptionsHtml = BUSINESS_CATEGORIES.map(
    (c) =>
      `<option value="${escapeHtml(c.value)}"${filters.category === c.value ? ' selected' : ''}>${escapeHtml(labels.categoryLabels[c.value] ?? c.label)}</option>`,
  ).join('')

  const tagOptionsHtml = BUSINESS_TAGS.map(
    (t) =>
      `<option value="${escapeHtml(t)}"${filters.tag === t ? ' selected' : ''}>${escapeHtml(labels.tagLabels[t] ?? t)}</option>`,
  ).join('')

  const cards =
    businesses.length === 0
      ? `<div class="explore-empty text-align-center text-color-secondary">${escapeHtml(labels.noResults)}</div>`
      : `<div class="explore-grid">${businesses.map((b) => buildBusinessCard(b, labels)).join('')}</div>`

  const section = `<section id="explore" class="section_features">
  <div class="padding-section-medium"></div>
  <div class="padding-global">
    <div class="container-large">
      <div class="features_layout">
        <div class="features_header">
          <div class="max-title is-42rem">
            <h1 class="text-align-center">${escapeHtml(labels.title)}</h1>
          </div>
        </div>
        <div class="spacer-medium"></div>
        <form id="explore-filters-form" class="explore-filters" method="get" action="${escapeHtml(action)}">
          <div class="explore-field">
            <label for="explore-q">${escapeHtml(labels.search)}</label>
            <input id="explore-q" class="form_input w-input" type="search" name="q" value="${escapeHtml(filters.q)}" placeholder="${escapeHtml(labels.search)}">
          </div>
          <div class="explore-field">
            <label for="explore-city">${escapeHtml(labels.city)}</label>
            <select id="explore-city" class="form_input w-input" name="city">
              <option value="">${escapeHtml(labels.allCities)}</option>
              ${cityOptionsHtml}
            </select>
          </div>
          <div class="explore-field">
            <label for="explore-category">${escapeHtml(labels.category)}</label>
            <select id="explore-category" class="form_input w-input" name="category">
              <option value="">${escapeHtml(labels.allCategories)}</option>
              ${categoryOptionsHtml}
            </select>
          </div>
          <div class="explore-field">
            <label for="explore-tag">${escapeHtml(labels.tags)}</label>
            <select id="explore-tag" class="form_input w-input" name="tag">
              <option value="">${escapeHtml(labels.allTags)}</option>
              ${tagOptionsHtml}
            </select>
          </div>
          <div class="explore-field">
            <label for="explore-sort">${escapeHtml(labels.sort)}</label>
            <select id="explore-sort" class="form_input w-input" name="sort">
              <option value="az"${filters.sort === 'az' ? ' selected' : ''}>${escapeHtml(labels.sortAz)}</option>
              <option value="za"${filters.sort === 'za' ? ' selected' : ''}>${escapeHtml(labels.sortZa)}</option>
            </select>
          </div>
        </form>
        ${cards}
      </div>
    </div>
  </div>
  <div class="padding-section-medium"></div>
</section>`

  let html = baseHtml
  if (!EXPLORE_SECTION_RE.test(html)) {
    return html
  }
  html = html.replace(EXPLORE_SECTION_RE, section)
  html = html.replace(/<\/head>/i, `${EXPLORE_STYLES}\n</head>`)
  html = html.replace(/<\/body>/i, `${EXPLORE_SCRIPT}\n</body>`)
  return html
}

export function parseExploreFilters(url: URL): ExploreFilters {
  return {
    q: url.searchParams.get('q') ?? '',
    city: url.searchParams.get('city') ?? '',
    category: url.searchParams.get('category') ?? '',
    tag: url.searchParams.get('tag') ?? '',
    sort: url.searchParams.get('sort') === 'za' ? 'za' : 'az',
  }
}

export function buildExploreQueryHref(
  path: string,
  filters: ExploreFilters,
  locale: SupportedLocale,
): string {
  return buildQuery(path, filters, locale)
}
