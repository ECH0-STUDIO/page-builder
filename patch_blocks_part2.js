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

// 1. NavbarBlock.tsx
const navbarFile = '/Users/mac/.gemini/antigravity/playground/eatery-page-builder/apps/web/src/components/page-builder/blocks/NavbarBlock.tsx';
replaceInFile(navbarFile, [
  [
    "export function NavbarPreview({ config }: { config: NavbarConfig }) {",
    "export function NavbarPreview({ config }: { config: NavbarConfig }) {\n  const { t } = useTranslation()"
  ],
  [
    "Logo\n        </div>",
    "{t('navbarBlock.logo')}\n        </div>"
  ],
  [
    "No links",
    "{t('navbarBlock.noLinks')}"
  ],
  [
    "export function NavbarSettings({\n  config,\n  businessId,\n  blocks,\n  onChange,\n}: {\n  config: NavbarConfig\n  businessId: string\n  /** Current page blocks so anchors can reference them */\n  blocks: PageBlock[]\n  onChange: (c: NavbarConfig) => void\n}) {",
    "export function NavbarSettings({\n  config,\n  businessId,\n  blocks,\n  onChange,\n}: {\n  config: NavbarConfig\n  businessId: string\n  /** Current page blocks so anchors can reference them */\n  blocks: PageBlock[]\n  onChange: (c: NavbarConfig) => void\n}) {\n  const { t } = useTranslation()"
  ],
  [
    "toast.success('Navbar saved')",
    "toast.success(t('navbarBlock.navbarSaved'))"
  ],
  [
    "toast.error('Save failed: ' + result.error)",
    "toast.error(t('navbarBlock.saveFailed') + ' ' + result.error)"
  ],
  [
    "{saving ? 'Saving…' : 'Save navbar'}",
    "{saving ? t('navbarBlock.saving') : t('navbarBlock.saveNavbar')}"
  ],
  [">Logo / Brand</Label>", ">{t('navbarBlock.logoBrand')}</Label>"],
  [
    `{([
            { value: 'business_name', label: 'Name' },
            { value: 'logo_image', label: 'Image' },
          ] as { value: NavbarConfig['logo_type']; label: string }[])`,
    `{([
            { value: 'business_name', label: t('navbarBlock.name') },
            { value: 'logo_image', label: t('navbarBlock.image') },
          ] as { value: NavbarConfig['logo_type']; label: string }[])`
  ],
  [">Navigation Links</Label>", ">{t('navbarBlock.navLinks')}</Label>"],
  [
    "link{config.links.length !== 1 ? 's' : ''}",
    "{config.links.length !== 1 ? t('navbarBlock.linksCount') : t('navbarBlock.linkCount')}"
  ],
  ["No links yet.", "{t('navbarBlock.noLinksYet')}"],
  ["placeholder=\"Link label\"", "placeholder={t('navbarBlock.linkLabel')}"],
  [
    ">Scroll to section</Label>",
    ">{t('navbarBlock.scrollToSection')}</Label>"
  ],
  [
    ">Scroll to block</Label>",
    ">{t('navbarBlock.scrollToBlock')}</Label>"
  ],
  [
    "placeholder=\"Select a section…\"",
    "placeholder={t('navbarBlock.selectSection')}"
  ],
  [
    "Will scroll to that section when clicked.",
    "{t('navbarBlock.scrollHelp')}"
  ],
  [
    "Add more blocks to the page first, then you can scroll-link to them.",
    "{t('navbarBlock.addBlocksFirst')}"
  ],
  [
    "placeholder=\"https://… or /page-path\"",
    "placeholder={t('navbarBlock.urlPlaceholder')}"
  ],
  ["Add link", "{t('navbarBlock.addLink')}"],
  [">Appearance</Label>", ">{t('navbarBlock.appearance')}</Label>"],
  [">Background</Label>", ">{t('navbarBlock.background')}</Label>"],
  [">Link colour</Label>", ">{t('navbarBlock.linkColour')}</Label>"],
  [">White</button>", ">{t('navbarBlock.white')}</button>"],
  [">Dark</button>", ">{t('navbarBlock.dark')}</button>"],
  [">Glass</button>", ">{t('navbarBlock.glass')}</button>"],
  [">Sticky navbar</Label>", ">{t('navbarBlock.stickyNavbar')}</Label>"],
  ["Sticks to top while scrolling", "{t('navbarBlock.stickyHelp')}"]
]);

