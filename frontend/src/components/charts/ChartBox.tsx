import { useEffect, useState, type ReactNode } from 'react';

/** Recharts needs a parent with explicit size; defer mount until after layout. */
export default function ChartBox({
  height,
  children,
  className = '',
}: {
  height: number;
  children: ReactNode;
  className?: string;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!ready) {
    return (
      <div
        className={`w-full min-w-0 animate-pulse rounded-lg bg-surface ${className}`}
        style={{ height }}
      />
    );
  }

  return (
    <div className={`w-full min-w-0 ${className}`} style={{ height }}>
      {children}
    </div>
  );
}
