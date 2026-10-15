import { redirect } from 'next/navigation';

export const revalidate = 60;

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  redirect(`/shop?collection=${encodeURIComponent(slug)}`);
}
