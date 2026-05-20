const fs = require('fs');

// Fix types.ts
let typesTs = fs.readFileSync('apps/web/src/components/page-builder/types.ts', 'utf8');
typesTs = typesTs.replace(/heading_font_family: string/g, 'heading_font_family: string | null');
fs.writeFileSync('apps/web/src/components/page-builder/types.ts', typesTs);

// Fix MenuItem tags
let menuTs = fs.readFileSync('apps/web/src/lib/menu.ts', 'utf8');
menuTs = menuTs.replace(/tags: string\[\]/g, 'tags: string[] | null');
fs.writeFileSync('apps/web/src/lib/menu.ts', menuTs);

// Fix check-slug/route.ts
let checkSlug = fs.readFileSync('apps/web/src/app/api/check-slug/route.ts', 'utf8');
checkSlug = checkSlug.replace(/p_slug: slug/g, 'slug_to_check: slug');
fs.writeFileSync('apps/web/src/app/api/check-slug/route.ts', checkSlug);

// Fix page-builder.ts missing properties on page_blocks insert
let pbActions = fs.readFileSync('apps/web/src/app/actions/page-builder.ts', 'utf8');
pbActions = pbActions.replace(/const { error: insErr } = await db\.from\('page_blocks'\)\.insert\(rows\)/, `const { error: insErr } = await db.from('page_blocks').insert(rows.map(r => ({ ...r, business_id: businessId, type: r.type, config: r.config })))`);
fs.writeFileSync('apps/web/src/app/actions/page-builder.ts', pbActions);

// Fix MenuBuilder.tsx cats null check
let menuBuilder = fs.readFileSync('apps/web/src/components/menu/MenuBuilder.tsx', 'utf8');
menuBuilder = menuBuilder.replace(/if \(\!selectedCatId && \(cats \?\? \[\]\)\.length > 0\) setSelectedCatId\(cats\[0\]\.id\)/, `if (!selectedCatId && cats && cats.length > 0) setSelectedCatId(cats[0].id)`);
fs.writeFileSync('apps/web/src/components/menu/MenuBuilder.tsx', menuBuilder);

console.log('Fixed TS errors');
