import './globals.css';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { ModeToggle } from '@/components/mode-toggle';

const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SuiGPT',
  description: 'An intelligent chatbot for the SUI blockchain platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakarta.className} antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <div className="relative min-h-screen">
            {children}
            <Toaster />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}