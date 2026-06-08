import { NextResponse } from "next/server";

// GET /api/geocode?lat=..&lng=.. — best-effort reverse geocoding via OpenStreetMap
// Nominatim. Proxied server-side so we can set a User-Agent (per their usage policy)
// and avoid CORS. Always resolves to { address: string | null } and never throws.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  if (!lat || !lng) {
    return NextResponse.json({ address: null });
  }

  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
      `&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}` +
      `&zoom=18&addressdetails=1`;

    const res = await fetch(url, {
      headers: { "User-Agent": "CrystalClearCRM/1.0 (local CRM app)" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ address: null });

    const data = await res.json();
    const a = data.address ?? {};
    const houseStreet = [a.house_number, a.road].filter(Boolean).join(" ");
    const cityLine = [a.city || a.town || a.village || a.hamlet, a.state]
      .filter(Boolean)
      .join(", ");
    const short = [houseStreet, cityLine].filter(Boolean).join(", ");

    return NextResponse.json({ address: short || data.display_name || null });
  } catch {
    return NextResponse.json({ address: null });
  }
}
