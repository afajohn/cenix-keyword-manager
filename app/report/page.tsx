'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Record {
  id: string;
  keyword?: string;
  Keyword?: string;
  KD?: string | number;
  SV?: string | number;
  Intent?: string;
  intent?: string;
  createdAt?: string;
  dataSource?: string;
  [key: string]: any;
}

interface KeywordHistory {
  keyword: string;
  entries: Array<{
    timestamp: string;
    kd: string | number;
    sv: string | number;
    intent: string;
    dataSource?: string;
  }>;
}

// Helper functions for extracting field values
const getFieldValue = (record: Record, field: string): any => {
  const fieldLower = field.toLowerCase();
  const keys = Object.keys(record);
  
  // Case-insensitive match; also ignore spaces in keys
  const found = keys.find(
    (key) => key.toLowerCase().replace(/\s+/g, '') === fieldLower.replace(/\s+/g, ''),
  );
  
  if (found) {
    return record[found];
  }
  
  // Try direct matches with different cases
  if (record[field]) return record[field];
  if (record[fieldLower]) return record[fieldLower];
  if (record[field.charAt(0).toUpperCase() + field.slice(1).toLowerCase()]) {
    return record[field.charAt(0).toUpperCase() + field.slice(1).toLowerCase()];
  }
  
  return '';
};

const getKeywordName = (record: Record): string => {
  // Try multiple field name variations (case-insensitive)
  const keyword = getFieldValue(record, 'keyword') || 
                  getFieldValue(record, 'Keyword') ||
                  record.keyword ||
                  record.Keyword ||
                  '';
  return String(keyword).trim();
};

const getKD = (record: Record): string | number => {
  return getFieldValue(record, 'KD') || getFieldValue(record, 'kd') || '-';
};

const getSV = (record: Record): string | number => {
  return getFieldValue(record, 'SV') || getFieldValue(record, 'sv') || '-';
};

const getIntent = (record: Record): string => {
  return String(getFieldValue(record, 'Intent') || getFieldValue(record, 'intent') || '-');
};

