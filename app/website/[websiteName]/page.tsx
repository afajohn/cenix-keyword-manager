'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';

export default function WebsitePage() {
  const params = useParams();
  const router = useRouter();
  const websiteName = params.websiteName as string;
  const [websiteInfo, setWebsiteInfo] = useState<{
    name: string;
    urlPath: string;
  } | null>(null);

  useEffect(() => {
    // Fetch website info from records to get URL path
    const fetchWebsiteInfo = async () => {
      try {
        const response = await fetch('/api/records');
        const data = await response.json();

        if (data.success) {
          // Find a record with this website name to get the URL path
          const record = data.data.find(
            (r: { websiteName?: string }) =>
              r.websiteName && decodeURIComponent(r.websiteName) === decodeURIComponent(websiteName)
          );

          if (record) {
            setWebsiteInfo({
              name: decodeURIComponent(websiteName),
              urlPath: record.websiteUrlPath || '',
            });
          } else {
            // If no record found, still set the name
            setWebsiteInfo({
              name: decodeURIComponent(websiteName),
              urlPath: '',
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch website info:', error);
      }
    };

    if (websiteName) {
      fetchWebsiteInfo();
    }
  }, [websiteName]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <div className="flex-1 flex flex-col overflow-hidden bg-zinc-50">
        <div className="p-6 border-b border-zinc-200">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="px-3 py-1 text-sm text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
              >
                ← Back to All Keywords
              </button>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">
                Keywords for: {websiteInfo?.name || decodeURIComponent(websiteName)}
              </h1>
              {websiteInfo?.urlPath && (
                <p className="mt-2 text-sm text-zinc-700">
                  URL Path: <span className="font-mono font-medium">{websiteInfo.urlPath}</span>
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto">
            <DataTable
              selectedDataSource={null}
              selectedWebsiteName={decodeURIComponent(websiteName)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
