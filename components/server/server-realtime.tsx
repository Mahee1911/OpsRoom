"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useSocket } from "@/components/providers/socket-provider";

interface ServerRealtimeProps {
  serverId: string;
}

export const ServerRealtime = ({
  serverId,
}: ServerRealtimeProps) => {
  const router = useRouter();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const refreshKey = `server:${serverId}:refresh`;

    const joinServer = () => {
      socket.emit("server:join", serverId);
    };

    const handleRefresh = () => {
      router.refresh();
    };

    socket.on("connect", joinServer);
    socket.on(refreshKey, handleRefresh);

    if (socket.connected) {
      joinServer();
    }

    return () => {
      socket.off("connect", joinServer);
      socket.off(refreshKey, handleRefresh);
      socket.emit("server:leave", serverId);
    };
  }, [router, serverId, socket]);

  return null;
};