function ReportContent() {
  const searchParams = useSearchParams();
  const dataSourceParam = searchParams.get('dataSource');
  const [selectedDataSource, setSelectedDataSource] = useState<string | null>(dataSourceParam);
  
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [selectedDate1, setSelectedDate1] = useState<string>('');
  const [selectedDate2, setSelectedDate2] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [keywordSearchQuery, setKeywordSearchQuery] = useState<string>('');
  const [keywordSortConfig, setKeywordSortConfig] = useState<{ key: 'name' | 'entries'; direction: 'asc' | 'desc' } | null>({ key: 'entries', direction: 'desc' });
  const [keywordCurrentPage, setKeywordCurrentPage] = useState(1);
  const [keywordItemsPerPage, setKeywordItemsPerPage] = useState(20);

  useEffect(() => {
    const dataSource = searchParams.get('dataSource');
    setSelectedDataSource(dataSource);
  }, [searchParams]);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/records');
      const data = await response.json();

      if (data.success) {
        setRecords(data.data);
        console.log('Fetched records:', data.data.length);
        // Debug: log first record to see structure
        if (data.data.length > 0) {
          console.log('Sample record:', data.data[0]);
        }
      } else {
        console.error('Failed to fetch records:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group records by keyword and sort by timestamp
  const keywordHistory = useMemo(() => {
    const keywordMap = new Map<string, KeywordHistory>();

    if (records.length === 0) {
      console.log('No records found');
      return [];
    }

    // Filter records by data source if selected
    let filteredRecords = records;
    if (selectedDataSource) {
      filteredRecords = records.filter((record) => record.dataSource === selectedDataSource);
    }

    filteredRecords.forEach((record, index) => {
      const keyword = getKeywordName(record);
      
      // Debug first few records
      if (index < 3) {
        console.log(`Record ${index}:`, {
          keyword,
          allKeys: Object.keys(record),
          recordSample: record,
        });
      }
      
      if (!keyword || keyword.trim() === '' || keyword === 'undefined' || keyword === 'null') {
        return;
      }

      if (!keywordMap.has(keyword)) {
        keywordMap.set(keyword, {
          keyword,
          entries: [],
        });
      }

      const history = keywordMap.get(keyword)!;
      const timestamp = record.createdAt || '';
      
      history.entries.push({
        timestamp,
        kd: getKD(record),
        sv: getSV(record),
        intent: getIntent(record),
        dataSource: record.dataSource,
      });
    });

    console.log(`Total keywords found: ${keywordMap.size} (filtered by data source: ${selectedDataSource || 'All'})`);

    // Sort entries by timestamp (oldest first)
    keywordMap.forEach((history) => {
      history.entries.sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return dateA - dateB;
      });
    });

    // Convert to array (will be sorted by UI controls)
    return Array.from(keywordMap.values());
  }, [records, selectedDataSource]);

  // Filter, sort, and paginate keywords
  const filteredSortedKeywords = useMemo(() => {
    let filtered = keywordHistory;

    // Apply search filter
    if (keywordSearchQuery.trim()) {
      const query = keywordSearchQuery.toLowerCase();
      filtered = filtered.filter((history) =>
        history.keyword.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (keywordSortConfig) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (keywordSortConfig.key === 'entries') {
          aValue = a.entries.length;
          bValue = b.entries.length;
        } else {
          // Sort by name
          aValue = a.keyword.toLowerCase();
          bValue = b.keyword.toLowerCase();
        }

        if (aValue < bValue) return keywordSortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return keywordSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default: sort by entries descending (highest first)
      filtered = [...filtered].sort((a, b) => b.entries.length - a.entries.length);
    }

    return filtered;
  }, [keywordHistory, keywordSearchQuery, keywordSortConfig]);

  // Paginate keywords
  const paginatedKeywords = useMemo(() => {
    const startIndex = (keywordCurrentPage - 1) * keywordItemsPerPage;
    const endIndex = startIndex + keywordItemsPerPage;
    return filteredSortedKeywords.slice(startIndex, endIndex);
  }, [filteredSortedKeywords, keywordCurrentPage, keywordItemsPerPage]);

  const keywordTotalPages = Math.ceil(filteredSortedKeywords.length / keywordItemsPerPage);

  const handleKeywordSort = (key: 'name' | 'entries') => {
    setKeywordSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === 'asc'
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
    setKeywordCurrentPage(1);
  };

  const handleExportToCSV = () => {
    // Prepare data: if keyword is selected, export only that keyword; otherwise export all
    const exportData: Array<{
      Keyword: string;
      Timestamp: string;
      KD: string | number;
      SV: string | number;
      Intent: string;
      'Present In': string;
    }> = [];

    // Determine which keywords to export
    const keywordsToExport = selectedKeyword
      ? keywordHistory.filter((h) => h.keyword === selectedKeyword)
      : keywordHistory;

    // Process each keyword
    keywordsToExport.forEach((history) => {
      // Sort entries by timestamp descending (newest first)
      const sortedEntries = [...history.entries].sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return dateB - dateA; // Descending order
      });

      // Add each entry for this keyword
      sortedEntries.forEach((entry) => {
        exportData.push({
          Keyword: history.keyword,
          Timestamp: formatDateTime(entry.timestamp),
          KD: entry.kd,
          SV: entry.sv,
          Intent: entry.intent,
          'Present In': entry.dataSource || '-',
        });
      });
    });

    // Convert to CSV format
    const headers = ['Keyword', 'Timestamp', 'KD', 'SV', 'Intent', 'Present In'];
    const csvRows = [
      headers.join(','),
      ...exportData.map((row) =>
        [
          `"${String(row.Keyword).replace(/"/g, '""')}"`,
          `"${String(row.Timestamp).replace(/"/g, '""')}"`,
          String(row.KD),
          String(row.SV),
          `"${String(row.Intent).replace(/"/g, '""')}"`,
          `"${String(row['Present In']).replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ];

    const csvContent = csvRows.join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    const filename = selectedKeyword
      ? `keyword-report-${selectedKeyword.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`
      : `keyword-report-all-${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  };

  const formatDateTime = (value: string | undefined): string => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const hoursStr = pad(hours);
    
    return `${month}-${day}-${year} ${hoursStr}:${minutes}:${seconds} ${ampm}`;
  };

  const selectedKeywordData = useMemo(() => {
    if (!selectedKeyword) return null;
    return keywordHistory.find((h) => h.keyword === selectedKeyword) || null;
  }, [selectedKeyword, keywordHistory]);

  // Get comparison data based on selected dates
  const comparisonData = useMemo(() => {
    if (!selectedKeywordData || !selectedDate1 || !selectedDate2) return null;

    // Find entries by matching the formatted timestamp
    const formatDateTimeForComparison = (value: string | undefined): string => {
      if (!value) return '';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '';
      
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const month = pad(date.getMonth() + 1);
      const day = pad(date.getDate());
      const year = date.getFullYear();
      
      let hours = date.getHours();
      const minutes = pad(date.getMinutes());
      const seconds = pad(date.getSeconds());
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      if (hours === 0) hours = 12;
      const hoursStr = pad(hours);
      
      return `${month}-${day}-${year} ${hoursStr}:${minutes}:${seconds} ${ampm}`;
    };

    const entry1 = selectedKeywordData.entries.find((e) => {
      const entryDate = formatDateTimeForComparison(e.timestamp);
      return entryDate === selectedDate1;
    });
    
    const entry2 = selectedKeywordData.entries.find((e) => {
      const entryDate = formatDateTimeForComparison(e.timestamp);
      return entryDate === selectedDate2;
    });

    return { entry1, entry2 };
  }, [selectedKeywordData, selectedDate1, selectedDate2]);

  // Filter and sort history entries
  const filteredAndSortedEntries = useMemo(() => {
    if (!selectedKeywordData) return [];

    let filtered = selectedKeywordData.entries;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((entry) => {
        return (
          String(entry.kd).toLowerCase().includes(query) ||
          String(entry.sv).toLowerCase().includes(query) ||
          String(entry.intent).toLowerCase().includes(query) ||
          (entry.dataSource && entry.dataSource.toLowerCase().includes(query)) ||
          formatDateTime(entry.timestamp).toLowerCase().includes(query)
        );
      });
    }

    // Apply sorting
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'timestamp':
            aValue = new Date(a.timestamp).getTime();
            bValue = new Date(b.timestamp).getTime();
            break;
          case 'kd':
            aValue = Number(a.kd) || 0;
            bValue = Number(b.kd) || 0;
            break;
          case 'sv':
            aValue = Number(a.sv) || 0;
            bValue = Number(b.sv) || 0;
            break;
          case 'intent':
            aValue = String(a.intent).toLowerCase();
            bValue = String(b.intent).toLowerCase();
            break;
          case 'dataSource':
            aValue = String(a.dataSource || '').toLowerCase();
            bValue = String(b.dataSource || '').toLowerCase();
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default: sort by timestamp descending (newest first)
      filtered = [...filtered].sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return dateB - dateA; // Descending order
      });
    }

    return filtered;
  }, [selectedKeywordData, searchQuery, sortConfig]);

  // Paginate entries
  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedEntries.slice(startIndex, endIndex);
  }, [filteredAndSortedEntries, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedEntries.length / itemsPerPage);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === 'asc'
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (column: string) => {
    if (sortConfig?.key !== column) {
      return (
        <span className="ml-1 text-zinc-400">
          <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </span>
      );
    }
    return sortConfig.direction === 'asc' ? (
      <span className="ml-1 text-zinc-900">
        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </span>
    ) : (
      <span className="ml-1 text-zinc-900">
        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8 text-zinc-700">Loading report data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="w-full">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Keyword Change Report</h1>
            <p className="text-zinc-600 mt-1">
              Track changes in KD, SV, and Intent over time
              {selectedDataSource && (
                <span className="ml-2 text-sm font-medium">
                  (Data Source: {selectedDataSource})
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-md font-medium
                hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export to CSV
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-zinc-600 text-white rounded-md font-medium
                hover:bg-zinc-700 transition-colors"
            >
              Back to Records
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Keyword List */}
          <div className="lg:col-span-1 bg-white rounded-lg border border-zinc-200 shadow-sm p-4 flex flex-col">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-zinc-900">
                  Keywords ({filteredSortedKeywords.length})
                </h2>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleKeywordSort('entries')}
                    className="px-2 py-1 text-xs border border-zinc-300 rounded bg-white text-zinc-700 hover:bg-zinc-50"
                    title="Sort by entries"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleKeywordSort('name')}
                    className="px-2 py-1 text-xs border border-zinc-300 rounded bg-white text-zinc-700 hover:bg-zinc-50"
                    title="Sort by name"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder="Search keywords..."
                value={keywordSearchQuery}
                onChange={(e) => {
                  setKeywordSearchQuery(e.target.value);
                  setKeywordCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md
                  bg-white text-zinc-900
                  focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto min-h-0">
              {paginatedKeywords.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  {keywordSearchQuery ? 'No keywords found' : 'No keywords available'}
                </div>
              ) : (
                paginatedKeywords.map((history) => (
                  <button
                    key={history.keyword}
                    onClick={() => setSelectedKeyword(history.keyword)}
                    className={`w-full text-left p-3 rounded-md border transition-colors ${
                      selectedKeyword === history.keyword
                        ? 'bg-blue-50 border-blue-300 text-blue-900'
                        : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-900'
                    }`}
                  >
                    <div className="font-medium">{history.keyword}</div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {history.entries.length} {history.entries.length === 1 ? 'entry' : 'entries'}
                    </div>
                  </button>
                ))
              )}
            </div>
            {/* Pagination for Keywords */}
            {keywordTotalPages > 1 && (
              <div className="mt-4 pt-4 border-t border-zinc-200">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-zinc-600">
                    <span>
                      Page {keywordCurrentPage} of {keywordTotalPages}
                    </span>
                    <select
                      value={keywordItemsPerPage}
                      onChange={(e) => {
                        setKeywordItemsPerPage(Number(e.target.value));
                        setKeywordCurrentPage(1);
                      }}
                      className="px-2 py-1 text-xs border border-zinc-300 rounded bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setKeywordCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={keywordCurrentPage === 1}
                      className="flex-1 px-2 py-1 text-xs border border-zinc-300 rounded-md bg-white text-zinc-900
                        hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setKeywordCurrentPage((prev) => Math.min(keywordTotalPages, prev + 1))}
                      disabled={keywordCurrentPage === keywordTotalPages}
                      className="flex-1 px-2 py-1 text-xs border border-zinc-300 rounded-md bg-white text-zinc-900
                        hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Keyword Details and Comparison */}
          <div className="lg:col-span-3 bg-white rounded-lg border border-zinc-200 shadow-sm p-6">
            {selectedKeywordData ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-zinc-900 mb-2">
                    {selectedKeywordData.keyword}
                  </h2>
                  <p className="text-zinc-600">
                    {selectedKeywordData.entries.length} historical entry
                    {selectedKeywordData.entries.length !== 1 ? 'ies' : 'y'}
                  </p>
                </div>

                {/* Date Selection for Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-zinc-50 rounded-md">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Select First Date
                    </label>
                    <select
                      value={selectedDate1}
                      onChange={(e) => setSelectedDate1(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    >
                      <option value="">Select date...</option>
                      {selectedKeywordData.entries.map((entry, idx) => (
                        <option key={idx} value={formatDateTime(entry.timestamp)}>
                          {formatDateTime(entry.timestamp)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Select Second Date (for comparison)
                    </label>
                    <select
                      value={selectedDate2}
                      onChange={(e) => setSelectedDate2(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    >
                      <option value="">Select date...</option>
                      {selectedKeywordData.entries.map((entry, idx) => (
                        <option key={idx} value={formatDateTime(entry.timestamp)}>
                          {formatDateTime(entry.timestamp)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Comparison View */}
                {comparisonData && comparisonData.entry1 && comparisonData.entry2 && (
                  <div className="border border-zinc-200 rounded-md p-4">
                    <h3 className="text-lg font-semibold text-zinc-900 mb-4">Comparison</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-50 rounded-md">
                        <div className="text-sm font-medium text-zinc-700 mb-2">
                          {formatDateTime(comparisonData.entry1.timestamp)}
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs text-zinc-600">KD:</span>{' '}
                            <span className="font-semibold">{comparisonData.entry1.kd}</span>
                          </div>
                          <div>
                            <span className="text-xs text-zinc-600">SV:</span>{' '}
                            <span className="font-semibold">{comparisonData.entry1.sv}</span>
                          </div>
                          <div>
                            <span className="text-xs text-zinc-600">Intent:</span>{' '}
                            <span className="font-semibold">{comparisonData.entry1.intent}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-md">
                        <div className="text-sm font-medium text-zinc-700 mb-2">
                          {formatDateTime(comparisonData.entry2.timestamp)}
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs text-zinc-600">KD:</span>{' '}
                            <span className="font-semibold">{comparisonData.entry2.kd}</span>
                            {comparisonData.entry1.kd !== comparisonData.entry2.kd && (
                              <span className="ml-2 text-xs text-orange-600">(changed)</span>
                            )}
                          </div>
                          <div>
                            <span className="text-xs text-zinc-600">SV:</span>{' '}
                            <span className="font-semibold">{comparisonData.entry2.sv}</span>
                            {comparisonData.entry1.sv !== comparisonData.entry2.sv && (
                              <span className="ml-2 text-xs text-orange-600">(changed)</span>
                            )}
                          </div>
                          <div>
                            <span className="text-xs text-zinc-600">Intent:</span>{' '}
                            <span className="font-semibold">{comparisonData.entry2.intent}</span>
                            {comparisonData.entry1.intent !== comparisonData.entry2.intent && (
                              <span className="ml-2 text-xs text-orange-600">(changed)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Full History Table */}
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h3 className="text-lg font-semibold text-zinc-900">
                      Full History ({filteredAndSortedEntries.length} entries)
                    </h3>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="Search history..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="flex-1 sm:w-64 px-3 py-2 border border-zinc-300 rounded-md
                          bg-white text-zinc-900
                          focus:outline-none focus:ring-2 focus:ring-zinc-500"
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50">
                          <th
                            onClick={() => handleSort('timestamp')}
                            className="px-4 py-3 text-left text-sm font-semibold text-zinc-800
                              cursor-pointer hover:bg-zinc-100 select-none"
                          >
                            <div className="flex items-center">
                              Timestamp
                              {getSortIcon('timestamp')}
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort('kd')}
                            className="px-4 py-3 text-left text-sm font-semibold text-zinc-800
                              cursor-pointer hover:bg-zinc-100 select-none"
                          >
                            <div className="flex items-center">
                              KD
                              {getSortIcon('kd')}
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort('sv')}
                            className="px-4 py-3 text-left text-sm font-semibold text-zinc-800
                              cursor-pointer hover:bg-zinc-100 select-none"
                          >
                            <div className="flex items-center">
                              SV
                              {getSortIcon('sv')}
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort('intent')}
                            className="px-4 py-3 text-left text-sm font-semibold text-zinc-800
                              cursor-pointer hover:bg-zinc-100 select-none"
                          >
                            <div className="flex items-center">
                              Intent
                              {getSortIcon('intent')}
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort('dataSource')}
                            className="px-4 py-3 text-left text-sm font-semibold text-zinc-800
                              cursor-pointer hover:bg-zinc-100 select-none"
                          >
                            <div className="flex items-center">
                              Present In
                              {getSortIcon('dataSource')}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedEntries.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-8 text-center text-zinc-700"
                            >
                              {searchQuery ? 'No entries found matching your search' : 'No entries available'}
                            </td>
                          </tr>
                        ) : (
                          paginatedEntries.map((entry, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-zinc-100 hover:bg-zinc-50"
                            >
                              <td className="px-4 py-3 text-sm text-zinc-900">
                                {formatDateTime(entry.timestamp)}
                              </td>
                              <td className="px-4 py-3 text-sm text-zinc-900">{entry.kd}</td>
                              <td className="px-4 py-3 text-sm text-zinc-900">{entry.sv}</td>
                              <td className="px-4 py-3 text-sm text-zinc-900">{entry.intent}</td>
                              <td className="px-4 py-3 text-sm text-zinc-600">
                                {entry.dataSource || '-'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-zinc-700">Items per page:</label>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="px-2 py-1 border border-zinc-300 rounded-md bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 border border-zinc-300 rounded-md bg-white text-zinc-900
                            hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed
                            transition-colors"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-zinc-700">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 border border-zinc-300 rounded-md bg-white text-zinc-900
                            hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed
                            transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500">
                <p>Select a keyword from the left panel to view its change history</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8 text-zinc-700">Loading report data...</div>
        </div>
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}
