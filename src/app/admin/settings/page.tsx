'use client';

import React, { useState, useEffect } from 'react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>({
    storeName: 'Mio Studio',
    tagline: 'small things that make everything a little more beautiful',
    announcementText: 'Handmade with care — free domestic studio delivery on orders over $45',
    announcementLink: '/shop',
    announcementEnabled: true,
    whatsappNumber: '+15035550192',
    contactEmail: 'hello@miostudio.craft',
    studioAddress: 'Studio 4B, Artisan Alley, Portland, OR',
    instagramUrl: 'https://instagram.com/miostudio',
    pinterestUrl: 'https://pinterest.com/miostudio',
    heroHeadline: 'small things that make everything a little more beautiful',
    heroSubhead: 'Thoughtfully designed stickers, tactile keyrings, and small-batch handmade crochet objects crafted for everyday wonder.',
    brandStatement: 'We believe the objects you carry, clip to your bag, or tuck into a notebook should carry warmth and personal intention.',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings(data.settings);
          }
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error('Failed to update settings');
      }

      setNotice('Studio settings and WhatsApp configuration updated live!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error saving settings';
      setNotice(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading studio configuration...</div>;
  }

  return (
    <div style={{ maxWidth: '780px' }}>
      <div style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', margin: '0 0 0.25rem 0' }}>
          Store Settings & WhatsApp Integration
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
          Manage your WhatsApp order destination number, announcement bar copy, and editorial brand text.
        </p>
      </div>

      {notice && (
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-tag)', border: '1px solid var(--border-hairline)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          {notice}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* WhatsApp & Contact */}
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', padding: '1.75rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginBottom: '1rem' }}>
            1. WhatsApp Order Destination & Contact
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                Studio WhatsApp Phone Number (with Country Code) *
              </label>
              <input
                type="text"
                required
                value={settings.whatsappNumber || ''}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                placeholder="+15035550192"
                style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Customer order totals and itemized breakdowns are sent directly to this WhatsApp number upon checkout.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                  Contact Email *
                </label>
                <input
                  type="email"
                  required
                  value={settings.contactEmail || ''}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                  Studio Address
                </label>
                <input
                  type="text"
                  value={settings.studioAddress || ''}
                  onChange={(e) => setSettings({ ...settings, studioAddress: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Announcement Bar */}
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', padding: '1.75rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginBottom: '1rem' }}>
            2. Top Announcement Strip
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={Boolean(settings.announcementEnabled)}
                onChange={(e) => setSettings({ ...settings, announcementEnabled: e.target.checked })}
              />
              <span style={{ fontSize: '0.88rem' }}>Display announcement strip across storefront</span>
            </label>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                Announcement Message
              </label>
              <input
                type="text"
                value={settings.announcementText || ''}
                onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                Announcement Target Link
              </label>
              <input
                type="text"
                value={settings.announcementLink || ''}
                onChange={(e) => setSettings({ ...settings, announcementLink: e.target.value })}
                placeholder="/shop"
                style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
              />
            </div>
          </div>
        </div>

        {/* Brand Text */}
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', padding: '1.75rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginBottom: '1rem' }}>
            3. Brand & Editorial Copy
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                Store Tagline / Central Brand Idea
              </label>
              <input
                type="text"
                value={settings.tagline || ''}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                Brand Statement in Display Serif
              </label>
              <textarea
                rows={3}
                value={settings.brandStatement || ''}
                onChange={(e) => setSettings({ ...settings, brandStatement: e.target.value })}
                style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '0.85rem 2rem' }}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
