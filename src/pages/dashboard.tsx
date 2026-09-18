import { Layout } from "@/components/layout";
import { useGetDashboardStats, useGetBalance, useListPlatforms, useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Coins, Download, CheckCircle2, History, ArrowUpRight, Gamepad2, Zap, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tilt, Reveal } from "@/components/motion-fx";

const formatMoney = (value?: string | number | null) => {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
};

function buildOfferUrl(template: string, userId: number): string {
  return template
    .replace(/\{USER_ID\}/g, String(userId))
    .replace(/\[USER_ID\]/g, String(userId))
    .replace(/%7BUSER_ID%7D/g, String(userId));
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: balanceData } = useGetBalance();
  const { data: platformsData } = useListPlatforms();
  const { data: user } = useGetMe();
  const [featuredPlatform, setFeaturedPlatform] = useState<any>(null);

  // Pick the homepage-placement platform as the featured one
  useEffect(() => {
    if (!platformsData?.platforms) return;
    const hp = platformsData.platforms.find((p: any) => p.placement === "homepage" && p.isEnabled && p.apiEndpoint);
    if (hp) {
      setFeaturedPlatform(hp);
    } else {
      // fallback: first platform with a URL
      const fallback = platformsData.platforms.find((p: any) => p.apiEndpoint && p.isEnabled);
      if (fallback) setFeaturedPlatform(fallback);
    }
  }, [platformsData]);

  const offerUrl = featuredPlatform && user?.id
    ? buildOfferUrl(featuredPlatform.apiEndpoint, user.id)
    : featuredPlatform?.apiEndpoint;

  const statCards = [
    { label: "Current Balance", value: `$${formatMoney(balanceData?.balance)}`, icon: Coins, highlight: true },
    { label: "Total Earned", value: `$${formatMoney(stats?.totalEarned)}`, icon: CheckCircle2, highlight: false },
    { label: "Total Withdrawn", value: `$${formatMoney(stats?.totalWithdrawn)}`, icon: Download, highlight: false },
    { label: "Pending", value: `$${formatMoney(stats?.pendingWithdrawals)}`, icon: History, highlight: false },
  ];

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
        <Reveal className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">Dashboard</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Here's your earnings overview.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/platforms">
              <Button variant="outline" size="sm" className="border-border hover:border-primary/40 hover:text-primary">
                <Gamepad2 className="h-4 w-4 mr-1.5" />Browse Offers
              </Button>
            </Link>
            <Link href="/withdraw">
              <Button size="sm" className="brand-gradient text-white font-bold shadow-brand hover:-translate-y-0.5 transition-transform">
                <ArrowUpRight className="h-4 w-4 mr-1.5" />Withdraw
              </Button>
            </Link>
          </div>
        </Reveal>

        {/* Stats — 3D tilt cards */}
        <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.06}>
              <Tilt strength={6} className="h-full">
                <Card
                  className={`relative h-full overflow-hidden border-border transition-shadow duration-300 hover:shadow-brand ${
                    stat.highlight ? "glass-card" : "bg-card"
                  }`}
                >
                  {stat.highlight && (
                    <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full brand-gradient opacity-20 blur-2xl" aria-hidden />
                  )}
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2">
                    <CardTitle className="text-[8px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</CardTitle>
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                        stat.highlight ? "brand-gradient shadow-brand" : "bg-primary/10 border border-primary/20"
                      }`}
                    >
                      <stat.icon className={`h-2.5 w-2.5 ${stat.highlight ? "text-white" : "text-primary"}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="relative p-2 pt-0">
                    {statsLoading ? (
                      <Skeleton className="h-6 w-16 mt-0.5" />
                    ) : (
                      <div className={`text-lg sm:text-xl font-black tracking-tight ${stat.highlight ? "brand-text" : "text-foreground"}`}>
                        {stat.value}
                      </div>
                    )}
                    <p className="text-[8px] text-muted-foreground mt-0 uppercase tracking-wider">USDT</p>
                  </CardContent>
                </Card>
              </Tilt>
            </Reveal>
          ))}
        </div>

        {/* Featured Platform — always open iframe */}
        <Reveal delay={0.15}>
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {featuredPlatform?.logoUrl ? (
                  <img src={featuredPlatform.logoUrl} alt={featuredPlatform.name} className="w-6 h-6 rounded object-cover border border-border" />
                ) : (
                  <div className="w-6 h-6 rounded-md bg-primary/15 border border-primary/25 flex items-center justify-center">
                    <Zap className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <span className="font-bold text-sm text-foreground">
                  {featuredPlatform ? featuredPlatform.name : "No Featured Platform"}
                </span>
                {featuredPlatform && (
                  <span className="text-[10px] brand-gradient text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">Live</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {offerUrl && (
                  <a href={offerUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                    <ExternalLink className="h-3 w-3" /> Open in tab
                  </a>
                )}
                <Link href="/platforms">
                  <Button variant="outline" size="sm" className="h-7 text-xs border-border hover:border-primary/40 hover:text-primary">
                    <Gamepad2 className="h-3 w-3 mr-1" /> Switch Platform
                  </Button>
                </Link>
              </div>
            </div>

            {/* Iframe area */}
            {featuredPlatform && offerUrl ? (
              <iframe
                key={featuredPlatform.id}
                src={offerUrl}
                className="w-full border-0"
                style={{ height: "600px" }}
                allow="fullscreen"
                title={featuredPlatform.name}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-20 px-8" style={{ height: "600px" }}>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="w-16 h-16 rounded-2xl brand-gradient shadow-brand flex items-center justify-center mb-5 animate-float"
                >
                  <Gamepad2 className="h-8 w-8 text-white" />
                </motion.div>
                <h3 className="text-lg font-bold text-foreground mb-2">No Platform Featured Yet</h3>
                <p className="text-muted-foreground text-sm max-w-xs mb-5">
                  The admin hasn't set a featured platform for the dashboard yet. Browse all available offerwalls.
                </p>
                <Link href="/platforms">
                  <Button className="brand-gradient text-white font-bold shadow-brand hover:-translate-y-0.5 transition-transform">
                    <Gamepad2 className="h-4 w-4 mr-2" /> Browse Offerwalls
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </Layout>
  );
}
