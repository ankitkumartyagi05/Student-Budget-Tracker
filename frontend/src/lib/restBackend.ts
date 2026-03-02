import type { Principal } from "@icp-sdk/core/principal";
import {
  BudgetDisciplineLevel,
  ConflictFrequency,
  Gender,
  IncomeSource,
  LivingSituation,
  UserRole,
  Variant_custom_equal,
  Variant_warning_exceeded_critical,
  type Expense,
  type SharedExpense,
  type SharedExpenseGroup,
  type UserProfile,
  type backendInterface,
} from "../backend.d";

type ApiExpense = {
  id: string;
  amount: number;
  category: string;
  date: string;
  notes: string | null;
  isShared: boolean;
};

type ApiBudget = {
  id: string;
  month: string;
  category: string;
  monthlyLimit: number;
};

type ApiSharedExpense = {
  id: string;
  description: string;
  totalAmount: number;
  paidBy: string;
  participants: Array<{ name: string; share: number }>;
  date: string;
  isSettled: boolean;
};

type StoredGroup = { id: string; name: string; members: string[] };
type SharedToGroupMap = Record<string, string>;

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";
const DEFAULT_CATEGORIES = [
  "Food",
  "Transport",
  "Books",
  "Entertainment",
  "Shopping",
  "Rent",
  "Miscellaneous",
];

const STORAGE_KEYS = {
  profile: "sbt_profile",
  categories: "sbt_categories",
  groups: "sbt_groups",
  sharedGroupMap: "sbt_shared_group_map",
};

const expenseIdToRaw = new Map<string, string>();
const expenseRawToId = new Map<string, string>();
const sharedIdToRaw = new Map<string, string>();
const sharedRawToId = new Map<string, string>();

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function principalFromText(value: string): Principal {
  return {
    toString: () => value,
  } as unknown as Principal;
}

function hashToBigIntString(input: string): string {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return String(Math.abs(hash));
}

function toBigIntString(rawId: string, kind: "expense" | "shared"): string {
  const direct = /^\d+$/.test(rawId) ? rawId : hashToBigIntString(rawId);
  if (kind === "expense") {
    expenseIdToRaw.set(direct, rawId);
    expenseRawToId.set(rawId, direct);
  } else {
    sharedIdToRaw.set(direct, rawId);
    sharedRawToId.set(rawId, direct);
  }
  return direct;
}

function fromBigIntToRaw(id: bigint, kind: "expense" | "shared"): string {
  const key = id.toString();
  if (kind === "expense") {
    return expenseIdToRaw.get(key) ?? key;
  }
  return sharedIdToRaw.get(key) ?? key;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload?.detail) message = payload.detail;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

async function fetchExpenses(): Promise<ApiExpense[]> {
  return apiRequest<ApiExpense[]>("/expenses");
}

async function fetchBudgets(month?: string): Promise<ApiBudget[]> {
  const query = month ? `?month=${encodeURIComponent(month)}` : "";
  return apiRequest<ApiBudget[]>(`/budgets${query}`);
}

async function fetchSharedExpenses(): Promise<ApiSharedExpense[]> {
  return apiRequest<ApiSharedExpense[]>("/shared-expenses");
}

function getStoredProfile(): UserProfile | null {
  return readJson<UserProfile | null>(STORAGE_KEYS.profile, null);
}

function getStoredGroups(): StoredGroup[] {
  return readJson<StoredGroup[]>(STORAGE_KEYS.groups, []);
}

function setStoredGroups(groups: StoredGroup[]): void {
  writeJson(STORAGE_KEYS.groups, groups);
}

function getSharedToGroupMap(): SharedToGroupMap {
  return readJson<SharedToGroupMap>(STORAGE_KEYS.sharedGroupMap, {});
}

function setSharedToGroupMap(value: SharedToGroupMap): void {
  writeJson(STORAGE_KEYS.sharedGroupMap, value);
}

async function listCategoriesInternal(): Promise<string[]> {
  const customCategories = readJson<string[]>(STORAGE_KEYS.categories, []);
  const expenses = await fetchExpenses().catch(() => []);
  const budgets = await fetchBudgets().catch(() => []);
  const fromExpenses = expenses.map((expense) => expense.category);
  const fromBudgets = budgets.map((budget) => budget.category);
  return Array.from(
    new Set([
      ...DEFAULT_CATEGORIES,
      ...customCategories,
      ...fromExpenses,
      ...fromBudgets,
    ]),
  );
}

