import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Dashboard from "@/pages/dashboard";
import Balance from "@/pages/balance";
import Transactions from "@/pages/transactions";
import Withdraw from "@/pages/withdraw";
import Platforms from "@/pages/platforms";
import Settings from "@/pages/settings";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminWithdrawals from "@/pages/admin/withdrawals";
import AdminPlatforms from "@/pages/admin/platforms";
import AdminAdmins from "@/pages/admin/admins";
import AdminVerifications from "@/pages/admin/verifications";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/balance" component={Balance} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/withdraw" component={Withdraw} />
      <Route path="/platforms" component={Platforms} />
      <Route path="/settings" component={Settings} />

      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/withdrawals" component={AdminWithdrawals} />
      <Route path="/admin/platforms" component={AdminPlatforms} />
      <Route path="/admin/admins" component={AdminAdmins} />
      <Route path="/admin/verifications" component={AdminVerifications} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
