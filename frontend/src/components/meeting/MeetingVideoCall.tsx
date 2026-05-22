import { useEffect, useRef, useState } from 'react';
import { Video, VideoOff, Mic, ExternalLink } from 'lucide-react';

const JITSI_SCRIPT = 'https://meet.jit.si/external_api.js';
const JITSI_DOMAIN = import.meta.env.VITE_JITSI_DOMAIN || 'meet.jit.si';

type JitsiApi = {
  dispose: () => void;
  addEventListener: (event: string, handler: () => void) => void;
};

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: Record<string, unknown>
    ) => JitsiApi;
  }
}

function loadJitsiScript(): Promise<void> {
  if (window.JitsiMeetExternalAPI) return Promise.resolve();
  const existing = document.querySelector(`script[src="${JITSI_SCRIPT}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Jitsi failed to load')));
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = JITSI_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Jitsi failed to load'));
    document.body.appendChild(script);
  });
}

/** Sanitize room code for Jitsi room names (alphanumeric + underscore). */
function jitsiRoomName(roomCode: string, meetingId?: number) {
  const code = roomCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const suffix = meetingId ? `_m${meetingId}` : '';
  return `FocusSessions_${code}${suffix}`;
}

interface MeetingVideoCallProps {
  roomCode: string;
  meetingId?: number;
  displayName?: string;
}

export default function MeetingVideoCall({
  roomCode,
  meetingId,
  displayName,
}: MeetingVideoCallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiApi | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !containerRef.current) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    loadJitsiScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.JitsiMeetExternalAPI) return;

        apiRef.current?.dispose();
        const roomName = jitsiRoomName(roomCode, meetingId);

        apiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          userInfo: displayName ? { displayName } : undefined,
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: true,
            prejoinPageEnabled: true,
            disableDeepLinking: true,
            enableWelcomePage: false,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            MOBILE_APP_PROMO: false,
            DISPLAY_WELCOME_PAGE_CONTENT: false,
            TOOLBAR_BUTTONS: [
              'microphone',
              'camera',
              'desktop',
              'fullscreen',
              'hangup',
              'tileview',
              'settings',
            ],
          },
        });

        apiRef.current.addEventListener('videoConferenceLeft', () => {
          setOpen(false);
        });
      })
      .catch(() => {
        if (!cancelled) setError('Video could not load. Try again or open in a new tab.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, [open, roomCode, meetingId, displayName]);

  const externalUrl = `https://${JITSI_DOMAIN}/${jitsiRoomName(roomCode, meetingId)}`;

  return (
    <div className="card-elevated space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-white">
            <Video className="h-5 w-5 text-violet-400" />
            Optional video room
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Camera and mic start off. Turn on only if you want face-to-face accountability.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={open ? 'btn-secondary' : 'btn-primary'}
        >
          {open ? (
            <>
              <VideoOff className="h-4 w-4" />
              Hide video
            </>
          ) : (
            <>
              <Video className="h-4 w-4" />
              Open video
            </>
          )}
        </button>
      </div>

      {open && (
        <>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Mic className="h-3 w-3" /> Muted by default
            </span>
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Open in new tab
            </a>
          </div>

          {error && <p className="text-sm text-amber-400">{error}</p>}

          <div
            className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950"
            style={{ minHeight: 320 }}
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                Loading video…
              </div>
            )}
            <div ref={containerRef} className="h-[min(50vh,420px)] w-full" />
          </div>
        </>
      )}
    </div>
  );
}
