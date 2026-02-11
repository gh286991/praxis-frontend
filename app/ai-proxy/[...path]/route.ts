import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // Set max duration to 60 seconds (for Vercel/Next.js)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  // Ensure we use the correct backend URL with /api prefix if needed.
  // In .env, NEXT_PUBLIC_BACKEND_URL is http://localhost:3001/api
  // If env is missing, default to http://localhost:3001/api
  const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001/api";
  
  // Clean up double slashes just in case
  const baseUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
  const requestPath = path.join("/");
  
  const targetUrl = `${baseUrl}/${requestPath}`;

  console.log(`[Proxy] Forwarding request to: ${targetUrl}`);
  console.log(`[Proxy] Using Env URL: ${process.env.NEXT_PUBLIC_BACKEND_URL}`);

  try {
    const body = await request.json();
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("connection");

    // Important: Don't set timeouts here. Let fetch wait indefinitely (or until Node/Vercel limit).
    // The maxDuration export handles the Vercel/Next.js function limit.
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
        console.error(`[Proxy] Backend error: ${response.status} ${response.statusText}`);
        return NextResponse.json(
            { error: `Backend error: ${response.statusText}` },
            { status: response.status }
        );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Proxy] Error forwarding request:", error);
    return NextResponse.json(
      { error: "Internal Server Error during proxying" },
      { status: 500 }
    );
  }
}
