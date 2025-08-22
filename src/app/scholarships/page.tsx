import React from 'react';
import { ScholarshipRepository } from '@/lib/repositories/ScholarshipRepository';
import { Scholarship } from '@/types/database';
import { Card } from '@/components/ui/Card';

export default async function ScholarshipsPage() {
  const scholarshipRepository = new ScholarshipRepository();
  const { scholarships } = await scholarshipRepository.search();

  return (
    <main className="relative min-h-screen bg-surface-900 overflow-hidden">
      <div className="relative z-10 container mx-auto px-4 py-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Scholarships</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scholarships.map((scholarship) => (
            <Card key={scholarship.id}>
              <h2 className="text-xl font-bold">{scholarship.name}</h2>
              <p className="text-gray-400">{scholarship.country}</p>
              <p className="text-gray-400">{new Date(scholarship.deadline).toLocaleDateString()}</p>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}