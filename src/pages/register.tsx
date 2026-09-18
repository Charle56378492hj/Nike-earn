import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { setToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { BrandLogo } from "@/components/brand-logo";
import { Loader2, CheckCircle2, Rocket } from "lucide-react";
import { customFetch } from "@/lib/api-client/custom-fetch";
import type { AuthResponse } from "@/lib/api-client";
import { useMutation } from "@tanstack/react-query";

const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  username: z.string().min(3, "Min 3 characters").max(30),
  password: z.string().min(8, "Min 8 characters"),
});
type RegisterFormValues = z.infer<typeof registerSchema>;

const perks = [
  "Free to join — no credit card required",
  "Withdraw USDT to your wallet instantly",
  "Access 5+ premium offerwalls",
];

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", username: "", password: "" },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormValues) =>
      customFetch<AuthResponse>("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (res) => {
      setToken(res.token);
      toast({ title: "Welcome to Nike earn!" });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.data?.error || error.message,
      });
    },
  });

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#030812]">
      <div className="auth-background absolute inset-0" aria-hidden />
      <div className="auth-overlay absolute inset-0" aria-hidden />
      {/* ── Left 3D brand panel ── */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden p-12 lg:flex">
        <div className="absolute inset-0 grid-overlay-light opacity-60" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-[26rem] w-[26rem] rounded-full brand-gradient opacity-40 blur-[110px] animate-aurora" aria-hidden />
        <div className="pointer-events-none absolute -top-28 right-0 h-80 w-80 rounded-full bg-primary-glow/40 blur-[110px] animate-float-slow" aria-hidden />

        <motion.div
          initial={{ opacity: 0, y: 24, rotateY: 14 }}
          animate={{ opacity: 1, y: 0, rotateY: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="scene-3d relative z-10 w-full max-w-sm"
        >
          <div className="layer-3d space-y-8 text-center">
            <div className="flex justify-center depth-2">
              <BrandLogo size="lg" tone="light" />
            </div>

            <div className="depth-1 space-y-3">
              <h2 className="text-4xl font-black tracking-tighter text-white">Start Earning Today</h2>
              <p className="text-lg text-white/70">
                Create your free account and start withdrawing USDT in minutes.
              </p>
            </div>

            <div className="depth-2 rounded-3xl glass-dark p-5 text-left shadow-brand-lg animate-float">
              <div className="mb-4 flex items-center gap-2.5 text-white">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient shadow-brand">
                  <Rocket className="h-4.5 w-4.5 text-white" />
                </span>
                <span className="text-sm font-black uppercase tracking-[0.16em]">Member perks</span>
              </div>
              <div className="space-y-3">
                {perks.map((t) => (
                  <div key={t} className="flex items-start gap-3 text-sm text-white/85">
                    <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-red-600-glow" />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Right form ── */}
      <div className="relative flex min-h-screen flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8 lg:max-w-lg">
        <div className="pointer-events-none absolute inset-0 grid-overlay opacity-40 lg:hidden" aria-hidden />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-sm"
        >
          <div className="mb-8 text-center lg:text-left">
            <div className="mb-6 flex justify-center lg:hidden">
              <BrandLogo size="md" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">Create Account</h1>
            <p className="mt-1.5 text-sm text-white/70">
              Join thousands of users earning USDT daily.
            </p>
          </div>

          <div className="auth-form-panel rounded-3xl p-6 shadow-brand sm:p-7">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@example.com"
                          {...field}
                          className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Username
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="YourUsername"
                          {...field}
                          className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Min. 8 characters"
                          {...field}
                          className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="mt-1 h-12 w-full brand-gradient text-base font-black text-white shadow-brand transition-transform hover:-translate-y-0.5"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Free Account"}
                </Button>
              </form>
            </Form>
          </div>

          <div className="mt-6 text-center text-sm text-white/70">
            Already have an account?{" "}
            <Link href="/login">
              <span className="cursor-pointer font-semibold text-red-600 hover:underline">Sign in</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
