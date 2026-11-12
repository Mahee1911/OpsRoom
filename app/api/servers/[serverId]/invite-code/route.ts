import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

interface InviteCodeRouteProps {
  params: Promise<{
    serverId: string;
  }>;
}

export async function PATCH(
  _req: Request,
  { params }: InviteCodeRouteProps
) {
  try {
    const { serverId } = await params;
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", {
        status: 401,
      });
    }

    if (!serverId) {
      return new NextResponse("Server ID Missing", {
        status: 400,
      });
    }

    const server = await db.server.update({
      where: {
        id: serverId,
        profileId: profile.id,
      },
      data: {
        inviteCode: uuid(),
      },
    });

    return NextResponse.json(server);
  } catch (error) {
    console.error("[SERVER_INVITE_CODE]", error);

    return new NextResponse("Internal Error", {
      status: 500,
    });
  }
}