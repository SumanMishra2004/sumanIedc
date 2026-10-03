import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PublicationQueuePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has publish permission
  if (!["EDITOR", "ADMIN", "SUPERADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Publication Queue</CardTitle>
          <CardDescription>
            Manage approved research submissions ready for publication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Publication queue dashboard coming soon. This page will allow editors to publish approved research to the public portal.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
