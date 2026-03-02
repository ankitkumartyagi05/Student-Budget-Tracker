import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import {
  Loader2,
  Pencil,
  PiggyBank,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useBudgetSummary,
  useCategories,
  useSetBudget,
} from "../hooks/useQueries";

const DEFAULT_CATEGORIES = [
  "Food",
  "Transport",
  "Books",
  "Entertainment",
  "Shopping",
  "Rent",
  "Miscellaneous",
];

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getStatusColor(pct: number) {
  if (pct >= 100)
    return {
      bar: "bg-destructive",
      text: "text-destructive",
      badge: "bg-destructive/15 text-destructive border-destructive/30",
    };
  if (pct >= 90)
    return {
      bar: "bg-orange-500",
      text: "text-orange-500",
      badge: "bg-orange-500/15 text-orange-600 border-orange-500/30",
    };
  if (pct >= 75)
    return {
      bar: "bg-yellow-500",
      text: "text-yellow-600",
      badge: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
    };
  return {
    bar: "bg-success",
    text: "text-success",
    badge: "bg-success/15 text-success border-success/30",
  };
}

function getStatusLabel(pct: number) {
  if (pct >= 100) return "Exceeded";
  if (pct >= 90) return "Critical";
  if (pct >= 75) return "Warning";
  return "On Track";
}

export function BudgetsPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [month, setMonth] = useState(getCurrentMonth());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [limitAmount, setLimitAmount] = useState("");

  const { data: budgetSummary, isLoading } = useBudgetSummary(month);
  const { data: categories } = useCategories();
  const setBudget = useSetBudget();

  useEffect(() => {
    if (!identity) navigate({ to: "/" });
  }, [identity, navigate]);

  const allCategories =
    categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const openAdd = () => {
    setEditCategory(null);
    setSelectedCategory("");
    setLimitAmount("");
    setDialogOpen(true);
  };

  const openEdit = (category: string, currentLimit: number) => {
    setEditCategory(category);
    setSelectedCategory(category);
    setLimitAmount(currentLimit.toString());
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const amount = Number.parseFloat(limitAmount);
    if (!selectedCategory) {
      toast.error("Please select a category");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid budget amount");
      return;
    }

    try {
      await setBudget.mutateAsync({ category: selectedCategory, amount });
      toast.success(`Budget set for ${selectedCategory}`);
      setDialogOpen(false);
    } catch {
      toast.error("Failed to set budget");
    }
  };

  const budgetCats = budgetSummary?.categories ?? [];
  const setCategoriesNames = new Set(budgetCats.map((c) => c.category));
  const unsetCategories = allCategories.filter(
    (c) => !setCategoriesNames.has(c),
  );

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8 gap-4 flex-wrap"
      >
        <div>
          <h1 className="font-display text-3xl font-black">Budgets</h1>
          <p className="text-muted-foreground mt-1">
            Set and track monthly category budgets
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-40 h-9 text-sm"
          />
          <Button
            onClick={openAdd}
            className="gradient-primary text-white border-0 shadow-glow font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Set Budget
          </Button>
        </div>
      </motion.div>

      {/* Summary cards */}
      {budgetSummary && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-2xl font-black">
                ₹{budgetSummary.totalIncome.toLocaleString("en-IN")}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5" />
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-2xl font-black text-destructive">
                ₹{budgetSummary.totalExpenses.toLocaleString("en-IN")}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Income/Expense Ratio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`font-display text-2xl font-black ${budgetSummary.incomeToExpenseRatio >= 1 ? "text-success" : "text-destructive"}`}
              >
                {budgetSummary.incomeToExpenseRatio.toFixed(2)}x
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Budget cards */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {["a", "b", "c", "d"].map((k) => (
            <Skeleton key={k} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : budgetCats.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card rounded-2xl shadow-card py-16 flex flex-col items-center gap-3 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <PiggyBank className="w-7 h-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-lg">No budgets set</p>
            <p className="text-muted-foreground text-sm mt-1">
              Set monthly limits for each category to track your spending
            </p>
          </div>
          <Button
            onClick={openAdd}
            className="gradient-primary text-white border-0 mt-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Set First Budget
          </Button>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {budgetCats.map((cat, i) => {
            const status = getStatusColor(cat.percentageUsed);
            return (
              <motion.div
                key={cat.category}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="shadow-card hover:shadow-card-hover transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold">
                        {cat.category}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs border ${status.badge}`}>
                          {getStatusLabel(cat.percentageUsed)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 hover:bg-primary/10 hover:text-primary"
                          onClick={() => openEdit(cat.category, cat.limit)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm mb-3">
                      <div>
                        <span className="text-muted-foreground">Spent: </span>
                        <span className="font-semibold">
                          ₹{cat.totalSpent.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Remaining:{" "}
                        </span>
                        <span
                          className={`font-semibold ${cat.remaining >= 0 ? "text-success" : "text-destructive"}`}
                        >
                          ₹{Math.abs(cat.remaining).toLocaleString("en-IN")}
                          {cat.remaining < 0 ? " over" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${status.bar}`}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(cat.percentageUsed, 100)}%`,
                        }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>₹0</span>
                      <span className={`font-semibold ${status.text}`}>
                        {Math.round(cat.percentageUsed)}% used
                      </span>
                      <span>₹{cat.limit.toLocaleString("en-IN")}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Unset categories suggestion */}
      {unsetCategories.length > 0 && budgetCats.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 bg-secondary/50 rounded-xl border border-border"
        >
          <p className="text-sm font-medium mb-2">Also set budgets for:</p>
          <div className="flex flex-wrap gap-2">
            {unsetCategories.map((cat) => (
              <Button
                key={cat}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setEditCategory(null);
                  setSelectedCategory(cat);
                  setLimitAmount("");
                  setDialogOpen(true);
                }}
              >
                <Plus className="w-3 h-3 mr-1" />
                {cat}
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Set Budget Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editCategory
                ? `Update ${editCategory} Budget`
                : "Set Category Budget"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editCategory && (
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="limit">Monthly Limit (₹) *</Label>
              <Input
                id="limit"
                type="number"
                placeholder="e.g. 3000"
                min="1"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={setBudget.isPending}
              className="gradient-primary text-white border-0"
            >
              {setBudget.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Budget"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
