const fs = require('fs');

const replaceInFile = (file, replacements) => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes("import { useTranslation } from '@/i18n/I18nProvider'")) {
    content = content.replace("import { cn } from '@/lib/utils'", "import { cn } from '@/lib/utils'\nimport { useTranslation } from '@/i18n/I18nProvider'");
  }
  
  for (const [search, replace] of replacements) {
    if (typeof search === 'string') {
      content = content.split(search).join(replace);
    } else {
      content = content.replace(search, replace);
    }
  }
  fs.writeFileSync(file, content);
};

// 1. TextImageBlock.tsx
const textImageFile = '/Users/mac/.gemini/antigravity/playground/eatery-page-builder/apps/web/src/components/page-builder/blocks/TextImageBlock.tsx';
replaceInFile(textImageFile, [
  [
    "export function TextImagePreview({ config }: { config: TextImageConfig }) {",
    "export function TextImagePreview({ config }: { config: TextImageConfig }) {\n  const { t } = useTranslation()"
  ],
  [
    "const layoutLabels: Record<TextImageLayout, string> = {\n    img_left: 'Image Left',\n    img_right: 'Image Right',\n    stacked: 'Stacked',\n    text_only: 'Text Only',\n    img_only: 'Image Only',\n  }",
    "const layoutLabels: Record<TextImageLayout, string> = {\n    img_left: t('textImageBlock.imgLeft'),\n    img_right: t('textImageBlock.imgRight'),\n    stacked: t('textImageBlock.stacked'),\n    text_only: t('textImageBlock.textOnly'),\n    img_only: t('textImageBlock.imgOnly'),\n  }"
  ],
  [
    "export function TextImageSettings({\n  config,",
    "export function TextImageSettings({\n  config,"
  ],
  [
    "  onChange: (c: TextImageConfig) => void\n}) {",
    "  onChange: (c: TextImageConfig) => void\n}) {\n  const { t } = useTranslation()"
  ],
  [
    "const LAYOUTS: { value: TextImageLayout; label: string }[] = [\n  { value: 'img_left', label: 'Image Left' },\n  { value: 'img_right', label: 'Image Right' },\n  { value: 'stacked', label: 'Stacked' },\n  { value: 'text_only', label: 'Text Only' },\n  { value: 'img_only', label: 'Image Only' },\n]",
    "" // We'll move them inside
  ],
  [
    "const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [\n  { value: 'square', label: 'Square (1:1)' },\n  { value: '4_3', label: '4:3' },\n  { value: '16_9', label: '16:9' },\n  { value: 'free', label: 'Free' },\n]",
    ""
  ],
  [
    "const PADDINGS: { value: PaddingSize; label: string }[] = [\n  { value: 'compact', label: 'Compact' },\n  { value: 'normal', label: 'Normal' },\n  { value: 'spacious', label: 'Spacious' },\n]",
    ""
  ],
  [
    "const BACKGROUNDS: { value: BlockBackground; label: string }[] = [\n  { value: 'transparent', label: 'Transparent' },\n  { value: 'solid', label: 'Solid colour' },\n  { value: 'gradient', label: 'Subtle gradient' },\n]",
    ""
  ],
  [
    "  const [uploading, setUploading] = useState(false)",
    `  const [uploading, setUploading] = useState(false)

  const LAYOUTS: { value: TextImageLayout; label: string }[] = [
    { value: 'img_left', label: t('textImageBlock.imgLeft') },
    { value: 'img_right', label: t('textImageBlock.imgRight') },
    { value: 'stacked', label: t('textImageBlock.stacked') },
    { value: 'text_only', label: t('textImageBlock.textOnly') },
    { value: 'img_only', label: t('textImageBlock.imgOnly') },
  ]

  const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
    { value: 'square', label: t('textImageBlock.square') },
    { value: '4_3', label: t('textImageBlock.4_3') },
    { value: '16_9', label: t('textImageBlock.16_9') },
    { value: 'free', label: t('textImageBlock.free') },
  ]

  const PADDINGS: { value: PaddingSize; label: string }[] = [
    { value: 'compact', label: t('textImageBlock.compact') },
    { value: 'normal', label: t('textImageBlock.normal') },
    { value: 'spacious', label: t('textImageBlock.spacious') },
  ]

  const BACKGROUNDS: { value: BlockBackground; label: string }[] = [
    { value: 'transparent', label: t('textImageBlock.transparent') },
    { value: 'solid', label: t('textImageBlock.solidColour') },
    { value: 'gradient', label: t('textImageBlock.gradient') },
  ]
`
  ],
  ["Text content…", "{t('textImageBlock.textContentPlaceholder')}…"],
  [">Layout</Label>", ">{t('textImageBlock.layout')}</Label>"],
  [">Image</Label>", ">{t('textImageBlock.image')}</Label>"],
  [">Click to upload</span>", ">{t('textImageBlock.clickToUpload')}</span>"],
  [">Aspect ratio</Label>", ">{t('textImageBlock.aspectRatio')}</Label>"],
  [">Image fit</Label>", ">{t('textImageBlock.imageFit')}</Label>"],
  [">Cover<", ">{t('textImageBlock.cover')}<"],
  [">Contain<", ">{t('textImageBlock.contain')}<"],
  [">Content</Label>", ">{t('textImageBlock.content')}</Label>"],
  [">Heading (optional)</Label>", ">{t('textImageBlock.headingOptional')}</Label>"],
  ["placeholder=\"Section title…\"", "placeholder={t('textImageBlock.headingPlaceholder')}"],
  [">Body text</Label>", ">{t('textImageBlock.bodyText')}</Label>"],
  ["placeholder=\"Write your content here…\\nLine breaks are preserved.\"", "placeholder={t('textImageBlock.bodyPlaceholder')}"],
  ["label=\"CTA Button\"", "label={t('textImageBlock.ctaButton')}"],
  ["+ Add CTA button", "{t('textImageBlock.addCta')}"],
  [">Styling</Label>", ">{t('textImageBlock.styling')}</Label>"],
  [">Background</Label>", ">{t('textImageBlock.background')}</Label>"],
  [">Gradient goes top-left → bottom-right</p>", ">{t('textImageBlock.gradientHelp')}</p>"],
  [">Padding</Label>", ">{t('textImageBlock.padding')}</Label>"],
  [">Image roundness</Label>", ">{t('textImageBlock.imageRoundness')}</Label>"],
  [
    `              {([
                { value: 'none', label: 'None' },
                { value: 'sm', label: 'Small' },
                { value: 'md', label: 'Medium' },
                { value: 'lg', label: 'Large' },
                { value: 'xl', label: 'X-Large' },
                { value: 'full', label: 'Pill' },
              ] as { value: BorderRadius; label: string }[]).map(r => (`,
    `              {([
                { value: 'none', label: t('textImageBlock.none') },
                { value: 'sm', label: t('textImageBlock.small') },
                { value: 'md', label: t('textImageBlock.medium') },
                { value: 'lg', label: t('textImageBlock.large') },
                { value: 'xl', label: t('textImageBlock.xlarge') },
                { value: 'full', label: t('textImageBlock.pill') },
              ] as { value: BorderRadius; label: string }[]).map(r => (`
  ]
]);

