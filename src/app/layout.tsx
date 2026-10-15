import type { Metadata } from 'next';
import { Fraunces, Lato, Caveat } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
});

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  display: 'swap',
  variable: '--font-lato',
});

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
  variable: '--font-caveat',
});

export const metadata: Metadata = {
  title: {
    default: 'dear little things — stickers, charms & handmade crochet',
    template: '%s — dear little things',
  },
  description:
    'Small things that make everything a little more beautiful. Stickers, keyrings, charms and handmade crochet.',
  openGraph: {
    title: 'dear little things',
    description: 'Small things that make everything a little more beautiful.',
    siteName: 'dear little things',
    locale: 'en_IN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${lato.variable} ${caveat.variable}`}>
      <body>
        <CartProvider>
          <WishlistProvider>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Header />
              <CartDrawer />
              <main id="main-content" style={{ flex: 1 }}>
                {children}
              </main>
              <Footer />
            </div>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
