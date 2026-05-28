import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume2, Heart } from 'lucide-react';

interface MusicPlayerProps {
  trackId?: string;
  volume?: number;
}

const SOUND_URLS: Record<string, string> = {
  'white-noise': 'https://actions.google.com/sounds/v1/weather/strong_wind.ogg',
  'brown-noise': 'https://actions.google.com/sounds/v1/water/water_rushing.ogg',
  rain: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg',
  lofi: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
};

const MusicPlayer = React.memo(function MusicPlayer({ trackId = 'lofi', volume = 80 }: MusicPlayerProps) {
  const [playing, setPlaying] = useState(true);
  const [title, setTitle] = useState('Focus Lofi');
  const [favorited, setFavorited] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let t = 'Focus Lofi';
    if (trackId.includes('rain')) t = 'Rainfall';
    else if (trackId.includes('white')) t = 'White Noise';
    else if (trackId.includes('brown')) t = 'Brown Noise';
    setTitle(t);
  }, [trackId]);

  const getAudioUrl = (id: string) => {
    if (id.includes('rain')) return SOUND_URLS.rain;
    if (id.includes('white')) return SOUND_URLS['white-noise'];
    if (id.includes('brown')) return SOUND_URLS['brown-noise'];
    return SOUND_URLS.lofi;
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    const audioUrl = getAudioUrl(trackId);
    
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.loop = true;
      audioRef.current.volume = volume / 100;
    } else {
      audioRef.current.src = audioUrl;
    }

    if (playing) {
      audioRef.current.play().catch(() => {
        setPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [playing, trackId]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  async function toggleFavorite() {
    setFavorited(!favorited);
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-hover px-4 py-3">
      <button type="button" onClick={() => setPlaying(!playing)} className="text-primary hover:scale-105 transition-transform">
        {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text">{title}</p>
        <p className="text-xs text-text-subtle">Melody Wings</p>
      </div>
      <Volume2 className="h-4 w-4 text-text-subtle" />
      <button type="button" onClick={toggleFavorite} className={`${favorited ? 'text-red-400' : 'text-text-subtle'} hover:scale-105 transition-transform`}>
        <Heart className={`h-5 w-5 ${favorited ? 'fill-current' : ''}`} />
      </button>
    </div>
  );
});

export default MusicPlayer;
