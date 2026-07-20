import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', maxWidth: 440, padding: '0 24px' }}
      >
        <div style={{
          fontSize: 120,
          fontWeight: 900,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          letterSpacing: '-0.04em',
          lineHeight: 1,
          marginBottom: 16,
        }}>
          <span className="text-gradient-primary">404</span>
        </div>
        <h2 style={{
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--text)',
          marginBottom: 12,
        }}>
          Page not found
        </h2>
        <p style={{
          fontSize: 15,
          color: 'var(--text-muted)',
          marginBottom: 32,
          lineHeight: 1.6,
        }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Go Home
        </Link>
      </motion.div>
    </div>
  );
}
