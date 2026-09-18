import { AdminLayout as Layout } from "@/components/admin-layout";
import { useListAdmins } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function AdminAdmins() {
  const { data, isLoading } = useListAdmins();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase text-foreground">Admins</h2>
          <p className="text-muted-foreground">Manage administrative access.</p>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-accent">
                  <TableRow className="border-border">
                    <TableHead>User ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="animate-spin h-6 w-6 mx-auto text-primary" /></TableCell></TableRow>
                  ) : data?.admins?.map(admin => (
                    <TableRow key={admin.id} className="border-border">
                      <TableCell className="font-mono text-xs">{admin.userId}</TableCell>
                      <TableCell className="font-semibold text-foreground">{admin.username}</TableCell>
                      <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                      <TableCell>
                        <Badge variant={admin.role === 'super_admin' ? 'default' : 'secondary'} className="uppercase tracking-wider text-[10px]">
                          {admin.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data?.admins?.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center py-8">No admins found.</TableCell></TableRow>
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
