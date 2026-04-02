import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import Providers from '../providers';
import ManageSidebar from './_sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = { title: 'Blind Box — Admin' };

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex h-screen bg-gray-50 overflow-hidden">
            <ManageSidebar />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
