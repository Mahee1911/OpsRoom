import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ExpiredInviteModal } from "@/components/modals/expired-invite-modal";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

interface InviteCodePageProps {
  params: Promise<{
    inviteCode: string;
  }>;
}

export default async function InviteCodePage({
  params,
}: InviteCodePageProps) {
  const { redirectToSignIn } = await auth();
  const { inviteCode } = await params;

  const profile = await currentProfile();

  if (!profile) {
    return redirectToSignIn();
  }

  if (!inviteCode) {
    return <ExpiredInviteModal />;
  }

  // Check whether the invite link still belongs to a server.
  const invitedServer = await db.server.findUnique({
    where: {
      inviteCode,
    },
  });

  // The server generated a new code, so this old link has expired.
  if (!invitedServer) {
    return <ExpiredInviteModal />;
  }

  // Check whether this user is already a member.
  const existingMember = await db.member.findFirst({
    where: {
      serverId: invitedServer.id,
      profileId: profile.id,
    },
  });

  if (existingMember) {
    return redirect(`/servers/${invitedServer.id}`);
  }

  // Add the user using the verified server ID.
  await db.server.update({
    where: {
      id: invitedServer.id,
    },
    data: {
      members: {
        create: {
          profileId: profile.id,
        },
      },
    },
  });

  return redirect(`/servers/${invitedServer.id}`);
}