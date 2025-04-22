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
    const { data: employee, error } = await supabase
      .from("employees")
      .select(
        `
        *,
        last_education:educations(level),
        person_grade:person_grades(grade),
        job:jobs(name, classification, job_family, sub_job_family, job_type, group_name),
        organization:organizations(name),
        unit:units(name),
        region:regions(name),
        job_grade:job_grades(grade)
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json(employee);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: Request) {
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
      .from("employees")
      .update(body)
      .eq("id", id)
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

export async function DELETE(request: Request) {
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
    const { error } = await supabase.from("employees").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Employee deleted successfully" });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
