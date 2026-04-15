import JournalDashboard from "@/components/journal/JournalDashboard";
import JournalTable from "@/components/journal/JournalTable";
import { auth } from "@/lib/auth";

const Journal = async () => {
  const session = await auth();

  return (
    <div className="w-full h-full p-4 md:p-6 lg:p-8 flex flex-col gap-6">
      <JournalDashboard isAdmin={session?.user.role === "ADMIN"} />
      <div className="w-full">
        <JournalTable session={session} />
      </div>
    </div>
  );
};

export default Journal;
