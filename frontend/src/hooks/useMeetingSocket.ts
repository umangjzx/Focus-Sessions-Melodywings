import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { MeetingSync } from "../services/api";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:8000");

export function useMeetingSocket(
  roomCode: string,
  token: string | null,
  onSync?: (sync: MeetingSync) => void
) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  useEffect(() => {
    if (!token || !roomCode) return;

    const normalizedCode = roomCode.trim().toUpperCase();

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
    });

    const joinRoom = () => {
      newSocket.emit("join_room", { room_code: normalizedCode }, (response: {
        error?: string;
        sync?: MeetingSync;
      }) => {
        if (response?.error) {
          setError(response.error);
        } else if (response?.sync) {
          onSyncRef.current?.(response.sync);
        }
      });
    };

    const requestSync = () => {
      newSocket.emit("request_sync", { room_code: normalizedCode }, (response: {
        error?: string;
        sync?: MeetingSync;
      }) => {
        if (response?.sync) {
          onSyncRef.current?.(response.sync);
        }
        setReconnecting(false);
      });
    };

    newSocket.on("connect", () => {
      setConnected(true);
      setError(null);
      joinRoom();
    });

    newSocket.io.on("reconnect_attempt", () => {
      setReconnecting(true);
      setConnected(false);
    });

    newSocket.io.on("reconnect", () => {
      setConnected(true);
      requestSync();
    });

    newSocket.on("meeting_sync", (sync: MeetingSync) => {
      onSyncRef.current?.(sync);
      setReconnecting(false);
    });

    newSocket.on("disconnect", () => {
      setConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      setError(err.message);
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit("leave_room", { room_code: normalizedCode });
      newSocket.disconnect();
    };
  }, [roomCode, token]);

  return { socket, connected, reconnecting, error, setError };
}
