import { AdminLayout as Layout } from "@/components/admin-layout";
import { useGetAdminStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Gamepad2, Coins, ArrowDownUp, Clock, TrendingUp, UserCheck, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const earningsData = [
  { month: "Jan", earnings: 1200, withdrawals: 900 },
  { month: "Feb", earnings: 1800, withdrawals: 1200 },
  { month: "Mar", earnings: 2400, withdrawals: 1900 },
  { month: "Apr", earnings: 2100, withdrawals: 1700 },
  { month: "May", earnings: 3200, withdrawals: 2600 },
  { month: "Jun", earnings: 2900, withdrawals: 2300 },
  { month: "Jul", earnings: 4100, withdrawals: 3400 },
];

const userGrowthData = [
  { month: "Jan", users: 3200 },
  { month: "Feb", users: 4800 },
  { month: "Mar", users: 7200 },
  { month: "Apr", users: 9100 },
  { month: "May", users: 12400 },
  { month: "Jun", users: 18700 },
  { month: "Jul", users: 24300 },
];

const platformData = [
  { name: "OfferToro", value: 35, color: "#f97316" },
  { name: "CPX Research", value: 25, color: "#fb923c" },
  { name: "Lootably", value: 20, color: "#fdba74" },
  { name: "Adgate", value: 12, color: "#fed7aa" },
  { name: "BitLabs", value: 8, color: "#ffedd5" },
];

const formatAdminAmount = (value: string | number | null | undefined) => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount.toFixed(1) : "0.0";
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-xs">
        <p className="font-bold text-foreground mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-medium">
            {p.name}: ${p.value?.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats();

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers, sub: `${stats?.activeUsers ?? 0} active`, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "System Balance", value: `${formatAdminAmount(stats?.totalBalanceInSystem)} USDT`, sub: "across all wallets", icon: Coins, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    { label: "Total Withdrawn", value: `${formatAdminAmount(stats?.totalWithdrawnAllTime)} USDT`, sub: "all time", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
    { label: "Pending Withdrawals", value: stats?.pendingWithdrawals, sub: "awaiting review", icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { label: "Active Platforms", value: stats?.totalPlatforms, sub: "offerwalls", icon: Gamepad2, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { label: "Admins", value: "—", sub: "manage access", icon: UserCheck, color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20" },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Admin Overview
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5">System-wide metrics and performance analytics.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5 font-bold">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Live Data
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat) => (
            <Card key={stat.label} className="bg-card border-border hover:border-border/80 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <CardTitle className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</CardTitle>
                <div className={`w-7 h-7 rounded-lg ${stat.bg} border ${stat.border} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {isLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
              <div className="text-2xl font-black text-foreground">{stat.value ?? "—"}</div>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Earnings vs Withdrawals */}
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Earnings vs Withdrawals
              </CardTitle>
              <p className="text-xs text-muted-foreground">Monthly platform performance (USD)</p>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={earningsData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="withdrawalsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="earnings" name="Earnings" stroke="#f97316" strokeWidth={2} fill="url(#earningsGrad)" />
                  <Area type="monotone" dataKey="withdrawals" name="Withdrawals" stroke="#60a5fa" strokeWidth={2} fill="url(#withdrawalsGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Platform Distribution */}
          <Card className="bg-card border-border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-primary" />
                Platform Share
              </CardTitle>
              <p className="text-xs text-muted-foreground">Traffic distribution</p>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={platformData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`${val}%`, 'Share']} contentStyle={{ background: 'hsl(222,40%,9%)', border: '1px solid hsl(222,20%,14%)', borderRadius: '8px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {platformData.map((p) => (
                  <div key={p.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-muted-foreground">{p.name}</span>
                    </div>
                    <span className="font-bold text-foreground">{p.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* User Growth */}
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                User Growth
              </CardTitle>
              <p className="text-xs text-muted-foreground">Cumulative registered users</p>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={userGrowthData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(222,40%,9%)', border: '1px solid hsl(222,20%,14%)', borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="users" name="Users" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-card border-border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 grid grid-cols-2 gap-2">
              <Link href="/admin/withdrawals">
                <Button variant="outline" className="w-full h-auto py-3.5 flex flex-col gap-1 border-border hover:border-primary/40 hover:text-primary text-xs">
                  <ArrowDownUp className="h-5 w-5" />
                  <span>Withdrawals</span>
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="outline" className="w-full h-auto py-3.5 flex flex-col gap-1 border-border hover:border-primary/40 hover:text-primary text-xs">
                  <Users className="h-5 w-5" />
                  <span>Users</span>
                </Button>
              </Link>
              <Link href="/admin/platforms">
                <Button variant="outline" className="w-full h-auto py-3.5 flex flex-col gap-1 border-border hover:border-primary/40 hover:text-primary text-xs">
                  <Gamepad2 className="h-5 w-5" />
                  <span>Offerwalls</span>
                </Button>
              </Link>
              <Link href="/admin/verifications">
                <Button variant="outline" className="w-full h-auto py-3.5 flex flex-col gap-1 border-border hover:border-primary/40 hover:text-primary text-xs">
                  <Clock className="h-5 w-5" />
                  <span>Verif. Codes</span>
                </Button>
              </Link>
            </CardContent>

            {stats?.pendingWithdrawals && Number(stats.pendingWithdrawals) > 0 ? (
              <CardContent className="p-4 pt-0">
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-wider">Action Required</p>
                  <p className="text-foreground font-bold text-lg">{stats.pendingWithdrawals} pending</p>
                  <Link href="/admin/withdrawals">
                    <Button className="bg-orange-500 text-white hover:bg-orange-600 font-bold w-full text-xs h-8 mt-1">
                      Review Now
                    </Button>
                  </Link>
                </div>
              </CardContent>
            ) : (
              <CardContent className="p-4 pt-0">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">System Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <span className="text-xs text-muted-foreground font-medium">All systems operational</span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}