// 2. ContactBlock.tsx
const contactFile = '/Users/mac/.gemini/antigravity/playground/eatery-page-builder/apps/web/src/components/page-builder/blocks/ContactBlock.tsx';
replaceInFile(contactFile, [
  [
    "export function ContactPreview({ config }: { config: ContactConfig }) {",
    "export function ContactPreview({ config }: { config: ContactConfig }) {\n  const { t } = useTranslation()"
  ],
  [
    "  const items = [\n    config.show_map && 'Map',\n    config.show_phone && 'Phone',\n    config.show_email && 'Email',\n    config.show_address && 'Address',\n    config.show_hours && 'Hours',\n  ].filter(Boolean)",
    "  const items = [\n    config.show_map && t('contactBlock.map'),\n    config.show_phone && t('contactBlock.phoneNumber'),\n    config.show_email && t('contactBlock.emailAddress'),\n    config.show_address && t('contactBlock.physicalAddress'),\n    config.show_hours && t('contactBlock.openingHours'),\n  ].filter(Boolean)"
  ],
  [
    "Socials: {config.socials_shown.length",
    "{t('contactBlock.socialsPreview')} {config.socials_shown.length"
  ],
  [
    "const MAP_HEIGHTS: { value: MapHeight; label: string }[] = [\n  { value: 'small', label: 'Small' },\n  { value: 'medium', label: 'Medium' },\n  { value: 'large', label: 'Large' },\n]",
    ""
  ],
  [
    "export function ContactSettings({\n  config,\n  business,\n  onChange,\n}: {\n  config: ContactConfig\n  business: Business\n  onChange: (c: ContactConfig) => void\n}) {",
    "export function ContactSettings({\n  config,\n  business,\n  onChange,\n}: {\n  config: ContactConfig\n  business: Business\n  onChange: (c: ContactConfig) => void\n}) {\n  const { t } = useTranslation()"
  ],
  [
    "  function set<K extends keyof ContactConfig>(key: K, value: ContactConfig[K]) {",
    `  const MAP_HEIGHTS: { value: MapHeight; label: string }[] = [
    { value: 'small', label: t('contactBlock.small') },
    { value: 'medium', label: t('contactBlock.medium') },
    { value: 'large', label: t('contactBlock.large') },
  ]
  function set<K extends keyof ContactConfig>(key: K, value: ContactConfig[K]) {`
  ],
  [">Layout</Label>", ">{t('contactBlock.layout')}</Label>"],
  [">Stacked<", ">{t('contactBlock.stacked')}<"],
  [">Map Left<", ">{t('contactBlock.mapLeft')}<"],
  [">Appearance</Label>", ">{t('contactBlock.appearance')}</Label>"],
  [">Background</Label>", ">{t('contactBlock.background')}</Label>"],
  [">Text colour</Label>", ">{t('contactBlock.textColour')}</Label>"],
  [">Light<", ">{t('contactBlock.light')}<"],
  [">Dark<", ">{t('contactBlock.dark')}<"],
  [">Map</Label>", ">{t('contactBlock.map')}</Label>"],
  ["label=\"Show map\"", "label={t('contactBlock.showMap')}"],
  [">Map height</Label>", ">{t('contactBlock.mapHeight')}</Label>"],
  ["No address set in business profile — map will not display.", "{t('contactBlock.noAddressSet')}"],
  [">Contact info</Label>", ">{t('contactBlock.contactInfo')}</Label>"],
  ["label=\"Phone number\"", "label={t('contactBlock.phoneNumber')}"],
  ["No phone in business profile.", "{t('contactBlock.noPhoneSet')}"],
  ["label=\"Email address\"", "label={t('contactBlock.emailAddress')}"],
  ["No email in business profile.", "{t('contactBlock.noEmailSet')}"],
  ["label=\"Physical address\"", "label={t('contactBlock.physicalAddress')}"],
  ["label=\"Opening hours\"", "label={t('contactBlock.openingHours')}"],
  [">Social Icons</Label>", ">{t('contactBlock.socialIcons')}</Label>"],
  ["No social links set on the business profile yet. Add them in the Business settings.", "{t('contactBlock.noSocialsSet')}"]
]);

