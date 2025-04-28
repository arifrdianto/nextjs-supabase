import { NextResponse } from "next/server";
// import { createClient } from "@/app/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // extract the token with decode btoa
    const decodedToken = Buffer.from(token.split(".")[1], "base64").toString(
      "utf-8"
    );
    const decodedTokenJson = JSON.parse(decodedToken);

    if (!decodedTokenJson) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        message: "Authentication successful",
        data: decodedTokenJson,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Internal server error", message: errorMessage },
      { status: 500 }
    );
  }
}
