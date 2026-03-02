import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  DollarSign,
  Lightbulb,
  PiggyBank,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Variant_warning_exceeded_critical } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAlerts,
  useBudgetSummary,
  useFinancialScore,
  useUserProfile,
} from "../hooks/useQueries";

const CHART_COLORS = [
  "oklch(0.58 0.16 195)",
  "oklch(0.65 0.18 148)",
  "oklch(0.78 0.18 75)",
  "oklch(0.72 0.19 305)",
  "oklch(0.62 0.22 25)",
  "oklch(0.68 0.15 240)",
  "oklch(0.70 0.16 165)",
];

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function BudgetBarColor(pct: number) {
  if (pct >= 100) return "bg-destructive";
  if (pct >= 90) return "bg-orange-500";
  if (pct >= 75) return "bg-yellow-500";
  return "bg-success";
}

function AlertIcon({ type }: { type: Variant_warning_exceeded_critical }) {
  if (type === Variant_warning_exceeded_critical.exceeded)
    return <XCircle className="w-4 h-4 text-destructive" />;
  if (type === Variant_warning_exceeded_critical.critical)
    return <AlertCircle className="w-4 h-4 text-orange-500" />;
  return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
}

function AlertBadge({ type }: { type: Variant_warning_exceeded_critical }) {
  if (type === Variant_warning_exceeded_critical.exceeded)
    return (
      <Badge className="bg-destructive/15 text-destructive border-destructive/30">
        Exceeded
      </Badge>
    );
  if (type === Variant_warning_exceeded_critical.critical)
    return (
      <Badge className="bg-orange-500/15 text-orange-600 border-orange-500/30">
        Critical
      </Badge>
    );
  return (
    <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30">
      Warning
    </Badge>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 54;
  const pct = Math.min(score / 100, 1);
  const offset = circumference * (1 - pct * 0.75); // 270° arc

  const color =
    score >= 75
      ? "oklch(0.6 0.17 148)"
      : score >= 50
        ? "oklch(0.78 0.18 75)"
        : "oklch(0.577 0.245 27.325)";

  const label =
    score >= 80
      ? "Excellent"
      : score >= 60
        ? "Good"
        : score >= 40
          ? "Fair"
          : "Needs Work";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full -rotate-[135deg]"
          role="img"
          aria-label="Financial score gauge"
        >
          <title>Financial score: {score}/100</title>
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="oklch(0.92 0.01 250)"
            strokeWidth="10"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeLinecap="round"
          />
          <motion.circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
            initial={{
              strokeDashoffset: circumference * 0.25 + circumference * 0.75,
            }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-black">{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <span className="font-semibold text-sm mt-1" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

export function DashboardPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const month = getCurrentMonth();
  const { data: profile } = useUserProfile();
  const { data: budgetSummary, isLoading: budgetLoading } =
    useBudgetSummary(month);
  const { data: alerts, isLoading: alertsLoading } = useAlerts(month);
  const { data: score, isLoading: scoreLoading } = useFinancialScore();

  useEffect(() => {
    if (!identity) navigate({ to: "/" });
  }, [identity, navigate]);

  const hasExpenses = budgetSummary && budgetSummary.totalExpenses > 0;
  const hasAlerts = alerts && alerts.length > 0;

  const pieData =
    budgetSummary?.categories
      .filter((c) => c.totalSpent > 0)
      .map((c) => ({ name: c.category, value: c.totalSpent })) ?? [];

  const trendData =
    score?.monthlyTrend?.slice(-6).map((m) => ({
      month: m.month,
      Spent: m.total,
    })) ?? [];

  const barData = trendData.map((d, i) => ({
    ...d,
    Budget: budgetSummary?.totalIncome
      ? Math.round(
          (budgetSummary.totalIncome / (trendData.length || 1)) *
            (0.8 + i * 0.05),
        )
      : 0,
  }));

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-display text-3xl font-black">
          {profile?.name
            ? `Hey, ${profile.name.split(" ")[0]} 👋`
            : "Dashboard"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </motion.div>

      {/* Top row: Score + Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {/* Financial Score */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="sm:col-span-2 lg:col-span-1"
        >
          <Card className="h-full shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                Financial Score
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-4">
              {scoreLoading ? (
                <Skeleton className="w-36 h-36 rounded-full" />
              ) : (
                <ScoreGauge score={score?.financialScore ?? 0} />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Income */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                Monthly Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              {budgetLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="font-display text-3xl font-black">
                  ₹{(budgetSummary?.totalIncome ?? 0).toLocaleString("en-IN")}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Expenses */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Wallet className="w-4 h-4" />
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              {budgetLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="font-display text-3xl font-black text-destructive">
                  ₹{(budgetSummary?.totalExpenses ?? 0).toLocaleString("en-IN")}
                </div>
              )}
              <div className="flex items-center gap-1 mt-1">
                {!budgetLoading &&
                  budgetSummary &&
                  budgetSummary.totalIncome > 0 && (
                    <>
                      {budgetSummary.totalExpenses <=
                      budgetSummary.totalIncome ? (
                        <TrendingDown className="w-3 h-3 text-success" />
                      ) : (
                        <TrendingUp className="w-3 h-3 text-destructive" />
                      )}
                      <p className="text-xs text-muted-foreground">
                        {Math.round(
                          (budgetSummary.totalExpenses /
                            budgetSummary.totalIncome) *
                            100,
                        )}
                        % of income
                      </p>
                    </>
                  )}
                {!budgetLoading &&
                  (!budgetSummary || budgetSummary.totalIncome === 0) && (
                    <p className="text-xs text-muted-foreground">This month</p>
                  )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Savings */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <PiggyBank className="w-4 h-4" />
                Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {budgetLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div
                  className={`font-display text-3xl font-black ${
                    (budgetSummary?.totalIncome ?? 0) -
                      (budgetSummary?.totalExpenses ?? 0) >=
                    0
                      ? "text-success"
                      : "text-destructive"
                  }`}
                >
                  ₹
                  {Math.abs(
                    (budgetSummary?.totalIncome ?? 0) -
                      (budgetSummary?.totalExpenses ?? 0),
                  ).toLocaleString("en-IN")}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {(budgetSummary?.totalIncome ?? 0) -
                  (budgetSummary?.totalExpenses ?? 0) >=
                0
                  ? "Saved this month"
                  : "Over budget"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Alerts */}
      {!alertsLoading && hasAlerts && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <Card className="shadow-card border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {alerts?.map((alert) => (
                <div
                  key={`${alert.category}-${alert.alertType}`}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/40"
                >
                  <AlertIcon type={alert.alertType} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm">
                        {alert.category}
                      </span>
                      <AlertBadge type={alert.alertType} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {alert.message}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Budget utilization */}
      {!budgetLoading &&
        budgetSummary &&
        budgetSummary.categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Budget Utilization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {budgetSummary.categories.map((cat) => (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1.5 text-sm">
                      <span className="font-medium">{cat.category}</span>
                      <span className="text-muted-foreground text-xs">
                        ₹{cat.totalSpent.toLocaleString("en-IN")} / ₹
                        {cat.limit.toLocaleString("en-IN")}
                        <span
                          className={`ml-2 font-semibold ${
                            cat.percentageUsed >= 100
                              ? "text-destructive"
                              : cat.percentageUsed >= 90
                                ? "text-orange-500"
                                : cat.percentageUsed >= 75
                                  ? "text-yellow-600"
                                  : "text-success"
                          }`}
                        >
                          {Math.round(cat.percentageUsed)}%
                        </span>
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${BudgetBarColor(cat.percentageUsed)}`}
                        style={{
                          width: `${Math.min(cat.percentageUsed, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        {/* Pie chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {!hasExpenses ? (
                <EmptyChartState message="Add expenses to see category breakdown" />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell
                          key={entry.name}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        `₹${value.toLocaleString("en-IN")}`,
                        "Spent",
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Monthly Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              {trendData.length === 0 ? (
                <EmptyChartState message="Track expenses for a month to see trends" />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={barData}
                    margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.92 0.01 250)"
                    />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        `₹${value.toLocaleString("en-IN")}`,
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="Spent"
                      fill="oklch(0.577 0.245 27.325)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="Budget"
                      fill="oklch(0.58 0.16 195)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Line chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <Card className="shadow-card mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <EmptyChartState message="Keep logging expenses to see your spending trend" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={trendData}
                  margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.92 0.01 250)"
                  />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `₹${value.toLocaleString("en-IN")}`,
                      "Spent",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="Spent"
                    stroke="oklch(0.58 0.16 195)"
                    strokeWidth={2.5}
                    dot={{ fill: "oklch(0.58 0.16 195)", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Saving tips */}
      {score && score.savingTips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="shadow-card mb-6 border-secondary">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                Personalized Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {score.savingTips.slice(0, 3).map((tip, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static tip list
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary font-bold shrink-0">
                    {i + 1}.
                  </span>
                  <span className="text-muted-foreground">{tip}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Footer */}
      <footer className="text-center py-4 text-sm text-muted-foreground">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="h-[200px] flex flex-col items-center justify-center text-center gap-2">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
        <BarChart3 className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground max-w-[200px]">{message}</p>
    </div>
  );
}

function BarChart3({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="img"
      aria-label="Bar chart icon"
    >
      <title>Bar chart</title>
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}
