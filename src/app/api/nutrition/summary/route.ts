// app/api/nutrition/summary/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "daily";
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const limit = parseInt(url.searchParams.get("limit") || "30");

    let data, error;

    switch (period) {
      case "daily":
        let dailyQuery = supabase
          .from("daily_nutrition_summary")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(limit);

        if (startDate) {
          dailyQuery = dailyQuery.gte("date", startDate);
        }

        if (endDate) {
          dailyQuery = dailyQuery.lte("date", endDate);
        }

        const dailyResult = await dailyQuery;
        data = dailyResult.data;
        error = dailyResult.error;
        break;

      case "weekly":
        const weeklyResult = await supabase.rpc(
          "get_weekly_nutrition_summary",
          {
            p_user_id: user.id,
            p_start_date: startDate,
            p_end_date: endDate,
            p_limit: limit,
          }
        );
        data = weeklyResult.data;
        error = weeklyResult.error;
        break;

      case "monthly":
        const monthlyResult = await supabase.rpc(
          "get_monthly_nutrition_summary",
          {
            p_user_id: user.id,
            p_start_date: startDate,
            p_end_date: endDate,
            p_limit: limit,
          }
        );
        data = monthlyResult.data;
        error = monthlyResult.error;
        break;

      case "yearly":
        const yearlyResult = await supabase.rpc(
          "get_yearly_nutrition_summary",
          {
            p_user_id: user.id,
            p_start_date: startDate,
            p_end_date: endDate,
            p_limit: limit,
          }
        );
        data = yearlyResult.data;
        error = yearlyResult.error;
        break;

      default:
        return NextResponse.json({ error: "Invalid period" }, { status: 400 });
    }

    if (error) {
      console.error("Error fetching nutrition summary:", error);
      return NextResponse.json(
        { error: "Failed to fetch nutrition data" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data, period });
  } catch (error) {
    console.error("Error fetching nutrition summary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
