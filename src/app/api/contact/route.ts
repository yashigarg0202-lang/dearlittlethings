import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown-client';
    const rateLimit = checkRateLimit(ip, 'contact', 5, 15 * 60 * 1000); // 5 attempts per 15 min
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many inquiries sent in a short window. Please wait a few moments or message us directly on WhatsApp.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { name, email, topic, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Please provide your name, email address, and message note.' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address for our reply.' },
        { status: 400 }
      );
    }

    // Log the contact message into the AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'CONTACT_INQUIRY',
        entityType: 'CustomerInquiry',
        entityId: email,
        details: JSON.stringify({
          name: name.slice(0, 100),
          email: email.slice(0, 100),
          topic: topic ? topic.slice(0, 50) : 'General Inquiry',
          messageLength: message.length,
          preview: message.slice(0, 200),
          ip,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Your inquiry has been delivered directly to the maker’s workbench. We reply within 24–48 business hours.',
    });
  } catch (error) {
    console.error('Contact error:', error);
    return NextResponse.json(
      { error: 'Failed to deliver message. Please try reaching us directly on WhatsApp.' },
      { status: 500 }
    );
  }
}
