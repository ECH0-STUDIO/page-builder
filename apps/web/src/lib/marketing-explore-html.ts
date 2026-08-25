import type { SupportedLocale } from '@/i18n/locale'
import type {
  ExploreBusiness,
  ExploreBusinessSearchMeta,
} from '@/lib/explore-directory'
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
    ? `<img src="${escapeHtml(biz.logo_url)}" loading="lazy" alt="${escapeHtml(biz.name)}" class="explore-logo-img">`
    : `<div class="explore-logo-fallback">${initials}</div>`

  const tagChips = (biz.tags ?? [])
    .slice(0, 6)
    .map(
      (t) =>
        `<div class="tag-item explore-tag"><div>${escapeHtml(labels.tagLabels[t] ?? t)}</div></div>`,
    )
    .join('')

  const visitLabel = escapeHtml(labels.visitWebsite)

  return `<article class="explore-card">
  <div class="explore-card-top">
    <div class="explore-logo-box">${logo}</div>
    <div class="explore-card-heading">
      <h2 class="h6">${escapeHtml(biz.name)}</h2>
      ${categoryLabel ? `<div class="text-sm text-color-secondary">${escapeHtml(categoryLabel)}</div>` : ''}
    </div>
  </div>
  ${location ? `<div class="text-sm text-color-secondary">${escapeHtml(location)}</div>` : ''}
  ${tagChips ? `<div class="explore-tags">${tagChips}</div>` : ''}
  <a href="${escapeHtml(biz.websiteUrl)}" target="_blank" rel="noopener noreferrer" class="button w-variant-afd4be8c-cefc-38d4-ee66-8fdad5b98c2b w-inline-block explore-cta">
    <div class="button_mask">
      <div class="button_text">${visitLabel}</div>
      <div class="button_text is-hide">${visitLabel}</div>
    </div>
  </a>
</article>`
}

function filterBusinesses(
  businesses: ExploreBusinessSearchMeta[],
  filters: ExploreFilters,
): ExploreBusiness[] {
  const q = filters.q.trim()
  const city = filters.city.trim()
  const category = filters.category.trim()
  const tag = filters.tag.trim()
  const sort = filters.sort === 'za' ? 'za' : 'az'

  const terms = q
    ? q
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
    : []

  let results = businesses.filter((b) => {
    if (terms.length > 0 && !terms.every((term) => b.searchText.includes(term))) {
      return false
    }
    if (city && b.city !== city) return false
    if (category && !(b.category ?? []).includes(category)) return false
    if (tag && !(b.tags ?? []).includes(tag)) return false
    return true
  })

  results = [...results].sort((a, b) => {
    const cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    return sort === 'za' ? -cmp : cmp
  })

  return results
}

