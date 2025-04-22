import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const id = searchParams.get("id");
  const supabase = createRouteHandlerClient({ cookies });

  if (!id) {
    return NextResponse.json(
      { error: "Employee ID is required" },
      { status: 400 }
    );
  }

  try {
    const { data: performanceRatings, error } = await supabase
      .from("performance_ratings")
      .select("*")
      .eq("employee_id", id)
      .order("year", { ascending: false });

    if (error) throw error;

    return NextResponse.json(performanceRatings);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const id = searchParams.get("id");
  const supabase = createRouteHandlerClient({ cookies });
  const body = await request.json();

  if (!id) {
    return NextResponse.json(
      { error: "Employee ID is required" },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("performance_ratings")
      .insert([{ ...body, employee_id: id }])
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
