import { useState } from "react";
import { AdminLayout as Layout } from "@/components/admin-layout";
import { useListAllPlatforms, useCreatePlatform, useUpdatePlatform, useDeletePlatform, getListAllPlatformsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Copy, Check, Trash2, Link2, Globe, Star, ChevronDown, ChevronUp } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = window.location.origin;

function PostbackUrl({ platformId, secretKey }: { platformId: number; secretKey?: string }) {
  const [copied, setCopied] = useState(false);
  const [copiedFile, setCopiedFile] = useState(false);

  // Standard URL: /api/postback/:id
  const standardUrl = `${BASE_URL}/api/postback/${platformId}?user_id={USER_ID}&amount={AMOUNT}&txid={TXN_ID}&secret={YOUR_SECRET}`;
  // CPX Research / fixed-path URL: /file (platform identified by hash matching secretKey)
  const fileUrl = `${BASE_URL}/file?status={status}&trans_id={trans_id}&user_id={user_id}&sub_id={subid}&sub_id_2={subid_2}&amount_local={amount_local}&amount_usd={amount_usd}&offer_id={offer_ID}&hash={secure_hash}&ip_click={ip_click}`;

  const copy = (url: string, setFn: (v: boolean) => void) => {
    navigator.clipboard.writeText(url);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <code className="text-xs font-mono text-primary truncate max-w-[190px]">{standardUrl.slice(0, 36)}…</code>
        <button onClick={() => copy(standardUrl, setCopied)} className="shrink-0 text-muted-foreground hover:text-primary transition-colors" title="Copy standard postback URL">
          {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      {secretKey && (
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1 py-0.5 rounded shrink-0">CPX</span>
          <code className="text-xs font-mono text-blue-600 truncate max-w-[170px]">{fileUrl.slice(0, 32)}…</code>
          <button onClick={() => copy(fileUrl, setCopiedFile)} className="shrink-0 text-muted-foreground hover:text-blue-600 transition-colors" title="Copy CPX Research / fixed-path postback URL">
            {copiedFile ? <Check className="h-3.5 w-3.5 text-blue-600" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminPlatforms() {
  const { data, isLoading } = useListAllPlatforms();
  const queryClient = useQueryClient();
  const updatePlatform = useUpdatePlatform();
  const deletePlatform = useDeletePlatform();
  const { toast } = useToast();

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete platform "${name}"?`)) return;
    deletePlatform.mutate({ platformId: id }, {
      onSuccess: () => {
        toast({ title: "Platform deleted" });
        queryClient.invalidateQueries({ queryKey: getListAllPlatformsQueryKey() });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to delete" }),
    });
  };

  const handleSetFeatured = (id: number, name: string, currentPlacement: string) => {
    const newPlacement = currentPlacement === "homepage" ? "dedicated" : "homepage";
    updatePlatform.mutate(
      { platformId: id, data: { placement: newPlacement as any } },
      {
        onSuccess: () => {
          toast({ title: newPlacement === "homepage" ? `"${name}" is now featured on the landing page!` : `"${name}" removed from landing page` });
          queryClient.invalidateQueries({ queryKey: getListAllPlatformsQueryKey() });
        },
        onError: () => toast({ variant: "destructive", title: "Failed to update placement" }),
      }
    );
  };

  const featuredPlatform = data?.platforms?.find((p: any) => p.placement === "homepage");

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">Offerwalls</h2>
            <p className="text-muted-foreground text-sm">Manage offerwall platforms and their postback settings.</p>
          </div>
          <PlatformDialog />
        </div>

        {/* Featured platform info */}
        <div className={`rounded-xl p-4 border flex items-start gap-3 ${featuredPlatform ? "bg-orange-50 border-primary/25" : "bg-card border-border"}`}>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${featuredPlatform ? "bg-primary/15 border border-primary/25" : "bg-muted border border-border"}`}>
            <Globe className={`h-4 w-4 ${featuredPlatform ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-bold text-sm ${featuredPlatform ? "text-primary" : "text-foreground"}`}>
              {featuredPlatform ? `Featured on Landing Page: "${featuredPlatform.name}"` : "No Platform Featured on Landing Page"}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {featuredPlatform
                ? "This platform appears in an iframe on the landing page. Click the star icon to change or remove it."
                : "Click the star icon next to any platform to feature it on the landing page inside an iframe for visitors."}
            </p>
          </div>
        </div>

        {/* Postback info */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Link2 className="h-4 w-4 text-primary" />
            <h4 className="font-bold text-foreground text-sm">How Automatic Crediting Works</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Each platform has a unique <span className="text-primary font-mono font-semibold">Postback URL</span>.
            Paste it in the offerwall's dashboard. When a user completes an offer, the offerwall calls this URL and the user's balance is credited automatically.
            You can customize the <span className="text-primary font-semibold">Postback Param Names</span> per platform (e.g. CPX Research uses <code className="font-mono">status</code> instead of <code className="font-mono">txid</code>).
          </p>
        </div>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-border">
                    <TableHead className="font-bold">Name</TableHead>
                    <TableHead className="font-bold">Postback URL</TableHead>
                    <TableHead className="font-bold">Offer URL</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold text-center">Featured</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="animate-spin h-6 w-6 mx-auto text-primary" /></TableCell></TableRow>
                  ) : data?.platforms?.map((p: any) => {
                    const isFeatured = p.placement === "homepage";
                    const hasCustomParams = p.paramUserId || p.paramAmount || p.paramTxid || p.paramStatus;
                    return (
                      <TableRow key={p.id} className={`border-border transition-colors ${isFeatured ? "bg-orange-50/60 hover:bg-orange-50" : "hover:bg-muted/30"}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {p.logoUrl && <img src={p.logoUrl} alt={p.name} className="w-6 h-6 rounded object-cover border border-border" />}
                            <div>
                              <span className="font-bold text-foreground">{p.name}</span>
                              {isFeatured && (
                                <span className="ml-1.5 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Featured</span>
                              )}
                              {hasCustomParams && (
                                <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Custom Params</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <PostbackUrl
                            platformId={p.id}
                            secretKey={p.secretKey}
                          />
                        </TableCell>
                        <TableCell>
                          {p.apiEndpoint ? (
                            <span className="text-xs font-mono text-muted-foreground truncate block max-w-[130px]">
                              {p.apiEndpoint.slice(0, 28)}{p.apiEndpoint.length > 28 ? "…" : ""}
                            </span>
                          ) : <span className="text-muted-foreground text-sm">—</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.isEnabled ? 'default' : 'secondary'} className={p.isEnabled ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100" : ""}>
                            {p.isEnabled ? 'Active' : 'Disabled'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            onClick={() => handleSetFeatured(p.id, p.name, p.placement)}
                            disabled={updatePlatform.isPending}
                            title={isFeatured ? "Remove from landing page" : "Set as featured on landing page"}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all duration-200 ${
                              isFeatured
                                ? "bg-primary text-white shadow-[0_2px_8px_rgba(249,115,22,0.3)]"
                                : "bg-muted text-muted-foreground hover:bg-primary/15 hover:text-primary"
                            }`}
                          >
                            <Star className={`h-4 w-4 ${isFeatured ? "fill-white" : ""}`} />
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <PlatformDialog platform={p} />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0"
                              onClick={() => handleDelete(p.id, p.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!data?.platforms || data.platforms.length === 0) && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        No platforms yet. Add your first offerwall above.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function PlatformDialog({ platform }: { platform?: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createPlatform = useCreatePlatform();
  const updatePlatform = useUpdatePlatform();
  const [open, setOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [name, setName] = useState(platform?.name || "");
  const [description, setDescription] = useState(platform?.description || "");
  const [logoUrl, setLogoUrl] = useState(platform?.logoUrl || "");
  const [apiEndpoint, setApiEndpoint] = useState(platform?.apiEndpoint || "");
  const [secretKey, setSecretKey] = useState(platform?.secretKey || "");
  const [placement, setPlacement] = useState<any>(platform?.placement || "dedicated");
  const [isEnabled, setIsEnabled] = useState(platform?.isEnabled ?? true);
  // Custom postback param names
  const [paramUserId, setParamUserId] = useState(platform?.paramUserId || "");
  const [paramAmount, setParamAmount] = useState(platform?.paramAmount || "");
  const [paramTxid, setParamTxid] = useState(platform?.paramTxid || "");
  const [paramStatus, setParamStatus] = useState(platform?.paramStatus || "");

  const handleSave = () => {
    const payload: any = {
      name, description, logoUrl, apiEndpoint, secretKey, placement, isEnabled,
      paramUserId: paramUserId.trim() || undefined,
      paramAmount: paramAmount.trim() || undefined,
      paramTxid:   paramTxid.trim()   || undefined,
      paramStatus: paramStatus.trim() || undefined,
    };
    const mutation = platform
      ? updatePlatform.mutateAsync({ platformId: platform.id, data: payload })
      : createPlatform.mutateAsync({ data: payload });

    mutation.then(() => {
      toast({ title: platform ? "Platform updated" : "Platform created" });
      queryClient.invalidateQueries({ queryKey: getListAllPlatformsQueryKey() });
      setOpen(false);
    }).catch(err => {
      toast({ variant: "destructive", title: "Error", description: err.data?.error || "Failed" });
    });
  };

  const isPending = createPlatform.isPending || updatePlatform.isPending;
  const hasCustomParams = paramUserId || paramAmount || paramTxid || paramStatus;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {platform ? (
          <Button variant="outline" size="sm" className="border-border hover:border-primary/40 hover:text-primary text-xs h-8">Edit</Button>
        ) : (
          <Button className="bg-primary text-white font-bold hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Add Offerwall
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-md max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{platform ? 'Edit Offerwall' : 'Add Offerwall'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">

          {/* Basic fields */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Platform Name *</Label>
            <Input placeholder="e.g. CPX Research" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Description</Label>
            <Input placeholder="Short description" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Offer Wall URL</Label>
            <Input placeholder="https://example.com/wall?uid={USER_ID}" value={apiEndpoint} onChange={e => setApiEndpoint(e.target.value)} className="font-mono text-sm" />
            <p className="text-xs text-muted-foreground">Use <code className="text-primary">{"{USER_ID}"}</code> as placeholder — replaced automatically.</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Secret Key</Label>
            <Input placeholder="Secret key from offerwall dashboard" value={secretKey} onChange={e => setSecretKey(e.target.value)} className="font-mono text-sm" />
          </div>
          {platform && (
            <div className="bg-orange-50 border border-primary/20 rounded-lg p-3 space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Postback URL</Label>
              <PostbackUrl
                platformId={platform.id}
                secretKey={secretKey}
              />
              <p className="text-xs text-muted-foreground">Paste this URL in the offerwall's postback settings.</p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Logo URL</Label>
            <Input placeholder="https://..." value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className="font-mono text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Placement</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={placement} onChange={e => setPlacement(e.target.value)}>
              <option value="dedicated">Dedicated Page</option>
              <option value="homepage">Featured on Homepage (Landing Page iframe)</option>
              <option value="sidebar">Sidebar</option>
            </select>
            {placement === "homepage" && <p className="text-xs text-primary font-medium">This platform will appear in an iframe on the landing page for all visitors.</p>}
          </div>
          <div className="flex items-center gap-3 py-1">
            <Switch id="enabled" checked={isEnabled} onCheckedChange={setIsEnabled} />
            <Label htmlFor="enabled" className="cursor-pointer">{isEnabled ? "Platform is Active" : "Platform is Disabled"}</Label>
          </div>

          {/* Advanced: Custom Postback Param Names */}
          <div className="border border-border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/70 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">Custom Postback Param Names</span>
                {hasCustomParams && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Configured</span>
                )}
              </div>
              {showAdvanced ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showAdvanced && (
              <div className="p-4 space-y-3 border-t border-border bg-card">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Override the postback query parameter names for this platform. Leave blank to use the defaults.
                  Useful for platforms like <span className="text-foreground font-semibold">CPX Research</span> that use different param names.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-muted-foreground">User ID param</Label>
                    <Input
                      placeholder="user_id"
                      value={paramUserId}
                      onChange={e => setParamUserId(e.target.value)}
                      className="font-mono text-xs h-9"
                    />
                    <p className="text-[10px] text-muted-foreground">Default: <code>user_id</code></p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-muted-foreground">Amount param</Label>
                    <Input
                      placeholder="amount"
                      value={paramAmount}
                      onChange={e => setParamAmount(e.target.value)}
                      className="font-mono text-xs h-9"
                    />
                    <p className="text-[10px] text-muted-foreground">Default: <code>amount</code></p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-muted-foreground">Transaction ID param</Label>
                    <Input
                      placeholder="txid"
                      value={paramTxid}
                      onChange={e => setParamTxid(e.target.value)}
                      className="font-mono text-xs h-9"
                    />
                    <p className="text-[10px] text-muted-foreground">Default: <code>txid</code></p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-muted-foreground">Status param</Label>
                    <Input
                      placeholder="status"
                      value={paramStatus}
                      onChange={e => setParamStatus(e.target.value)}
                      className="font-mono text-xs h-9"
                    />
                    <p className="text-[10px] text-muted-foreground">Optional / info only</p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800 font-semibold mb-1">Example — CPX Research:</p>
                  <div className="text-[11px] text-blue-700 font-mono space-y-0.5">
                    <div>User ID param: <strong>ExternalReference</strong></div>
                    <div>Amount param: <strong>RewardValue</strong></div>
                    <div>Transaction ID param: <strong>TransactionId</strong></div>
                    <div>Status param: <strong>status</strong></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button onClick={handleSave} disabled={isPending || !name} className="w-full bg-primary text-white font-bold hover:bg-primary/90">
            {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : (platform ? "Save Changes" : "Create Platform")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
