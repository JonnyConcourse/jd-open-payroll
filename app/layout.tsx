import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Nav } from '@/components/layout/Nav';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Open Payroll NJ — New Jersey Government Employee Salaries',
  description:
    'Interactive visualization of New Jersey state government employee payroll data. Explore salaries by agency, job title, and individual employee.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-50 text-gray-900 antialiased`}>
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
