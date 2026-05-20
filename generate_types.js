const fs = require('fs');
const spec = require('./openapi.json');

const tsTypes = {
  string: 'string',
  integer: 'number',
  number: 'number',
  boolean: 'boolean',
  array: 'any[]',
  object: 'Json'
};

function mapType(prop) {
  if (prop.type === 'array' && prop.items && prop.items.type) {
    return tsTypes[prop.items.type] + '[]';
  }
  return tsTypes[prop.type] || 'any';
}

let code = `export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
`;

for (const [tableName, definition] of Object.entries(spec.definitions)) {
  code += `      ${tableName}: {\n`;
  code += `        Row: {\n`;
  for (const [propName, prop] of Object.entries(definition.properties)) {
    const isNullable = !definition.required || !definition.required.includes(propName);
    code += `          ${propName}: ${mapType(prop)}${isNullable ? ' | null' : ''}\n`;
  }
  code += `        }\n`;

  code += `        Insert: {\n`;
  for (const [propName, prop] of Object.entries(definition.properties)) {
    const isNullable = !definition.required || !definition.required.includes(propName);
    const isOptional = isNullable || propName === 'id' || propName === 'created_at' || propName === 'updated_at' || prop.default !== undefined;
    code += `          ${propName}${isOptional ? '?' : ''}: ${mapType(prop)}${isNullable ? ' | null' : ''}\n`;
  }
  code += `        }\n`;

  code += `        Update: {\n`;
  for (const [propName, prop] of Object.entries(definition.properties)) {
    const isNullable = !definition.required || !definition.required.includes(propName);
    code += `          ${propName}?: ${mapType(prop)}${isNullable ? ' | null' : ''}\n`;
  }
  code += `        }\n`;
  
  let relationships = [];
  if (tableName === 'business_members') {
    relationships.push('{ foreignKeyName: "business_members_business_id_fkey", columns: ["business_id"], isOneToOne: false, referencedRelation: "businesses", referencedColumns: ["id"] }');
    relationships.push('{ foreignKeyName: "business_members_user_id_fkey", columns: ["user_id"], isOneToOne: false, referencedRelation: "users", referencedColumns: ["id"] }');
  } else if (tableName === 'orders') {
    relationships.push('{ foreignKeyName: "orders_business_id_fkey", columns: ["business_id"], isOneToOne: false, referencedRelation: "businesses", referencedColumns: ["id"] }');
  } else if (tableName === 'order_items') {
    relationships.push('{ foreignKeyName: "order_items_order_id_fkey", columns: ["order_id"], isOneToOne: false, referencedRelation: "orders", referencedColumns: ["id"] }');
  } else if (tableName === 'team_invitations') {
    relationships.push('{ foreignKeyName: "team_invitations_business_id_fkey", columns: ["business_id"], isOneToOne: false, referencedRelation: "businesses", referencedColumns: ["id"] }');
  } else if (tableName === 'page_views') {
    relationships.push('{ foreignKeyName: "page_views_business_id_fkey", columns: ["business_id"], isOneToOne: false, referencedRelation: "businesses", referencedColumns: ["id"] }');
  } else if (tableName === 'businesses') {
    relationships.push('{ foreignKeyName: "businesses_owner_id_fkey", columns: ["owner_id"], isOneToOne: false, referencedRelation: "users", referencedColumns: ["id"] }');
  }

  code += `        Relationships: [\n          ${relationships.join(',\n          ')}\n        ]\n`;
  code += `      }\n`;
}

code += `    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
`;

fs.writeFileSync('apps/web/src/types/database.ts', code);
console.log('Types generated natively!');
