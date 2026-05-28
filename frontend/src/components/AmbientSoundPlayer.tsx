import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { AMBIENT_SOUNDS } from '../data/ambientSounds';

interface Props {
  soundId?: string;
  volume?: number;
  isSessionPaused?: boolean;
}

const SOUND_URLS: Record<string, string> = {
  'white-noise': 'https://actions.google.com/sounds/v1/weather/strong_wind.ogg',
  'brown-noise': 'https://actions.google.com/sounds/v1/water/water_rushing.ogg',
  rain: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg',
  forest: 'https://actions.google.com/sounds/v1/nature/forest_birds_and_insects.ogg',
  ocean: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg',
  lofi: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
};

const AmbientSoundPlayer = React.memo(function AmbientSoundPlayer({
  soundId = 'rain',
  volume = 80,
  isSessionPaused = false,
}: Props) {
  // Track actual browser audio state via native events, not React state
  const [isPlaying, setIsPlaying] = useState(false);
  const [needsActivation, setNeedsActivation] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Tracks whether the user WANTS audio (vs manually paused the player)
  const userWantsPlayRef = useRef(true);
  const label = AMBIENT_SOUNDS.find((s) => s.id === soundId)?.label ?? 'Ambient';
  const audioUrl = SOUND_URLS[soundId] || SOUND_URLS.rain;

  // Create audio element once, recreate only if URL changes
  useEffect(() => {
    const audio = new Audio(audioUrl);
    audio.loop = true;
    audio.volume = Math.max(0, Math.min(1, volume / 100));
    audioRef.current = audio;

    // Listen to the BROWSER's actual play/pause events — this is the source of truth
    const onPlay = () => {
      setIsPlaying(true);
      setNeedsActivation(false);
    };
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    // Attempt autoplay
    if (userWantsPlayRef.current && !isSessionPaused) {
      audio.play().catch(() => {
        // Browser blocked autoplay — show activation button
        setNeedsActivation(true);
      });
    }

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.pause();
      audio.removeAttribute('src');
      audio.load(); // Release network resources
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  // Sync volume (including mute when volume=0)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume / 100));
    }
  }, [volume]);

  // Sync with session pause/resume
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isSessionPaused) {
      audio.pause();
    } else if (userWantsPlayRef.current) {
      audio.play().catch(() => {
        setNeedsActivation(true);
      });
    }
  }, [isSessionPaused]);

  // User clicks the play/pause button on the player itself
  const handleToggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      userWantsPlayRef.current = false;
    } else {
      userWantsPlayRef.current = true;
      audio.play().catch(() => {
        setNeedsActivation(true);
      });
    }
  }, [isPlaying]);

  // User clicks "Tap to enable" when browser blocked autoplay
  const handleActivate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    userWantsPlayRef.current = true;
    audio.play().catch(() => {
      // Still blocked — very rare at this point since this IS a user gesture
    });
  }, []);

  const isMuted = volume === 0;

  // Show activation prompt if browser blocked autoplay
  if (needsActivation) {
    return (
      <button
        type="button"
        onClick={handleActivate}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary/20 border border-primary/40 px-4 py-3 hover:bg-primary/30 transition-colors group"
      >
        <Play className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
        <div className="text-left">
          <p className="text-sm font-medium text-text">Tap to enable {label}</p>
          <p className="text-xs text-text-muted">Browser requires a click to start audio</p>
        </div>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-hover px-4 py-3">
      <button
        type="button"
        onClick={handleToggle}
        className="text-primary hover:scale-105 transition-transform"
        aria-label={isPlaying ? 'Pause ambient sound' : 'Play ambient sound'}
      >
        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text">{label}</p>
        <p className="text-xs text-text-subtle">
          {isSessionPaused ? 'Paused with session' : isPlaying ? 'Playing' : 'Paused'}
        </p>
      </div>
      {isMuted ? (
        <VolumeX className="h-4 w-4 text-text-subtle" />
      ) : (
        <Volume2 className="h-4 w-4 text-text-subtle" />
      )}
    </div>
  );
});

export default AmbientSoundPlayer;
