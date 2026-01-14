'use client';

import { useState } from 'react';
import CSVUpload from '@/components/CSVUpload';
import DataTable from '@/components/DataTable';
import DataSourceSidebar from '@/components/DataSourceSidebar';
import WebsiteNavigation from '@/components/WebsiteNavigation';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDataSource, setSelectedDataSource] = useState<string | null>(null);

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans flex">
      <DataSourceSidebar
        selectedDataSource={selectedDataSource}
        onDataSourceSelect={setSelectedDataSource}
        refreshKey={refreshKey}
      />
      <div className="flex-1 flex flex-col overflow-hidden bg-zinc-50">
        <div className="p-6 border-b border-zinc-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between  mx-auto">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">
                Keyword Masterlist Manager
              </h1>
              <p className="mt-1 text-sm text-zinc-700">
                Manage and explore imported keyword masterlist data from SEMrush.
              </p>
            </div>
            <div className="w-full lg:w-auto">
              <CSVUpload onUploadSuccess={handleUploadSuccess} />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto">
            <WebsiteNavigation refreshKey={refreshKey} />
            <DataTable
              key={refreshKey}
              selectedDataSource={selectedDataSource}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
