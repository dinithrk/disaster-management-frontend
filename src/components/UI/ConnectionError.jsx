import React from 'react';
import { ServerCrash, RefreshCw } from 'lucide-react';

const ConnectionError = ({ 
  onReload, 
  message = "System Offline", 
  subMessage = "Unable to connect to the backend server. The system might be down for maintenance or experiencing connectivity issues.", 
  errorCode = "ERR_CONNECTION_REFUSED" 
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      minHeight: '60vh',
      width: '100%',
      textAlign: 'center'
    }}>
      <div className="glass-card" style={{
        padding: '4rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '800px',
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background glow */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          height: '200px',
          background: 'rgba(239, 68, 68, 0.15)',
          filter: 'blur(50px)',
          borderRadius: '50%',
          zIndex: 0
        }}></div>

        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2rem',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          zIndex: 1,
          boxShadow: 'var(--glow-hi-critical)'
        }}>
          <ServerCrash size={40} color="var(--severity-hi-critical)" className="animate-pulse-glow" />
        </div>

        <h1 style={{ 
          fontSize: '1.75rem', 
          fontWeight: '600', 
          marginBottom: '1rem',
          color: 'var(--text-primary)',
          zIndex: 1
        }}>
          {message}
        </h1>
        
        <p style={{ 
          fontSize: '1rem', 
          marginBottom: '2rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
          zIndex: 1
        }}>
          {subMessage}
        </p>

        <div style={{
          background: 'rgba(0,0,0,0.3)',
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '2rem',
          zIndex: 1
        }}>
          <code style={{ 
            fontSize: '0.85rem', 
            color: 'var(--text-muted)',
            fontFamily: 'monospace'
          }}>
            ERROR: {errorCode}
          </code>
        </div>

        <button 
          onClick={onReload}
          className="btn btn-primary"
          style={{
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 2rem',
            fontSize: '1rem'
          }}
        >
          <RefreshCw size={18} />
          Try Again
        </button>
      </div>
    </div>
  );
};

export default ConnectionError;
