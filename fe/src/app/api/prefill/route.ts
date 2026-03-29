import { NextRequest } from "next/server";
import { researchCompany } from "@/lib/server/prefill-engine";

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
    const data = await researchCompany(domain);
    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
