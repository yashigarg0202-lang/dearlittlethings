import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export const revalidate = 60;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findFirst({
    where: {
      OR: [
        { slug },
        { slug: slug === 'handmade-crochet' ? 'crochet' : slug === 'keyrings-charms' ? 'keyrings' : slug },
      ],
    },
  });
  if (!category) return { title: 'the collection | dear little things' };
  return {
    title: `${category.name.toLowerCase()} | dear little things`,
    description: category.introText || `Handmade ${category.name} by dear little things.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  redirect(`/shop?category=${encodeURIComponent(slug)}`);
}
