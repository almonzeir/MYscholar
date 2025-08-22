import React from 'react';
import Link from 'next/link';
import { ClientBackground3D } from '../../components/ui';

export default function AboutPage() {
  return (
    <main className="relative min-h-screen bg-surface-900 overflow-hidden">
      <ClientBackground3D className="fixed inset-0 z-0" />
      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">About MyScholar</h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8">
          MyScholar is a revolutionary platform that uses artificial intelligence to match students with the perfect scholarship opportunities. We believe that every student deserves the chance to pursue their educational dreams, and we're here to make that happen.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-8">
          <div className="p-6 bg-surface-800 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-2">AI-Powered Matching</h2>
            <p className="text-gray-400">Our advanced AI algorithm analyzes your profile and preferences to find the scholarships that are most relevant to you.</p>
          </div>
          <div className="p-6 bg-surface-800 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-2">Comprehensive Database</h2>
            <p className="text-gray-400">We have a vast database of scholarships from all over the world, so you're sure to find the perfect one for you.</p>
          </div>
          <div className="p-6 bg-surface-800 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-2">Easy to Use</h2>
            <p className="text-gray-400">Our platform is designed to be simple and intuitive, so you can find the scholarships you need without any hassle.</p>
          </div>
        </div>
        <Link href="/search" className="btn-primary">
          Get Started
        </Link>
      </div>
    </main>
  );
}