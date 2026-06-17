import { ProfileViewer } from "@/components/profile/ProfileViewer"


interface PageProps {
  searchParams: Promise<{ userId?: string }>
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams
  const userId = params.userId

  return (
    <div className="px-4 md:px-6 py-6 space-y-6">
      
      <ProfileViewer userId={userId} />
    </div>
  )
}

