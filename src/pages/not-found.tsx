import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/6 blur-[120px] rounded-full pointer-events-none" />
      <div className="relative z-10 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <AlertCircle className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-6xl font-black text-primary mb-2">404</h1>
          <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
          <p className="text-muted-foreground text-sm">The page you're looking for doesn't exist or has been moved.</p>
        </div>
        <Link href="/">
          <Button className="bg-primary text-white font-bold shadow-[0_0_15px_rgba(249,115,22,0.3)]">
            <Home className="h-4 w-4 mr-2" />Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
