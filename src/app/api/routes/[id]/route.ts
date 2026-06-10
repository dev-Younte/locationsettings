import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isDbConfigured = () => !!(SUPABASE_URL && SUPABASE_KEY);

// 1. PATCH/PUT: Update route name or color in Supabase
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const { id } = params;

  try {
    const body = await req.json();
    const { name, color } = body;

    // Build patches payload
    const payload: Record<string, any> = {};
    if (name !== undefined) payload.name = name;
    if (color !== undefined) payload.color = color;

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/plogging_routes?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY!,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Supabase PATCH error response:", errText);
      return NextResponse.json({ error: "Failed to update DB" }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DB PATCH exception:", err);
    return NextResponse.json({ error: "Server Database Connection Error" }, { status: 500 });
  }
}

// 2. DELETE: Delete route from Supabase
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const { id } = params;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/plogging_routes?id=eq.${id}`, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_KEY!,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Supabase DELETE error response:", errText);
      return NextResponse.json({ error: "Failed to delete from DB" }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DB DELETE exception:", err);
    return NextResponse.json({ error: "Server Database Connection Error" }, { status: 500 });
  }
}
