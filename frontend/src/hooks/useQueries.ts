import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BudgetDisciplineLevel,
  ConflictFrequency,
  Expense,
  Gender,
  IncomeSource,
  LivingSituation,
  UserProfile,
  Variant_custom_equal,
} from "../backend.d";
import { useActor } from "./useActor";

// Re-export types for use elsewhere
export type {
  UserProfile,
  Expense,
  BudgetDisciplineLevel,
  Gender,
  IncomeSource,
  LivingSituation,
  ConflictFrequency,
  Variant_custom_equal,
};

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useCategories() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCategories();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.addCustomCategory(name);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.deleteCustomCategory(name);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useExpenses(
  categoryFilter?: string | null,
  monthFilter?: string | null,
) {
  const { actor, isFetching } = useActor();
  return useQuery<Expense[]>({
    queryKey: ["expenses", categoryFilter, monthFilter],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listExpenses(categoryFilter ?? null, monthFilter ?? null);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      amount,
      category,
      date,
      note,
    }: {
      amount: number;
      category: string;
      date: string;
      note: string | null;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addExpense(amount, category, date, note);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useEditExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      amount,
      category,
      date,
      note,
    }: {
      id: bigint;
      amount: number;
      category: string;
      date: string;
      note: string | null;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.editExpense(id, amount, category, date, note);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useDeleteExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.deleteExpense(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useBudgetSummary(month: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["budgetSummary", month],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getBudgetSummary(month);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetBudget() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      category,
      amount,
    }: { category: string; amount: number }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.setMonthlyBudget(category, amount);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["budgetSummary"] }),
  });
}

export function useAlerts(month: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["alerts", month],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAlerts(month);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFinancialScore() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["financialScore"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getFinancialScore();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGroups() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listGroups();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateGroup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createGroup(name);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export function useDeleteGroup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.deleteGroup(groupId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export function useAddGroupMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      member,
    }: { groupId: bigint; member: Principal }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.addGroupMember(groupId, member);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export function useRemoveGroupMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      member,
    }: { groupId: bigint; member: Principal }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.removeGroupMember(groupId, member);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export function useSharedExpenses(groupId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["sharedExpenses", groupId?.toString()],
    queryFn: async () => {
      if (!actor || groupId === null) return [];
      return actor.listSharedExpenses(groupId);
    },
    enabled: !!actor && !isFetching && groupId !== null,
  });
}

export function useAddSharedExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      description,
      totalAmount,
      paidBy,
      splitType,
      customSplits,
    }: {
      groupId: bigint;
      description: string;
      totalAmount: number;
      paidBy: Principal;
      splitType: Variant_custom_equal;
      customSplits: Array<[Principal, number]>;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addSharedExpense(
        groupId,
        description,
        totalAmount,
        paidBy,
        splitType,
        customSplits,
      );
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["sharedExpenses"] }),
  });
}

export function useMarkSplitPaid() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      expenseId,
    }: { groupId: bigint; expenseId: bigint }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.markSplitPaid(groupId, expenseId);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["sharedExpenses"] }),
  });
}

export function useSettlementSummary(groupId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["settlements", groupId?.toString()],
    queryFn: async () => {
      if (!actor || groupId === null) return [];
      return actor.getSettlementSummary(groupId);
    },
    enabled: !!actor && !isFetching && groupId !== null,
  });
}
