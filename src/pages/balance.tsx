import { Layout } from "@/components/layout";
import { useGetBalance } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Coins, Send, Clock, Wallet, ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tilt, Reveal } from "@/components/motion-fx";

const formatMoney = (value?: string | number | null) => {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
};

export default function Balance() {
  const { data: balanceData, isLoading } = useGetBalance();

  return (
    <Layout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <Reveal className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-foreground">Wallet</h2>
            <p className="text-muted-foreground">Manage your earnings.</p>
          </div>
          <Link href="/withdraw">
            <Button className="brand-gradient text-white font-bold shadow-brand hover:-translate-y-0.5 transition-transform">
              <Send className="mr-2 h-4 w-4" /> Withdraw
            </Button>
          </Link>
        </Reveal>

        {/* 3D hero balance card */}
        <Reveal delay={0.06}>
          <Tilt strength={5}>
            <div className="relative animate-float-slow">
              <div className="absolute -inset-4 brand-gradient rounded-[2rem] blur-3xl opacity-30" aria-hidden />
              <div className="relative overflow-hidden rounded-[2rem] glass-dark p-8 shadow-brand-lg layer-3d">
                <div className="pointer-events-none absolute inset-0 grid-overlay-light opacity-30" aria-hidden />
                <div className="pointer-events-none absolute -right-10 -top-10 opacity-10">
                  <Wallet className="w-56 h-56 text-white" />
                </div>

                <div className="relative depth-1 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">Available Balance</span>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                    USDT
                  </span>
                </div>

                <div className="relative mt-5 depth-2 flex items-center justify-between gap-4">
                  {isLoading ? (
                    <Skeleton className="h-16 w-56 bg-white/10" />
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-black tracking-tighter text-white drop-shadow">
                        {formatMoney(balanceData?.balance)}
                      </span>
                      <span className="text-2xl font-black text-primary-glow">USDT</span>
                    </div>
                  )}
                  {!isLoading && Number(balanceData?.balance ?? 0) === 0 && (
                    <img
                      src="/assets/fox-earn-zero-balance.webp"
                      alt="Your balance is currently zero"
                      className="w-36 max-h-36 shrink-0 object-contain object-right sm:w-52 sm:max-h-44"
                    />
                  )}
                </div>

                <div className="relative mt-6 depth-3">
                  <Link href="/withdraw">
                    <button className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-primary shadow-lg transition-transform hover:-translate-y-0.5">
                      <ArrowUpRight className="h-4 w-4" /> Withdraw now
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </Tilt>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2">
          <Reveal delay={0.12}>
            <Tilt strength={7} className="h-full">
              <Card className="h-full bg-card border-border transition-shadow duration-300 hover:shadow-brand">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Earned</CardTitle>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 border border-green-500/20">
                    <Coins className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <div className="text-2xl font-black text-foreground">{formatMoney(balanceData?.totalEarned)} USDT</div>
                  )}
                </CardContent>
              </Card>
            </Tilt>
          </Reveal>
          <Reveal delay={0.18}>
            <Tilt strength={7} className="h-full">
              <Card className="h-full bg-card border-border transition-shadow duration-300 hover:shadow-brand">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pending Withdrawals</CardTitle>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <div className="text-2xl font-black text-foreground">{formatMoney(balanceData?.pendingWithdrawals)} USDT</div>
                  )}
                </CardContent>
              </Card>
            </Tilt>
          </Reveal>
        </div>
      </div>
    </Layout>
  );
}
