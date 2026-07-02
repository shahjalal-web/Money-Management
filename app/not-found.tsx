import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-8xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
          404
        </h1>
        <p className="text-xl text-muted mt-4 mb-8">Page not found</p>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
