'use client';

import { useState, useEffect } from 'react';

interface CSVUploadProps {
  onUploadSuccess: () => void;
}

const CSVUpload = ({ onUploadSuccess }: CSVUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [existingDataSources, setExistingDataSources] = useState<string[]>([]);
  const [selectedDataSourceOption, setSelectedDataSourceOption] = useState<string>('');
  const [newDataSource, setNewDataSource] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDataSources = async () => {
    try {
      const response = await fetch('/api/records');
      const data = await response.json();

      if (data.success) {
        const sources = new Set<string>();
        data.data.forEach((record: { dataSource?: string }) => {
          if (record.dataSource) {
            sources.add(record.dataSource);
          }
        });
        setExistingDataSources(Array.from(sources).sort());
      }
    } catch (error) {
      console.error('Failed to fetch data sources:', error);
    }
  };

  useEffect(() => {
    fetchDataSources();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setMessage(null);
    } else {
      setMessage({ type: 'error', text: 'Please select a valid CSV file' });
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file first' });
      return;
    }

    // Determine the data source value
    let dataSourceValue = '';
    if (selectedDataSourceOption === 'new') {
      dataSourceValue = newDataSource.trim();
      if (!dataSourceValue) {
        setMessage({ type: 'error', text: 'Please enter a new data source name' });
        return;
      }
    } else if (selectedDataSourceOption) {
      dataSourceValue = selectedDataSourceOption;
    } else {
      setMessage({ type: 'error', text: 'Please select or create a data source' });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dataSource', dataSourceValue);

      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: data.message || 'CSV uploaded successfully',
        });
        setFile(null);
        setSelectedDataSourceOption('');
        setNewDataSource('');
        // Refresh data sources list in case a new one was added
        await fetchDataSources();
        onUploadSuccess();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to upload CSV',
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'An error occurred while uploading',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <div className="flex-1 min-w-[220px]">
            <label
              htmlFor="data-source-select"
              className="sr-only"
            >
              Data Source
            </label>
            <select
              id="data-source-select"
              value={selectedDataSourceOption}
              onChange={(e) => {
                setSelectedDataSourceOption(e.target.value);
                if (e.target.value !== 'new') {
                  setNewDataSource('');
                }
                setMessage(null);
              }}
              className="w-full px-3 py-2 border border-zinc-300 rounded-md
                bg-white text-zinc-900 text-sm
                focus:outline-none focus:ring-2 focus:ring-zinc-500
                disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isUploading}
              required
            >
              <option value="">Select or create data source...</option>
              {existingDataSources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
              <option value="new">➕ Create new data source...</option>
            </select>
          </div>
          {selectedDataSourceOption === 'new' && (
            <div className="flex-1 min-w-[220px]">
              <label
                htmlFor="new-data-source"
                className="sr-only"
              >
                New Data Source Name
              </label>
              <input
                id="new-data-source"
                type="text"
                value={newDataSource}
                onChange={(e) => {
                  setNewDataSource(e.target.value);
                  setMessage(null);
                }}
                placeholder="Enter new data source name"
                className="w-full px-3 py-2 border border-zinc-300 rounded-md
                  bg-white text-zinc-900 text-sm
                  focus:outline-none focus:ring-2 focus:ring-zinc-500
                  disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUploading}
                required
              />
            </div>
          )}
          <div className="flex-1 min-w-[220px]">
            <label
              htmlFor="csv-file"
              className="sr-only"
            >
              CSV File
            </label>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-zinc-600
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-zinc-100 file:text-zinc-700
                hover:file:bg-zinc-200
                cursor-pointer"
              disabled={isUploading}
            />
          </div>
          <div className="md:w-auto">
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full md:w-auto px-4 py-2 bg-zinc-900 text-white rounded-md font-medium
                hover:bg-zinc-800
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors text-sm"
            >
              {isUploading ? 'Uploading...' : 'Upload CSV'}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {file && (
            <div className="text-xs text-zinc-700">
              Selected file: <span className="font-medium">{file.name}</span>
            </div>
          )}
          {message && (
            <div
              className={`mt-1 p-2 rounded-md text-xs ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSVUpload;
