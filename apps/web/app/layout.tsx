import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Developer Copilot',
  description: 'Enterprise repository intelligence and evidence-grounded code Q&A',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              AI Developer Copilot
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              v1.0-alpha
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-slate-400">
            <a href="/" className="hover:text-slate-200 transition-colors">Repositories</a>
            <a href="/chat" className="hover:text-slate-200 transition-colors">Chat</a>
            <a href="/analyses" className="hover:text-slate-200 transition-colors">PR Reviews</a>
            <a href="/admin" className="hover:text-slate-200 transition-colors">Admin & Usage</a>
          </nav>
        </header>
        <main className="max-w-7xl mx-auto p-6">
          {children}
        </main>
      </body>
    </html>
  );
}

