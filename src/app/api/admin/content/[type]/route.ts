import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ensureSchema } from "@/lib/schema";

export const dynamic = "force-dynamic";

type FieldType = "text" | "int" | "bool" | "array" | "json";

type TableSchema = {
  table: string;
  order: string;
  fields: Record<string, FieldType>;
  nullable?: string[];
};

const SCHEMAS: Record<string, TableSchema> = {
  buses: {
    table: "buses",
    order: "sort_order ASC, id ASC",
    nullable: ["year"],
    fields: {
      slug: "text", name: "text", brand: "text", model: "text", seats: "int", year: "int",
      bus_type: "text", description: "text", specs: "array", rental_terms: "text",
      price: "text", price_unit: "text", photos: "array", main_photo: "text",
      sort_order: "int", active: "bool",
    },
  },
  services: {
    table: "services",
    order: "sort_order ASC, id ASC",
    fields: { slug: "text", name: "text", description: "text", icon: "text", image: "text", sort_order: "int", active: "bool" },
  },
  advantages: {
    table: "advantages",
    order: "sort_order ASC, id ASC",
    fields: { title: "text", text: "text", icon: "text", sort_order: "int", active: "bool" },
  },
  steps: {
    table: "steps",
    order: "sort_order ASC, id ASC",
    fields: { title: "text", description: "text", icon: "text", sort_order: "int", active: "bool" },
  },
  types: {
    table: "content_types",
    order: "sort_order ASC, id ASC",
    fields: { slug: "text", name: "text", description: "text", icon: "text", fields: "json", sort_order: "int", active: "bool" },
  },
  items: {
    table: "content_items",
    order: "sort_order ASC, id ASC",
    fields: { type_slug: "text", data: "json", sort_order: "int", active: "bool" },
  },
};

function coerce(type: FieldType, value: any, nullable = false) {
  if (value === undefined) return undefined;
  switch (type) {
    case "int": {
      if (value === null || value === "") return nullable ? null : 0;
      const n = parseInt(String(value), 10);
      return Number.isFinite(n) ? n : nullable ? null : 0;
    }
    case "bool":
      return !(value === false || value === "false" || value === 0 || value === "0");
    case "array":
      return Array.isArray(value) ? value.map((x) => String(x)) : [];
    case "json":
      // jsonb columns need an explicit JSON string (pg would turn JS arrays into Postgres arrays)
      if (typeof value === "string") {
        try {
          JSON.parse(value);
          return value;
        } catch {
          return "[]";
        }
      }
      return JSON.stringify(value ?? (Array.isArray(value) ? [] : {}));
    default:
      return value === null || value === undefined ? "" : String(value);
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  if (!requireAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { type } = await params;

  try {
    await ensureSchema();

    if (type === "settings") {
      const rows = await sql(`SELECT key, value FROM site_settings ORDER BY key ASC`);
      return NextResponse.json(rows);
    }
    if (type === "applications") {
      const url = new URL(request.url);
      const status = url.searchParams.get("status");
      const rows = status
        ? await sql(`SELECT * FROM applications WHERE status = $1 ORDER BY id DESC`, [status])
        : await sql(`SELECT * FROM applications ORDER BY id DESC`);
      return NextResponse.json(rows);
    }

    const schema = SCHEMAS[type];
    if (!schema) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    const rows = await sql(`SELECT * FROM ${schema.table} ORDER BY ${schema.order}`);
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ type: string }> }) {
  if (!requireAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { type } = await params;

  try {
    await ensureSchema();
    const body = await request.json();

    if (type === "settings") {
      const entries = Array.isArray(body) ? body : [body];
      for (const entry of entries) {
        if (!entry?.key) continue;
        await sql(
          `INSERT INTO site_settings (key, value) VALUES ($1,$2)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          [String(entry.key), String(entry.value ?? "")]
        );
      }
      return NextResponse.json({ success: true });
    }

    if (type === "applications") {
      const r = await sql(
        `INSERT INTO applications (name, phone, email, bus, route, passengers, message, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [body.name || "", body.phone || "", body.email || "", body.bus || "", body.route || "", body.passengers || "", body.message || "", body.status || "new"]
      );
      return NextResponse.json({ success: true, id: r[0]?.id });
    }

    const schema = SCHEMAS[type];
    if (!schema) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    const cols: string[] = [];
    const placeholders: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const [col, ftype] of Object.entries(schema.fields)) {
      const v = coerce(ftype, body[col], schema.nullable?.includes(col));
      if (v === undefined) continue;
      cols.push(col);
      placeholders.push(`$${i++}`);
      values.push(v);
    }
    if (!cols.length) return NextResponse.json({ error: "Немає даних" }, { status: 400 });

    const r = await sql(
      `INSERT INTO ${schema.table} (${cols.join(",")}) VALUES (${placeholders.join(",")}) RETURNING id`,
      values
    );
    return NextResponse.json({ success: true, id: r[0]?.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ type: string }> }) {
  if (!requireAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { type } = await params;

  try {
    await ensureSchema();
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "ID обов'язковий" }, { status: 400 });

    if (type === "applications") {
      await sql(`UPDATE applications SET status = $1 WHERE id = $2`, [data.status || "new", id]);
      return NextResponse.json({ success: true });
    }
    if (type === "settings") {
      return NextResponse.json({ error: "Use POST for settings" }, { status: 400 });
    }

    const schema = SCHEMAS[type];
    if (!schema) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    const sets: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const [col, ftype] of Object.entries(schema.fields)) {
      if (!(col in data)) continue;
      const v = coerce(ftype, data[col], schema.nullable?.includes(col));
      sets.push(`${col} = $${i++}`);
      values.push(v);
    }
    if (!sets.length) return NextResponse.json({ error: "Немає даних" }, { status: 400 });

    values.push(parseInt(String(id), 10));
    await sql(`UPDATE ${schema.table} SET ${sets.join(", ")} WHERE id = $${i}`, values);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ type: string }> }) {
  if (!requireAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { type } = await params;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID обов'язковий" }, { status: 400 });

  try {
    await ensureSchema();
    if (type === "applications") {
      await sql(`DELETE FROM applications WHERE id = $1`, [parseInt(id, 10)]);
      return NextResponse.json({ success: true });
    }
    const schema = SCHEMAS[type];
    if (!schema) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    await sql(`DELETE FROM ${schema.table} WHERE id = $1`, [parseInt(id, 10)]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
