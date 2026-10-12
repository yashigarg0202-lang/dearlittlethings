import React from 'react';
import { prisma } from '@/lib/prisma';

export default async function AdminAuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-accent)',
            color: 'var(--accent-terracotta)',
            fontSize: '1.1rem',
            display: 'block',
          }}
        >
          security &amp; action history
        </span>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.2rem',
            fontWeight: 400,
          }}
        >
          Studio Audit Logs
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Historical record of administrative updates, order status changes, inventory adjustments, and inquiry events.
        </p>
      </div>

      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-hairline)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1.5fr 1.5fr 3fr',
            padding: '0.85rem 1.25rem',
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-hairline)',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <div>Timestamp</div>
          <div>Action</div>
          <div>Entity</div>
          <div>Details</div>
        </div>

        {logs.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No audit log entries recorded yet.
          </div>
        ) : (
          <div>
            {logs.map((log) => {
              let parsedDetails = log.details;
              try {
                if (log.details) {
                  parsedDetails = JSON.stringify(JSON.parse(log.details), null, 2);
                }
              } catch {
                // keep raw string
              }

              return (
                <div
                  key={log.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 1.5fr 1.5fr 3fr',
                    padding: '0.85rem 1.25rem',
                    borderBottom: '1px solid var(--border-hairline)',
                    alignItems: 'start',
                    fontSize: '0.85rem',
                    gap: '1rem',
                  }}
                >
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date(log.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </div>
                  <div>
                    <span
                      style={{
                        padding: '0.15rem 0.4rem',
                        fontSize: '0.75rem',
                        border: '1px solid var(--border-hairline)',
                        backgroundColor: 'var(--bg-secondary)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {log.action}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem' }}>
                    <strong>{log.entityType}</strong>
                    {log.entityId && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        ID: {log.entityId}
                      </div>
                    )}
                  </div>
                  <div>
                    {parsedDetails ? (
                      <pre
                        style={{
                          margin: 0,
                          fontSize: '0.78rem',
                          backgroundColor: 'var(--bg-primary)',
                          padding: '0.5rem',
                          border: '1px solid var(--border-hairline)',
                          overflowX: 'auto',
                          maxHeight: '120px',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                        }}
                      >
                        {parsedDetails}
                      </pre>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
