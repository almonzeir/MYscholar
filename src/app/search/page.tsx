import React from 'react';
import { SearchApp } from '@/components/features/SearchApp';

export default function SearchPage() {
  return (
    <main className="relative min-h-screen bg-surface-900 overflow-hidden">
      <div className="relative z-10 container mx-auto px-4 py-8">
        <SearchApp />
      </div>
    </main>
  );
}