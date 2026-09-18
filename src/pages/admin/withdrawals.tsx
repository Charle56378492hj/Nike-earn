import { useState } from "react";
import { AdminLayout as Layout } from "@/components/admin-layout";
import { useListAllWithdrawals, useUpdateWithdrawalStatus, getListAllWithdrawalsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const formatAdminAmount = (value: string | number | null | undefined) => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount.toFixed(1) : "0.0";
};

export default function AdminWithdrawals() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const limit = 10;
  const { data, isLoading } = useListAllWithdrawals({ page, limit, ...(status !== 'all' && { status: status as any }) });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
          <div>
            <h2 className="text-3xl font-black tracking-tight uppercase text-foreground">Withdrawals</h2>
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px] bg-background border-border">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-accent">
                  <TableRow className="border-border">
                    <TableHead>User ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Network / Wallet</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin h-6 w-6 mx-auto text-primary" /></TableCell></TableRow>
                  ) : data?.withdrawals?.map(w => (
                    <TableRow key={w.id} className="border-border">
                      <TableCell className="font-mono text-xs">{w.userId}</TableCell>
                      <TableCell className="font-mono font-bold text-foreground">{formatAdminAmount(w.amount)} USDT</TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">{w.network}</div>
                        <div className="font-mono text-xs truncate max-w-[150px]" title={w.walletAddress}>{w.walletAddress}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={w.status === 'paid' ? 'default' : w.status === 'rejected' ? 'destructive' : 'secondary'}>{w.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <WithdrawalActions withdrawal={w} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {data?.withdrawals?.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8">No withdrawals found.</TableCell></TableRow>
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

function WithdrawalActions({ withdrawal }: { withdrawal: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateStatus = useUpdateWithdrawalStatus();
  const [status, setStatus] = useState<any>(withdrawal.status);
  const [txHash, setTxHash] = useState(withdrawal.txHash || "");
  const [adminNote, setAdminNote] = useState(withdrawal.adminNote || "");

  const handleUpdate = () => {
    updateStatus.mutate({ withdrawalId: withdrawal.id, data: { status, txHash, adminNote } }, {
      onSuccess: () => {
        toast({ title: "Updated" });
        queryClient.invalidateQueries({ queryKey: getListAllWithdrawalsQueryKey() });
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.data?.error || "Failed" })
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white">Update</Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>Update Withdrawal #{withdrawal.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Transaction Hash" value={txHash} onChange={e => setTxHash(e.target.value)} />
          <Input placeholder="Admin Note" value={adminNote} onChange={e => setAdminNote(e.target.value)} />
          <Button onClick={handleUpdate} disabled={updateStatus.isPending} className="w-full">
            {updateStatus.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
