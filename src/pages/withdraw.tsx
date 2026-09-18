import { useState } from "react";
import { Layout } from "@/components/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateWithdrawal, useListWithdrawals, useGetBalance, getGetBalanceQueryKey, getListWithdrawalsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Wallet } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Reveal, Tilt } from "@/components/motion-fx";

const formatMoney = (value?: string | number | null) => {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
};

const networkOptions = [
  { value: "BEP20",         label: "BNB Smart Chain (BEP20)",  addressLabel: "Wallet Address",             addressPlaceholder: "0x..." },
  { value: "TRC20",         label: "Tron (TRC20)",             addressLabel: "Wallet Address",             addressPlaceholder: "T..."  },
  { value: "SHAM_CASH",     label: "(Sham Cash)",      addressLabel: "Phone Number",               addressPlaceholder: "09xxxxxxxx" },
  { value: "SYRIATEL_CASH", label: "(Syriatel Cash)", addressLabel: "Phone Number",           addressPlaceholder: "09xxxxxxxx" },
  { value: "COENEX_EMAIL",  label: "Coinex (Email)",           addressLabel: "Email Address",              addressPlaceholder: "you@example.com" },
];

const withdrawSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  network: z.enum(["BEP20", "TRC20", "SHAM_CASH", "SYRIATEL_CASH", "COENEX_EMAIL"]),
  walletAddress: z.string().min(3, "Required"),
});

type WithdrawForm = z.infer<typeof withdrawSchema>;

export default function Withdraw() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: balanceData } = useGetBalance();
  const { data: historyData, isLoading: historyLoading } = useListWithdrawals({ page: 1, limit: 10 });
  const withdrawMutation = useCreateWithdrawal();

  const form = useForm<WithdrawForm>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      amount: "",
      network: "BEP20",
      walletAddress: "",
    },
  });

  const selectedNetwork = form.watch("network");
  const networkMeta = networkOptions.find(n => n.value === selectedNetwork) ?? networkOptions[0];

  const onSubmit = (data: WithdrawForm) => {
    withdrawMutation.mutate({ data: { ...data, network: data.network as any } }, {
      onSuccess: () => {
        toast({ title: "Withdrawal Requested", description: "Your request is being processed." });
        form.reset();
        queryClient.invalidateQueries({ queryKey: getGetBalanceQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListWithdrawalsQueryKey({ page: 1, limit: 10 }) });
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Withdrawal Failed", description: error.data?.error || "Could not process request" });
      },
    });
  };

  const networkDisplayName = (network: string) =>
    networkOptions.find(n => n.value === network)?.label ?? network;

  return (
    <Layout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <Reveal>
          <h2 className="text-3xl font-black tracking-tight text-foreground">Withdraw Funds</h2>
          <p className="text-muted-foreground">Transfer your balance to your preferred payment method.</p>
        </Reveal>

        <div className="grid lg:grid-cols-3 gap-8">
          <Reveal delay={0.06} className="lg:col-span-1">
            <Tilt strength={5}>
              <Card className="relative overflow-hidden bg-card border-border shadow-sm">
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full brand-gradient opacity-[0.08] blur-2xl animate-float-slow" aria-hidden />
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-2 uppercase tracking-wider">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg brand-gradient shadow-brand">
                      <Send className="h-3.5 w-3.5 text-white" />
                    </span>
                    Request Withdrawal
                  </CardTitle>
                  <CardDescription>Minimum withdrawal: $1</CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="mb-6 flex items-center justify-between rounded-xl border border-primary/15 bg-accent/70 p-4">
                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground">
                      <Wallet className="h-3.5 w-3.5 text-primary" /> Available
                    </span>
                    <span className="font-black text-foreground">{formatMoney(balanceData?.balance)} USDT</span>
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground uppercase text-xs font-bold">Amount (USDT)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="1.00" {...field} className="h-11 rounded-xl bg-background border-input focus-visible:ring-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="network"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground uppercase text-xs font-bold">Payment Method</FormLabel>
                            <Select
                              onValueChange={(val) => {
                                field.onChange(val);
                                form.setValue("walletAddress", "");
                              }}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-11 rounded-xl bg-background border-input focus-visible:ring-primary">
                                  <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {networkOptions.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="walletAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground uppercase text-xs font-bold">
                              {networkMeta.addressLabel}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={networkMeta.addressPlaceholder}
                                {...field}
                                className="h-11 rounded-xl bg-background border-input focus-visible:ring-primary font-mono text-sm"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full h-11 brand-gradient text-white font-black uppercase tracking-wider shadow-brand hover:-translate-y-0.5 transition-transform mt-4"
                        disabled={withdrawMutation.isPending}
                      >
                        {withdrawMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Withdraw Now"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </Tilt>
          </Reveal>

          <Reveal delay={0.12} className="lg:col-span-2">
            <Card className="bg-card border-border h-full shadow-sm">
              <CardHeader>
                <CardTitle className="uppercase tracking-wider">Withdrawal History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-accent">
                      <TableRow className="border-border">
                        <TableHead className="font-bold text-muted-foreground">Date</TableHead>
                        <TableHead className="font-bold text-muted-foreground">Amount</TableHead>
                        <TableHead className="font-bold text-muted-foreground">Method</TableHead>
                        <TableHead className="font-bold text-muted-foreground">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyLoading ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="animate-spin h-6 w-6 mx-auto text-primary"/></TableCell></TableRow>
                      ) : historyData?.withdrawals?.length ? (
                        historyData.withdrawals.map((w, i) => (
                          <motion.tr
                            key={w.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.35, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                            className="border-border border-b transition-colors hover:bg-primary/[0.03]"
                          >
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              {new Date(w.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-bold">{w.amount} USDT</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-semibold text-xs">
                                {networkDisplayName(w.network)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={w.status === "paid" ? "default" : w.status === "rejected" ? "destructive" : "secondary"}
                                className="uppercase tracking-wider text-[10px]"
                              >
                                {w.status}
                              </Badge>
                            </TableCell>
                          </motion.tr>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                            No withdrawals yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </div>
    </Layout>
  );
}
