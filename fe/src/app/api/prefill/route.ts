import { NextRequest } from "next/server";

const BE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  let url: string;
  try {
    ({ url } = await req.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  // Normalise to bare domain — strip protocol and path
  const domain = url
    .trim()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .trim();

  if (!domain) {
    return Response.json({ error: "Invalid domain" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BE_URL}/prefill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        { error: data.detail ?? "Backend error" },
        { status: res.status }
      );
    }

    return Response.json(data);
  } catch {
    return Response.json(
      { error: "Could not reach the analysis service. Is the backend running?" },
      { status: 502 }
    );
  }
}
