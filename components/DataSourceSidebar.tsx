'use client';

import { useState, useEffect } from 'react';

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
    </div>
  );
};

export default DataSourceSidebar;
