import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart2,
  Flame,
  Lightbulb,
  PiggyBank,
  ShieldCheck,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useBudgetSummary,
  useExpenses,
  useFinancialScore,
} from "../hooks/useQueries";

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const circumference = 2 * Math.PI * (size * 0.4);
  const pct = Math.min(score / 100, 1);
  const offset = circumference * (1 - pct * 0.75);

  const color =
    score >= 75
      ? "oklch(0.6 0.17 148)"
      : score >= 50
        ? "oklch(0.78 0.18 75)"
        : "oklch(0.577 0.245 27.325)";

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-20 h-20 -rotate-[135deg]"
      role="img"
      aria-label="Score gauge"
    >
      <title>Financial score: {score}/100</title>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size * 0.4}
        fill="none"
        stroke="oklch(0.92 0.01 250)"
        strokeWidth={size * 0.08}
        strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
        strokeLinecap="round"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={size * 0.4}
        fill="none"
        stroke={color}
        strokeWidth={size * 0.08}
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
  );
}

function InsightCard({
  icon: Icon,
  title,
  value,
  description,
  color,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  description: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="shadow-card hover:shadow-card-hover transition-shadow h-full">
        <CardContent className="p-5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}
          >
            <Icon className="w-4.5 h-4.5 text-white" />
          </div>
          <p className="text-xs text-muted-foreground font-medium mb-1">
            {title}
          </p>
          <p className="font-display text-xl font-black mb-1">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ReportsPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const month = getCurrentMonth();

  const { data: score, isLoading: scoreLoading } = useFinancialScore();
  const { data: budgetSummary, isLoading: budgetLoading } =
    useBudgetSummary(month);
  const { data: expenses } = useExpenses(null, month);

  useEffect(() => {
    if (!identity) navigate({ to: "/" });
  }, [identity, navigate]);

  const savings =
    (budgetSummary?.totalIncome ?? 0) - (budgetSummary?.totalExpenses ?? 0);
  const topCategory = score?.highestSpendingCategory ?? "—";
  const trendData =
    score?.monthlyTrend?.slice(-6).map((m) => ({
      month: m.month,
      Spent: m.total,
    })) ?? [];

  const disciplineColor =
    score?.disciplineLevel === "high"
      ? "text-success"
      : score?.disciplineLevel === "medium"
        ? "text-yellow-600"
        : "text-destructive";

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-display text-3xl font-black">Reports & Insights</h1>
        <p className="text-muted-foreground mt-1">
          Your financial intelligence at a glance
        </p>
      </motion.div>

      {/* Financial Score + Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6"
      >
        <Card className="shadow-card overflow-hidden">
          <div className="gradient-primary p-6 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                {scoreLoading ? (
                  <Skeleton className="w-20 h-20 rounded-full" />
                ) : (
                  <div className="relative">
                    <ScoreRing score={score?.financialScore ?? 0} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className="font-display text-2xl font-black">
                          {score?.financialScore ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-white/70 text-sm mb-1">
                  Your Financial Score
                </p>
                <p className="font-display text-4xl font-black">
                  {score
                    ? score.financialScore >= 80
                      ? "Excellent! 🌟"
                      : score.financialScore >= 60
                        ? "Good Job! 👍"
                        : score.financialScore >= 40
                          ? "Keep Going! 💪"
                          : "Needs Work 📈"
                    : "—"}
                </p>
                <p className="text-white/70 text-sm mt-2">
                  Discipline:{" "}
                  <span className="font-semibold capitalize text-white">
                    {score?.disciplineLevel ?? "—"}
                  </span>
                  {" · "}
                  Borrowing Risk:{" "}
                  <span className="font-semibold capitalize text-white">
                    {score?.borrowingRisk ?? "—"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Monthly Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <InsightCard
          icon={TrendingDown}
          title="Total Income"
          value={`₹${(budgetSummary?.totalIncome ?? 0).toLocaleString("en-IN")}`}
          description="This month"
          color="gradient-primary"
          delay={0.1}
        />
        <InsightCard
          icon={Flame}
          title="Total Spent"
          value={`₹${(budgetSummary?.totalExpenses ?? 0).toLocaleString("en-IN")}`}
          description="This month"
          color="bg-destructive"
          delay={0.15}
        />
        <InsightCard
          icon={PiggyBank}
          title="Savings"
          value={`₹${Math.abs(savings).toLocaleString("en-IN")}${savings < 0 ? " 🔴" : " 🟢"}`}
          description={savings >= 0 ? "Saved this month" : "Over budget"}
          color={savings >= 0 ? "bg-success" : "bg-destructive"}
          delay={0.2}
        />
        <InsightCard
          icon={Star}
          title="Top Category"
          value={topCategory}
          description="Highest spending"
          color="bg-chart-3"
          delay={0.25}
        />
      </div>

      {/* Intelligence insights */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-card h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-success" />
                Weekly Spending Cap
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scoreLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="font-display text-2xl font-black">
                  ₹{(score?.weeklySpendingCap ?? 0).toLocaleString("en-IN")}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Recommended weekly limit to stay on track
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="shadow-card h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Target className="w-4 h-4 text-primary" />
                Emergency Fund Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scoreLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="font-display text-2xl font-black">
                  ₹
                  {(score?.emergencyFundRecommendation ?? 0).toLocaleString(
                    "en-IN",
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Recommended 3-month emergency fund
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-card h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-chart-3" />
                Income/Expense Ratio
              </CardTitle>
            </CardHeader>
            <CardContent>
              {budgetLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div
                  className={`font-display text-2xl font-black ${(budgetSummary?.incomeToExpenseRatio ?? 0) >= 1 ? "text-success" : "text-destructive"}`}
                >
                  {(budgetSummary?.incomeToExpenseRatio ?? 0).toFixed(2)}x
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {(budgetSummary?.incomeToExpenseRatio ?? 0) >= 1.2
                  ? "Great! You're well within budget"
                  : (budgetSummary?.incomeToExpenseRatio ?? 0) >= 1
                    ? "Good — income covers expenses"
                    : "Warning: Spending exceeds income"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Spending trend line chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mb-6"
      >
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Improvement Trend
              </CardTitle>
              {trendData.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Last {trendData.length} months
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center gap-2">
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Track expenses over multiple months to see your trend
                </p>
              </div>
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
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Behavioral insights + Saving tips */}
      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        {/* Behavioral insights */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="shadow-card h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Behavioral Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {scoreLoading ? (
                <div className="space-y-2">
                  {["a", "b", "c", "d"].map((k) => (
                    <Skeleton key={k} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <InsightRow
                    label="Budget Discipline"
                    value={score?.disciplineLevel ?? "—"}
                    colorClass={disciplineColor}
                  />
                  <InsightRow
                    label="Borrowing Risk"
                    value={score?.borrowingRisk ?? "—"}
                    colorClass={
                      score?.borrowingRisk === "low"
                        ? "text-success"
                        : score?.borrowingRisk === "medium"
                          ? "text-yellow-600"
                          : "text-destructive"
                    }
                  />
                  <InsightRow
                    label="Top Spending Area"
                    value={topCategory}
                    colorClass="text-foreground"
                  />
                  <InsightRow
                    label="Monthly Expenses"
                    value={`₹${(budgetSummary?.totalExpenses ?? 0).toLocaleString("en-IN")}`}
                    colorClass="text-foreground"
                  />
                  <InsightRow
                    label="Expenses This Month"
                    value={`${expenses?.length ?? 0} transactions`}
                    colorClass="text-foreground"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Saving tips */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Card className="shadow-card h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                Personalized Saving Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scoreLoading ? (
                <div className="space-y-2">
                  {["a", "b", "c", "d", "e"].map((k) => (
                    <Skeleton key={k} className="h-10 w-full" />
                  ))}
                </div>
              ) : !score || score.savingTips.length === 0 ? (
                <div className="text-center py-8">
                  <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Tips will appear once you have expense data
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {score.savingTips.map((tip, i) => (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: static ordered tip list
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-sm leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

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

function InsightRow({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: string;
  colorClass: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold capitalize ${colorClass}`}>
        {value}
      </span>
    </div>
  );
}