// 2. FooterBlock.tsx
const footerFile = '/Users/mac/.gemini/antigravity/playground/eatery-page-builder/apps/web/src/components/page-builder/blocks/FooterBlock.tsx';
replaceInFile(footerFile, [
  [
    "export function FooterSettings({\n  config,\n  onChange,\n}: {\n  config: FooterConfig\n  onChange: (config: FooterConfig) => void\n}) {",
    "export function FooterSettings({\n  config,\n  onChange,\n}: {\n  config: FooterConfig\n  onChange: (config: FooterConfig) => void\n}) {\n  const { t } = useTranslation()"
  ],
  [
    "import { Separator } from '@/components/ui/separator'",
    "import { Separator } from '@/components/ui/separator'\nimport { useTranslation } from '@/i18n/I18nProvider'"
  ],
  [">Footer Settings</h3>", ">{t('footerBlock.footerSettings')}</h3>"],
  ["Appears at the bottom of your page.", "{t('footerBlock.appearsBottom')}"],
  [">Show business name</Label>", ">{t('footerBlock.showBusinessName')}</Label>"],
  [">Copyright Text</Label>", ">{t('footerBlock.copyrightText')}</Label>"],
  [">Colours</Label>", ">{t('footerBlock.colours')}</Label>"],
  [">Background</Label>", ">{t('footerBlock.background')}</Label>"],
  [">Text</Label>", ">{t('footerBlock.text')}</Label>"]
]);

// 3. QRCodeBlock.tsx
const qrCodeFile = '/Users/mac/.gemini/antigravity/playground/eatery-page-builder/apps/web/src/components/page-builder/blocks/QRCodeBlock.tsx';
replaceInFile(qrCodeFile, [
  [
    "export function QRCodePreview({ config }: { config: QRCodeConfig }) {",
    "export function QRCodePreview({ config }: { config: QRCodeConfig }) {\n  const { t } = useTranslation()"
  ],
  [
    "{config.label || 'QR Code'}",
    "{config.label || t('qrCodeBlock.qrCode')}"
  ],
  [
    "function SettingsPanelQR({ url }: { url: string }) {",
    "function SettingsPanelQR({ url }: { url: string }) {\n  const { t } = useTranslation()"
  ],
  [
    ">QR</div>",
    ">{t('qrCodeBlock.qrLoading')}</div>"
  ],
  [
    "const SIZES: { value: QRCodeConfig['size']; label: string }[] = [\n  { value: 'sm', label: 'Small' },\n  { value: 'md', label: 'Medium' },\n  { value: 'lg', label: 'Large' },\n]",
    ""
  ],
  [
    "const ALIGNMENTS: { value: QRCodeConfig['alignment']; label: string }[] = [\n  { value: 'left', label: 'Left' },\n  { value: 'center', label: 'Center' },\n  { value: 'right', label: 'Right' },\n]",
    ""
  ],
  [
    "export function QRCodeSettings({ config, businessSlug, onChange }: QRCodeSettingsProps) {",
    "export function QRCodeSettings({ config, businessSlug, onChange }: QRCodeSettingsProps) {\n  const { t } = useTranslation()"
  ],
  [
    "  function set<K extends keyof QRCodeConfig>(key: K, value: QRCodeConfig[K]) {",
    `  const SIZES: { value: QRCodeConfig['size']; label: string }[] = [
    { value: 'sm', label: t('qrCodeBlock.small') },
    { value: 'md', label: t('qrCodeBlock.medium') },
    { value: 'lg', label: t('qrCodeBlock.large') },
  ]
  const ALIGNMENTS: { value: QRCodeConfig['alignment']; label: string }[] = [
    { value: 'left', label: t('qrCodeBlock.left') },
    { value: 'center', label: t('qrCodeBlock.center') },
    { value: 'right', label: t('qrCodeBlock.right') },
  ]
  function set<K extends keyof QRCodeConfig>(key: K, value: QRCodeConfig[K]) {`
  ],
  [">QR target</Label>", ">{t('qrCodeBlock.qrTarget')}</Label>"],
  [
    `          {([
            { value: 'page' as const, label: 'My page' },
            { value: 'custom' as const, label: 'Custom URL' },
          ]).map(o => (`,
    `          {([
            { value: 'page' as const, label: t('qrCodeBlock.myPage') },
            { value: 'custom' as const, label: t('qrCodeBlock.customUrl') },
          ]).map(o => (`
  ],
  [">Label</Label>", ">{t('qrCodeBlock.label')}</Label>"],
  ["placeholder=\"Scan to view our menu\"", "placeholder={t('qrCodeBlock.scanToView')}"],
  [">Size</Label>", ">{t('qrCodeBlock.size')}</Label>"],
  [">Alignment</Label>", ">{t('qrCodeBlock.alignment')}</Label>"],
  [">Show download button</Label>", ">{t('qrCodeBlock.showDownload')}</Label>"],
  [">Colours</Label>", ">{t('qrCodeBlock.colours')}</Label>"],
  [">Background</Label>", ">{t('qrCodeBlock.background')}</Label>"],
  [">QR colour</Label>", ">{t('qrCodeBlock.qrColour')}</Label>"]
]);

