"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { WalletMinimal } from "lucide-react";
import { CLOUD_ENABLED } from "@/lib/supabase/config";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Tabs } from "@/components/ui/Tabs";

type Mode = "signin" | "signup" | "magic";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!CLOUD_ENABLED) {
      router.replace("/");
      return;
    }
    import("@/lib/supabase/client").then(async ({ getSupabase }) => {
      const { data } = await getSupabase().auth.getSession();
      if (data.session) router.replace("/");
    });
  }, [router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const { getSupabase } = await import("@/lib/supabase/client");
      const supabase = getSupabase();
      const redirectTo = `${window.location.origin}/auth/callback`;
      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
        if (error) throw error;
        setNotice("Check your email for a sign-in link.");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
        if (error) throw error;
        if (data.session) router.replace("/");
        else setNotice("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-accent text-on-accent">
            <WalletMinimal className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Money Ledger</h1>
            <p className="text-sm text-fg-3">Private. Synced. Yours.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-5 shadow-card sm:p-6">
          <Tabs
            label="Sign-in method"
            value={mode}
            onChange={(m) => {
              setMode(m);
              setError(null);
              setNotice(null);
            }}
            items={[
              { value: "signin", label: "Sign in" },
              { value: "signup", label: "Create account" },
              { value: "magic", label: "Email link" },
            ]}
            className="mb-5"
          />
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <Field label="Email">
              {({ id }) => (
                <Input id={id} type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              )}
            </Field>
            {mode !== "magic" && (
              <Field label="Password" hint={mode === "signup" ? "At least 8 characters" : undefined}>
                {({ id, describedBy }) => (
                  <Input
                    id={id}
                    type="password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    value={password}
                    minLength={8}
                    aria-describedby={describedBy}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                )}
              </Field>
            )}
            {error && (
              <p role="alert" className="rounded-sm bg-danger-soft px-3 py-2 text-sm text-danger-text">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="rounded-sm bg-accent-soft px-3 py-2 text-sm text-accent-text">
                {notice}
              </p>
            )}
            <Button type="submit" size="lg" loading={busy} fullWidth>
              {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send sign-in link"}
            </Button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-fg-3">Your entries are encrypted in transit and stored only under your account.</p>
      </div>
    </main>
  );
}
