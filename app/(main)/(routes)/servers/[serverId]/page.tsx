import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

interface ServerIdPageProps {
  params: Promise<{
    serverId: string;
  }>;
}

export default async function ServerIdPage({
  params,
}: ServerIdPageProps) {
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
    include: {
      channels: {
        where: {
          name: "general",
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  const initialChannel = server?.channels[0];

  if (!initialChannel || initialChannel.name !== "general") {
    return null;
  }

  // return (
  //   <div className="flex h-full items-center justify-center">
  //     <h1 className="text-2xl font-bold">
  //       Server created successfully
  //     </h1>
  //   </div>
  // );
  return redirect(
    `/servers/${serverId}/channels/${initialChannel.id}`
  );
}