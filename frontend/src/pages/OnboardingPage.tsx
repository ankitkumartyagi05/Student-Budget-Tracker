import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Loader2,
  Target,
  User,
  Wallet,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  BudgetDisciplineLevel,
  ConflictFrequency,
  Gender,
  IncomeSource,
  LivingSituation,
  type UserProfile,
} from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSaveProfile } from "../hooks/useQueries";

const FEATURE_OPTIONS = [
  "Expense Tracking",
  "Budget Alerts",
  "Financial Score",
  "Shared Expense Splitting",
  "Savings Goals",
  "Monthly Reports",
  "Spending Insights",
  "Emergency Fund Tracker",
];

const STRESS_LABELS = ["No stress", "Minimal", "Moderate", "High", "Very high"];

const steps = [
  {
    id: 1,
    title: "About You",
    subtitle: "Tell us a bit about yourself",
    icon: User,
  },
  {
    id: 2,
    title: "Your Income",
    subtitle: "Help us understand your financial situation",
    icon: DollarSign,
  },
  {
    id: 3,
    title: "Financial Habits",
    subtitle: "How do you currently manage money?",
    icon: Brain,
  },
  {
    id: 4,
    title: "Your Goals",
    subtitle: "What do you want to achieve?",
    icon: Target,
  },
];

type FormState = {
  name: string;
  age: string;
  gender: Gender | "";
  course: string;
  livingSituation: LivingSituation | "";
  incomeSource: IncomeSource | "";
  monthlyIncome: string;
  tracksDailyExpenses: boolean;
  monthEndShortage: boolean;
  majorSpendingCategory: string;
  borrowsDueToBudget: boolean;
  setsMonthlyBudget: boolean;
  budgetDisciplineLevel: BudgetDisciplineLevel | "";
  financialStressLevel: string;
  hasEmergencySavings: boolean;
  findsAppsUseful: boolean;
  previousAppName: string;
  hasSharedExpenses: boolean;
  conflictFrequency: ConflictFrequency | "";
  prefersAutoSplit: boolean;
  featurePreferences: string[];
  biggestFinancialProblem: string;
};

const initialForm: FormState = {
  name: "",
  age: "",
  gender: "",
  course: "",
  livingSituation: "",
  incomeSource: "",
  monthlyIncome: "",
  tracksDailyExpenses: false,
  monthEndShortage: false,
  majorSpendingCategory: "",
  borrowsDueToBudget: false,
  setsMonthlyBudget: false,
  budgetDisciplineLevel: "",
  financialStressLevel: "3",
  hasEmergencySavings: false,
  findsAppsUseful: true,
  previousAppName: "",
  hasSharedExpenses: false,
  conflictFrequency: "",
  prefersAutoSplit: true,
  featurePreferences: [],
  biggestFinancialProblem: "",
};

