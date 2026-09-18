import { Link, useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { LogOut, Home, Wallet, History, Send, Gamepad2, Settings, ShieldAlert, Menu, Languages, ChevronRight } from "lucide-react";
import { removeToken } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";

const translations = {
  en: { dashboard: "Overview", balance: "Wallet", transactions: "Activity", withdraw: "Cash out", platforms: "Earn now", settings: "Profile", adminPanel: "Admin studio", logout: "Sign out", loading: "Loading your workspace..." },
  ar: { dashboard: "الرئيسية", balance: "المحفظة", transactions: "النشاط", withdraw: "سحب الأرباح", platforms: "ابدأ الربح", settings: "الملف الشخصي", adminPanel: "لوحة الإدارة", logout: "تسجيل الخروج", loading: "جارٍ تجهيز حسابك..." },
} as const;

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useGetMe();
  const [language, setLanguage] = useState<"en" | "ar">(() => (localStorage.getItem("nike-language") as "en" | "ar") || "en");
  useEffect(() => { localStorage.setItem("nike-language", language); document.documentElement.lang = language; document.documentElement.dir = language === "ar" ? "rtl" : "ltr"; }, [language]);
  useEffect(() => { if (!isLoading && !user) setLocation("/login"); }, [isLoading, user, setLocation]);
  const t = useMemo(() => translations[language], [language]);

  if (isLoading || !user) return <div className="min-h-screen grid place-items-center bg-slate-50"><div className="text-center"><div className="brand-mark mx-auto mb-4 h-12 w-12 text-2xl animate-pulse"><span>n</span></div><p className="text-sm font-semibold text-slate-500">{t.loading}</p></div></div>;

  const handleLogout = () => { removeToken(); queryClient.clear(); setLocation("/login"); };
  const navItems = [
    { href: "/dashboard", label: t.dashboard, icon: Home },
    { href: "/balance", label: t.balance, icon: Wallet },
    { href: "/transactions", label: t.transactions, icon: History },
    { href: "/withdraw", label: t.withdraw, icon: Send },
    { href: "/platforms", label: t.platforms, icon: Gamepad2 },
    { href: "/settings", label: t.settings, icon: Settings },
    ...(user.isAdmin || user.isSuperAdmin ? [{ href: "/admin/dashboard", label: t.adminPanel, icon: ShieldAlert }] : []),
  ];
  const NavLinks = ({ closeSheet }: { closeSheet?: () => void }) => <>{navItems.map((item) => { const active = location === item.href; return <Link key={item.href} href={item.href} onClick={closeSheet}><div className={`nav-link ${active ? "nav-link-active" : ""}`}><item.icon className="h-[18px] w-[18px] shrink-0" /><span>{item.label}</span>{item.href === "/admin/dashboard" && <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-extrabold uppercase text-red-600">Admin</span>}{active && <ChevronRight className="ml-auto h-4 w-4 opacity-60" />}</div></Link>; })}</>;

  return <div className="min-h-screen bg-[#f7f8fa] text-slate-950">
    <aside className="dashboard-sidebar hidden lg:flex">
      <div className="px-6 pt-7"><Link href="/"><BrandLogo size="md" /></Link><div className="mt-10 rounded-2xl bg-slate-950 p-4 text-white"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-400">Your earning hub</p><p className="mt-2 text-sm font-medium text-slate-300">Turn spare moments into real rewards.</p></div></div>
      <nav className="mt-8 flex flex-1 flex-col gap-1 px-4"><p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Workspace</p><NavLinks /></nav>
      <div className="border-t border-slate-200 p-4"><div className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><div className="avatar-dot">{user.username?.slice(0,1).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-bold">{user.username}</p><p className="truncate text-[11px] text-slate-500">{user.email}</p></div></div><Button variant="ghost" className="w-full justify-start gap-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600" onClick={handleLogout}><LogOut className="h-4 w-4" />{t.logout}</Button></div>
    </aside>
    <main className="min-w-0 lg:pl-[280px]">
      <header className="dashboard-topbar"><div className="lg:hidden"><Link href="/"><BrandLogo size="sm" /></Link></div><div className="hidden lg:block"><p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">Nike earn / workspace</p><p className="mt-1 text-sm text-slate-500">Welcome back, {user.username}</p></div><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => setLanguage(language === "en" ? "ar" : "en")} className="h-9 gap-1.5 rounded-full border-slate-200 bg-white px-3 text-xs font-bold"><Languages className="h-3.5 w-3.5" />{language === "en" ? "AR" : "EN"}</Button><div className="lg:hidden"><Sheet><SheetTrigger asChild><Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-slate-200 bg-white"><Menu className="h-4 w-4" /></Button></SheetTrigger><SheetContent side="left" className="w-[290px] border-0 bg-white p-0"><div className="border-b border-slate-100 p-6"><BrandLogo size="sm" /></div><nav className="flex flex-col gap-1 p-4"><NavLinks /></nav><div className="mt-auto border-t border-slate-100 p-4"><Button variant="ghost" className="w-full justify-start gap-3 text-red-600" onClick={handleLogout}><LogOut className="h-4 w-4" />{t.logout}</Button></div></SheetContent></Sheet></div></div></header>
      <nav className="mobile-bottom-nav lg:hidden">{navItems.slice(0, 5).map((item) => <Link key={item.href} href={item.href}><div className={location === item.href ? "mobile-nav-item active" : "mobile-nav-item"}><item.icon className="h-5 w-5" /><span>{item.label.split(" ")[0]}</span></div></Link>)}</nav>
      <div className="min-h-[calc(100vh-80px)] p-4 pb-24 sm:p-6 lg:p-10 lg:pb-10">{children}</div>
    </main>
  </div>;
}