function buildBudgetId(month: string, category: string): string {
  const normalized = category.trim().toLowerCase().replace(/\s+/g, "-");
  return `${month}-${normalized}`;
}

function buildDefaultProfile(): UserProfile {
  return {
    age: 20n,
    findsAppsUseful: true,
    previousAppName: undefined,
    tracksDailyExpenses: true,
    livingSituation: LivingSituation.onCampus,
    biggestFinancialProblem: "Overspending on essentials",
    name: "Student",
    featurePreferences: ["Budgets", "Alerts"],
    conflictFrequency: ConflictFrequency.rarely,
    incomeSource: IncomeSource.allowance,
    borrowsDueToBudget: false,
    majorSpendingCategory: "Food",
    gender: Gender.other,
    financialStressLevel: 5n,
    hasSharedExpenses: false,
    course: "",
    prefersAutoSplit: true,
    hasEmergencySavings: false,
    setsMonthlyBudget: true,
    monthEndShortage: false,
    monthlyIncome: 0,
    budgetDisciplineLevel: BudgetDisciplineLevel.medium,
  };
}

class RestBackendActor implements backendInterface {
  async addCustomCategory(name: string): Promise<void> {
    const categories = readJson<string[]>(STORAGE_KEYS.categories, []);
    if (!categories.includes(name)) {
      categories.push(name);
      writeJson(STORAGE_KEYS.categories, categories);
    }
  }

  async addExpense(
    amount: number,
    category: string,
    date: string,
    note: string | null,
  ): Promise<bigint> {
    const id = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    await apiRequest<{ ok: boolean }>("/expenses", {
      method: "POST",
      body: JSON.stringify({
        id,
        amount,
        category,
        date,
        notes: note,
        isShared: false,
      }),
    });
    return BigInt(toBigIntString(id, "expense"));
  }

  async addGroupMember(groupId: bigint, member: Principal): Promise<void> {
    const groups = getStoredGroups();
    const target = groups.find((group) => group.id === groupId.toString());
    if (!target) return;
    const value = member.toString();
    if (!target.members.includes(value)) {
      target.members.push(value);
      setStoredGroups(groups);
    }
  }

  async addSharedExpense(
    groupId: bigint,
    description: string,
    totalAmount: number,
    paidBy: Principal,
    splitType: Variant_custom_equal,
    customSplits: Array<[Principal, number]>,
  ): Promise<bigint> {
    const id = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const groups = getStoredGroups();
    const group = groups.find((item) => item.id === groupId.toString());
    const members = group?.members ?? [];
    const participants =
      splitType === Variant_custom_equal.custom
        ? customSplits.map(([principal, share]) => ({
            name: principal.toString(),
            share,
          }))
        : members.map((name) => ({
            name,
            share:
              members.length > 0
                ? Number((totalAmount / members.length).toFixed(2))
                : totalAmount,
          }));

    await apiRequest<{ ok: boolean }>("/shared-expenses", {
      method: "POST",
      body: JSON.stringify({
        id,
        description,
        totalAmount,
        paidBy: paidBy.toString(),
        participants,
        date: new Date().toISOString().slice(0, 10),
      }),
    });

    const map = getSharedToGroupMap();
    map[id] = groupId.toString();
    setSharedToGroupMap(map);

    return BigInt(toBigIntString(id, "shared"));
  }

  async assignCallerUserRole(_user: Principal, _role: UserRole): Promise<void> {}

  async createGroup(name: string): Promise<bigint> {
    const id = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const groups = getStoredGroups();
    groups.push({ id, name, members: [] });
    setStoredGroups(groups);
    return BigInt(id);
  }

  async deleteCustomCategory(name: string): Promise<void> {
    const categories = readJson<string[]>(STORAGE_KEYS.categories, []);
    writeJson(
      STORAGE_KEYS.categories,
      categories.filter((item) => item !== name),
    );
  }

  async deleteExpense(id: bigint): Promise<void> {
    const rawId = fromBigIntToRaw(id, "expense");
    await apiRequest<{ ok: boolean }>(`/expenses/${encodeURIComponent(rawId)}`, {
      method: "DELETE",
    });
  }

  async deleteGroup(groupId: bigint): Promise<void> {
    const target = groupId.toString();
    const groups = getStoredGroups().filter((group) => group.id !== target);
    setStoredGroups(groups);
  }

