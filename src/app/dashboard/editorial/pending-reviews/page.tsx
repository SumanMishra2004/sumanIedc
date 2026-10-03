import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PendingReviewsPage() {
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
          <CardTitle>Pending Reviews</CardTitle>
          <CardDescription>
            View all research submissions awaiting your review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Pending reviews dashboard coming soon. This page will show all submissions that require editorial review.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
