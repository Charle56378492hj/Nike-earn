import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { useLogin } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { BrandLogo } from "@/components/brand-logo";
import { Loader2, ShieldCheck, Wallet, TrendingUp } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Required"),
});
type LoginFormValues = z.infer<typeof loginSchema>;

const highlights = [
  { icon: Wallet, text: "Access your balance anytime" },
  { icon: TrendingUp, text: "Track all your earnings" },
  { icon: ShieldCheck, text: "Withdraw to any wallet securely" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          setToken(res.token);
          toast({ title: "Welcome back!" });
          setLocation("/dashboard");
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: "Login failed",
            description: error.data?.error || error.message,
          });
        },
      },
    );
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#030812]">
      <div className="auth-background absolute inset-0" aria-hidden />
      <div className="auth-overlay absolute inset-0" aria-hidden />
      {/* ── Left 3D brand panel ── */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden p-12 lg:flex">
        <div className="absolute inset-0 grid-overlay-light opacity-60" aria-hidden />
        <div className="pointer-events-none absolute -top-24 -left-16 h-[26rem] w-[26rem] rounded-full brand-gradient opacity-40 blur-[110px] animate-aurora" aria-hidden />
        <div className="pointer-events-none absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-primary-glow/40 blur-[110px] animate-float-slow" aria-hidden />

        <motion.div
          initial={{ opacity: 0, y: 24, rotateY: -14 }}
          animate={{ opacity: 1, y: 0, rotateY: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="scene-3d relative z-10 w-full max-w-sm"
        >
          <div className="layer-3d space-y-8 text-center">
            <div className="flex justify-center depth-2">
              <BrandLogo size="lg" tone="light" />
            </div>

            <div className="depth-1 space-y-3">
              <h2 className="text-4xl font-black tracking-tighter text-white">Welcome Back</h2>
              <p className="text-lg text-white/70">
                Sign in and continue earning USDT from your favorite offerwalls.
              </p>
            </div>

            <div className="depth-2 rounded-3xl glass-dark p-5 text-left shadow-brand-lg animate-float">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Available balance</div>
              <div className="mt-1 text-4xl font-black tracking-tighter text-white">$1,284.60</div>
              <div className="mt-4 space-y-2.5">
                {highlights.map((h) => (
                  <div key={h.text} className="flex items-center gap-3 text-sm text-white/85">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
                      <h.icon className="h-4 w-4" />
                    </span>
                    {h.text}
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
            <h1 className="text-3xl font-black tracking-tight text-white">Sign In</h1>
            <p className="mt-1.5 text-sm text-white/70">
              Enter your credentials to access your account.
            </p>
          </div>

          <div className="auth-form-panel rounded-3xl p-6 shadow-brand sm:p-7">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Password
                        </FormLabel>
                        <Link href="/forgot-password">
                          <span className="cursor-pointer text-xs font-semibold text-red-600 hover:underline">
                            Forgot password?
                          </span>
                        </Link>
                      </div>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
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
                  className="h-12 w-full brand-gradient text-base font-black text-white shadow-brand transition-transform hover:-translate-y-0.5"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
                </Button>
              </form>
            </Form>
          </div>

          <div className="mt-6 text-center text-sm text-white/70">
            New to Nike earn?{" "}
            <Link href="/register">
              <span className="cursor-pointer font-semibold text-red-600 hover:underline">Create account</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
