import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

export function useMeetingState(socket: Socket | null, initialStatus: string) {
  const [status, setStatus] = useState<string>(initialStatus);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    if (!socket) return;

    const handleStarted = () => setStatus("RUNNING");
    const handlePaused = () => setStatus("PAUSED");
    const handleResumed = () => setStatus("RUNNING");
    const handleCompleted = () => setStatus("COMPLETED");

    socket.on("meeting_started", handleStarted);
    socket.on("meeting_paused", handlePaused);
    socket.on("meeting_resumed", handleResumed);
    socket.on("meeting_completed", handleCompleted);

    return () => {
      socket.off("meeting_started", handleStarted);
      socket.off("meeting_paused", handlePaused);
      socket.off("meeting_resumed", handleResumed);
      socket.off("meeting_completed", handleCompleted);
    };
  }, [socket]);

  return { status, setStatus };
}
