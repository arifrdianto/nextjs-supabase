import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Base query for employees
    let query = supabase.from("employees").select(
      `
        *,
        last_education:educations!inner(level),
        person_grade:person_grades!inner(grade),
        job:jobs!inner(name, classification, job_family, sub_job_family, job_type, group_name),
        organization:organizations!inner(name),
        unit:units!inner(name),
        region:regions!inner(name),
        job_grade:job_grades!inner(grade),
        job_history(
          *,
          job:jobs(name, classification, job_family, sub_job_family, job_type, group_name),
          person_grade:person_grades(grade),
          job_grade:job_grades(grade)
        ),
        performance_ratings(*),
        key_talents(*),
        successors(*),
        assessments(*)
      `
    );

    // Name filter
    if (searchParams.get("name")) {
      query = query.ilike("name", `%${searchParams.get("name")}%`);
    }

    // Current Data Filters
    if (searchParams.get("job_name")) {
      query = query.eq("job.name", searchParams.get("job_name"));
    }
    if (searchParams.get("person_grade")) {
      query = query.eq("person_grade.grade", searchParams.get("person_grade"));
    }
    if (searchParams.get("job_grade")) {
      query = query.eq("job_grade.grade", searchParams.get("job_grade"));
    }
    if (searchParams.get("job_group")) {
      query = query.eq("job.group_name", searchParams.get("job_group"));
    }
    if (searchParams.get("job_classification")) {
      query = query.eq(
        "job.classification",
        searchParams.get("job_classification")
      );
    }
    if (searchParams.get("last_education")) {
      query = query.eq(
        "last_education.level",
        searchParams.get("last_education")
      );
    }
    if (searchParams.get("marital_status")) {
      query = query.eq("marital_status", searchParams.get("marital_status"));
    }

    // Age filter
    if (searchParams.get("age_min") || searchParams.get("age_max")) {
      const currentDate = new Date();
      const minAge = searchParams.get("age_min")
        ? parseInt(searchParams.get("age_min")!)
        : 0;
      const maxAge = searchParams.get("age_max")
        ? parseInt(searchParams.get("age_max")!)
        : 100;

      const minBirthDate = new Date(currentDate.getFullYear() - maxAge, 0, 1);
      const maxBirthDate = new Date(currentDate.getFullYear() - minAge, 11, 31);

      query = query
        .gte("birth_date", minBirthDate.toISOString())
        .lte("birth_date", maxBirthDate.toISOString());
    }

    // Retirement date filter
    if (
      searchParams.get("retirement_years_min") ||
      searchParams.get("retirement_years_max")
    ) {
      const currentDate = new Date();
      const minYears = searchParams.get("retirement_years_min")
        ? parseInt(searchParams.get("retirement_years_min")!)
        : 0;
      const maxYears = searchParams.get("retirement_years_max")
        ? parseInt(searchParams.get("retirement_years_max")!)
        : 100;

      const minRetirementDate = new Date(
        currentDate.getFullYear() + minYears,
        0,
        1
      );
      const maxRetirementDate = new Date(
        currentDate.getFullYear() + maxYears,
        11,
        31
      );

      query = query
        .gte("retirement_date", minRetirementDate.toISOString())
        .lte("retirement_date", maxRetirementDate.toISOString());
    }

    // Historical Data Filters
    if (searchParams.get("job_name_hist")) {
      query = query.eq(
        "job_history.job.name",
        searchParams.get("job_name_hist")
      );
    }
    if (searchParams.get("job_classification_hist")) {
      query = query.eq(
        "job_history.job.classification",
        searchParams.get("job_classification_hist")
      );
    }
    if (searchParams.get("person_grade_hist")) {
      query = query.eq(
        "job_history.person_grade.grade",
        searchParams.get("person_grade_hist")
      );
    }
    if (searchParams.get("job_grade_hist")) {
      query = query.eq(
        "job_history.job_grade.grade",
        searchParams.get("job_grade_hist")
      );
    }
    if (searchParams.get("job_group_hist")) {
      query = query.eq(
        "job_history.job.group_name",
        searchParams.get("job_group_hist")
      );
    }
    if (searchParams.get("job_family_hist")) {
      query = query.eq(
        "job_history.job.job_family",
        searchParams.get("job_family_hist")
      );
    }
    if (searchParams.get("sub_job_family_hist")) {
      query = query.eq(
        "job_history.job.sub_job_family",
        searchParams.get("sub_job_family_hist")
      );
    }
    if (searchParams.get("job_type_hist")) {
      query = query.eq(
        "job_history.job.job_type",
        searchParams.get("job_type_hist")
      );
    }
    if (searchParams.get("rating_hist")) {
      query = query.eq(
        "performance_ratings.rating",
        searchParams.get("rating_hist")
      );
    }
    if (searchParams.get("key_talent")) {
      query = query.not("key_talents", "is", null);
    }
    if (searchParams.get("successor")) {
      query = query.not("successors", "is", null);
    }
    if (searchParams.get("assessment")) {
      query = query.ilike(
        "assessments.result",
        `%${searchParams.get("assessment")}%`
      );
    }

    // Order by name
    query = query.order("name");

    const { data: employees, error } = await query;

    if (error) throw error;

    // Calculate duration in current position and person grade
    const employeesWithDuration = employees?.map((employee) => {
      const currentDate = new Date();
      const currentJob = employee.job_history?.[0]; // Use optional chaining since job_history might be null

      const positionDuration = currentJob
        ? Math.floor(
            (currentDate.getTime() -
              new Date(currentJob.start_date).getTime()) /
              (1000 * 60 * 60 * 24 * 30)
          )
        : 0;

      const gradeDuration = currentJob
        ? Math.floor(
            (currentDate.getTime() -
              new Date(currentJob.start_date).getTime()) /
              (1000 * 60 * 60 * 24 * 30)
          )
        : 0;

      return {
        ...employee,
        position_duration_months: positionDuration,
        grade_duration_months: gradeDuration,
      };
    });

    // Apply duration filters if specified
    let filteredEmployees = employeesWithDuration;
    if (
      searchParams.get("position_duration_min") ||
      searchParams.get("position_duration_max")
    ) {
      const minMonths = searchParams.get("position_duration_min")
        ? parseInt(searchParams.get("position_duration_min")!)
        : 0;
      const maxMonths = searchParams.get("position_duration_max")
        ? parseInt(searchParams.get("position_duration_max")!)
        : Infinity;

      filteredEmployees = filteredEmployees?.filter(
        (emp) =>
          emp.position_duration_months >= minMonths &&
          emp.position_duration_months <= maxMonths
      );
    }

    if (
      searchParams.get("grade_duration_min") ||
      searchParams.get("grade_duration_max")
    ) {
      const minMonths = searchParams.get("grade_duration_min")
        ? parseInt(searchParams.get("grade_duration_min")!)
        : 0;
      const maxMonths = searchParams.get("grade_duration_max")
        ? parseInt(searchParams.get("grade_duration_max")!)
        : Infinity;

      filteredEmployees = filteredEmployees?.filter(
        (emp) =>
          emp.grade_duration_months >= minMonths &&
          emp.grade_duration_months <= maxMonths
      );
    }

    return NextResponse.json(filteredEmployees);
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
      .from("employees")
      .insert([body])
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
