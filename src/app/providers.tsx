'use client';

import React from 'react';
import { ErrorProvider, ErrorBoundary } from '@/components/error';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // <ErrorProvider
    //   maxErrors={100}
    //   showToasts={true}
    //   autoReportReactErrors={true}
    // >
    //   <ErrorBoundary level="page">
    //     {children}
    //   </ErrorBoundary>
    // </ErrorProvider>
    <>{children}</> // Render children directly
  );
}
