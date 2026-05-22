import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

export function useMeetingTimer(socket: Socket | null) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleTick = (data: { remaining_seconds: number }) => {
      setRemainingSeconds(data.remaining_seconds);
    };

    const handleStarted = (data: { remaining_seconds?: number; duration_minutes?: number }) => {
      if (data.remaining_seconds != null) {
        setRemainingSeconds(data.remaining_seconds);
      } else if (data.duration_minutes != null) {
        setRemainingSeconds(data.duration_minutes * 60);
      }
    };

    const handleResumed = (data: { remaining_seconds?: number }) => {
      if (data.remaining_seconds != null) {
        setRemainingSeconds(data.remaining_seconds);
      }
    };

    socket.on("timer_tick", handleTick);
    socket.on("meeting_started", handleStarted);
    socket.on("meeting_resumed", handleResumed);

    return () => {
      socket.off("timer_tick", handleTick);
      socket.off("meeting_started", handleStarted);
      socket.off("meeting_resumed", handleResumed);
    };
  }, [socket]);

  return { remainingSeconds, setRemainingSeconds };
}
