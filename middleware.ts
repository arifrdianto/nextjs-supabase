import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "./app/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Only apply to /api routes
  if (!request.nextUrl.pathname.startsWith("/api")) {
    return await updateSession(request);
  }

  // Get the authorization header
  const authHeader = request.headers.get("authorization");

  // Check if the authorization header exists and has the correct format
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure Area"',
      },
    });
  }

  // Get the base64 encoded credentials
  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "ascii"
  );
  const [username, password] = credentials.split(":");

  // Check if the credentials are valid
  // You should replace these with your actual credentials or environment variables
  const validUsername = process.env.BASIC_AUTH_USERNAME || "admin";
  const validPassword = process.env.BASIC_AUTH_PASSWORD || "admin";

  if (username !== validUsername || password !== validPassword) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure Area"',
      },
    });
  }

  // If credentials are valid, continue to the API route
  return await updateSession(request);
}

// Configure the middleware to run only on /api routes
export const config = {
  matcher: "/api/:path*",
};
