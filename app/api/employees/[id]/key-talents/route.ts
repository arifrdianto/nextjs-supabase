import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const employee_id = searchParams.get("employee_id");
  const supabase = createRouteHandlerClient({ cookies });

  if (!employee_id) {
    return NextResponse.json(
      { error: "Employee ID is required" },
      { status: 400 }
    );
  }

  try {
    const { data: keyTalents, error } = await supabase
      .from("key_talents")
      .select("*")
      .eq("employee_id", employee_id)
      .order("year", { ascending: false });

    if (error) throw error;

    return NextResponse.json(keyTalents);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await request.json();

  try {
    const { data, error } = await supabase
      .from("key_talents")
      .insert([{ ...body }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
