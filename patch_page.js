const fs = require('fs');
const file = 'apps/web/src/app/[slug]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the vGroups fetch
const oldVGroups = `      const [{ data: vGroups }] = await Promise.all([
        db.from('menu_item_variant_groups').select('*').in('item_id', itemIds).order('sort_order'),
      ])
      variantGroups = vGroups ?? []`;

const newVGroups = `      variantGroups = []
      for (let i = 0; i < itemIds.length; i += 50) {
        const chunk = itemIds.slice(i, i + 50)
        const { data: vGroups } = await db.from('menu_item_variant_groups').select('*').in('item_id', chunk).order('sort_order')
        if (vGroups) variantGroups.push(...vGroups)
      }`;

content = content.replace(oldVGroups, newVGroups);

// Replace the vOpts fetch
const oldVOpts = `        const { data: vOpts } = await db.from('menu_item_variant_options').select('*').in('group_id', groupIds).order('sort_order')
        variantOptions = vOpts ?? []`;

const newVOpts = `        variantOptions = []
        for (let i = 0; i < groupIds.length; i += 50) {
          const chunk = groupIds.slice(i, i + 50)
          const { data: vOpts } = await db.from('menu_item_variant_options').select('*').in('group_id', chunk).order('sort_order')
          if (vOpts) variantOptions.push(...vOpts)
        }`;

content = content.replace(oldVOpts, newVOpts);
fs.writeFileSync(file, content);