// 4. CtaEditor.tsx
const ctaFile = '/Users/mac/.gemini/antigravity/playground/eatery-page-builder/apps/web/src/components/page-builder/blocks/CtaEditor.tsx';
replaceInFile(ctaFile, [
  [
    "const ACTION_LABELS: Record<CtaAction, string> = {\n  url: 'URL',\n  tel: 'Phone',\n  email: 'Email',\n  anchor: 'Scroll to',\n}",
    ""
  ],
  [
    "const STYLE_OPTIONS: { value: CtaStyle; label: string }[] = [\n  { value: 'filled', label: 'Filled' },\n  { value: 'outlined', label: 'Outlined' },\n  { value: 'text', label: 'Text link' },\n]",
    ""
  ],
  [
    "export function CtaEditor({\n  value,\n  label: fieldLabel,\n  blocks,\n  onChange,\n  onRemove,\n}: {\n  value: CtaButton\n  label: string\n  /** Full block list — used to populate the 'scroll to' section dropdown */\n  blocks: PageBlock[]\n  onChange: (v: CtaButton) => void\n  onRemove: () => void\n}) {",
    "export function CtaEditor({\n  value,\n  label: fieldLabel,\n  blocks,\n  onChange,\n  onRemove,\n}: {\n  value: CtaButton\n  label: string\n  /** Full block list — used to populate the 'scroll to' section dropdown */\n  blocks: PageBlock[]\n  onChange: (v: CtaButton) => void\n  onRemove: () => void\n}) {\n  const { t } = useTranslation()"
  ],
  [
    "  const anchorOptions = getAnchorOptions(blocks)",
    `  const ACTION_LABELS: Record<CtaAction, string> = {
    url: t('ctaEditor.url'),
    tel: t('ctaEditor.phone'),
    email: t('ctaEditor.email'),
    anchor: t('ctaEditor.scrollTo'),
  }
  const STYLE_OPTIONS: { value: CtaStyle; label: string }[] = [
    { value: 'filled', label: t('ctaEditor.filled') },
    { value: 'outlined', label: t('ctaEditor.outlined') },
    { value: 'text', label: t('ctaEditor.textLink') },
  ]
  const anchorOptions = getAnchorOptions(blocks)`
  ],
  ["placeholder=\"Button label\"", "placeholder={t('ctaEditor.buttonLabel')}"],
  [">Scroll to section</Label>", ">{t('ctaEditor.scrollToSection')}</Label>"],
  ["placeholder=\"Select a section…\"", "placeholder={t('ctaEditor.selectSection')}"],
  [
    "No sections with an anchor ID yet. Set a <strong>Section ID</strong> on any block using the input below the block settings.",
    "<span dangerouslySetInnerHTML={{ __html: t('ctaEditor.noAnchorIds') }} />"
  ]
]);

console.log('Second batch of blocks updated!');
