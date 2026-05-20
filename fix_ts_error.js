const fs = require('fs');

const file = 'apps/web/src/components/page-builder/EditorShell.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update LiveBlockCard definition
content = content.replace(
  `function LiveBlockCard({
  block, isSelected, business, menuGridData, onClick,
}: {
  block: PageBlock
  isSelected: boolean
  business: Business
  menuGridData: MenuGridData
  onClick: () => void
}) {`,
  `function LiveBlockCard({
  block, isSelected, business, menuGridData, onClick, isMobilePreview,
}: {
  block: PageBlock
  isSelected: boolean
  business: Business
  menuGridData: MenuGridData
  onClick: () => void
  isMobilePreview?: boolean
}) {`
);

// Update HeroRender usage inside LiveBlockCard
content = content.replace(
  "{block.type === 'hero' && <HeroRender config={block.config as HeroConfig} businessName={business.name} isMobilePreview={viewMode === 'mobile'} />}",
  "{block.type === 'hero' && <HeroRender config={block.config as HeroConfig} businessName={business.name} isMobilePreview={isMobilePreview} />}"
);

// Update MenuGridRender usage inside LiveBlockCard
content = content.replace(
  `        {block.type === 'menu_grid' && (
          <MenuGridRender
            config={block.config as MenuGridConfig}
            data={block.data as MenuGridData}
            isMobilePreview={viewMode === 'mobile'}
          />
        )}`,
  `        {block.type === 'menu_grid' && (
          <MenuGridRender
            config={block.config as MenuGridConfig}
            data={block.data as MenuGridData}
            isMobilePreview={isMobilePreview}
          />
        )}`
);

// Update LiveBlockCard instantiation
content = content.replace(
  `                  <LiveBlockCard
                    key={block.id}
                    block={block}
                    isSelected={selectedBlockId === block.id}
                    business={business}
                    menuGridData={menuGridData}
                    onClick={() => {`,
  `                  <LiveBlockCard
                    key={block.id}
                    block={block}
                    isSelected={selectedBlockId === block.id}
                    business={business}
                    menuGridData={menuGridData}
                    isMobilePreview={viewMode === 'mobile'}
                    onClick={() => {`
);

fs.writeFileSync(file, content);
console.log('Fixed TS error');
