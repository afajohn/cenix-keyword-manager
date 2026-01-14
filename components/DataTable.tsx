'use client';

import { useState, useEffect, useMemo } from 'react';

interface Record {
  id: string;
  dataSource?: string;
  [key: string]: any;
}

interface DataTableProps {
  selectedDataSource: string | null;
  selectedWebsiteName?: string | null;
}

const DataTable = ({ selectedDataSource, selectedWebsiteName }: DataTableProps) => {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkField, setBulkField] = useState<'Keyword' | 'KD' | 'SV' | 'Intent' | 'URL' | 'Website Name' | 'Website URL Path' | ''>('');
  const [bulkValue, setBulkValue] = useState('');
  const [bulkEditData, setBulkEditData] = useState<{ [key: string]: Record }>({});

  // Filter input states (what the user is typing/selecting)
  const [kdMinInput, setKdMinInput] = useState<string>('');
  const [kdMaxInput, setKdMaxInput] = useState<string>('');
  const [svMinInput, setSvMinInput] = useState<string>('');
  const [svMaxInput, setSvMaxInput] = useState<string>('');
  const [selectedIntentsInput, setSelectedIntentsInput] = useState<string[]>([]);
  const [assignedToWebsiteInput, setAssignedToWebsiteInput] = useState<boolean>(false);

  // Applied filter states (take effect only when Apply Filters is clicked)
  const [kdMinFilter, setKdMinFilter] = useState<string>('');
  const [kdMaxFilter, setKdMaxFilter] = useState<string>('');
  const [svMinFilter, setSvMinFilter] = useState<string>('');
  const [svMaxFilter, setSvMaxFilter] = useState<string>('');
  const [selectedIntentsFilter, setSelectedIntentsFilter] = useState<string[]>([]);
  const [assignedToWebsiteFilter, setAssignedToWebsiteFilter] = useState<boolean>(false);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/records');
      const data = await response.json();

      if (data.success) {
        setRecords(data.data);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to fetch records' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedDataSource]);

  // Initialize bulk edit data when rows are selected on website page
  useEffect(() => {
    if (selectedWebsiteName && selectedIds.length > 0) {
      const newBulkEditData: { [key: string]: Record } = {};
      selectedIds.forEach((id) => {
        const record = records.find((r) => r.id === id);
        if (record) {
          newBulkEditData[id] = { ...record };
        }
      });
      setBulkEditData((prev) => {
        const updated = { ...prev };
        selectedIds.forEach((id) => {
          if (!updated[id] && newBulkEditData[id]) {
            updated[id] = newBulkEditData[id];
          }
        });
        // Remove data for unselected IDs
        Object.keys(updated).forEach((id) => {
          if (!selectedIds.includes(id)) {
            delete updated[id];
          }
        });
        return updated;
      });
    } else {
      setBulkEditData({});
    }
  }, [selectedIds, selectedWebsiteName, records]);

  const getFieldKey = (record: Record, column: string): string => {
    const columnLower = column.toLowerCase();

    // Map display column names to expected underlying field name (in lowercase)
    let targetLower = columnLower;
    if (columnLower === 'timestamp') {
      targetLower = 'createdat';
    }
    if (columnLower === 'website name') {
      targetLower = 'websitename';
    }

    const keys = Object.keys(record);

    // Case-insensitive match; also ignore spaces in keys (defensive)
    const found = keys.find(
      (key) => key.toLowerCase().replace(/\s+/g, '') === targetLower,
    );

    if (found) {
      return found;
    }

    // Fallbacks for known columns
    if (columnLower === 'timestamp') {
      return 'createdAt';
    }
    if (columnLower === 'website name') {
      // Try common variations
      return record.websiteName ? 'websiteName' : 
             record['Website Name'] ? 'Website Name' : 
             record['websiteName'] ? 'websiteName' : 'websiteName';
    }

    return column;
  };

  const getCellValue = (record: Record, column: string) => {
    const fieldKey = getFieldKey(record, column);

    if (column === 'Timestamp') {
      return formatDateTime(record[fieldKey]);
    }

    // For Website Name, try multiple field name variations
    if (column === 'Website Name') {
      const value = record[fieldKey] || record.websiteName || record['Website Name'] || record['websiteName'];
      if (value === null || value === undefined || value === '') {
        return '-';
      }
      return String(value);
    }

    const value = record[fieldKey];
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return String(value);
  };

  const filteredAndSortedRecords = useMemo(() => {
    let filtered = records;

    // Filter by data source
    if (selectedDataSource) {
      filtered = filtered.filter((record) => record.dataSource === selectedDataSource);
    }

    // Filter by website name
    if (selectedWebsiteName) {
      filtered = filtered.filter((record) => {
        // Case-insensitive matching for website name
        const recordWebsiteName = record.websiteName || record['Website Name'] || record['websiteName'];
        return recordWebsiteName && String(recordWebsiteName).trim() === selectedWebsiteName.trim();
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((record) => {
        return Object.values(record).some((value) => {
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(query);
        });
      });
    }

    // Filter by KD numeric range
    if (kdMinFilter.trim() || kdMaxFilter.trim()) {
      const min = kdMinFilter.trim() ? Number(kdMinFilter) : Number.NEGATIVE_INFINITY;
      const max = kdMaxFilter.trim() ? Number(kdMaxFilter) : Number.POSITIVE_INFINITY;
      filtered = filtered.filter((record) => {
        const key = getFieldKey(record, 'KD');
        const value = Number(record[key]);
        if (Number.isNaN(value)) {
          return false;
        }
        return value >= min && value <= max;
      });
    }

    // Filter by SV numeric range
    if (svMinFilter.trim() || svMaxFilter.trim()) {
      const min = svMinFilter.trim() ? Number(svMinFilter) : Number.NEGATIVE_INFINITY;
      const max = svMaxFilter.trim() ? Number(svMaxFilter) : Number.POSITIVE_INFINITY;
      filtered = filtered.filter((record) => {
        const key = getFieldKey(record, 'SV');
        const value = Number(record[key]);
        if (Number.isNaN(value)) {
          return false;
        }
        return value >= min && value <= max;
      });
    }

    // Filter by selected intents (using contains matching)
    if (selectedIntentsFilter.length > 0) {
      filtered = filtered.filter((record) => {
        const key = getFieldKey(record, 'Intent');
        const value = record[key];
        if (value === null || value === undefined || String(value).trim() === '') {
          return false;
        }
        const intentValue = String(value).toLowerCase();
        // Check if any of the selected intents are contained in the record's intent value
        return selectedIntentsFilter.some((selectedIntent) =>
          intentValue.includes(selectedIntent.toLowerCase()),
        );
      });
    }

    // Filter by website/URL assignment
    if (assignedToWebsiteFilter) {
      filtered = filtered.filter((record) => {
        const websiteName = record.websiteName || record['Website Name'] || record['websiteName'];
        const websiteUrlPath = record.websiteUrlPath || record['Website URL Path'] || record['websiteUrlPath'];
        const url = record.url || record['URL'] || record['url'];
        // Keyword is assigned if it has a website name, website URL path, or URL field
        return (websiteName && String(websiteName).trim() !== '') ||
               (websiteUrlPath && String(websiteUrlPath).trim() !== '') ||
               (url && String(url).trim() !== '');
      });
    }

    // Sort records
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const column = sortConfig.key;
        const fieldKeyA = getFieldKey(a, column);
        const fieldKeyB = getFieldKey(b, column);

        const aValue = a[fieldKeyA];
        const bValue = b[fieldKeyB];

        // Treat empty/undefined as smallest
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;

        const aNum = Number(aValue);
        const bNum = Number(bValue);
        const aIsNum = !Number.isNaN(aNum);
        const bIsNum = !Number.isNaN(bNum);

        if (aIsNum && bIsNum) {
          if (sortConfig.direction === 'asc') {
            return aNum - bNum;
          }
          return bNum - aNum;
        }

        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();

        if (sortConfig.direction === 'asc') {
          return aStr > bStr ? 1 : aStr < bStr ? -1 : 0;
        }
        return aStr < bStr ? 1 : aStr > bStr ? -1 : 0;
      });
    }

    return filtered;
  }, [
    records,
    selectedDataSource,
    selectedWebsiteName,
    searchQuery,
    sortConfig,
    kdMinFilter,
    kdMaxFilter,
    svMinFilter,
    svMaxFilter,
    selectedIntentsFilter,
    assignedToWebsiteFilter,
  ]);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedRecords.slice(startIndex, endIndex);
  }, [filteredAndSortedRecords, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedRecords.length / itemsPerPage);

  const intentOptions = ['Navigational', 'Informational', 'Commercial', 'Transactional'];

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

  const handleCancelAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to cancel website assignment for this keyword? The keyword will be removed from this website page but will still be available on the main page.')) {
      return;
    }

    try {
      // Only clear website assignment fields, preserve all other data
      const response = await fetch(`/api/records/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          websiteName: '', 
          websiteUrlPath: '',
          // Also clear url field if it's related to website assignment (optional, keeping it for now)
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Website assignment canceled successfully. The keyword has been removed from this website page but is still available on the main page.' });
        // Clear selections to avoid confusion
        setSelectedIds([]);
        fetchRecords();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to cancel assignment' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      const response = await fetch(`/api/records/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Record deleted successfully' });
        fetchRecords();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete record' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    }
  };

  const handleEdit = (record: Record) => {
    setEditingId(record.id);
    setEditData({ ...record });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleSaveEdit = async () => {
    if (!editData || !editingId) return;

    try {
      const { id, createdAt, updatedAt, ...updateData } = editData;
      const response = await fetch(`/api/records/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Record updated successfully' });
        setEditingId(null);
        setEditData(null);
        fetchRecords();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update record' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
  };

  const handleBulkFieldChange = (recordId: string, field: string, value: any) => {
    setBulkEditData((prev) => ({
      ...prev,
      [recordId]: {
        ...prev[recordId],
        [field]: value,
      },
    }));
  };

  const handleBulkSave = async () => {
    if (selectedIds.length === 0 || Object.keys(bulkEditData).length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one record to edit.' });
      return;
    }

    try {
      const updatePromises = selectedIds.map((id) => {
        const editRecord = bulkEditData[id];
        if (!editRecord) return Promise.resolve();

        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...updateData } = editRecord;
        return fetch(`/api/records/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
      });

      await Promise.all(updatePromises);
      setMessage({
        type: 'success',
        text: `Updated ${selectedIds.length} record(s).`,
      });
      setBulkEditData({});
      setSelectedIds([]);
      fetchRecords();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.message || 'Failed to update selected records.',
      });
    }
  };

  const handleBulkCancel = () => {
    setBulkEditData({});
    setSelectedIds([]);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id],
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === paginatedRecords.length) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(paginatedRecords.map((record) => record.id));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one record to delete.' });
      return;
    }

    if (!confirm(`Delete ${selectedIds.length} selected record(s)? This cannot be undone.`)) {
      return;
    }

    try {
      const deletePromises = selectedIds.map((id) =>
        fetch(`/api/records/${id}`, {
          method: 'DELETE',
        }),
      );

      await Promise.all(deletePromises);
      setMessage({ type: 'success', text: 'Selected records deleted successfully.' });
      setSelectedIds([]);
      fetchRecords();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.message || 'Failed to delete selected records.',
      });
    }
  };

  const handleBulkEdit = async () => {
    if (selectedIds.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one record to edit.' });
      return;
    }

    if (!bulkField) {
      setMessage({ type: 'error', text: 'Please choose a field to edit.' });
      return;
    }

    // Allow empty values for website fields to clear assignments
    const websiteFields = ['Website Name', 'Website URL Path'];
    const isEmptyForWebsiteField = websiteFields.includes(bulkField) && !bulkValue.trim();

    if (!bulkValue.trim() && !isEmptyForWebsiteField) {
      setMessage({ type: 'error', text: 'Please provide a value for bulk edit.' });
      return;
    }

    const fieldKeyMap: { [key: string]: string } = {
      Keyword: 'Keyword',
      KD: 'KD',
      SV: 'SV',
      Intent: 'Intent',
      URL: 'url',
      'Website Name': 'websiteName',
      'Website URL Path': 'websiteUrlPath',
    };

    const fieldKey = fieldKeyMap[bulkField];

    try {
      const updatePromises = selectedIds.map((id) =>
        fetch(`/api/records/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ [fieldKey]: bulkValue.trim() }),
        }),
      );

      await Promise.all(updatePromises);
      setMessage({
        type: 'success',
        text: `Updated ${selectedIds.length} record(s).`,
      });
      setBulkValue('');
      setBulkField('');
      setSelectedIds([]);
      fetchRecords();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.message || 'Failed to update selected records.',
      });
    }
  };

  const handleBulkCancelAssignment = async () => {
    if (selectedIds.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one record to cancel assignment.' });
      return;
    }

    if (!confirm(`Are you sure you want to cancel website assignment for ${selectedIds.length} record(s)? The keywords will be removed from this website page but will still be available on the main page.`)) {
      return;
    }

    try {
      // Only clear website assignment fields, preserve all other data
      const updatePromises = selectedIds.map((id) =>
        fetch(`/api/records/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            websiteName: '', 
            websiteUrlPath: '',
            // Only clearing website assignment fields, all other data remains intact
          }),
        }),
      );

      const results = await Promise.all(updatePromises);
      
      // Check if all updates succeeded
      const allSuccessful = results.every((response) => response.ok);
      
      if (allSuccessful) {
        setMessage({
          type: 'success',
          text: `Canceled assignment for ${selectedIds.length} record(s). The keywords have been removed from this website page but are still available on the main page.`,
        });
        setSelectedIds([]);
        setBulkEditData({});
        fetchRecords();
      } else {
        setMessage({
          type: 'error',
          text: 'Some records failed to update. Please try again.',
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.message || 'Failed to cancel assignment.',
      });
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDataSource, selectedWebsiteName]);

  // Get website info for display
  const websiteInfo = useMemo(() => {
    if (!selectedWebsiteName) return null;
    const record = records.find((r) => {
      const recordWebsiteName = r.websiteName || r['Website Name'] || r['websiteName'];
      return recordWebsiteName && String(recordWebsiteName).trim() === selectedWebsiteName.trim();
    });
    if (record) {
      return {
        name: selectedWebsiteName,
        urlPath: record.websiteUrlPath || record['Website URL Path'] || record['websiteUrlPath'] || '',
      };
    }
    return { name: selectedWebsiteName, urlPath: '' };
  }, [selectedWebsiteName, records]);

  // Dynamic columns based on filter state
  const columns = useMemo(() => {
    const baseColumns = ['Timestamp', 'Keyword', 'KD', 'SV', 'Intent', 'URL'];
    if (assignedToWebsiteFilter && !selectedWebsiteName) {
      // When "Assigned to Website/URL" filter is applied on main page, add Website Name
      return ['Timestamp', 'Keyword', 'KD', 'SV', 'Intent', 'Website Name', 'URL'];
    }
    return baseColumns;
  }, [assignedToWebsiteFilter, selectedWebsiteName]);

  if (loading) {
    return (
      <div className="flex-1 p-6 bg-white rounded-lg border border-zinc-200">
        <div className="text-center py-8 text-zinc-700">Loading records...</div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex-1 p-6 bg-white rounded-lg border border-zinc-200">
        <div className="text-center py-8 text-zinc-700">
          No records found. Upload a CSV file to get started.
        </div>
      </div>
    );
  }

  const formatDateTime = (value: unknown) => {
    if (!value) {
      return '-';
    }

    const date = new Date(value as string | number | Date);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) {
      hours = 12;
    }
    const hoursStr = pad(hours);

    // MM-DD-YYYY hh:mm:ss AM/PM (12-hour format)
    return `${month}-${day}-${year} ${hoursStr}:${minutes}:${seconds} ${ampm}`;
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

  return (
    <div className="flex-1 p-6 bg-white rounded-lg border border-zinc-200 shadow-sm">
      <div className="flex flex-col gap-3 mb-4">
        {websiteInfo && (
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-md">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold text-zinc-900">
                Website: {websiteInfo.name}
              </h3>
              {websiteInfo.urlPath && (
                <p className="text-sm text-zinc-700">
                  URL Path: <span className="font-mono font-medium">{websiteInfo.urlPath}</span>
                </p>
              )}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-zinc-900">
                Records ({filteredAndSortedRecords.length})
              </h2>
              <a
                href={`/report${selectedDataSource ? `?dataSource=${encodeURIComponent(selectedDataSource)}` : ''}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium
                  hover:bg-blue-700 transition-colors text-sm"
              >
                Generate Report
              </a>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 sm:w-64 px-3 py-2 border border-zinc-300 rounded-md
                  bg-white text-zinc-900
                  focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
              <button
                onClick={fetchRecords}
                className="px-4 py-2 bg-green-100 text-zinc-800 rounded-md font-medium
                  hover:bg-green-300 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs sm:text-sm">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="font-medium text-zinc-800">Filters</span>

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
                    checked={assignedToWebsiteInput}
                    onChange={(e) => setAssignedToWebsiteInput(e.target.checked)}
                  />
                  <span className="text-xs text-zinc-800">Assigned to Website/URL</span>
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
                    setAssignedToWebsiteInput(false);
                    setKdMinFilter('');
                    setKdMaxFilter('');
                    setSvMinFilter('');
                    setSvMaxFilter('');
                    setSelectedIntentsFilter([]);
                    setAssignedToWebsiteFilter(false);
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
                    setAssignedToWebsiteFilter(assignedToWebsiteInput);
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

        {selectedIds.length > 0 && (
          <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-zinc-800">
                {selectedIds.length} record{selectedIds.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {selectedWebsiteName ? (
                  <>
                    <button
                      onClick={handleBulkSave}
                      className="px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      Bulk Save
                    </button>
                    <button
                      onClick={handleBulkCancel}
                      className="px-3 py-1 rounded-md bg-zinc-600 text-white hover:bg-zinc-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkCancelAssignment}
                      className="px-3 py-1 rounded-md bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                    >
                      Cancel Assignment
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Delete selected
                    </button>
                  </>
                ) : (
                  <>
                    <select
                      value={bulkField}
                      onChange={(e) => setBulkField(e.target.value as 'Keyword' | 'KD' | 'SV' | 'Intent' | 'URL' | 'Website Name' | 'Website URL Path' | '')}
                      className="px-2 py-1 border border-zinc-300 rounded-md bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    >
                      <option value="">Field to edit</option>
                      <option value="Keyword">Keyword</option>
                      <option value="KD">KD</option>
                      <option value="SV">SV</option>
                      <option value="Intent">Intent</option>
                      <option value="URL">URL</option>
                      <option value="Website Name">Website Name</option>
                      <option value="Website URL Path">Website URL Path</option>
                    </select>
                    <input
                      type="text"
                      placeholder="New value"
                      value={bulkValue}
                      onChange={(e) => setBulkValue(e.target.value)}
                      className="px-2 py-1 border border-zinc-300 rounded-md bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    />
                    <button
                      onClick={handleBulkEdit}
                      className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      Apply edit
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Delete selected
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-md text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-800">
                <input
                  type="checkbox"
                  aria-label="Select all rows on this page"
                  checked={selectedIds.length > 0 && selectedIds.length === paginatedRecords.length}
                  onChange={handleToggleSelectAll}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                />
              </th>
              {columns.map((column) => (
                <th
                  key={column}
                  onClick={() => handleSort(column)}
                  className="px-4 py-3 text-left text-sm font-semibold text-zinc-800
                    cursor-pointer hover:bg-zinc-50 select-none"
                >
                  <div className="flex items-center">
                    {column}
                    {getSortIcon(column)}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-800">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-8 text-center text-zinc-700"
                >
                  No records found matching your criteria
                </td>
              </tr>
            ) : (
              paginatedRecords.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-yellow-50"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select row"
                      checked={selectedIds.includes(record.id)}
                      onChange={() => handleToggleSelect(record.id)}
                      className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                    />
                  </td>
                  {(editingId === record.id && editData) ||
                  (selectedWebsiteName && selectedIds.includes(record.id) && bulkEditData[record.id]) ? (
                    <>
                      {columns.map((column) => {
                        const currentEditData = editingId === record.id && editData 
                          ? editData 
                          : bulkEditData[record.id];
                        const fieldKey = getFieldKey(currentEditData, column);
                        return (
                          <td key={column} className="px-4 py-3">
                            {column === 'Timestamp' ? (
                              <span className="text-sm text-black">
                                {formatDateTime(currentEditData[fieldKey])}
                              </span>
                            ) : (
                              <input
                                type="text"
                                value={currentEditData[fieldKey] || ''}
                                onChange={(e) => {
                                  if (editingId === record.id && editData) {
                                    handleFieldChange(fieldKey, e.target.value);
                                  } else {
                                    handleBulkFieldChange(record.id, fieldKey, e.target.value);
                                  }
                                }}
                                className="w-full px-2 py-1 text-sm border border-zinc-300 rounded
                                  bg-white text-zinc-900"
                              />
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3">
                        {editingId === record.id && editData ? (
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 text-sm bg-zinc-300 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-400 dark:hover:bg-zinc-600 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-500">Bulk editing</span>
                        )}
                      </td>
                    </>
                  ) : (
                    <>
                      {columns.map((column) => (
                        <td key={column} className="px-4 py-3 text-sm text-black">
                          {getCellValue(record, column)}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(record)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            Edit
                          </button>
                          {selectedWebsiteName && (
                            <button
                              onClick={() => handleCancelAssignment(record.id)}
                              className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                            >
                              Cancel Assignment
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-700 dark:text-zinc-300">Items per page:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded-md
                bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50
                focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400"
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
              className="px-3 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded-md
                bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300
                hover:bg-zinc-100 dark:hover:bg-zinc-700
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded-md
                bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300
                hover:bg-zinc-100 dark:hover:bg-zinc-700
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
