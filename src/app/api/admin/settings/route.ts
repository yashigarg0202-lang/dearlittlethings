import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'default' },
    });
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const updated = await prisma.siteSettings.upsert({
      where: { id: 'default' },
      update: {
        storeName: body.storeName,
        tagline: body.tagline,
        announcementText: body.announcementText,
        announcementLink: body.announcementLink || null,
        announcementEnabled: Boolean(body.announcementEnabled),
        contactEmail: body.contactEmail,
        whatsappNumber: body.whatsappNumber || null,
        studioAddress: body.studioAddress || null,
        instagramUrl: body.instagramUrl || null,
        pinterestUrl: body.pinterestUrl || null,
        heroHeadline: body.heroHeadline,
        heroSubhead: body.heroSubhead,
        brandStatement: body.brandStatement,
        editorialStoryTitle: body.editorialStoryTitle,
        editorialStoryExcerpt: body.editorialStoryExcerpt,
      },
      create: {
        id: 'default',
        storeName: body.storeName || 'Mio Studio',
        tagline: body.tagline || 'small things that make everything a little more beautiful',
        announcementText: body.announcementText || 'Handmade with care',
        announcementEnabled: true,
        contactEmail: body.contactEmail || 'hello@miostudio.craft',
        whatsappNumber: body.whatsappNumber || '+15035550192',
      },
    });

    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: 'SETTINGS_UPDATE',
        entityType: 'SITE_SETTINGS',
        entityId: 'default',
        details: `Updated site settings & studio WhatsApp number to ${body.whatsappNumber}`,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error('Settings save error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save settings' }, { status: 500 });
  }
}
