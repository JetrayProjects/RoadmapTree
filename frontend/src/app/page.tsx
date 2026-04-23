'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function Home() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Node Road" className="w-10 h-10 rounded-xl object-contain" />
            <span className="text-xl font-bold text-white [-webkit-text-stroke:0.25px_black] font-[family-name:var(--font-vast-shadow)]">Node Road</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/roadmaps" className="text-gray-600 hover:text-black transition-colors font-medium">
              Explore
            </Link>
            {user ? (
              <>
                <Link href="/create" className="text-gray-600 hover:text-black transition-colors font-medium">
                  Create
                </Link>
                <Link href="/dashboard" className="text-gray-600 hover:text-black transition-colors font-medium">
                  Dashboard
                </Link>
                <button
                  onClick={signOut}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
                >
                  Sign Out
                </button>
                {user.avatarUrl && (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-10 h-10 rounded-full ring-2 ring-gray-200"
                  />
                )}
              </>
            ) : (
              <button
                onClick={signInWithGoogle}
                disabled={loading}
                className="px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-all hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? 'Loading...' : 'Sign In with Google'}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700 mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Learn anything, step by step
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Build Your <span className="gradient-text">Learning Path</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-2xl">
            Create visual roadmaps to organize your learning journey. Share your knowledge
            with others or follow curated paths from experts in any field.
          </p>

          <div className="flex flex-wrap gap-4">
            {user ? (
              <Link
                href="/create"
                className="px-8 py-4 bg-black text-white text-lg font-semibold rounded-full hover:bg-gray-800 transition-all hover:shadow-xl flex items-center gap-2"
              >
                Create Roadmap
              </Link>
            ) : (
              <button
                onClick={signInWithGoogle}
                disabled={loading}
                className="px-8 py-4 bg-black text-white text-lg font-semibold rounded-full hover:bg-gray-800 transition-all hover:shadow-xl disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Get Started Free'}
              </button>
            )}
            <Link
              href="/roadmaps"
              className="px-8 py-4 bg-white text-black text-lg font-semibold rounded-full border-2 border-gray-200 hover:border-black transition-all"
            >
              Explore Roadmaps
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">How It Works</h2>
            <p className="text-gray-600 text-lg">Three simple steps to master any skill</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 card-hover">
              <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mb-6">
                <span className="text-white text-2xl font-bold">01</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-black">Create Nodes</h3>
              <p className="text-gray-600 leading-relaxed">
                Add learning resources like YouTube videos, PDFs, articles, and documents
                to build your roadmap structure.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 card-hover">
              <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mb-6">
                <span className="text-white text-2xl font-bold">02</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-black">Connect & Organize</h3>
              <p className="text-gray-600 leading-relaxed">
                Link nodes together to show the learning sequence. Add milestones to
                track your progress.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 card-hover">
              <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mb-6">
                <span className="text-white text-2xl font-bold">03</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-black">Share & Learn</h3>
              <p className="text-gray-600 leading-relaxed">
                Publish your roadmap for others to follow. Explore roadmaps created
                by experts in any domain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section>
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">Popular Use Cases</h2>
            <p className="text-gray-600 text-lg">See what others are learning</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover">
              <div className="text-4xl mb-4">MUSIC</div>
              <h3 className="text-lg font-bold mb-2 text-black">Music</h3>
              <p className="text-gray-600 text-sm">
                Learn guitar, piano, or any instrument with structured lessons.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover">
              <div className="text-4xl mb-4">CODE</div>
              <h3 className="text-lg font-bold mb-2 text-black">Programming</h3>
              <p className="text-gray-600 text-sm">
                From beginner to advanced coding skills.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover">
              <div className="text-4xl mb-4">STUDY</div>
              <h3 className="text-lg font-bold mb-2 text-black">Academics</h3>
              <p className="text-gray-600 text-sm">
                Structured learning paths for any subject.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover">
              <div className="text-4xl mb-4">ART</div>
              <h3 className="text-lg font-bold mb-2 text-black">Creative</h3>
              <p className="text-gray-600 text-sm">
                Design, art, photography, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black text-white">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-gray-400 text-lg mb-8">
            Join thousands of learners building their knowledge trees.
          </p>
          {user ? (
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black text-lg font-semibold rounded-full hover:bg-gray-100 transition-all"
            >
              Create Your First Roadmap
            </Link>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black text-lg font-semibold rounded-full hover:bg-gray-100 transition-all"
            >
              Get Started Free
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Node Road" className="w-8 h-8 rounded-lg object-contain" />
              <span className="font-semibold text-white [-webkit-text-stroke:0.25px_black] font-[family-name:var(--font-vast-shadow)]">Node Road</span>
            </div>
            <p className="text-sm text-gray-500">
              Build your learning journey, one node at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
