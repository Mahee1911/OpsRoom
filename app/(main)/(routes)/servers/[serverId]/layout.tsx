import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ServerSidebar } from "@/components/server/server-sidebar";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { ServerRealtime } from "@/components/server/server-realtime";

interface ServerIdLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    serverId: string;
  }>;
}

export default async function ServerIdLayout({
  children,
  params,
}: ServerIdLayoutProps) {
  const { redirectToSignIn } = await auth();
  const { serverId } = await params;

  const profile = await currentProfile();

  if (!profile) {
    return redirectToSignIn();
  }

  const server = await db.server.findUnique({
    where: {
      id: serverId,
      members: {
        some: {
          profileId: profile.id,
        },
      },
    },
  });

  if (!server) {
    return redirect("/");
  }

  return (
    <div className="h-full">
      <ServerRealtime serverId={serverId} />
      
      <div className="fixed inset-y-0 left-[72px] z-20 flex h-full w-60 flex-col">
        <ServerSidebar serverId={serverId} />
      </div>

      <main className="h-full pl-60">
        {children}
      </main>
    </div>
  );
}