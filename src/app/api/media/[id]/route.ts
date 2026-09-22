import sql from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (!Number.isFinite(numId)) return new Response("Not found", { status: 404 });

  const rows = await sql(`SELECT mime, data FROM media WHERE id = $1`, [numId]);
  if (!rows.length) return new Response("Not found", { status: 404 });

  const buffer = Buffer.from(rows[0].data, "base64");
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": rows[0].mime || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
