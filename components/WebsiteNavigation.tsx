'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface WebsiteNavigationProps {
  refreshKey?: number;
}

const WebsiteNavigation = ({ refreshKey }: WebsiteNavigationProps) => {
  const [websites, setWebsites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchWebsites = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/records');
      const data = await response.json();

      if (data.success) {
        const websiteSet = new Set<string>();
        data.data.forEach((record: { websiteName?: string }) => {
          if (record.websiteName && record.websiteName.trim()) {
            // Handle comma-separated websites
            const websites = record.websiteName.split(',').map((w: string) => w.trim()).filter((w: string) => w);
            websites.forEach((w: string) => websiteSet.add(w));
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

  const handleWebsiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue === 'all') {
      router.push('/');
    } else if (selectedValue) {
      router.push(`/website/${encodeURIComponent(selectedValue)}`);
    }
  };

  // Get current website from pathname
  const currentWebsite = pathname?.startsWith('/website/') 
    ? decodeURIComponent(pathname.split('/website/')[1] || '')
    : 'all';

  if (loading) {
    return null;
  }

  if (websites.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 p-3 bg-zinc-50 border border-zinc-200 rounded-md">
      <div className="flex items-center gap-2">
        <label className="text-sm font-semibold text-zinc-700">Websites:</label>
        <select
          value={currentWebsite}
          onChange={handleWebsiteChange}
          className="px-3 py-1.5 text-sm bg-white border border-zinc-300 rounded-md text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 min-w-[200px] cursor-pointer"
        >
          <option value="all">All</option>
          {websites.map((website) => (
            <option key={website} value={website}>
              {website}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default WebsiteNavigation;
