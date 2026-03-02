import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  Filter,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  type Expense,
  useAddCategory,
  useAddExpense,
  useCategories,
  useDeleteExpense,
  useEditExpense,
  useExpenses,
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

type ExpenseFormData = {
  amount: string;
  category: string;
  date: string;
  note: string;
};

const emptyForm: ExpenseFormData = {
  amount: "",
  category: "",
  date: new Date().toISOString().split("T")[0],
  note: "",
};

export function ExpensesPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState<string | null>(
    getCurrentMonth(),
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState<ExpenseFormData>(emptyForm);
  const [newCategory, setNewCategory] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);

  const { data: expenses, isLoading } = useExpenses(
    categoryFilter,
    monthFilter,
  );
  const { data: categories } = useCategories();
  const addExpense = useAddExpense();
  const editExpenseMutation = useEditExpense();
  const deleteExpense = useDeleteExpense();
  const addCategory = useAddCategory();

  useEffect(() => {
    if (!identity) navigate({ to: "/" });
  }, [identity, navigate]);

  const allCategories =
    categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const openAdd = () => {
    setEditExpense(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditExpense(expense);
    setForm({
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      note: expense.note ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const amount = Number.parseFloat(form.amount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!form.category) {
      toast.error("Please select a category");
      return;
    }
    if (!form.date) {
      toast.error("Please select a date");
      return;
    }

    try {
      if (editExpense) {
        await editExpenseMutation.mutateAsync({
          id: editExpense.id,
          amount,
          category: form.category,
          date: form.date,
          note: form.note || null,
        });
        toast.success("Expense updated");
      } else {
        await addExpense.mutateAsync({
          amount,
          category: form.category,
          date: form.date,
          note: form.note || null,
        });
        toast.success("Expense added");
      }
      setDialogOpen(false);
      setForm(emptyForm);
    } catch {
      toast.error("Failed to save expense");
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteExpense.mutateAsync(deleteId);
      toast.success("Expense deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete expense");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await addCategory.mutateAsync(newCategory.trim());
      toast.success(`Category "${newCategory}" added`);
      setNewCategory("");
      setShowAddCategory(false);
    } catch {
      toast.error("Failed to add category");
    }
  };

  const isPending = addExpense.isPending || editExpenseMutation.isPending;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8 gap-4 flex-wrap"
      >
        <div>
          <h1 className="font-display text-3xl font-black">Expenses</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your spending
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="gradient-primary text-white border-0 shadow-glow font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3 mb-6 p-4 bg-card rounded-xl shadow-card"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          Filters:
        </div>
        <div className="flex flex-wrap gap-2 flex-1">
          <Select
            value={categoryFilter ?? "all"}
            onValueChange={(v) => setCategoryFilter(v === "all" ? null : v)}
          >
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {allCategories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="month"
            value={monthFilter ?? ""}
            onChange={(e) => setMonthFilter(e.target.value || null)}
            className="w-40 h-8 text-sm"
          />
          {(categoryFilter || monthFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCategoryFilter(null);
                setMonthFilter(null);
              }}
              className="h-8 px-2 text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl shadow-card overflow-hidden"
      >
        {isLoading ? (
          <div className="p-6 space-y-3">
            {["a", "b", "c", "d", "e"].map((k) => (
              <Skeleton key={k} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : !expenses || expenses.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <Receipt className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-lg">No expenses yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                {categoryFilter || monthFilter
                  ? "No expenses match your filters"
                  : "Add your first expense to start tracking"}
              </p>
            </div>
            {!categoryFilter && !monthFilter && (
              <Button
                onClick={openAdd}
                className="gradient-primary text-white border-0 mt-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                )
                .map((exp) => (
                  <TableRow
                    key={exp.id.toString()}
                    className="hover:bg-muted/20"
                  >
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(exp.date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {exp.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {exp.note || "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-destructive">
                      ₹{exp.amount.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 hover:bg-primary/10 hover:text-primary"
                          onClick={() => openEdit(exp)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteId(exp.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </motion.div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editExpense ? "Edit Expense" : "Add Expense"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="e.g. 250"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Category *</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-primary"
                  onClick={() => setShowAddCategory(!showAddCategory)}
                >
                  + New
                </Button>
              </div>
              {showAddCategory && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="h-8 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                  />
                  <Button size="sm" onClick={handleAddCategory} className="h-8">
                    Add
                  </Button>
                </div>
              )}
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
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
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                placeholder="What was this for?"
                rows={2}
                value={form.note}
                onChange={(e) =>
                  setForm((f) => ({ ...f, note: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="gradient-primary text-white border-0"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : editExpense ? (
                "Update"
              ) : (
                "Add Expense"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The expense will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deleteExpense.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
