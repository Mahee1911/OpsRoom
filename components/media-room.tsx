"use client";

import "@livekit/components-styles";

import { useUser } from "@clerk/nextjs";
import {
  ControlBar,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface MediaRoomProps {
  chatId: string;
  video: boolean;
  audio: boolean;
}

function CustomVideoConference() {
  const trackReferences = useTracks(
    [
      {
        source: Track.Source.Camera,
        withPlaceholder: true,
      },
      {
        source: Track.Source.ScreenShare,
        withPlaceholder: false,
      },
    ],
    {
      onlySubscribed: false,
    }
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-[#1e1f22]">
      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-1 gap-3 overflow-y-auto p-4 md:grid-cols-2">
        {trackReferences.map((trackReference) => (
          <ParticipantTile
            key={`${trackReference.participant.identity}-${trackReference.source}`}
            trackRef={trackReference}
            className="min-h-[240px] overflow-hidden rounded-xl bg-[#2b2d31]"
          />
        ))}
      </div>

      <RoomAudioRenderer />

      <div className="border-t border-zinc-800 bg-[#111214] p-2">
        <ControlBar />
      </div>
    </div>
  );
}

export const MediaRoom = ({
  chatId,
  audio,
  video,
}: MediaRoomProps) => {
  const { user, isLoaded } = useUser();

  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded || !user) return;

    const controller = new AbortController();

    const getToken = async () => {
      try {
        setError("");
        setToken("");

        const username =
          user.fullName ||
          user.username ||
          user.firstName ||
          "OpsRoom User";

        const params = new URLSearchParams({
          room: chatId,
          username,
        });

        const response = await fetch(`/api/livekit?${params.toString()}`, {
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to join the call");
        }

        if (!data.token) {
          throw new Error("LiveKit token was not returned");
        }

        setToken(data.token);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("LiveKit token error:", error);
          setError(error.message);
        }
      }
    };

    void getToken();

    return () => {
      controller.abort();
    };
  }, [chatId, isLoaded, user]);

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-sm text-rose-500">{error}</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <Loader2 className="my-4 h-7 w-7 animate-spin text-zinc-500" />

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Connecting to the call...
        </p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      key={`${chatId}-${user?.id}`}
      className="h-full min-h-0 flex-1"
      data-lk-theme="default"
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      token={token}
      connect
      video={video}
      audio={audio}
    >
      <CustomVideoConference />
    </LiveKitRoom>
  );
};