'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface WebsiteNavigationProps {
  refreshKey?: number;
}

const WebsiteNavigation = ({ refreshKey }: WebsiteNavigationProps) => {
  const [websites, setWebsites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWebsites = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/records');
      const data = await response.json();

      if (data.success) {
        const websiteSet = new Set<string>();
        data.data.forEach((record: { websiteName?: string }) => {
          if (record.websiteName && record.websiteName.trim()) {
            websiteSet.add(record.websiteName.trim());
          }
        });
        setWebsites(Array.from(websiteSet).sort());
      }
    } catch (error) {
      console.error('Failed to fetch websites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, [refreshKey]);

  if (loading) {
    return null;
  }

  if (websites.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 p-3 bg-zinc-50 border border-zinc-200 rounded-md">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-zinc-700 mr-1">Websites:</span>
        {websites.map((website) => (
          <Link
            key={website}
            href={`/website/${encodeURIComponent(website)}`}
            className="px-3 py-1 text-sm bg-white border border-zinc-300 rounded-md text-zinc-700 hover:bg-zinc-100 hover:border-zinc-400 transition-colors"
          >
            {website}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default WebsiteNavigation;