// 3. MenuGridBlock.tsx
const menuGridFile = '/Users/mac/.gemini/antigravity/playground/eatery-page-builder/apps/web/src/components/page-builder/blocks/MenuGridBlock.tsx';
replaceInFile(menuGridFile, [
  [
    "export function MenuGridPreview({ config }: { config: MenuGridConfig }) {",
    "export function MenuGridPreview({ config }: { config: MenuGridConfig }) {\n  const { t } = useTranslation()"
  ],
  [
    "const colMap: Record<string, string> = { '2col': '2 col', '3col': '3 col', '4col': '4 col', list: 'List' }",
    "const colMap: Record<string, string> = { '2col': t('menuGridBlock.col2'), '3col': t('menuGridBlock.col3'), '4col': t('menuGridBlock.col4'), list: t('menuGridBlock.list') }"
  ],
  [
    "{config.heading || 'Menu'}",
    "{config.heading || t('menuGridBlock.menu')}"
  ],
  [
    "{config.show_category_tabs ? 'Tabs on' : 'No tabs'}",
    "{config.show_category_tabs ? t('menuGridBlock.tabsOn') : t('menuGridBlock.noTabs')}"
  ],
  [
    "const LAYOUTS: { value: MenuGridConfig['layout']; label: string }[] = [\n  { value: '2col', label: '2 Col' },\n  { value: '3col', label: '3 Col' },\n  { value: '4col', label: '4 Col' },\n  { value: 'list', label: 'List' },\n]",
    ""
  ],
  [
    "export function MenuGridSettings({ config, categories, items, onChange }: MenuGridSettingsProps) {",
    "export function MenuGridSettings({ config, categories, items, onChange }: MenuGridSettingsProps) {\n  const { t } = useTranslation()"
  ],
  [
    "  function set<K extends keyof MenuGridConfig>(key: K, value: MenuGridConfig[K]) {",
    `  const LAYOUTS: { value: MenuGridConfig['layout']; label: string }[] = [
    { value: '2col', label: t('menuGridBlock.col2') },
    { value: '3col', label: t('menuGridBlock.col3') },
    { value: '4col', label: t('menuGridBlock.col4') },
    { value: 'list', label: t('menuGridBlock.list') },
  ]
  function set<K extends keyof MenuGridConfig>(key: K, value: MenuGridConfig[K]) {`
  ],
  [">Section heading</Label>", ">{t('menuGridBlock.sectionHeading')}</Label>"],
  ["placeholder=\"Our Menu\"", "placeholder={t('menuGridBlock.headingPlaceholder')}"],
  [">Optional title shown above the menu grid.</p>", ">{t('menuGridBlock.headingHelp')}</p>"],
  [">Description</Label>", ">{t('menuGridBlock.description')}</Label>"],
  ["placeholder=\"A short description about this menu section...\"", "placeholder={t('menuGridBlock.descPlaceholder')}"],
  [">Layout</Label>", ">{t('menuGridBlock.layout')}</Label>"],
  [">Selection Mode</Label>", ">{t('menuGridBlock.selectionMode')}</Label>"],
  [">By Category<", ">{t('menuGridBlock.byCategory')}<"],
  [">Custom Items<", ">{t('menuGridBlock.customItems')}<"],
  [">Categories to show</Label>", ">{t('menuGridBlock.categoriesToShow')}</Label>"],
  [">No menu categories yet. Add them in the Menu builder first.</p>", ">{t('menuGridBlock.noCategories')}</p>"],
  [">All categories<", ">{t('menuGridBlock.allCategories')}<"],
  [">(hidden)</span>", ">{t('menuGridBlock.hidden')}</span>"],
  [">Items to show</Label>", ">{t('menuGridBlock.itemsToShow')}</Label>"],
  [">No menu items yet. Add them in the Menu builder first.</p>", ">{t('menuGridBlock.noItems')}</p>"],
  [">(sold out)</span>", ">{t('menuGridBlock.soldOut')}</span>"],
  [">Display options</Label>", ">{t('menuGridBlock.displayOptions')}</Label>"],
  [">Category filter tabs</Label>", ">{t('menuGridBlock.categoryFilterTabs')}</Label>"],
  [">Auto (2+ cats)</span>", ">{t('menuGridBlock.autoCats')}</span>"],
  [
    `          {([
            { key: 'show_image', label: 'Item images' },
            { key: 'show_description', label: 'Item descriptions' },
            { key: 'show_price', label: 'Prices' },
            { key: 'show_unavailable_badge', label: '"Sold Out" badge' },
          ] as { key: keyof MenuGridConfig; label: string }[]).map(({ key, label }) => (`,
    `          {([
            { key: 'show_image', label: t('menuGridBlock.itemImages') },
            { key: 'show_description', label: t('menuGridBlock.itemDescriptions') },
            { key: 'show_price', label: t('menuGridBlock.prices') },
            { key: 'show_unavailable_badge', label: t('menuGridBlock.soldOutBadge') },
          ] as { key: keyof MenuGridConfig; label: string }[]).map(({ key, label }) => (`
  ],
  [">Colours</Label>", ">{t('menuGridBlock.colours')}</Label>"],
  [">Background</Label>", ">{t('menuGridBlock.background')}</Label>"],
  [">Text</Label>", ">{t('menuGridBlock.text')}</Label>"]
]);

console.log('Blocks updated!');
