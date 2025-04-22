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
    const { data: jobHistory, error } = await supabase
      .from("job_history")
      .select(
        `
        *,
        job:jobs(name, classification, job_family, sub_job_family, job_type, group_name),
        organization:organizations(name),
        unit:units(name),
        region:regions(name),
        person_grade:person_grades(grade),
        job_grade:job_grades(grade)
      `
      )
      .eq("employee_id", id)
      .order("start_date", { ascending: false });

    if (error) throw error;

    return NextResponse.json(jobHistory);
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
      .from("job_history")
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
