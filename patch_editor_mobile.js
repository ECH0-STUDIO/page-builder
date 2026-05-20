const fs = require('fs');

const replaceInFile = (file, replacements) => {
  let content = fs.readFileSync(file, 'utf8');
  for (const [search, replace] of replacements) {
    if (typeof search === 'string') {
      content = content.split(search).join(replace);
    } else {
      content = content.replace(search, replace);
    }
  }
  fs.writeFileSync(file, content);
};

// 1. EditorShell.tsx
replaceInFile('apps/web/src/components/page-builder/EditorShell.tsx', [
  [
    "{block.type === 'hero' && <HeroRender config={block.config as HeroConfig} businessName={business.name} />}",
    "{block.type === 'hero' && <HeroRender config={block.config as HeroConfig} businessName={business.name} isMobilePreview={viewMode === 'mobile'} />}"
  ],
  [
    `        {block.type === 'menu_grid' && (
          <MenuGridRender
            config={block.config as MenuGridConfig}
            data={block.data as MenuGridData}
          />
        )}`,
    `        {block.type === 'menu_grid' && (
          <MenuGridRender
            config={block.config as MenuGridConfig}
            data={block.data as MenuGridData}
            isMobilePreview={viewMode === 'mobile'}
          />
        )}`
  ]
]);

// 2. MenuGridRender.tsx
replaceInFile('apps/web/src/components/page-builder/render/MenuGridRender.tsx', [
  [
    "function MenuGridInner({ config, data }: MenuGridRenderProps) {",
    "function MenuGridInner({ config, data, isMobilePreview }: MenuGridRenderProps & { isMobilePreview?: boolean }) {"
  ],
  [
    "export function MenuGridRender({ config, data }: MenuGridRenderProps) {",
    "export function MenuGridRender({ config, data, isMobilePreview }: MenuGridRenderProps & { isMobilePreview?: boolean }) {"
  ],
  [
    "return <MenuGridInner config={config} data={data} />",
    "return <MenuGridInner config={config} data={data} isMobilePreview={isMobilePreview} />"
  ],
  [
    "const colClass = gridCols[config.layout] ?? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'",
    "const colClass = isMobilePreview ? 'grid-cols-1' : (gridCols[config.layout] ?? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')"
  ],
  [
    "fontSize: 'clamp(20px, 5vw, 36px)',",
    "fontSize: isMobilePreview ? '24px' : 'clamp(20px, 5vw, 36px)',"
  ],
  [
    "fontSize: 'clamp(14px, 3vw, 16px)',",
    "fontSize: isMobilePreview ? '14px' : 'clamp(14px, 3vw, 16px)',"
  ]
]);

// 3. HeroRender.tsx
replaceInFile('apps/web/src/components/page-builder/render/HeroRender.tsx', [
  [
    "export function HeroRender({ config, businessName }: { config: HeroConfig; businessName?: string }) {",
    "export function HeroRender({ config, businessName, isMobilePreview }: { config: HeroConfig; businessName?: string; isMobilePreview?: boolean }) {"
  ],
  [
    "fontSize: 'clamp(28px, 7vw, 64px)'",
    "fontSize: isMobilePreview ? '36px' : 'clamp(28px, 7vw, 64px)'"
  ],
  [
    "fontSize: 'clamp(16px, 4vw, 20px)'",
    "fontSize: isMobilePreview ? '18px' : 'clamp(16px, 4vw, 20px)'"
  ],
  [
    "fontSize: 'clamp(14px, 3vw, 16px)'",
    "fontSize: isMobilePreview ? '15px' : 'clamp(14px, 3vw, 16px)'"
  ],
  [
    "fontSize: 'clamp(24px, 6vw, 52px)'",
    "fontSize: isMobilePreview ? '30px' : 'clamp(24px, 6vw, 52px)'"
  ],
  [
    "fontSize: 'clamp(16px, 4vw, 18px)'",
    "fontSize: isMobilePreview ? '16px' : 'clamp(16px, 4vw, 18px)'"
  ],
  [
    "fontSize: 'clamp(14px, 3vw, 15px)'",
    "fontSize: isMobilePreview ? '14px' : 'clamp(14px, 3vw, 15px)'"
  ]
]);

console.log('Mobile preview patches applied.');
