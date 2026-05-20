import { readFileSync, writeFileSync } from 'fs';

const path = 'apps/web/src/app/(dashboard)/dashboard/page.tsx';
let content = readFileSync(path, 'utf8');

// Add CheckCircle2 import
content = content.replace('Eye, BarChart3 } from \'lucide-react\'', 'Eye, BarChart3, CheckCircle2 } from \'lucide-react\'');

// Add data fetching
const fetchCode = `  const [
    { data: publishing },
    { count: menuCount },
    { count: blocksCount },
  ] = await Promise.all([
    db.from('publishing_settings').select('published').eq('business_id', business.id).single(),
    db.from('menu_categories').select('*', { count: 'exact', head: true }).eq('business_id', business.id),
    db.from('page_blocks').select('*', { count: 'exact', head: true }).eq('business_id', business.id),
  ])

  const stepsComplete = {
    businessProfile: !!(business.logo_url || business.address || business.phone),
    menu: (menuCount ?? 0) > 0,
    pageBuilder: (blocksCount ?? 0) > 0,
    publish: publishing?.published === true,
  }

  const CORE_STEPS = [`;

content = content.replace('  const CORE_STEPS = [', fetchCode);

// Add isComplete to CORE_STEPS items
content = content.replace(
  "icon: Store,\n    },",
  "icon: Store,\n      isComplete: stepsComplete.businessProfile,\n    },"
).replace(
  "icon: UtensilsCrossed,\n    },",
  "icon: UtensilsCrossed,\n      isComplete: stepsComplete.menu,\n    },"
).replace(
  "icon: Palette,\n    },",
  "icon: Palette,\n      isComplete: stepsComplete.pageBuilder,\n    },"
).replace(
  "icon: Globe,\n    },",
  "icon: Globe,\n      isComplete: stepsComplete.publish,\n    },"
);

// Update select to include logo_url, address, phone
content = content.replace(
  "select('id, name')",
  "select('id, name, logo_url, address, phone')"
);

// Add checkmark to UI
const uiOld = `                  <span className="text-xs font-semibold text-muted-foreground/50">
                    0{idx + 1}
                  </span>`;
const uiNew = `                  {step.isComplete ? (
                    <span className="text-green-600 bg-green-100 p-1 rounded-full"><CheckCircle2 className="size-3.5" /></span>
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground/50">0{idx + 1}</span>
                  )}`;

content = content.replace(uiOld, uiNew);

writeFileSync(path, content);