export function OnboardingPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const saveProfile = useSaveProfile();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);

  if (!identity) {
    navigate({ to: "/" });
    return null;
  }

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleFeature = (feature: string) => {
    setForm((prev) => ({
      ...prev,
      featurePreferences: prev.featurePreferences.includes(feature)
        ? prev.featurePreferences.filter((f) => f !== feature)
        : [...prev.featurePreferences, feature],
    }));
  };

  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.age ||
      !form.gender ||
      !form.course ||
      !form.livingSituation
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const profile: UserProfile = {
      name: form.name,
      age: BigInt(Number.parseInt(form.age) || 20),
      gender: form.gender as Gender,
      course: form.course,
      livingSituation: form.livingSituation as LivingSituation,
      incomeSource: (form.incomeSource ||
        IncomeSource.allowance) as IncomeSource,
      monthlyIncome: Number.parseFloat(form.monthlyIncome) || 0,
      tracksDailyExpenses: form.tracksDailyExpenses,
      monthEndShortage: form.monthEndShortage,
      majorSpendingCategory: form.majorSpendingCategory || "Food",
      borrowsDueToBudget: form.borrowsDueToBudget,
      setsMonthlyBudget: form.setsMonthlyBudget,
      budgetDisciplineLevel: (form.budgetDisciplineLevel ||
        BudgetDisciplineLevel.medium) as BudgetDisciplineLevel,
      financialStressLevel: BigInt(
        Number.parseInt(form.financialStressLevel) || 3,
      ),
      hasEmergencySavings: form.hasEmergencySavings,
      findsAppsUseful: form.findsAppsUseful,
      previousAppName: form.previousAppName || undefined,
      hasSharedExpenses: form.hasSharedExpenses,
      conflictFrequency: (form.conflictFrequency ||
        ConflictFrequency.rarely) as ConflictFrequency,
      prefersAutoSplit: form.prefersAutoSplit,
      featurePreferences: form.featurePreferences,
      biggestFinancialProblem:
        form.biggestFinancialProblem || "Managing monthly budget",
    };

    try {
      await saveProfile.mutateAsync(profile);
      toast.success("Profile saved! Welcome to BudgetWise 🎉");
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Arjun Sharma"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="e.g. 21"
                  min="16"
                  max="35"
                  value={form.age}
                  onChange={(e) => update("age", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Gender *</Label>
                <Select
                  value={form.gender}
                  onValueChange={(v) => update("gender", v as Gender)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Gender.male}>Male</SelectItem>
                    <SelectItem value={Gender.female}>Female</SelectItem>
                    <SelectItem value={Gender.other}>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="course">Course / Stream *</Label>
              <Input
                id="course"
                placeholder="e.g. B.Tech Computer Science"
                value={form.course}
                onChange={(e) => update("course", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Living Situation *</Label>
              <Select
                value={form.livingSituation}
                onValueChange={(v) =>
                  update("livingSituation", v as LivingSituation)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Where do you live?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={LivingSituation.withParents}>
                    With Parents
                  </SelectItem>
                  <SelectItem value={LivingSituation.onCampus}>
                    On Campus
                  </SelectItem>
                  <SelectItem value={LivingSituation.offCampus}>
                    Off Campus
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Primary Income Source</Label>
              <Select
                value={form.incomeSource}
                onValueChange={(v) => update("incomeSource", v as IncomeSource)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select income source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={IncomeSource.allowance}>
                    Family Allowance
                  </SelectItem>
                  <SelectItem value={IncomeSource.scholarship}>
                    Scholarship
                  </SelectItem>
                  <SelectItem value={IncomeSource.partTimeJob}>
                    Part-Time Job
                  </SelectItem>
                  <SelectItem value={IncomeSource.other}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="income">Monthly Income / Allowance (₹)</Label>
              <Input
                id="income"
                type="number"
                placeholder="e.g. 8000"
                min="0"
                value={form.monthlyIncome}
                onChange={(e) => update("monthlyIncome", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="majorCategory">Biggest Spending Category</Label>
              <Input
                id="majorCategory"
                placeholder="e.g. Food, Transport, Entertainment"
                value={form.majorSpendingCategory}
                onChange={(e) =>
                  update("majorSpendingCategory", e.target.value)
                }
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <p className="text-sm font-medium">Track daily expenses</p>
                <p className="text-xs text-muted-foreground">
                  Do you currently log your expenses?
                </p>
              </div>
              <Switch
                checked={form.tracksDailyExpenses}
                onCheckedChange={(v) => update("tracksDailyExpenses", v)}
              />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <p className="text-sm font-medium">Month-end money shortage</p>
                <p className="text-xs text-muted-foreground">
                  Run out of money before month ends?
                </p>
              </div>
              <Switch
                checked={form.monthEndShortage}
                onCheckedChange={(v) => update("monthEndShortage", v)}
              />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <p className="text-sm font-medium">
                  Borrow due to poor budgeting
                </p>
                <p className="text-xs text-muted-foreground">
                  Had to borrow money this year?
                </p>
              </div>
              <Switch
                checked={form.borrowsDueToBudget}
                onCheckedChange={(v) => update("borrowsDueToBudget", v)}
              />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <p className="text-sm font-medium">Sets monthly budget</p>
                <p className="text-xs text-muted-foreground">
                  Do you plan a budget each month?
                </p>
              </div>
              <Switch
                checked={form.setsMonthlyBudget}
                onCheckedChange={(v) => update("setsMonthlyBudget", v)}
              />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <p className="text-sm font-medium">Has emergency savings</p>
                <p className="text-xs text-muted-foreground">
                  Do you have any emergency fund?
                </p>
              </div>
              <Switch
                checked={form.hasEmergencySavings}
                onCheckedChange={(v) => update("hasEmergencySavings", v)}
              />
            </div>
            <div className="space-y-2">
              <Label>Budget Discipline Level</Label>
              <Select
                value={form.budgetDisciplineLevel}
                onValueChange={(v) =>
                  update("budgetDisciplineLevel", v as BudgetDisciplineLevel)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="How strictly do you follow budgets?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BudgetDisciplineLevel.low}>
                    Low — I rarely stick to it
                  </SelectItem>
                  <SelectItem value={BudgetDisciplineLevel.medium}>
                    Medium — Sometimes I follow it
                  </SelectItem>
                  <SelectItem value={BudgetDisciplineLevel.high}>
                    High — I follow it strictly
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Financial Stress Level:{" "}
                <span className="text-primary">
                  {
                    STRESS_LABELS[
                      Number.parseInt(form.financialStressLevel) - 1
                    ]
                  }
                </span>
              </Label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">1</span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={form.financialStressLevel}
                  onChange={(e) =>
                    update("financialStressLevel", e.target.value)
                  }
                  className="flex-1 accent-primary"
                />
                <span className="text-xs text-muted-foreground">5</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <p className="text-sm font-medium">
                  Shared expenses with others
                </p>
                <p className="text-xs text-muted-foreground">
                  Split bills with roommates/friends?
                </p>
              </div>
              <Switch
                checked={form.hasSharedExpenses}
                onCheckedChange={(v) => update("hasSharedExpenses", v)}
              />
            </div>
            {form.hasSharedExpenses && (
              <div className="space-y-2">
                <Label>Conflict frequency over money</Label>
                <Select
                  value={form.conflictFrequency}
                  onValueChange={(v) =>
                    update("conflictFrequency", v as ConflictFrequency)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="How often do conflicts happen?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ConflictFrequency.never_}>
                      Never
                    </SelectItem>
                    <SelectItem value={ConflictFrequency.rarely}>
                      Rarely
                    </SelectItem>
                    <SelectItem value={ConflictFrequency.sometimes}>
                      Sometimes
                    </SelectItem>
                    <SelectItem value={ConflictFrequency.often}>
                      Often
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="biggestProblem">
                Biggest financial problem you face
              </Label>
              <Textarea
                id="biggestProblem"
                placeholder="e.g. I always spend too much on food and run out of money by the 20th..."
                rows={3}
                value={form.biggestFinancialProblem}
                onChange={(e) =>
                  update("biggestFinancialProblem", e.target.value)
                }
              />
            </div>
            <div className="space-y-3">
              <Label>
                Which features interest you? (select all that apply)
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {FEATURE_OPTIONS.map((feature) => (
                  <label
                    key={feature}
                    htmlFor={`feature-${feature}`}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      id={`feature-${feature}`}
                      checked={form.featurePreferences.includes(feature)}
                      onCheckedChange={() => toggleFeature(feature)}
                    />
                    <span className="text-sm">{feature}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const currentStep = steps[step];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl">BudgetWise</span>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i === step
                    ? "gradient-primary text-white shadow-glow"
                    : i < step
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? "✓" : s.id}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1 rounded ${i < step ? "bg-primary" : "bg-border"}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-card p-6 ring-1 ring-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
              <currentStep.icon className="w-4.5 h-4.5 text-secondary-foreground" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl">
                {currentStep.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {currentStep.subtitle}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3 mt-6 pt-4 border-t border-border">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                className="flex-1 gradient-primary text-white border-0"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={saveProfile.isPending}
                className="flex-1 gradient-primary text-white border-0"
              >
                {saveProfile.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Complete Setup 🎉"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
