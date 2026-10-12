import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const CreateCategorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  introText: z.string().optional(),
  editorialImage: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const parsed = CreateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid category details' }, { status: 400 });
    }

    const { name, slug, introText, editorialImage } = parsed.data;

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'A category with this slug already exists.' }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        introText: introText || null,
        editorialImage: editorialImage || '/placeholders/stickers-editorial.svg',
      },
    });

    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: 'CATEGORY_CREATE',
        entityType: 'CATEGORY',
        entityId: category.id,
        details: `Created new category "${name}" (${slug})`,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error: unknown) {
    console.error('Error creating category:', error);
    const message = error instanceof Error ? error.message : 'Failed to create category';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