  async editExpense(
    id: bigint,
    amount: number,
    category: string,
    date: string,
    note: string | null,
  ): Promise<void> {
    const rawId = fromBigIntToRaw(id, "expense");
    await apiRequest<{ ok: boolean }>(`/expenses/${encodeURIComponent(rawId)}`, {
      method: "PUT",
      body: JSON.stringify({
        id: rawId,
        amount,
        category,
        date,
        notes: note,
        isShared: false,
      }),
    });
  }

  async getAlerts(month: string): Promise<
    Array<{
      alertType: Variant_warning_exceeded_critical;
      message: string;
      category: string;
    }>
  > {
    const alerts = await apiRequest<Array<{ category: string; percentageSpent: number }>>(
      `/analytics/alerts?month=${encodeURIComponent(month)}`,
    ).catch(() => []);

    return alerts.map((alert) => {
      const value = alert.percentageSpent;
      const alertType =
        value >= 100
          ? Variant_warning_exceeded_critical.exceeded
          : value >= 90
            ? Variant_warning_exceeded_critical.critical
            : Variant_warning_exceeded_critical.warning;
      return {
        alertType,
        category: alert.category,
        message: `${alert.category} is at ${value.toFixed(0)}% of monthly budget`,
      };
    });
  }

  async getBudgetSummary(month: string): Promise<{
    categories: Array<{
      limit: number;
      totalSpent: number;
      percentageUsed: number;
      category: string;
      remaining: number;
    }>;
    totalIncome: number;
    incomeToExpenseRatio: number;
    totalExpenses: number;
  }> {
    const [budgets, expenses] = await Promise.all([
      fetchBudgets(month).catch(() => []),
      fetchExpenses().catch(() => []),
    ]);

    const monthlyExpenses = expenses.filter((expense) => expense.date.startsWith(month));
    const categories = Array.from(
      new Set([
        ...budgets.map((budget) => budget.category),
        ...monthlyExpenses.map((expense) => expense.category),
      ]),
    );

    const categoriesSummary = categories.map((category) => {
      const categoryLimit = budgets
        .filter((budget) => budget.category === category)
        .reduce((sum, budget) => sum + budget.monthlyLimit, 0);
      const totalSpent = monthlyExpenses
        .filter((expense) => expense.category === category)
        .reduce((sum, expense) => sum + expense.amount, 0);
      const percentageUsed =
        categoryLimit > 0 ? (totalSpent / categoryLimit) * 100 : totalSpent > 0 ? 100 : 0;
      return {
        category,
        limit: categoryLimit,
        totalSpent,
        percentageUsed,
        remaining: categoryLimit - totalSpent,
      };
    });

    const totalExpenses = monthlyExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );
    const profile = getStoredProfile();
    const totalIncome =
      profile?.monthlyIncome ?? budgets.reduce((sum, budget) => sum + budget.monthlyLimit, 0);
    const incomeToExpenseRatio = totalExpenses > 0 ? totalIncome / totalExpenses : totalIncome;

