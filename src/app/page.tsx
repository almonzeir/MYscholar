'use client';

import React from 'react';
import Link from 'next/link';
import { ClientBackground3D } from '@/components/ui';
// import { motion } from 'framer-motion';

export default function HomePage() {
  const headline = 'MyScholar';
  const tagline = 'Stop guessing. Let AI match you.';

  const headlineVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <main className="relative min-h-screen bg-surface-900 overflow-hidden">
      <ClientBackground3D className="fixed inset-0 z-0" />
      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center text-center">
        <h1
          className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x mb-4"
        >
          {headline.split('').map((char, index) => (
            <span key={index}>
              {char}
            </span>
          ))}
        </h1>
        <p
          className="text-2xl md:text-3xl font-semibold text-white/90 mb-8"
        >
          {tagline}
        </p>
        <div>
          <Link href="/search" className="btn-primary mr-4">
            Get Started
          </Link>
          <Link href="/about" className="btn-secondary">
            Learn More
          </Link>
        </div>
      </div>
    </main>
  );
}