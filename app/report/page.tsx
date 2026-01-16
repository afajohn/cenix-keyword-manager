'use client';

import { useState, useEffect, useMemo } from 'react';
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
  [key: string]: unknown;
}

interface MatrixCell {
  kd: string | number;
  sv: string | number;
  intent: string;
  dataSources: string[];
}

// Helper functions for extracting field values
const getFieldValue = (record: Record, field: string): unknown => {
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
  const keyword = getFieldValue(record, 'keyword') || 
                  getFieldValue(record, 'Keyword') ||
                  record.keyword ||
                  record.Keyword ||
                  '';
  return String(keyword).trim();
};

const getKD = (record: Record): string | number => {
  const kd = getFieldValue(record, 'KD') || getFieldValue(record, 'kd');
  if (kd === null || kd === undefined || kd === '') return '-';
  return typeof kd === 'number' || typeof kd === 'string' ? kd : '-';
};

const getSV = (record: Record): string | number => {
  const sv = getFieldValue(record, 'SV') || getFieldValue(record, 'sv');
  if (sv === null || sv === undefined || sv === '') return '-';
  return typeof sv === 'number' || typeof sv === 'string' ? sv : '-';
};

const getIntent = (record: Record): string => {
  return String(getFieldValue(record, 'Intent') || getFieldValue(record, 'intent') || '-');
};

const formatDateOnly = (value: string | undefined): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const year = date.getFullYear();
  
  return `${month}-${day}-${year}`;
};


