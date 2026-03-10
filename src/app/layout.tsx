import { Inter } from 'next/font/google'
import './globals.css';
import { Providers } from '@/components/providers';
import { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Управление на поръчки',
  description: 'Приложение за управление на поръчки.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg" suppressHydrationWarning>
      <body className={`font-sans antialiased ${inter.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