const EXPLORE_SECTION_RE =
  /<section id="(?:explore-shell|features)"[^>]*>[\s\S]*?<\/section>\s*(?=<section class="footer")/i

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
  align-items: flex-start;
  gap: 0.85rem;
  height: 100%;
  background-color: var(--bg-color--bg-white, #fff);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 5px 12px #00000008, 0 21px 21px #00000008;
}
.explore-card-top {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
}
.explore-card-heading {
  min-width: 0;
  flex: 1;
}
.explore-card-heading .h6 {
  margin: 0;
}
.explore-logo-box {
  position: relative;
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
.explore-logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: static;
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
.explore-tags .explore-tag {
  min-height: auto;
  font-size: 0.72rem;
  line-height: 1.2;
  text-transform: none;
  letter-spacing: normal;
  color: var(--text-color--text-secondary, #5c5c5c);
  background-color: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 0.25rem 0.65rem;
}
.explore-cta { margin-top: auto; align-self: flex-start; }
.explore-empty {
  padding: 3rem 1rem;
  border: 1px dashed rgba(0,0,0,0.12);
  border-radius: 1rem;
}
</style>`

export function buildExploreClientAssets(
  businesses: ExploreBusinessSearchMeta[],
  labels: ExploreRenderLabels,
  locale: SupportedLocale,
): string {
  return buildExploreClientScript(businesses, labels, locale)
}

function buildExploreClientScript(
  businesses: ExploreBusinessSearchMeta[],
  labels: ExploreRenderLabels,
  locale: SupportedLocale,
): string {
  const payload = JSON.stringify({
    businesses,
    labels: {
      visitWebsite: labels.visitWebsite,
      noResults: labels.noResults,
      categoryLabels: labels.categoryLabels,
      tagLabels: labels.tagLabels,
    },
    locale,
  }).replace(/</g, '\\u003c')

  return `<script id="explore-page-data" type="application/json">${payload}</script>
<script id="explore-page-script">
(function () {
  var CITY_KEY = 'eatery_explore_city';
  var dataEl = document.getElementById('explore-page-data');
  var form = document.getElementById('explore-filters-form');
  var resultsEl = document.getElementById('explore-results');
  if (!dataEl || !form || !resultsEl) return;

  var payload = JSON.parse(dataEl.textContent || '{}');
  var businesses = payload.businesses || [];
  var labels = payload.labels || {};
  var locale = payload.locale || 'vi';
  var qInput = form.querySelector('[name="q"]');
  var citySelect = form.querySelector('[name="city"]');
  var categorySelect = form.querySelector('[name="category"]');
  var tagSelect = form.querySelector('[name="tag"]');
  var sortSelect = form.querySelector('[name="sort"]');
  var timer = null;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function readFilters() {
    return {
      q: qInput ? qInput.value : '',
      city: citySelect ? citySelect.value : '',
      category: categorySelect ? categorySelect.value : '',
      tag: tagSelect ? tagSelect.value : '',
      sort: sortSelect && sortSelect.value === 'za' ? 'za' : 'az',
    };
  }

  function filterList(filters) {
    var q = (filters.q || '').trim();
    var city = (filters.city || '').trim();
    var category = (filters.category || '').trim();
    var tag = (filters.tag || '').trim();
    var sort = filters.sort === 'za' ? 'za' : 'az';
    var terms = q
      ? q.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().split(/\\s+/).filter(Boolean)
      : [];

    var results = businesses.filter(function (b) {
      if (terms.length && !terms.every(function (term) { return b.searchText.indexOf(term) !== -1; })) return false;
      if (city && b.city !== city) return false;
      if (category && (!b.category || b.category.indexOf(category) === -1)) return false;
      if (tag && (!b.tags || b.tags.indexOf(tag) === -1)) return false;
      return true;
    });

    results.sort(function (a, b) {
      var cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      return sort === 'za' ? -cmp : cmp;
    });
    return results;
  }

  function buildCard(biz) {
    var categoryKey = biz.category && biz.category[0];
    var categoryLabel = categoryKey
      ? (labels.categoryLabels && labels.categoryLabels[categoryKey]) || categoryKey
      : '';
    var location = [biz.address, biz.city].filter(Boolean).join(', ');
    var initials = escapeHtml(biz.name.slice(0, 2).toUpperCase());
    var logo = biz.logo_url
      ? '<img src="' + escapeHtml(biz.logo_url) + '" loading="lazy" alt="' + escapeHtml(biz.name) + '" class="explore-logo-img">'
      : '<div class="explore-logo-fallback">' + initials + '</div>';
    var tagChips = (biz.tags || []).slice(0, 6).map(function (t) {
      var label = (labels.tagLabels && labels.tagLabels[t]) || t;
      return '<div class="tag-item explore-tag"><div>' + escapeHtml(label) + '</div></div>';
    }).join('');
    var visitLabel = escapeHtml(labels.visitWebsite || 'Visit website');

    return '<article class="explore-card">' +
      '<div class="explore-card-top">' +
        '<div class="explore-logo-box">' + logo + '</div>' +
        '<div class="explore-card-heading">' +
          '<h2 class="h6">' + escapeHtml(biz.name) + '</h2>' +
          (categoryLabel ? '<div class="text-sm text-color-secondary">' + escapeHtml(categoryLabel) + '</div>' : '') +
        '</div>' +
      '</div>' +
      (location ? '<div class="text-sm text-color-secondary">' + escapeHtml(location) + '</div>' : '') +
      (tagChips ? '<div class="explore-tags">' + tagChips + '</div>' : '') +
      '<a href="' + escapeHtml(biz.websiteUrl) + '" target="_blank" rel="noopener noreferrer" class="button w-variant-afd4be8c-cefc-38d4-ee66-8fdad5b98c2b w-inline-block explore-cta">' +
        '<div class="button_mask">' +
          '<div class="button_text">' + visitLabel + '</div>' +
          '<div class="button_text is-hide">' + visitLabel + '</div>' +
        '</div>' +
      '</a>' +
    '</article>';
  }

  function renderResults(list) {
    if (!list.length) {
      resultsEl.innerHTML = '<div class="explore-empty text-align-center text-color-secondary">' +
        escapeHtml(labels.noResults || 'No results') + '</div>';
      return;
    }
    resultsEl.innerHTML = '<div class="explore-grid">' + list.map(buildCard).join('') + '</div>';
  }

  function buildQuery(filters) {
    var params = new URLSearchParams();
    if (filters.q.trim()) params.set('q', filters.q.trim());
    if (filters.city) params.set('city', filters.city);
    if (filters.category) params.set('category', filters.category);
    if (filters.tag) params.set('tag', filters.tag);
    if (filters.sort === 'za') params.set('sort', 'za');
    if (locale === 'en') params.set('lang', 'en');
    var qs = params.toString();
    return qs ? window.location.pathname + '?' + qs : window.location.pathname + (locale === 'en' ? '?lang=en' : '');
  }

  function applyFilters() {
    var filters = readFilters();
    renderResults(filterList(filters));
    var nextUrl = buildQuery(filters);
    if (window.location.pathname + window.location.search !== nextUrl) {
      history.replaceState(null, '', nextUrl);
    }
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    applyFilters();
  });

  try {
    if (citySelect && !citySelect.value) {
      var cached = localStorage.getItem(CITY_KEY);
      if (cached) citySelect.value = cached;
    }
  } catch (e) {}

  if (citySelect) {
    citySelect.addEventListener('change', function () {
      try {
        if (citySelect.value) localStorage.setItem(CITY_KEY, citySelect.value);
        else localStorage.removeItem(CITY_KEY);
      } catch (e) {}
      applyFilters();
    });
  }

  [categorySelect, tagSelect, sortSelect].forEach(function (el) {
    if (!el) return;
    el.addEventListener('change', applyFilters);
  });

  if (qInput) {
    qInput.addEventListener('input', function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(applyFilters, 300);
    });
  }
})();
</script>`
}

export function renderExplorePageHtml(
  baseHtml: string,
  allBusinesses: ExploreBusinessSearchMeta[],
  cityOptions: string[],
  filters: ExploreFilters,
  labels: ExploreRenderLabels,
  locale: SupportedLocale,
): string {
  const action = marketingPathForLocale('/explore', locale)
  const visible = filterBusinesses(allBusinesses, filters)

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

  const resultsHtml =
    visible.length === 0
      ? `<div class="explore-empty text-align-center text-color-secondary">${escapeHtml(labels.noResults)}</div>`
      : `<div class="explore-grid">${visible.map((b) => buildBusinessCard(b, labels)).join('')}</div>`

  const section = `<section id="explore" class="section_features" data-eatery-explore-shell>
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
            <input id="explore-q" class="form_input w-input" type="search" name="q" value="${escapeHtml(filters.q)}" placeholder="${escapeHtml(labels.search)}" autocomplete="off">
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
        <div id="explore-results">${resultsHtml}</div>
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