    return {
      categories: categoriesSummary,
      totalIncome,
      incomeToExpenseRatio,
      totalExpenses,
    };
  }

  async getCallerUserProfile(): Promise<UserProfile | null> {
    return getStoredProfile();
  }

  async getCallerUserRole(): Promise<UserRole> {
    return UserRole.user;
  }

  async getFinancialScore(): Promise<{
    savingTips: string[];
    highestSpendingCategory: string;
    emergencyFundRecommendation: number;
    disciplineLevel: string;
    weeklySpendingCap: number;
    borrowingRisk: string;
    monthlyTrend: Array<{ month: string; total: number }>;
    financialScore: number;
  }> {
    const [scoreData, monthlyData, categoryData, profile] = await Promise.all([
      apiRequest<{ score: number }>(`/analytics/score?month=${encodeURIComponent(currentMonth())}`).catch(
        () => ({ score: 0 }),
      ),
      apiRequest<Array<{ month: string; total: number }>>("/analytics/monthly?lastMonths=6").catch(
        () => [],
      ),
      apiRequest<Array<{ category: string; total: number }>>(
        `/analytics/category?month=${encodeURIComponent(currentMonth())}`,
      ).catch(() => []),
      Promise.resolve(getStoredProfile()),
    ]);

    const highest =
      categoryData.sort((left, right) => right.total - left.total)[0]?.category ?? "N/A";
    const income = profile?.monthlyIncome ?? 0;
    const weeklySpendingCap = income > 0 ? Number((income * 0.25).toFixed(2)) : 0;
    const disciplineLevel =
      scoreData.score >= 75 ? "High" : scoreData.score >= 50 ? "Medium" : "Low";

    return {
      financialScore: scoreData.score,
      monthlyTrend: monthlyData,
      highestSpendingCategory: highest,
      emergencyFundRecommendation: Math.round(income * 3),
      disciplineLevel,
      weeklySpendingCap,
      borrowingRisk: scoreData.score < 45 ? "High" : scoreData.score < 70 ? "Medium" : "Low",
      savingTips: [
        "Track daily expenses to reduce leakage",
        "Set category limits before the month starts",
        "Review weekly trends and adjust discretionary spending",
      ],
    };
  }

  async getSettlementSummary(groupId: bigint): Promise<Array<[Principal, Principal, number]>> {
    const list = await this.listSharedExpenses(groupId);
    return list.flatMap((item) => {
      const creditor = item.paidBy;
      return item.customSplits
        .filter(([debtor]) => debtor.toString() !== creditor.toString())
        .map(([debtor, amount]) => [debtor, creditor, amount] as [Principal, Principal, number]);
    });
  }

  async getUserProfile(_user: Principal): Promise<UserProfile | null> {
    return this.getCallerUserProfile();
  }

  async isCallerAdmin(): Promise<boolean> {
    return false;
  }

  async listCategories(): Promise<string[]> {
    return listCategoriesInternal();
  }

  async listExpenses(
    categoryFilter: string | null,
    monthFilter: string | null,
  ): Promise<Expense[]> {
    const data = await fetchExpenses();
    return data
      .filter((item) => (categoryFilter ? item.category === categoryFilter : true))
      .filter((item) => (monthFilter ? item.date.startsWith(monthFilter) : true))
      .map((item) => ({
        id: BigInt(toBigIntString(item.id, "expense")),
        date: item.date,
        note: item.notes ?? undefined,
        category: item.category,
        amount: item.amount,
      }));
  }

  async listGroups(): Promise<SharedExpenseGroup[]> {
    const groups = getStoredGroups();
    return groups.map((group) => ({
      id: BigInt(group.id),
      creator: principalFromText("anonymous"),
      members: group.members.map((member) => principalFromText(member)),
      name: group.name,
    }));
  }

  async listSharedExpenses(groupId: bigint): Promise<SharedExpense[]> {
    const data = await fetchSharedExpenses();
    const map = getSharedToGroupMap();
    const targetGroupId = groupId.toString();
    return data
      .filter((item) => map[item.id] === targetGroupId)
      .map((item) => ({
        id: BigInt(toBigIntString(item.id, "shared")),
        settlements: item.participants.map((participant) => [
          principalFromText(participant.name),
          item.isSettled,
        ] as [Principal, boolean]),
        splitType: Variant_custom_equal.custom,
        description: item.description,
        groupId,
        totalAmount: item.totalAmount,
        customSplits: item.participants.map((participant) => [
          principalFromText(participant.name),
          participant.share,
        ] as [Principal, number]),
        paidBy: principalFromText(item.paidBy),
      }));
  }

  async markSplitPaid(_groupId: bigint, expenseId: bigint): Promise<void> {
    const rawId = fromBigIntToRaw(expenseId, "shared");
    await apiRequest<{ ok: boolean }>(
      `/shared-expenses/${encodeURIComponent(rawId)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ isSettled: true }),
      },
    );
  }

  async removeGroupMember(groupId: bigint, member: Principal): Promise<void> {
    const groups = getStoredGroups();
    const target = groups.find((group) => group.id === groupId.toString());
    if (!target) return;
    target.members = target.members.filter((item) => item !== member.toString());
    setStoredGroups(groups);
  }

  async saveCallerUserProfile(profile: UserProfile): Promise<void> {
    writeJson(STORAGE_KEYS.profile, profile);
  }

  async setMonthlyBudget(category: string, amount: number): Promise<void> {
    const month = currentMonth();
    await apiRequest<{ ok: boolean }>("/budgets", {
      method: "POST",
      body: JSON.stringify({
        id: buildBudgetId(month, category),
        month,
        category,
        monthlyLimit: amount,
      }),
    });
  }
}

let singleton: backendInterface | null = null;

export function getRestBackendActor(): backendInterface {
  if (!singleton) {
    const actor = new RestBackendActor();
    if (!getStoredProfile()) {
      void actor.saveCallerUserProfile(buildDefaultProfile());
    }
    singleton = actor;
  }
  return singleton;
}
