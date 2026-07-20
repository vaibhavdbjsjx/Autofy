import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle({ size = 'default' }: { size?: 'default' | 'small' }) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  const w = size === 'small' ? 44 : 52;
  const h = size === 'small' ? 24 : 28;
  const thumb = size === 'small' ? 18 : 22;

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
      style={{
        position: 'relative',
        width: w,
        height: h,
        borderRadius: 100,
        border: 'none',
        cursor: 'pointer',
        background: dark
          ? 'linear-gradient(135deg, #451A03, #7C2D12)' // warm dark brown, matches brand
          : 'linear-gradient(135deg, #FDE68A, #FCD34D)', // soft amber for daytime
        transition: 'background 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        padding: 3,
        flexShrink: 0,
      }}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          width: thumb,
          height: thumb,
          borderRadius: '50%',
          background: '#FFFFFF',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: dark ? 0 : 'auto',
        }}
      >
        {dark ? (
          <svg width={thumb * 0.55} height={thumb * 0.55} viewBox="0 0 24 24" fill="none" stroke="#7C2D12" strokeWidth={2.5} strokeLinecap="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg width={thumb * 0.55} height={thumb * 0.55} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={2.5} strokeLinecap="round">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        )}
      </motion.div>
    </button>
  );
}
