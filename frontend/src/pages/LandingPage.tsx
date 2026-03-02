import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import {
  BarChart2,
  Loader2,
  Shield,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserProfile } from "../hooks/useQueries";

const features = [
  {
    icon: TrendingUp,
    title: "Track Every Rupee",
    desc: "Log expenses by category and see exactly where your money goes each month.",
  },
  {
    icon: Shield,
    title: "Smart Budget Alerts",
    desc: "Get warned at 75%, 90%, and 100% of your budget — before it's too late.",
  },
  {
    icon: Users,
    title: "Split with Roommates",
    desc: "Create groups, split bills equally or custom, and settle up with one tap.",
  },
  {
    icon: BarChart2,
    title: "Financial Score",
    desc: "A 0–100 score that measures your discipline, savings, and spending habits.",
  },
];

export function LandingPage() {
  const { login, loginStatus, identity, isInitializing } =
    useInternetIdentity();
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const isLoggingIn = loginStatus === "logging-in";

  useEffect(() => {
    if (identity && !profileLoading) {
      if (profile) {
        navigate({ to: "/dashboard" });
      } else {
        navigate({ to: "/onboarding" });
      }
    }
  }, [identity, profile, profileLoading, navigate]);

  if (isInitializing || (identity && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 glass border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-foreground text-lg">
              BudgetWise
            </span>
          </div>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            className="gradient-primary text-white border-0 font-semibold shadow-glow hover:opacity-90"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in…
              </>
            ) : (
              "Get Started Free"
            )}
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                Free for students
              </div>
              <h1 className="font-display text-5xl lg:text-6xl font-black leading-[1.05] mb-6">
                Master your{" "}
                <span className="text-gradient">student finances</span> without
                the stress
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
                Track expenses, set budgets, split bills with roommates, and get
                your personalized financial score — all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  onClick={login}
                  disabled={isLoggingIn}
                  className="gradient-primary text-white border-0 font-bold text-base shadow-glow hover:opacity-90 h-12 px-8"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting…
                    </>
                  ) : (
                    "Start Tracking Now →"
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 font-semibold"
                  onClick={() =>
                    document
                      .getElementById("features")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  See how it works
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Secured by Internet Identity · No password needed
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="rounded-2xl overflow-hidden shadow-card-hover ring-1 ring-border">
                <img
                  src="/assets/generated/hero-budget-tracker.dim_1200x600.png"
                  alt="BudgetWise dashboard preview"
                  className="w-full h-auto"
                />
              </div>
              {/* Floating stat cards */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="absolute -bottom-4 -left-4 glass rounded-xl p-3 shadow-card-hover"
              >
                <p className="text-xs text-muted-foreground">Financial Score</p>
                <p className="font-display text-2xl font-black text-gradient">
                  78/100
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="absolute -top-4 -right-4 glass rounded-xl p-3 shadow-card-hover"
              >
                <p className="text-xs text-muted-foreground">
                  Saved this month
                </p>
                <p className="font-display text-2xl font-black text-green-600">
                  ₹2,450
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-display text-4xl font-black mb-4">
              Everything a student needs
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Built with real student pain points in mind — from allowance
              tracking to roommate splits.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl font-black mb-4">
              Ready to take control?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of students who track smarter and stress less.
            </p>
            <Button
              size="lg"
              onClick={login}
              disabled={isLoggingIn}
              className="gradient-primary text-white border-0 font-bold text-base shadow-glow hover:opacity-90 h-12 px-10"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting…
                </>
              ) : (
                "Get started for free →"
              )}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
