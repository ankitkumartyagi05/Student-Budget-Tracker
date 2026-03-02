import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface SharedExpenseGroup {
    id: bigint;
    creator: Principal;
    members: Array<Principal>;
    name: string;
}
export interface SharedExpense {
    id: bigint;
    settlements: Array<[Principal, boolean]>;
    splitType: Variant_custom_equal;
    description: string;
    groupId: bigint;
    totalAmount: number;
    customSplits: Array<[Principal, number]>;
    paidBy: Principal;
}
export interface Expense {
    id: bigint;
    date: string;
    note?: string;
    category: string;
    amount: number;
}
export interface UserProfile {
    age: bigint;
    findsAppsUseful: boolean;
    previousAppName?: string;
    tracksDailyExpenses: boolean;
    livingSituation: LivingSituation;
    biggestFinancialProblem: string;
    name: string;
    featurePreferences: Array<string>;
    conflictFrequency: ConflictFrequency;
    incomeSource: IncomeSource;
    borrowsDueToBudget: boolean;
    majorSpendingCategory: string;
    gender: Gender;
    financialStressLevel: bigint;
    hasSharedExpenses: boolean;
    course: string;
    prefersAutoSplit: boolean;
    hasEmergencySavings: boolean;
    setsMonthlyBudget: boolean;
    monthEndShortage: boolean;
    monthlyIncome: number;
    budgetDisciplineLevel: BudgetDisciplineLevel;
}
export enum BudgetDisciplineLevel {
    low = "low",
    high = "high",
    medium = "medium"
}
export enum ConflictFrequency {
    often = "often",
    never_ = "never",
    sometimes = "sometimes",
    rarely = "rarely"
}
export enum Gender {
    other = "other",
    female = "female",
    male = "male"
}
export enum IncomeSource {
    scholarship = "scholarship",
    other = "other",
    partTimeJob = "partTimeJob",
    allowance = "allowance"
}
export enum LivingSituation {
    withParents = "withParents",
    onCampus = "onCampus",
    offCampus = "offCampus"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_custom_equal {
    custom = "custom",
    equal = "equal"
}
export enum Variant_warning_exceeded_critical {
    warning = "warning",
    exceeded = "exceeded",
    critical = "critical"
}
export interface backendInterface {
    addCustomCategory(name: string): Promise<void>;
    addExpense(amount: number, category: string, date: string, note: string | null): Promise<bigint>;
    addGroupMember(groupId: bigint, member: Principal): Promise<void>;
    addSharedExpense(groupId: bigint, description: string, totalAmount: number, paidBy: Principal, splitType: Variant_custom_equal, customSplits: Array<[Principal, number]>): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createGroup(name: string): Promise<bigint>;
    deleteCustomCategory(name: string): Promise<void>;
    deleteExpense(id: bigint): Promise<void>;
    deleteGroup(groupId: bigint): Promise<void>;
    editExpense(id: bigint, amount: number, category: string, date: string, note: string | null): Promise<void>;
    getAlerts(month: string): Promise<Array<{
        alertType: Variant_warning_exceeded_critical;
        message: string;
        category: string;
    }>>;
    getBudgetSummary(month: string): Promise<{
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
    }>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFinancialScore(): Promise<{
        savingTips: Array<string>;
        highestSpendingCategory: string;
        emergencyFundRecommendation: number;
        disciplineLevel: string;
        weeklySpendingCap: number;
        borrowingRisk: string;
        monthlyTrend: Array<{
            month: string;
            total: number;
        }>;
        financialScore: number;
    }>;
    getSettlementSummary(groupId: bigint): Promise<Array<[Principal, Principal, number]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listCategories(): Promise<Array<string>>;
    listExpenses(categoryFilter: string | null, monthFilter: string | null): Promise<Array<Expense>>;
    listGroups(): Promise<Array<SharedExpenseGroup>>;
    listSharedExpenses(groupId: bigint): Promise<Array<SharedExpense>>;
    markSplitPaid(groupId: bigint, expenseId: bigint): Promise<void>;
    removeGroupMember(groupId: bigint, member: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setMonthlyBudget(category: string, amount: number): Promise<void>;
}
