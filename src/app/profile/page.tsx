"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  CalendarIcon,
  TrendingUp,
  Activity,
  Target,
  Clock,
  Utensils,
} from "lucide-react";
import { format, subDays, isAfter, isBefore, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

interface NutritionSummary {
  date?: string;
  week_start?: string;
  month_start?: string;
  year_start?: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  total_sodium: number;
  meal_count: number;
  days_logged?: number;
  avg_daily_calories?: number;
}

interface Meal {
  id: string;
  meal_name: string;
  meal_type: string;
  logged_at: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber?: number;
  total_sodium?: number;
  image_url?: string;
  description?: string;
  meal_dishes: any[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const MEAL_TYPE_COLORS = {
  breakfast: "bg-orange-100 text-orange-800",
  lunch: "bg-blue-100 text-blue-800",
  dinner: "bg-green-100 text-green-800",
  snack: "bg-purple-100 text-purple-800",
  other: "bg-gray-100 text-gray-800",
};

export default function ProfilePage() {
  const [period, setPeriod] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("daily");
  const [summaryData, setSummaryData] = useState<NutritionSummary[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Fixed date range state using proper DateRange type
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const fetchNutritionSummary = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        period,
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: format(dateRange.to, "yyyy-MM-dd"),
        limit: "30",
      });

      const response = await fetch(`/api/nutrition/summary?${params}`);
      if (response.ok) {
        const result = await response.json();
        setSummaryData(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching nutrition summary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMeals = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    try {
      const params = new URLSearchParams({
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: format(dateRange.to, "yyyy-MM-dd"),
        limit: "100", // Increased limit to show more meals
      });

      const response = await fetch(`/api/meals?${params}`);
      if (response.ok) {
        const result = await response.json();
        setMeals(result.meals || []);
      }
    } catch (error) {
      console.error("Error fetching meals:", error);
    }
  };

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      fetchNutritionSummary();
      fetchMeals();
    }
  }, [period, dateRange]);

  const formatChartData = () => {
    return summaryData.map((item) => ({
      date: item.date || item.week_start || item.month_start || item.year_start,
      calories: Number(item.total_calories),
      protein: Number(item.total_protein),
      carbs: Number(item.total_carbs),
      fat: Number(item.total_fat),
      fiber: Number(item.total_fiber),
      sodium: Number(item.total_sodium) / 1000, // Convert to grams for better visualization
    }));
  };

  const getTotalStats = () => {
    return summaryData.reduce(
      (acc, item) => ({
        totalCalories: acc.totalCalories + Number(item.total_calories),
        totalProtein: acc.totalProtein + Number(item.total_protein),
        totalCarbs: acc.totalCarbs + Number(item.total_carbs),
        totalFat: acc.totalFat + Number(item.total_fat),
        totalMeals: acc.totalMeals + Number(item.meal_count),
        daysLogged: Math.max(acc.daysLogged, summaryData.length),
      }),
      {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalMeals: 0,
        daysLogged: 0,
      }
    );
  };

  const getPieChartData = () => {
    const totals = getTotalStats();
    return [
      { name: "Protein", value: totals.totalProtein, color: COLORS[0] },
      { name: "Carbs", value: totals.totalCarbs, color: COLORS[1] },
      { name: "Fat", value: totals.totalFat, color: COLORS[2] },
    ].filter((item) => item.value > 0);
  };

  const stats = getTotalStats();
  const avgDailyCalories =
    stats.daysLogged > 0
      ? Math.round(stats.totalCalories / stats.daysLogged)
      : 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Nutrition Profile
        </h1>
        <p className="text-muted-foreground">
          Track your nutritional intake and view progress over time
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>

        {/* Fixed Range Calendar Picker */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from && dateRange?.to ? (
                <>
                  {format(dateRange.from, "MMM dd, yyyy")} -{" "}
                  {format(dateRange.to, "MMM dd, yyyy")}
                </>
              ) : (
                "Select date range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3">
              <div className="text-sm text-muted-foreground mb-3">
                <p className="font-medium mb-1">Select Date Range</p>
                <p className="text-xs">
                  Click a start date, then click an end date to set the range
                </p>
              </div>
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                disabled={(date) => isAfter(date, new Date())}
                className="rounded-lg border"
              />
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateRange({
                      from: subDays(new Date(), 7),
                      to: new Date(),
                    });
                    setCalendarOpen(false);
                  }}
                >
                  Last 7 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateRange({
                      from: subDays(new Date(), 30),
                      to: new Date(),
                    });
                    setCalendarOpen(false);
                  }}
                >
                  Last 30 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateRange({
                      from: subDays(new Date(), 90),
                      to: new Date(),
                    });
                    setCalendarOpen(false);
                  }}
                >
                  Last 90 days
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          onClick={() => {
            fetchNutritionSummary();
            fetchMeals();
          }}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Refresh Data"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Total Calories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalCalories.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">
              Avg: {avgDailyCalories}/day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Meals Logged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalMeals}
            </div>
            <p className="text-sm text-muted-foreground">
              Over {stats.daysLogged} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Protein
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(stats.totalProtein)}g
            </div>
            <p className="text-sm text-muted-foreground">
              Avg: {Math.round(stats.totalProtein / (stats.daysLogged || 1))}
              g/day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Days Tracked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.daysLogged}
            </div>
            <p className="text-sm text-muted-foreground">Keep it up!</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Meals Table */}
      <Tabs defaultValue="calories" className="mb-8">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="calories">Calories</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="macros">Macros</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="meals">Meals</TabsTrigger>
        </TabsList>

        <TabsContent value="calories">
          <Card>
            <CardHeader>
              <CardTitle>Daily Calorie Intake</CardTitle>
              <CardDescription>
                Track your calorie consumption over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formatChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        format(new Date(value), "MMM dd")
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) =>
                        format(new Date(value), "MMM dd, yyyy")
                      }
                      formatter={(value: number) => [
                        Math.round(value),
                        "calories",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="calories"
                      stroke="#10b981"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="macros">
          <Card>
            <CardHeader>
              <CardTitle>Macronutrient Breakdown</CardTitle>
              <CardDescription>
                Protein, carbs, and fat intake over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formatChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        format(new Date(value), "MMM dd")
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) =>
                        format(new Date(value), "MMM dd, yyyy")
                      }
                      formatter={(value: number, name: string) => [
                        Math.round(value) + "g",
                        name,
                      ]}
                    />
                    <Bar dataKey="protein" stackId="a" fill={COLORS[0]} />
                    <Bar dataKey="carbs" stackId="a" fill={COLORS[1]} />
                    <Bar dataKey="fat" stackId="a" fill={COLORS[2]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Macronutrient Distribution</CardTitle>
              <CardDescription>
                Overall breakdown of your nutrition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getPieChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getPieChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [Math.round(value) + "g"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Progress</CardTitle>
                <CardDescription>Your nutrition trends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Average Daily Calories
                  </span>
                  <Badge variant="outline">{avgDailyCalories}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Total Meals Logged
                  </span>
                  <Badge variant="outline">{stats.totalMeals}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Days Tracked</span>
                  <Badge variant="outline">{stats.daysLogged}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Avg Protein/Day</span>
                  <Badge variant="outline">
                    {Math.round(stats.totalProtein / (stats.daysLogged || 1))}g
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Recent Meals Summary
                </CardTitle>
                <CardDescription>Your latest food logs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {meals.slice(0, 5).map((meal) => (
                    <div
                      key={meal.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium text-sm">{meal.meal_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(meal.logged_at), "MMM dd, HH:mm")} •{" "}
                          {meal.meal_type}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(meal.total_calories)} cal
                      </Badge>
                    </div>
                  ))}
                  {meals.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No meals found for selected date range.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="meals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                All Meals ({meals.length})
              </CardTitle>
              <CardDescription>
                Complete list of meals for the selected date range
              </CardDescription>
            </CardHeader>
            <CardContent>
              {meals.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Meal Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Calories</TableHead>
                        <TableHead className="text-right">Protein</TableHead>
                        <TableHead className="text-right">Carbs</TableHead>
                        <TableHead className="text-right">Fat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {meals.map((meal) => (
                        <TableRow key={meal.id}>
                          <TableCell className="font-medium">
                            <div className="text-sm">
                              <div>
                                {format(
                                  new Date(meal.logged_at),
                                  "MMM dd, yyyy"
                                )}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {format(new Date(meal.logged_at), "HH:mm")}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{meal.meal_name}</div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs",
                                MEAL_TYPE_COLORS[
                                  meal.meal_type.toLowerCase() as keyof typeof MEAL_TYPE_COLORS
                                ] || MEAL_TYPE_COLORS.other
                              )}
                            >
                              {meal.meal_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate text-sm text-muted-foreground">
                              {meal.description || "No description"}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {Math.round(meal.total_calories)}
                          </TableCell>
                          <TableCell className="text-right">
                            {Math.round(meal.total_protein)}g
                          </TableCell>
                          <TableCell className="text-right">
                            {Math.round(meal.total_carbs)}g
                          </TableCell>
                          <TableCell className="text-right">
                            {Math.round(meal.total_fat)}g
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No meals found</p>
                  <p className="text-sm">
                    Try adjusting your date range or log some meals to see data
                    here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
