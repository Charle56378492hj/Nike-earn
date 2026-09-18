import { cn } from "@/lib/utils";

interface BrandLogoProps { size?: "sm" | "md" | "lg"; tone?: "dark" | "light"; className?: string; }
const sizeMap = { sm: { mark: "h-8 w-8 text-lg", text: "text-lg" }, md: { mark: "h-11 w-11 text-2xl", text: "text-2xl" }, lg: { mark: "h-16 w-16 text-4xl", text: "text-4xl" } };
export function BrandLogo({ size = "md", tone = "dark", className }: BrandLogoProps) {
  const s = sizeMap[size]; const light = tone === "light";
  return <div className={cn("inline-flex select-none items-center gap-2.5", className)}><div className={cn("brand-mark shrink-0", s.mark)} aria-hidden="true"><span>n</span></div><span className={cn("font-black tracking-[-0.06em] leading-none", s.text, light ? "text-white" : "text-slate-950")}>Nike <span className={light ? "text-red-400" : "text-red-600"}>earn</span></span></div>;
}
export default BrandLogo;
