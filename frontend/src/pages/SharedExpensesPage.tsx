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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Principal } from "@dfinity/principal";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Loader2,
  Plus,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Variant_custom_equal } from "../backend.d";
import type { SharedExpense, SharedExpenseGroup } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddGroupMember,
  useAddSharedExpense,
  useCreateGroup,
  useDeleteGroup,
  useGroups,
  useMarkSplitPaid,
  useRemoveGroupMember,
  useSettlementSummary,
  useSharedExpenses,
} from "../hooks/useQueries";

function truncatePrincipal(p: { toString(): string }) {
  const s = p.toString();
  return `${s.slice(0, 8)}...${s.slice(-4)}`;
}

export function SharedExpensesPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [selectedGroupId, setSelectedGroupId] = useState<bigint | null>(null);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberPrincipal, setMemberPrincipal] = useState("");
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [deleteGroupId, setDeleteGroupId] = useState<bigint | null>(null);

  // Expense form
  const [expForm, setExpForm] = useState({
    description: "",
    totalAmount: "",
    paidBy: "",
    splitType: Variant_custom_equal.equal as Variant_custom_equal,
  });
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  const { data: groups, isLoading: groupsLoading } = useGroups();
  const createGroup = useCreateGroup();
  const deleteGroup = useDeleteGroup();
  const addMember = useAddGroupMember();
  const removeMember = useRemoveGroupMember();
  const addSharedExpense = useAddSharedExpense();
  const markSplitPaid = useMarkSplitPaid();

  const selectedGroup = groups?.find((g) => g.id === selectedGroupId) ?? null;
  const { data: sharedExpenses, isLoading: expensesLoading } =
    useSharedExpenses(selectedGroupId);
  const { data: settlements } = useSettlementSummary(selectedGroupId);

  useEffect(() => {
    if (!identity) navigate({ to: "/" });
  }, [identity, navigate]);

  const myPrincipal = identity?.getPrincipal().toString();

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    try {
      const id = await createGroup.mutateAsync(groupName.trim());
      toast.success(`Group "${groupName}" created`);
      setGroupName("");
      setCreateGroupOpen(false);
      setSelectedGroupId(id);
    } catch {
      toast.error("Failed to create group");
    }
  };

  const handleAddMember = async () => {
    if (!selectedGroupId || !memberPrincipal.trim()) return;
    try {
      const principal = Principal.fromText(memberPrincipal.trim());
      await addMember.mutateAsync({
        groupId: selectedGroupId,
        member: principal,
      });
      toast.success("Member added");
      setMemberPrincipal("");
      setAddMemberOpen(false);
    } catch {
      toast.error("Invalid principal or failed to add member");
    }
  };

  const handleRemoveMember = async (member: { toString(): string }) => {
    if (!selectedGroupId) return;
    try {
      await removeMember.mutateAsync({
        groupId: selectedGroupId,
        member: member as Principal,
      });
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleAddExpense = async () => {
    if (
      !selectedGroupId ||
      !expForm.description ||
      !expForm.totalAmount ||
      !expForm.paidBy
    ) {
      toast.error("Please fill all fields");
      return;
    }
    const total = Number.parseFloat(expForm.totalAmount);
    if (!total || total <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      const paidByPrincipal = Principal.fromText(expForm.paidBy);
      const splits: [Principal, number][] =
        expForm.splitType === Variant_custom_equal.custom
          ? Object.entries(customSplits).map(([p, a]) => [
              Principal.fromText(p),
              Number.parseFloat(a) || 0,
            ])
          : [];

      await addSharedExpense.mutateAsync({
        groupId: selectedGroupId,
        description: expForm.description,
        totalAmount: total,
        paidBy: paidByPrincipal,
        splitType: expForm.splitType,
        customSplits: splits,
      });
      toast.success("Expense added");
      setExpForm({
        description: "",
        totalAmount: "",
        paidBy: "",
        splitType: Variant_custom_equal.equal,
      });
      setCustomSplits({});
      setAddExpenseOpen(false);
    } catch {
      toast.error("Failed to add expense");
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteGroupId) return;
    try {
      await deleteGroup.mutateAsync(deleteGroupId);
      toast.success("Group deleted");
      if (selectedGroupId === deleteGroupId) setSelectedGroupId(null);
      setDeleteGroupId(null);
    } catch {
      toast.error("Failed to delete group");
    }
  };

  const handleMarkPaid = async (expenseId: bigint) => {
    if (!selectedGroupId) return;
    try {
      await markSplitPaid.mutateAsync({ groupId: selectedGroupId, expenseId });
      toast.success("Marked as paid");
    } catch {
      toast.error("Failed to mark as paid");
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8 gap-4 flex-wrap"
      >
        <div>
          <h1 className="font-display text-3xl font-black">Shared Expenses</h1>
          <p className="text-muted-foreground mt-1">
            Split bills fairly with roommates & friends
          </p>
        </div>
        <Button
          onClick={() => setCreateGroupOpen(true)}
          className="gradient-primary text-white border-0 shadow-glow font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Group
        </Button>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Groups list */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Your Groups
          </h2>
          {groupsLoading ? (
            <div className="space-y-2">
              {["a", "b", "c"].map((k) => (
                <Skeleton key={k} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : !groups || groups.length === 0 ? (
            <div className="bg-card rounded-xl shadow-card p-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No groups yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create a group to start splitting
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <motion.div
                key={group.id.toString()}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <button
                  type="button"
                  className={`w-full text-left p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedGroupId === group.id
                      ? "bg-primary/10 border-primary shadow-glow"
                      : "bg-card border-border shadow-card hover:shadow-card-hover"
                  }`}
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{group.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {group.members.length} member
                          {group.members.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteGroupId(group.id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </button>
              </motion.div>
            ))
          )}
        </div>

        {/* Group detail */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {!selectedGroup ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-64 bg-card rounded-xl shadow-card flex flex-col items-center justify-center text-center gap-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                  <ChevronRight className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-medium">Select a group to view details</p>
                <p className="text-sm text-muted-foreground">
                  Or create a new group to get started
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedGroup.id.toString()}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                {/* Members card */}
                <Card className="shadow-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {selectedGroup.name} — Members
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5"
                        onClick={() => setAddMemberOpen(true)}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Add
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedGroup.members.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No members yet
                      </p>
                    ) : (
                      selectedGroup.members.map((member) => {
                        const memberStr = member.toString();
                        const isMe = memberStr === myPrincipal;
                        return (
                          <div
                            key={memberStr}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                                {memberStr.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium font-mono">
                                  {truncatePrincipal(member)}
                                </p>
                                {isMe && (
                                  <p className="text-xs text-primary">You</p>
                                )}
                              </div>
                            </div>
                            {!isMe && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7 hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleRemoveMember(member)}
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>

                {/* Expenses card */}
                <Card className="shadow-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Shared Expenses
                      </CardTitle>
                      <Button
                        size="sm"
                        className="h-7 text-xs gradient-primary text-white border-0 gap-1.5"
                        onClick={() => {
                          setExpForm((f) => ({
                            ...f,
                            paidBy: myPrincipal ?? "",
                          }));
                          setAddExpenseOpen(true);
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Expense
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {expensesLoading ? (
                      <div className="space-y-2">
                        {["a", "b", "c"].map((k) => (
                          <Skeleton key={k} className="h-12 rounded-lg" />
                        ))}
                      </div>
                    ) : !sharedExpenses || sharedExpenses.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        No expenses yet
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {sharedExpenses.map((exp) => (
                          <SharedExpenseRow
                            key={exp.id.toString()}
                            expense={exp}
                            group={selectedGroup}
                            myPrincipal={myPrincipal ?? ""}
                            onMarkPaid={() => handleMarkPaid(exp.id)}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Settlement summary */}
                {settlements && settlements.length > 0 && (
                  <Card className="shadow-card border-secondary">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-success" />
                        Settlement Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {settlements.map(([from, to, amount]) => (
                        <div
                          key={`${from.toString()}-${to.toString()}`}
                          className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/40"
                        >
                          <span className="font-mono text-xs text-muted-foreground">
                            {truncatePrincipal(from)}
                          </span>
                          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="font-mono text-xs text-muted-foreground">
                            {truncatePrincipal(to)}
                          </span>
                          <span className="ml-auto font-bold text-success">
                            ₹{amount.toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Create Group Dialog */}
      <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Create Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name *</Label>
              <Input
                id="groupName"
                placeholder="e.g. Hostel Room 204"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateGroupOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={createGroup.isPending}
              className="gradient-primary text-white border-0"
            >
              {createGroup.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Add Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="principal">Member Principal ID *</Label>
              <Input
                id="principal"
                placeholder="e.g. 2vxsx-fae..."
                value={memberPrincipal}
                onChange={(e) => setMemberPrincipal(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Ask your friend to share their principal ID
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={addMember.isPending}
              className="gradient-primary text-white border-0"
            >
              {addMember.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Add Member"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              Add Shared Expense
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="desc">Description *</Label>
              <Input
                id="desc"
                placeholder="e.g. Monthly rent"
                value={expForm.description}
                onChange={(e) =>
                  setExpForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalAmt">Total Amount (₹) *</Label>
              <Input
                id="totalAmt"
                type="number"
                placeholder="e.g. 12000"
                value={expForm.totalAmount}
                onChange={(e) =>
                  setExpForm((f) => ({ ...f, totalAmount: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Paid By *</Label>
              <Select
                value={expForm.paidBy}
                onValueChange={(v) => setExpForm((f) => ({ ...f, paidBy: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Who paid?" />
                </SelectTrigger>
                <SelectContent>
                  {selectedGroup?.members.map((m) => (
                    <SelectItem key={m.toString()} value={m.toString()}>
                      <span className="font-mono text-xs">
                        {truncatePrincipal(m)}
                      </span>
                      {m.toString() === myPrincipal ? " (You)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Split Type</Label>
              <Select
                value={expForm.splitType}
                onValueChange={(v) =>
                  setExpForm((f) => ({
                    ...f,
                    splitType: v as Variant_custom_equal,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Variant_custom_equal.equal}>
                    Split Equally
                  </SelectItem>
                  <SelectItem value={Variant_custom_equal.custom}>
                    Custom Split
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {expForm.splitType === Variant_custom_equal.custom &&
              selectedGroup && (
                <div className="space-y-2">
                  <Label>Custom Amounts per Member</Label>
                  {selectedGroup.members.map((m) => (
                    <div key={m.toString()} className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground flex-1 truncate">
                        {truncatePrincipal(m)}
                      </span>
                      <Input
                        type="number"
                        placeholder="₹ amount"
                        className="w-28 h-8 text-sm"
                        value={customSplits[m.toString()] ?? ""}
                        onChange={(e) =>
                          setCustomSplits((s) => ({
                            ...s,
                            [m.toString()]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddExpenseOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddExpense}
              disabled={addSharedExpense.isPending}
              className="gradient-primary text-white border-0"
            >
              {addSharedExpense.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Add Expense"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirm */}
      <AlertDialog
        open={deleteGroupId !== null}
        onOpenChange={(o) => !o && setDeleteGroupId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the group and all its expenses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SharedExpenseRow({
  expense,
  group,
  myPrincipal,
  onMarkPaid,
}: {
  expense: SharedExpense;
  group: SharedExpenseGroup;
  myPrincipal: string;
  onMarkPaid: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const paidByStr = expense.paidBy.toString();
  const mySettlement = expense.settlements.find(
    ([p]) => p.toString() === myPrincipal,
  );
  const isPaidByMe = paidByStr === myPrincipal;
  const iMyPaid = mySettlement?.[1] ?? false;

  const perPerson =
    expense.splitType === Variant_custom_equal.equal
      ? expense.totalAmount / (group.members.length || 1)
      : null;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between p-3 cursor-pointer hover:bg-muted/20 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-secondary-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">{expense.description}</p>
            <p className="text-xs text-muted-foreground">
              ₹{expense.totalAmount.toLocaleString("en-IN")} ·{" "}
              {expense.splitType === Variant_custom_equal.equal
                ? "Equal split"
                : "Custom split"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPaidByMe ? (
            <Badge className="bg-success/15 text-success border-success/30 text-xs">
              You paid
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Paid by others
            </Badge>
          )}
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <Separator />
            <div className="p-3 space-y-2">
              {group.members.map((member) => {
                const memberStr = member.toString();
                const settlement = expense.settlements.find(
                  ([p]) => p.toString() === memberStr,
                );
                const paid = settlement?.[1] ?? false;
                const isCurrentMember = memberStr === myPrincipal;
                const amount =
                  expense.splitType === Variant_custom_equal.custom
                    ? expense.customSplits.find(
                        ([p]) => p.toString() === memberStr,
                      )?.[1]
                    : perPerson;

                return (
                  <div
                    key={memberStr}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${paid ? "bg-success" : "bg-muted-foreground"}`}
                      />
                      <span className="font-mono text-xs text-muted-foreground">
                        {memberStr.slice(0, 8)}...
                        {isCurrentMember ? " (You)" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">
                        ₹{(amount ?? 0).toFixed(2)}
                      </span>
                      {paid ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {!iMyPaid && !isPaidByMe && (
                <Button
                  size="sm"
                  className="w-full h-7 text-xs mt-2 gradient-primary text-white border-0"
                  onClick={onMarkPaid}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Mark My Share as Paid
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
