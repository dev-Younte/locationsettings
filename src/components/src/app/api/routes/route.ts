import { NextResponse } from "next/server";

const SUPABASE_URL = (process.env.SUPABASE_URL || "")
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Helper to check database credentials
const isDbConfigured = () => !!(SUPABASE_URL && SUPABASE_KEY);

// 1. GET: Fetch all routes from Supabase
export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/plogging_routes?order=created_at.desc`, {
      headers: {
        apikey: SUPABASE_KEY!,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      // Disable cache to ensure real-time multi-device sync
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Supabase GET error response:", errText);
      return NextResponse.json({ error: "Failed to fetch from DB" }, { status: res.status });
    }

    const data = await res.json();
    
    // Map DB schema back to client Route model
    const routes = data.map((item: any) => ({
      id: item.id,
      name: item.name,
      createdAt: item.created_at,
      points: typeof item.points === "string" ? JSON.parse(item.points) : item.points,
      color: item.color,
    }));

    return NextResponse.json(routes);
  } catch (err) {
    console.error("DB GET exception:", err);
    return NextResponse.json({ error: "Server Database Connection Error" }, { status: 500 });
  }
}

// 2. POST: Insert new route into Supabase
export async function POST(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { id, name, createdAt, points, color } = body;

    if (!id || !name || !points || points.length === 0) {
      return NextResponse.json({ error: "Invalid route schema" }, { status: 400 });
    }

    // Insert payload mapped to db columns
    const payload = {
      id,
      name,
      created_at: createdAt,
      points: points, // Postgres jsonb handles json object direct insert
      color: color || "#3B82F6",
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/plogging_routes`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY!,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Supabase POST error response:", errText);
      return NextResponse.json({ error: "Failed to save to DB" }, { status: res.status });
    }

    const saved = await res.json();
    return NextResponse.json(saved[0]);
  } catch (err) {
    console.error("DB POST exception:", err);
    return NextResponse.json({ error: "Server Database Connection Error" }, { status: 500 });
  }
}
