'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DataSourceSidebarProps {
  selectedDataSource: string | null;
  onDataSourceSelect: (dataSource: string | null) => void;
  refreshKey?: number;
}

const DataSourceSidebar = ({
  selectedDataSource,
  onDataSourceSelect,
  refreshKey,
}: DataSourceSidebarProps) => {
  const [dataSources, setDataSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDataSources = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/records');
      const data = await response.json();

      if (data.success) {
        const sources = new Set<string>();
        data.data.forEach((record: any) => {
          if (record.dataSource) {
            sources.add(record.dataSource);
          }
        });
        setDataSources(Array.from(sources).sort());
      }
    } catch (error) {
      console.error('Failed to fetch data sources:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataSources();
  }, [refreshKey]);

  return (
    <div className="w-64 bg-white border-r border-zinc-200 h-screen overflow-y-auto">
      <div className="p-4 border-b border-zinc-200 bg-zinc-50">
        <h2 className="text-lg font-semibold text-zinc-900">
          Data Sources
        </h2>
      </div>
      <div className="p-2">
        {loading ? (
          <div className="text-sm text-zinc-700 p-2">
            Loading...
          </div>
        ) : dataSources.length === 0 ? (
          <div className="text-sm text-zinc-700 p-2">
            No data sources found
          </div>
        ) : (
          <>
            <button
              onClick={() => onDataSourceSelect(null)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium mb-1 transition-colors ${
                selectedDataSource === null
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              All Sources
            </button>
            {dataSources.map((source) => (
              <button
                key={source}
                onClick={() => onDataSourceSelect(source)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium mb-1 transition-colors ${
                  selectedDataSource === source
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                {source}
              </button>
            ))}
          </>
        )}
      </div>
      
      {/* Navigation Links */}
      <div className="p-2 border-t border-zinc-200 mt-4">
        <p className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Navigation
        </p>
        <Link
          href={`/report${selectedDataSource ? `?dataSource=${encodeURIComponent(selectedDataSource)}` : ''}`}
          className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          View Reports
        </Link>
        <Link
          href="/documentation"
          className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Documentation
        </Link>
      </div>
    </div>
  );
};

export default DataSourceSidebar;
