'use client';

import React, { useState } from 'react';

export default function AdminLogoutButton() {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login?admin=1';
    } catch (err) {
      console.error('Logout error:', err);
      setLoggingOut(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      style={{
        background: 'none',
        border: '1px solid var(--border-hairline)',
        borderRadius: '3px',
        padding: '0.15rem 0.5rem',
        fontSize: '0.78rem',
        cursor: loggingOut ? 'not-allowed' : 'pointer',
        color: 'var(--text-secondary)',
        lineHeight: 1.3,
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--text-primary)';
        e.currentTarget.style.borderColor = 'var(--text-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--text-secondary)';
        e.currentTarget.style.borderColor = 'var(--border-hairline)';
      }}
    >
      {loggingOut ? 'Logging out...' : 'Log out'}
    </button>
  );
}
