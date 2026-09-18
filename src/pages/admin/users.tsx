import { useState } from "react";
import { AdminLayout as Layout } from "@/components/admin-layout";
import { useListUsers, useAdjustUserBalance, useUpdateUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const formatAdminAmount = (value: string | number | null | undefined) => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount.toFixed(1) : "0.0";
};

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;
  const { data, isLoading } = useListUsers({ page, limit, search });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
          <div>
            <h2 className="text-3xl font-black tracking-tight uppercase text-foreground">User Management</h2>
          </div>
          <Input 
            placeholder="Search username or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs bg-background border-border"
          />
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-accent">
                  <TableRow className="border-border">
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin h-6 w-6 mx-auto text-primary" /></TableCell></TableRow>
                  ) : data?.users?.map(user => (
                    <TableRow key={user.id} className="border-border">
                      <TableCell className="font-semibold text-foreground">{user.username}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="font-mono text-primary font-bold">{formatAdminAmount(user.balance)} USDT</TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>{user.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <UserActions user={user} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {data?.users?.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8">No users found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {data && data.total > 0 && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data.total)} of {data.total}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * limit >= data.total}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function UserActions({ user }: { user: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const adjustBalance = useAdjustUserBalance();
  const updateUser = useUpdateUser();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const handleAdjustBalance = () => {
    adjustBalance.mutate({ userId: user.id, data: { amount, reason } }, {
      onSuccess: () => {
        toast({ title: "Balance adjusted" });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.data?.error || "Failed" })
    });
  };

  const handleToggleStatus = () => {
    updateUser.mutate({ userId: user.id, data: { status: user.status === 'active' ? 'disabled' : 'active' } }, {
      onSuccess: () => {
        toast({ title: "Status updated" });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      }
    });
  };

  return (
    <div className="flex justify-end gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white">Balance</Button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Adjust Balance for {user.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input type="number" placeholder="Amount (positive or negative)" value={amount} onChange={e => setAmount(e.target.value)} />
            <Input placeholder="Reason" value={reason} onChange={e => setReason(e.target.value)} />
            <Button onClick={handleAdjustBalance} disabled={adjustBalance.isPending} className="w-full">
              {adjustBalance.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Adjust"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Button variant="outline" size="sm" onClick={handleToggleStatus} disabled={updateUser.isPending} className={user.status === 'active' ? 'text-destructive border-destructive/20 hover:bg-destructive hover:text-white' : 'text-green-500 border-green-500/20 hover:bg-green-500 hover:text-white'}>
        {user.status === 'active' ? 'Disable' : 'Enable'}
      </Button>
    </div>
  );
}