export default function ReportPage() {
  const searchParams = useSearchParams();
  const dataSourceParam = searchParams.get('dataSource');
  const [selectedDataSource, setSelectedDataSource] = useState<string | null>(dataSourceParam);
  
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'keyword', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Filter input states (what the user is typing/selecting)
  const [kdMinInput, setKdMinInput] = useState<string>('');
  const [kdMaxInput, setKdMaxInput] = useState<string>('');
  const [svMinInput, setSvMinInput] = useState<string>('');
  const [svMaxInput, setSvMaxInput] = useState<string>('');
  const [selectedIntentsInput, setSelectedIntentsInput] = useState<string[]>([]);
  const [selectedDataSourceInput, setSelectedDataSourceInput] = useState<string>('all');
  const [hasChangesInput, setHasChangesInput] = useState<boolean>(false);

  // Applied filter states (take effect only when Apply Filters is clicked)
  const [kdMinFilter, setKdMinFilter] = useState<string>('');
  const [kdMaxFilter, setKdMaxFilter] = useState<string>('');
  const [svMinFilter, setSvMinFilter] = useState<string>('');
  const [svMaxFilter, setSvMaxFilter] = useState<string>('');
  const [selectedIntentsFilter, setSelectedIntentsFilter] = useState<string[]>([]);
  const [selectedDataSourceFilter, setSelectedDataSourceFilter] = useState<string>('all');
  const [hasChangesFilter, setHasChangesFilter] = useState<boolean>(false);

  const intentOptions = ['Navigational', 'Informational', 'Commercial', 'Transactional'];

  // Get available data sources from records
  const availableDataSources = useMemo(() => {
    const sources = new Set<string>();
    records.forEach((record) => {
      if (record.dataSource && record.dataSource.trim() !== '') {
        sources.add(record.dataSource);
      }
    });
    return Array.from(sources).sort();
  }, [records]);

  useEffect(() => {
    const dataSource = searchParams.get('dataSource');
    setSelectedDataSource(dataSource);
    // If data source comes from URL, pre-select it in the filter
    if (dataSource) {
      setSelectedDataSourceInput(dataSource);
      setSelectedDataSourceFilter(dataSource);
    } else {
      // If no URL param, default to 'all'
      setSelectedDataSourceInput('all');
      setSelectedDataSourceFilter('all');
    }
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
      } else {
        console.error('Failed to fetch records:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setLoading(false);
    }
  };

  // Build matrix data structure: keyword -> date -> {kd, sv, intent, dataSources[]}
  const matrixData = useMemo(() => {
    const matrix = new Map<string, Map<string, MatrixCell>>();
    const allDates = new Set<string>();

    // Filter records by data source (from URL param or filter)
    let filteredRecords = records;
    
    // If data source filter is applied, use that; otherwise check URL param
    if (selectedDataSourceFilter && selectedDataSourceFilter !== 'all') {
      filteredRecords = records.filter((record) => record.dataSource === selectedDataSourceFilter);
    } else if (selectedDataSource && selectedDataSourceFilter === 'all') {
      // If URL param exists but filter is set to 'all', still respect URL param initially
      // This will be handled by the useEffect that syncs URL param to filter
    }

    filteredRecords.forEach((record) => {
      const keyword = getKeywordName(record);
      
      if (!keyword || keyword.trim() === '' || keyword === 'undefined' || keyword === 'null') {
        return;
      }

      const dateKey = formatDateOnly(record.createdAt);
      if (!dateKey) return;

      allDates.add(dateKey);

      if (!matrix.has(keyword)) {
        matrix.set(keyword, new Map());
      }

      const keywordMap = matrix.get(keyword)!;
      
      if (!keywordMap.has(dateKey)) {
        keywordMap.set(dateKey, {
          kd: getKD(record),
          sv: getSV(record),
          intent: getIntent(record),
          dataSources: [],
        });
      }

      const cell = keywordMap.get(dateKey)!;
      const dataSource = record.dataSource || '';
      
      // Aggregate data sources (comma-separated)
      if (dataSource && !cell.dataSources.includes(dataSource)) {
        cell.dataSources.push(dataSource);
      }

      // If multiple entries exist for same keyword+date, use the values from the last processed record
      // This will use the most recent entry's KD, SV, and Intent while aggregating all data sources
      cell.kd = getKD(record);
      cell.sv = getSV(record);
      cell.intent = getIntent(record);
    });

    // Sort dates in descending order (newest first)
    const sortedDates = Array.from(allDates).sort((a, b) => {
      const dateA = new Date(a.split('-').join('/')).getTime();
      const dateB = new Date(b.split('-').join('/')).getTime();
      return dateB - dateA; // Descending
    });

    return { matrix, dates: sortedDates };
  }, [records, selectedDataSource, selectedDataSourceFilter]);

  // Get all keywords and filter/search/sort them
  const processedKeywords = useMemo(() => {
    let keywords = Array.from(matrixData.matrix.keys());

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      keywords = keywords.filter((keyword) =>
        keyword.toLowerCase().includes(query)
      );
    }

    // Apply KD numeric range filter
    if (kdMinFilter.trim() || kdMaxFilter.trim()) {
      const min = kdMinFilter.trim() ? Number(kdMinFilter) : Number.NEGATIVE_INFINITY;
      const max = kdMaxFilter.trim() ? Number(kdMaxFilter) : Number.POSITIVE_INFINITY;
      keywords = keywords.filter((keyword) => {
        const keywordMap = matrixData.matrix.get(keyword);
        if (!keywordMap) return false;
        // Check if any date entry matches the KD range
        return Array.from(keywordMap.values()).some((cell) => {
          const kdValue = Number(cell.kd);
          if (Number.isNaN(kdValue)) return false;
          return kdValue >= min && kdValue <= max;
        });
      });
    }

    // Apply SV numeric range filter
    if (svMinFilter.trim() || svMaxFilter.trim()) {
      const min = svMinFilter.trim() ? Number(svMinFilter) : Number.NEGATIVE_INFINITY;
      const max = svMaxFilter.trim() ? Number(svMaxFilter) : Number.POSITIVE_INFINITY;
      keywords = keywords.filter((keyword) => {
        const keywordMap = matrixData.matrix.get(keyword);
        if (!keywordMap) return false;
        // Check if any date entry matches the SV range
        return Array.from(keywordMap.values()).some((cell) => {
          const svValue = Number(cell.sv);
          if (Number.isNaN(svValue)) return false;
          return svValue >= min && svValue <= max;
        });
      });
    }

    // Filter by selected intents (using contains matching)
    if (selectedIntentsFilter.length > 0) {
      keywords = keywords.filter((keyword) => {
        const keywordMap = matrixData.matrix.get(keyword);
        if (!keywordMap) return false;
        // Check if any date entry matches the intent filter
        return Array.from(keywordMap.values()).some((cell) => {
          const intentValue = String(cell.intent).toLowerCase();
          if (intentValue === '' || intentValue === '-') return false;
          // Check if any of the selected intents are contained in the cell's intent value
          return selectedIntentsFilter.some((selectedIntent) =>
            intentValue.includes(selectedIntent.toLowerCase()),
          );
        });
      });
    }

    // Filter by keywords that have changes in KD or SV
    if (hasChangesFilter) {
      keywords = keywords.filter((keyword) => {
        const keywordMap = matrixData.matrix.get(keyword);
        if (!keywordMap) return false;
        
        const cells = Array.from(keywordMap.values());
        if (cells.length < 2) return false; // Need at least 2 entries to have changes

        // Check for KD changes
        const kdValues = cells.map((cell) => Number(cell.kd)).filter((kd) => !Number.isNaN(kd));
        const hasKdChanges = kdValues.length >= 2 && new Set(kdValues).size > 1;

        // Check for SV changes
        const svValues = cells.map((cell) => Number(cell.sv)).filter((sv) => !Number.isNaN(sv));
        const hasSvChanges = svValues.length >= 2 && new Set(svValues).size > 1;

        // Return true if there are changes in KD or SV
        return hasKdChanges || hasSvChanges;
      });
    }

    // Apply sorting
    if (sortConfig) {
      keywords = [...keywords].sort((a, b) => {
        let aValue: string | number | undefined;
        let bValue: string | number | undefined;

        if (sortConfig.key === 'keyword') {
          aValue = a.toLowerCase();
          bValue = b.toLowerCase();
        } else if (sortConfig.key === 'entries') {
          // Sort by number of dates (entries)
          aValue = matrixData.matrix.get(a)?.size || 0;
          bValue = matrixData.matrix.get(b)?.size || 0;
        } else {
          // Sort by date+metric combination (e.g., "2024-01-01||kd", "2024-01-01||sv")
          const parts = sortConfig.key.split('||');
          if (parts.length !== 2) return 0;
          const [date, metric] = parts;
          const aCell = matrixData.matrix.get(a)?.get(date);
          const bCell = matrixData.matrix.get(b)?.get(date);

          if (!aCell && !bCell) return 0;
          if (!aCell) return 1; // Put nulls at end
          if (!bCell) return -1; // Put nulls at end

          switch (metric) {
            case 'kd':
              aValue = Number(aCell.kd) || 0;
              bValue = Number(bCell.kd) || 0;
              break;
            case 'sv':
              aValue = Number(aCell.sv) || 0;
              bValue = Number(bCell.sv) || 0;
              break;
            case 'intent':
              aValue = String(aCell.intent).toLowerCase();
              bValue = String(bCell.intent).toLowerCase();
              break;
            case 'source':
              aValue = aCell.dataSources.join(', ').toLowerCase();
              bValue = bCell.dataSources.join(', ').toLowerCase();
              break;
            default:
              return 0;
          }
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default: sort by keyword ascending
      keywords = [...keywords].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    }

    return keywords;
  }, [matrixData, searchQuery, sortConfig, kdMinFilter, kdMaxFilter, svMinFilter, svMaxFilter, selectedIntentsFilter, hasChangesFilter]);

  // Paginate keywords
  const paginatedKeywords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return processedKeywords.slice(startIndex, endIndex);
  }, [processedKeywords, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(processedKeywords.length / itemsPerPage);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === 'asc'
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig?.key !== columnKey) {
      return (
        <span className="ml-1 text-zinc-400">
          <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </span>
      );
    }
    return sortConfig.direction === 'asc' ? (
      <span className="ml-1 text-zinc-900">
        <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </span>
    ) : (
      <span className="ml-1 text-zinc-900">
        <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    );
  };

  const handleExportToCSV = () => {
    const exportData: Array<{
      Keyword: string;
      Date: string;
      KD: string | number;
      SV: string | number;
      Intent: string;
      'Data Sources': string;
    }> = [];

    // Determine which data sources to include in export
    const dataSourcesToExport = selectedDataSourceFilter && selectedDataSourceFilter !== 'all'
      ? [selectedDataSourceFilter]
      : null;

    processedKeywords.forEach((keyword) => {
      const keywordMap = matrixData.matrix.get(keyword);
      if (!keywordMap) return;

      // Sort dates descending
      const dates = Array.from(keywordMap.keys()).sort((a, b) => {
        const dateA = new Date(a.split('-').join('/')).getTime();
        const dateB = new Date(b.split('-').join('/')).getTime();
        return dateB - dateA;
      });

      dates.forEach((date) => {
        const cell = keywordMap.get(date);
        if (!cell) return;

        // Filter data sources if a filter is applied
        let dataSourcesToInclude = cell.dataSources;
        if (dataSourcesToExport) {
          dataSourcesToInclude = cell.dataSources.filter((ds) => 
            dataSourcesToExport.includes(ds)
          );
          // Skip this entry if no data sources match after filtering
          if (dataSourcesToInclude.length === 0) return;
        }

        exportData.push({
          Keyword: keyword,
          Date: date,
          KD: cell.kd,
          SV: cell.sv,
          Intent: cell.intent,
          'Data Sources': dataSourcesToInclude.join(', ') || '-',
        });
      });
    });

    // Convert to CSV format
    const headers = ['Keyword', 'Date', 'KD', 'SV', 'Intent', 'Data Sources'];
    const csvRows = [
      headers.join(','),
      ...exportData.map((row) =>
        [
          `"${String(row.Keyword).replace(/"/g, '""')}"`,
          `"${String(row.Date).replace(/"/g, '""')}"`,
          String(row.KD),
          String(row.SV),
          `"${String(row.Intent).replace(/"/g, '""')}"`,
          `"${String(row['Data Sources']).replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ];

    const csvContent = csvRows.join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    const filename = `keyword-report-matrix-${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6">
        <div className="w-full">
          <div className="text-center py-8 text-zinc-700">Loading report data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="w-full">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 bg-zinc-600 text-white rounded-md font-medium
                hover:bg-zinc-700 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Records
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">Keyword Change Report</h1>
              <p className="text-zinc-600 mt-1">
                Matrix view: Keywords vs Dates with KD, SV, Intent, and Data Sources
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
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search keywords..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md
                  bg-white text-zinc-900
                  focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <span>
                Showing {paginatedKeywords.length} of {processedKeywords.length} keywords
              </span>
              <span>•</span>
              <span>
                {matrixData.dates.length} date{matrixData.dates.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Custom Filters */}
          <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs sm:text-sm">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="font-medium text-zinc-800"> <strong>Filters:</strong> </span>
              
              <div className="flex items-center gap-2">
                <span className="text-zinc-700 font-medium">Data Source</span>
                <select
                  value={selectedDataSourceInput}
                  onChange={(e) => setSelectedDataSourceInput(e.target.value)}
                  className="min-w-[200px] px-2 py-1 border border-zinc-300 rounded-md bg-white text-zinc-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                  <option value="all">All Data Sources</option>
                  {availableDataSources.map((source) => (
                    <option key={source} value={source} className="text-xs sm:text-sm">
                      {source}
                    </option>
                  ))}
                </select>
              </div>


              <div className="flex items-center gap-1">
                <span className="text-zinc-700 font-medium">KD</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Min"
                  value={kdMinInput}
                  onChange={(e) => setKdMinInput(e.target.value)}
                  className="w-16 px-2 py-1 border border-zinc-300 rounded-md bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
                <span className="text-zinc-500">–</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Max"
                  value={kdMaxInput}
                  onChange={(e) => setKdMaxInput(e.target.value)}
                  className="w-16 px-2 py-1 border border-zinc-300 rounded-md bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-zinc-700 font-medium">SV</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Min"
                  value={svMinInput}
                  onChange={(e) => setSvMinInput(e.target.value)}
                  className="w-16 px-2 py-1 border border-zinc-300 rounded-md bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
                <span className="text-zinc-500">–</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Max"
                  value={svMaxInput}
                  onChange={(e) => setSvMaxInput(e.target.value)}
                  className="w-16 px-2 py-1 border border-zinc-300 rounded-md bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-zinc-700 font-medium">Intent</span>
                <div className="flex flex-wrap gap-2">
                  {intentOptions.map((intent) => {
                    const checked = selectedIntentsInput.includes(intent);
                    return (
                      <label
                        key={intent}
                        className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-white px-2 py-0.5 cursor-pointer hover:bg-zinc-100"
                      >
                        <input
                          type="checkbox"
                          className="h-3 w-3 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                          checked={checked}
                          onChange={() => {
                            setSelectedIntentsInput((prev) =>
                              prev.includes(intent)
                                ? prev.filter((value) => value !== intent)
                                : [...prev, intent],
                            );
                          }}
                        />
                        <span className="text-[11px] sm:text-xs text-zinc-800">{intent}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

         

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-white px-2 py-1 cursor-pointer hover:bg-zinc-100">
                  <input
                    type="checkbox"
                    className="h-3 w-3 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                    checked={hasChangesInput}
                    onChange={(e) => setHasChangesInput(e.target.checked)}
                  />
                  <span className="text-xs text-zinc-800">Has Changes in KD or SV</span>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    setKdMinInput('');
                    setKdMaxInput('');
                    setSvMinInput('');
                    setSvMaxInput('');
                    setSelectedIntentsInput([]);
                    setSelectedDataSourceInput('all');
                    setHasChangesInput(false);
                    setKdMinFilter('');
                    setKdMaxFilter('');
                    setSvMinFilter('');
                    setSvMaxFilter('');
                    setSelectedIntentsFilter([]);
                    setSelectedDataSourceFilter('all');
                    setHasChangesFilter(false);
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded-md border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setKdMinFilter(kdMinInput);
                    setKdMaxFilter(kdMaxInput);
                    setSvMinFilter(svMinInput);
                    setSvMaxFilter(svMaxInput);
                    setSelectedIntentsFilter(selectedIntentsInput);
                    setSelectedDataSourceFilter(selectedDataSourceInput);
                    setHasChangesFilter(hasChangesInput);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 rounded-md bg-zinc-900 text-white hover:bg-zinc-800"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
            <table className="border-collapse" style={{ width: 'max-content', minWidth: '100%', tableLayout: 'auto' }}>
              <thead>
                <tr className="bg-zinc-50 border-b-2 border-zinc-200" style={{ position: 'sticky', top: 0, zIndex: 15 }}>
                  {/* Keyword column header */}
                  <th
                    rowSpan={2}
                    onClick={() => handleSort('keyword')}
                    className="px-4 py-3 text-left text-sm font-semibold text-zinc-800
                      cursor-pointer hover:bg-zinc-100 select-none border-r-2 border-zinc-200
                      bg-zinc-50"
                    style={{ 
                      minWidth: '200px',
                      position: 'sticky',
                      left: 0,
                      zIndex: 30,
                      backgroundColor: '#fafafa'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      Keyword
                      {getSortIcon('keyword')}
                    </div>
                  </th>
                  {/* Date column headers with sub-columns */}
                  {matrixData.dates.map((date) => (
                    <th
                      key={date}
                      colSpan={4}
                      className="px-2 py-3 text-center text-xs font-semibold text-zinc-800 border-r border-zinc-200"
                      style={{ minWidth: '320px' }}
                    >
                      <div className="font-semibold">{date}</div>
                    </th>
                  ))}
                </tr>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  {/* Note: No empty cell needed here because keyword column has rowSpan={2} */}
                  {/* Sub-column headers for each date */}
                  {matrixData.dates.flatMap((date) => [
                    <th 
                      key={`${date}-kd`} 
                      onClick={() => handleSort(`${date}||kd`)}
                      className="px-2 py-2 text-xs font-medium text-zinc-700 border-r border-zinc-100
                        cursor-pointer hover:bg-zinc-100 select-none"
                      style={{ width: '80px', minWidth: '80px' }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        KD
                        {getSortIcon(`${date}||kd`)}
                      </div>
                    </th>,
                    <th 
                      key={`${date}-sv`} 
                      onClick={() => handleSort(`${date}||sv`)}
                      className="px-2 py-2 text-xs font-medium text-zinc-700 border-r border-zinc-100
                        cursor-pointer hover:bg-zinc-100 select-none"
                      style={{ width: '80px', minWidth: '80px' }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        SV
                        {getSortIcon(`${date}||sv`)}
                      </div>
                    </th>,
                    <th 
                      key={`${date}-intent`} 
                      onClick={() => handleSort(`${date}||intent`)}
                      className="px-2 py-2 text-xs font-medium text-zinc-700 border-r border-zinc-100
                        cursor-pointer hover:bg-zinc-100 select-none"
                      style={{ width: '80px', minWidth: '80px' }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Intent
                        {getSortIcon(`${date}||intent`)}
                      </div>
                    </th>,
                    <th 
                      key={`${date}-source`} 
                      onClick={() => handleSort(`${date}||source`)}
                      className="px-2 py-2 text-xs font-medium text-zinc-700 border-r border-zinc-200
                        cursor-pointer hover:bg-zinc-100 select-none"
                      style={{ width: '80px', minWidth: '80px' }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Present In
                        {getSortIcon(`${date}||source`)}
                      </div>
                    </th>,
                  ])}
                </tr>
              </thead>
              <tbody>
                {paginatedKeywords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={1 + matrixData.dates.length * 4}
                      className="px-4 py-8 text-center text-zinc-700"
                    >
                      {searchQuery ? 'No keywords found matching your search' : 'No keywords available'}
                    </td>
                  </tr>
                ) : (
                  paginatedKeywords.map((keyword) => {
                    const keywordMap = matrixData.matrix.get(keyword);
                    return (
                      <tr
                        key={keyword}
                        className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
                      >
                        {/* Keyword name (sticky) */}
                        <td 
                          className="px-4 py-3 text-sm font-medium text-zinc-900 border-r-2 border-zinc-200 bg-white"
                          style={{
                            position: 'sticky',
                            left: 0,
                            zIndex: 20,
                            backgroundColor: '#ffffff'
                          }}
                        >
                          {keyword}
                        </td>
                        {/* Data cells for each date */}
                        {matrixData.dates.flatMap((date) => {
                          const cell = keywordMap?.get(date);
                          if (!cell) {
                            return [
                              <td key={`${keyword}-${date}-kd`} className="px-2 py-3 text-sm text-zinc-400 text-center border-r border-zinc-100" style={{ width: '80px', minWidth: '80px' }}>-</td>,
                              <td key={`${keyword}-${date}-sv`} className="px-2 py-3 text-sm text-zinc-400 text-center border-r border-zinc-100" style={{ width: '80px', minWidth: '80px' }}>-</td>,
                              <td key={`${keyword}-${date}-intent`} className="px-2 py-3 text-sm text-zinc-400 text-center border-r border-zinc-100" style={{ width: '80px', minWidth: '80px' }}>-</td>,
                              <td key={`${keyword}-${date}-source`} className="px-2 py-3 text-sm text-zinc-400 text-center border-r border-zinc-200" style={{ width: '80px', minWidth: '80px' }}>-</td>,
                            ];
                          }
                          return [
                            <td key={`${keyword}-${date}-kd`} className="px-2 py-3 text-sm text-zinc-900 text-center border-r border-zinc-100" style={{ width: '80px', minWidth: '80px' }}>
                              {cell.kd}
                            </td>,
                            <td key={`${keyword}-${date}-sv`} className="px-2 py-3 text-sm text-zinc-900 text-center border-r border-zinc-100" style={{ width: '80px', minWidth: '80px' }}>
                              {cell.sv}
                            </td>,
                            <td key={`${keyword}-${date}-intent`} className="px-2 py-3 text-sm text-zinc-900 text-center border-r border-zinc-100" style={{ width: '80px', minWidth: '80px' }}>
                              {cell.intent}
                            </td>,
                            <td key={`${keyword}-${date}-source`} className="px-2 py-3 text-sm text-zinc-600 text-center border-r border-zinc-200" style={{ width: '80px', minWidth: '80px' }} title={cell.dataSources.join(', ')}>
                              {cell.dataSources.length > 0 ? (
                                <span className="max-w-xs truncate inline-block">
                                  {cell.dataSources.join(', ')}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>,
                          ];
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
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
  );
}
