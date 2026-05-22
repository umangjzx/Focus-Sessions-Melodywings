import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import type { MeetingParticipant } from "../services/api";

export type Participant = MeetingParticipant;

export function useParticipantPresence(
  socket: Socket | null,
  initialParticipants: Participant[]
) {
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [readyCount, setReadyCount] = useState(0);

  useEffect(() => {
    setParticipants(initialParticipants);
    setReadyCount(initialParticipants.filter((p) => p.is_ready).length);
  }, [initialParticipants]);

  useEffect(() => {
    if (!socket) return;

    const handleOnline = (data: { user_id: number; name: string }) => {
      setParticipants((prev) => {
        const exists = prev.find((p) => p.id === data.user_id);
        if (exists) {
          return prev.map((p) =>
            p.id === data.user_id ? { ...p, online: true } : p
          );
        }
        return [
          ...prev,
          { id: data.user_id, name: data.name, email: "", online: true, is_ready: false },
        ];
      });
    };

    const handleOffline = (data: { user_id: number }) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === data.user_id ? { ...p, online: false, is_ready: false } : p
        )
      );
    };

    const handleReady = (data: {
      user_id: number;
      is_ready: boolean;
      ready_count: number;
    }) => {
      setReadyCount(data.ready_count);
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === data.user_id ? { ...p, is_ready: data.is_ready } : p
        )
      );
    };

    socket.on("participant_online", handleOnline);
    socket.on("participant_offline", handleOffline);
    socket.on("ready_update", handleReady);

    return () => {
      socket.off("participant_online", handleOnline);
      socket.off("participant_offline", handleOffline);
      socket.off("ready_update", handleReady);
    };
  }, [socket]);

  return { participants, readyCount, setReadyCount };
}
