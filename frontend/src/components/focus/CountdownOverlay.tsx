import { motion, AnimatePresence } from 'framer-motion';

interface CountdownOverlayProps {
  count: number | null;
}

export default function CountdownOverlay({ count }: CountdownOverlayProps) {
  return (
    <AnimatePresence>
      {count !== null && count > 0 && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/95 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.span
            key={count}
            className="text-[12rem] font-bold leading-none text-transparent bg-clip-text bg-gradient-to-br from-primary to-secondary"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            {count}
          </motion.span>
          {count === 1 && (
            <motion.p
              className="absolute bottom-1/3 text-2xl font-semibold text-emerald-400"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Focus!
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
