import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AuditLogsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has audit:view permission (ADMIN or SUPERADMIN)
  if (!["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>
            View system audit trail and user activity logs. Audit logs are append-only and cannot be modified.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Audit logs dashboard coming soon. This page will display all system actions, user modifications, and administrative overrides for compliance and security monitoring.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
