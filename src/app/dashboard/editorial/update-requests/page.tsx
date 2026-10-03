import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function UpdateRequestsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has review permission
  if (!["EDITOR", "ADMIN", "SUPERADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Update Requests</CardTitle>
          <CardDescription>
            Track research submissions that have been sent back for updates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Update requests dashboard coming soon. This page will show all submissions that have been marked for updates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
