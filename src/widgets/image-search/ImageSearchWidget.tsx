import React from 'react';
import { SearchSection, ResultsSection } from '@/features/image-search';

export const ImageSearchWidget: React.FC = () => {
  return (
    <React.Fragment>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <SearchSection />
          <ResultsSection />
        </div>
      </div>
    </React.Fragment>
  );
};