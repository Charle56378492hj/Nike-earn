import { useState } from "react";
import { AdminLayout as Layout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, CheckCircle2, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface PendingVerification {
  id: number;
  email: string;
  username: string;
  code: string;
  expiresAt: string;
  createdAt: string;
}

function usePendingVerifications() {
  return useQuery<{ verifications: PendingVerification[] }>({
    queryKey: ["admin", "pending-verifications"],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch(`${import.meta.env.BASE_URL}api/admin/pending-verifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 15000,
  });
}

export default function AdminVerifications() {
  const { data, isLoading, refetch, isFetching } = usePendingVerifications();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = (v: PendingVerification) => {
    navigator.clipboard.writeText(v.code);
    setCopiedId(v.id);
    toast({ title: "Copied", description: `Code ${v.code} copied for ${v.email}` });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatExpiry = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin <= 0) return "Expired";
    if (diffMin < 60) return `${diffMin}m remaining`;
    return `${Math.floor(diffMin / 60)}h ${diffMin % 60}m remaining`;
  };

  const isExpiringSoon = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    return diffMs < 5 * 60 * 1000;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
          <div>
            <h2 className="text-3xl font-black tracking-tight uppercase text-foreground">Pending Verifications</h2>
            <p className="text-muted-foreground">Active verification codes for users who couldn't receive email.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <p className="text-amber-400 text-sm font-medium">
            ⚠ These codes are shown here because email delivery is unavailable (Resend sandbox mode). 
            Once you verify a domain at resend.com/domains, codes will be sent by email instead and this list will stay empty.
          </p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="pb-0">
            <CardTitle className="text-base text-muted-foreground font-medium uppercase tracking-wider">
              {data?.verifications?.length ?? 0} pending code{data?.verifications?.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-accent">
                  <TableRow className="border-border">
                    <TableHead>Email</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        <Loader2 className="animate-spin h-6 w-6 mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : data?.verifications?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        No pending verifications — email delivery is working normally.
                      </TableCell>
                    </TableRow>
                  ) : data?.verifications?.map((v) => (
                    <TableRow key={v.id} className="border-border">
                      <TableCell className="text-muted-foreground">{v.email}</TableCell>
                      <TableCell className="font-semibold text-foreground">{v.username}</TableCell>
                      <TableCell>
                        <span className="font-mono text-primary font-black text-lg tracking-widest">{v.code}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isExpiringSoon(v.expiresAt) ? "destructive" : "secondary"} className="font-mono text-xs">
                          {formatExpiry(v.expiresAt)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(v)}
                          className="gap-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white"
                        >
                          {copiedId === v.id ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          {copiedId === v.id ? "Copied!" : "Copy Code"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
