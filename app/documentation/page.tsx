'use client';

import { useState } from 'react';
import Link from 'next/link';

type Section = {
  id: string;
  title: string;
  icon: string;
};

const sections: Section[] = [
  { id: 'getting-started', title: 'Getting Started', icon: '🚀' },
  { id: 'features', title: 'Feature List', icon: '✨' },
  { id: 'dashboard', title: 'Main Dashboard', icon: '📊' },
  { id: 'csv-upload', title: 'CSV Upload', icon: '📤' },
  { id: 'data-table', title: 'Data Table Features', icon: '📋' },
  { id: 'filtering', title: 'Advanced Filtering', icon: '🔍' },
  { id: 'bulk-operations', title: 'Bulk Operations', icon: '⚡' },
  { id: 'website-assignment', title: 'Website Assignment', icon: '🌐' },
  { id: 'reports', title: 'Reports & Matrix', icon: '📈' },
  { id: 'export', title: 'Export to CSV', icon: '💾' },
  { id: 'tips', title: 'Tips & Best Practices', icon: '💡' },
];

type Feature = {
  name: string;
  category: string;
  description: string;
  purpose: string;
  icon: string;
};

const features: Feature[] = [
  // Data Management
  {
    name: 'CSV Import',
    category: 'Data Management',
    description: 'Upload and import keyword data from CSV files exported from SEMrush or other SEO tools.',
    purpose: 'Automate bulk data entry and eliminate manual copy-pasting of thousands of keywords.',
    icon: '📤',
  },
  {
    name: 'Data Source Management',
    category: 'Data Management',
    description: 'Organize imports by naming data sources and optionally appending to existing sources.',
    purpose: 'Track when and where data was imported, enabling historical comparisons and organized data management.',
    icon: '📁',
  },
  {
    name: 'Auto Column Detection',
    category: 'Data Management',
    description: 'Automatically detects and maps common column names (Keyword, KD, SV, Intent) regardless of case or format.',
    purpose: 'Reduce setup time and ensure data is correctly imported without manual field mapping.',
    icon: '🔄',
  },
  // Data Table
  {
    name: 'Sortable Columns',
    category: 'Data Table',
    description: 'Click any column header to sort data ascending or descending.',
    purpose: 'Quickly find high-value keywords by sorting by KD, SV, or any other metric.',
    icon: '↕️',
  },
  {
    name: 'Real-time Search',
    category: 'Data Table',
    description: 'Instantly filter keywords as you type in the search bar across all fields.',
    purpose: 'Find specific keywords quickly without scrolling through large datasets.',
    icon: '🔎',
  },
  {
    name: 'Pagination',
    category: 'Data Table',
    description: 'Navigate through large datasets with configurable items per page (10, 25, 50, 100).',
    purpose: 'Maintain fast performance while browsing thousands of keywords.',
    icon: '📄',
  },
  {
    name: 'Inline Editing',
    category: 'Data Table',
    description: 'Edit keyword fields directly in the table without leaving the page.',
    purpose: 'Make quick corrections or updates without disrupting workflow.',
    icon: '✏️',
  },
  // Filtering
  {
    name: 'KD Range Filter',
    category: 'Filtering',
    description: 'Filter keywords by minimum and maximum Keyword Difficulty values (0-100).',
    purpose: 'Identify low-competition keywords or find specific difficulty ranges for content planning.',
    icon: '📊',
  },
  {
    name: 'SV Range Filter',
    category: 'Filtering',
    description: 'Filter keywords by minimum and maximum Search Volume values.',
    purpose: 'Focus on high-traffic keywords or find niche opportunities with specific volume ranges.',
    icon: '📈',
  },
  {
    name: 'Intent Filter',
    category: 'Filtering',
    description: 'Filter by search intent types: Informational, Commercial, Navigational, Transactional.',
    purpose: 'Match keywords to content types and buyer journey stages for strategic content planning.',
    icon: '🎯',
  },
  {
    name: 'Assignment Status Filter',
    category: 'Filtering',
    description: 'Filter to show only assigned or unassigned keywords.',
    purpose: 'Quickly identify available keywords for new projects or review already distributed keywords.',
    icon: '✅',
  },
  {
    name: 'Data Source Filter',
    category: 'Filtering',
    description: 'Filter keywords by their data source origin.',
    purpose: 'Focus on specific import batches or compare data across different sources.',
    icon: '📁',
  },
  // Bulk Operations
  {
    name: 'Bulk Selection',
    category: 'Bulk Operations',
    description: 'Select multiple keywords using checkboxes for batch operations.',
    purpose: 'Perform actions on many keywords at once instead of one by one.',
    icon: '☑️',
  },
  {
    name: 'Bulk Edit',
    category: 'Bulk Operations',
    description: 'Update fields for multiple selected keywords simultaneously.',
    purpose: 'Mass update keyword attributes like intent or other custom fields.',
    icon: '✏️',
  },
  {
    name: 'Bulk Delete',
    category: 'Bulk Operations',
    description: 'Remove multiple selected keywords from the database.',
    purpose: 'Clean up outdated or irrelevant keywords efficiently.',
    icon: '🗑️',
  },
  {
    name: 'Bulk Assign',
    category: 'Bulk Operations',
    description: 'Assign multiple keywords to a website in one operation.',
    purpose: 'Distribute large batches of keywords to projects quickly.',
    icon: '🌐',
  },
  {
    name: 'Bulk Cancel Assignment',
    category: 'Bulk Operations',
    description: 'Remove website assignments from multiple keywords at once.',
    purpose: 'Quickly free up keywords from cancelled or completed projects.',
    icon: '❌',
  },
  // Website Assignment
  {
    name: 'Single Keyword Assignment',
    category: 'Website Assignment',
    description: 'Assign individual keywords to one or more websites with optional URL paths.',
    purpose: 'Track keyword distribution across different projects and prevent duplication.',
    icon: '🔗',
  },
  {
    name: 'Multi-Website Support',
    category: 'Website Assignment',
    description: 'Keywords can be assigned to multiple websites, displayed as comma-separated values.',
    purpose: 'Share keywords across related projects while maintaining clear tracking.',
    icon: '🌐',
  },
  {
    name: 'Website Navigation',
    category: 'Website Assignment',
    description: 'Dropdown navigation to filter and view keywords by assigned website.',
    purpose: 'Quickly switch between website contexts to manage keyword distribution.',
    icon: '🧭',
  },
  {
    name: 'Assignment Cancellation',
    category: 'Website Assignment',
    description: 'Cancel keyword assignments while preserving all keyword data.',
    purpose: 'Manage keyword redistribution without losing historical data.',
    icon: '↩️',
  },
  // Reports & Analytics
  {
    name: 'Matrix/Pivot Table View',
    category: 'Reports & Analytics',
    description: 'View keywords as rows with dates as columns, showing KD, SV, Intent, and Data Sources per date.',
    purpose: 'Visualize keyword performance trends over time in a comprehensive view.',
    icon: '📊',
  },
  {
    name: 'Historical Tracking',
    category: 'Reports & Analytics',
    description: 'Track keyword metrics across multiple data imports and dates.',
    purpose: 'Monitor how KD and SV change over time to make informed decisions.',
    icon: '📅',
  },
  {
    name: 'Has Changes Filter',
    category: 'Reports & Analytics',
    description: 'Filter to show only keywords where KD or SV has changed between imports.',
    purpose: 'Quickly identify keywords with significant metric changes that need attention.',
    icon: '🔔',
  },
  {
    name: 'Frozen Keyword Column',
    category: 'Reports & Analytics',
    description: 'The keyword column stays fixed while scrolling horizontally through date columns.',
    purpose: 'Always see which keyword you\'re analyzing when comparing across dates.',
    icon: '📌',
  },
  {
    name: 'Sortable Matrix Columns',
    category: 'Reports & Analytics',
    description: 'Sort by keyword name or by any metric (KD, SV, Intent) within date columns.',
    purpose: 'Find trends and outliers by sorting data in different ways.',
    icon: '↕️',
  },
  // Export
  {
    name: 'Export to CSV',
    category: 'Export',
    description: 'Download filtered keyword data as a CSV file for external use.',
    purpose: 'Share keyword lists with team members or use in spreadsheet applications.',
    icon: '💾',
  },
  {
    name: 'Filtered Export',
    category: 'Export',
    description: 'Export respects all applied filters, exporting only the visible data.',
    purpose: 'Create targeted keyword lists for specific purposes without manual filtering.',
    icon: '🎯',
  },
  // Actions
  {
    name: 'Edit Action',
    category: 'Row Actions',
    description: 'Edit individual keyword fields directly from the table row.',
    purpose: 'Make quick corrections without navigating away from the data view.',
    icon: '✏️',
  },
  {
    name: 'Assign Action',
    category: 'Row Actions',
    description: 'Open the assignment modal to assign a keyword to websites.',
    purpose: 'Quickly distribute individual keywords to projects.',
    icon: '🔗',
  },
  {
    name: 'Idea Action',
    category: 'Row Actions',
    description: 'Mark or flag a keyword for content ideation and brainstorming.',
    purpose: 'Track promising keywords that need further exploration or content planning.',
    icon: '💡',
  },
  {
    name: 'Delete Action',
    category: 'Row Actions',
    description: 'Remove a keyword from the database.',
    purpose: 'Clean up irrelevant or outdated keywords.',
    icon: '🗑️',
  },
];

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('getting-started');

  const handleScrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-zinc-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 rounded-md px-2 py-1"
              aria-label="Back to Dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">📖</span>
            Documentation
          </h1>
          <div className="w-24" aria-hidden="true" />
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar Navigation */}
        <aside className="hidden lg:block w-64 sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto border-r border-zinc-200 bg-white">
          <nav className="p-4 space-y-1" aria-label="Documentation sections">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 px-3">
              Contents
            </p>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleScrollToSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2
                  focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 ${
                  activeSection === section.id
                    ? 'bg-emerald-50 text-emerald-700 font-medium border border-emerald-200'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
                aria-current={activeSection === section.id ? 'true' : undefined}
              >
                <span aria-hidden="true">{section.icon}</span>
                {section.title}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-6 py-8 lg:px-12 overflow-y-auto bg-zinc-50" role="main">
          <div className="max-w-3xl mx-auto space-y-16">
            
            {/* Hero Section */}
            <div className="text-center py-8">
              <h1 className="text-4xl font-bold text-zinc-900 mb-4">
                Keyword Masterlist Manager
              </h1>
              <p className="text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
                A comprehensive guide to managing your SEO keyword data efficiently. 
                Learn how to import, organize, filter, and distribute keywords across your projects.
              </p>
            </div>

            {/* Getting Started */}
            <section id="getting-started" className="scroll-mt-24" aria-labelledby="getting-started-heading">
              <SectionHeader icon="🚀" title="Getting Started" id="getting-started-heading" />
              <div className="prose max-w-none">
                <p className="text-zinc-700 leading-relaxed text-base">
                  The Keyword Masterlist Manager is designed to streamline your SEO workflow by automating 
                  keyword data management. Instead of spending hours on manual data entry and updates, 
                  you can import CSV files from SEMrush and manage thousands of keywords in minutes.
                </p>
                
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <FeatureCard
                    icon="⏱️"
                    title="Save Time"
                    description="Reduce hours of manual work to minutes with bulk CSV imports"
                  />
                  <FeatureCard
                    icon="✅"
                    title="Reduce Errors"
                    description="Automated validation prevents duplicates and data inconsistencies"
                  />
                  <FeatureCard
                    icon="📊"
                    title="Track Changes"
                    description="Monitor keyword metrics over time with historical reports"
                  />
                  <FeatureCard
                    icon="🎯"
                    title="Stay Strategic"
                    description="Focus on research and strategy instead of administrative tasks"
                  />
                </div>
              </div>
            </section>

            {/* Feature List */}
            <section id="features" className="scroll-mt-24" aria-labelledby="features-heading">
              <SectionHeader icon="✨" title="Feature List" id="features-heading" />
              <div className="space-y-8">
                <p className="text-zinc-700 leading-relaxed text-base">
                  A complete list of all features available in the Keyword Masterlist Manager, 
                  organized by category with descriptions and purposes.
                </p>
                
                {/* Feature Categories */}
                {['Data Management', 'Data Table', 'Filtering', 'Bulk Operations', 'Website Assignment', 'Reports & Analytics', 'Export', 'Row Actions'].map((category) => (
                  <div key={category} className="space-y-4">
                    <h3 className="text-lg font-semibold text-emerald-700 border-b border-zinc-200 pb-2">
                      {category}
                    </h3>
                    <div className="grid gap-3">
                      {features
                        .filter((f) => f.category === category)
                        .map((feature) => (
                          <FeatureDocCard
                            key={feature.name}
                            icon={feature.icon}
                            name={feature.name}
                            description={feature.description}
                            purpose={feature.purpose}
                          />
                        ))}
                    </div>
                  </div>
                ))}
                
                {/* Feature Summary Stats */}
                <div className="mt-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
                  <h4 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                    <span aria-hidden="true">📊</span> Feature Summary
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-emerald-600">{features.length}</div>
                      <div className="text-sm text-zinc-600">Total Features</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-teal-600">8</div>
                      <div className="text-sm text-zinc-600">Categories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">5</div>
                      <div className="text-sm text-zinc-600">Bulk Actions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-amber-600">5</div>
                      <div className="text-sm text-zinc-600">Filter Types</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Main Dashboard */}
            <section id="dashboard" className="scroll-mt-24" aria-labelledby="dashboard-heading">
              <SectionHeader icon="📊" title="Main Dashboard" id="dashboard-heading" />
              <div className="space-y-6">
                <p className="text-zinc-700 leading-relaxed text-base">
                  The main dashboard is your central hub for keyword management. It consists of three main areas:
                </p>
                
                <div className="space-y-4">
                  <InfoBlock title="1. Data Source Sidebar (Left)">
                    <ul className="list-disc list-inside text-zinc-600 space-y-2">
                      <li>View all imported data sources</li>
                      <li>Click a data source to filter keywords</li>
                      <li>Select &quot;All Data Sources&quot; to view everything</li>
                      <li>Access the Reports page via the sidebar link</li>
                    </ul>
                  </InfoBlock>
                  
                  <InfoBlock title="2. Header Area (Top)">
                    <ul className="list-disc list-inside text-zinc-600 space-y-2">
                      <li>Application title and description</li>
                      <li>CSV Upload button for importing new data</li>
                    </ul>
                  </InfoBlock>
                  
                  <InfoBlock title="3. Data Table (Center)">
                    <ul className="list-disc list-inside text-zinc-600 space-y-2">
                      <li>Website navigation dropdown at the top</li>
                      <li>Advanced filters and search bar</li>
                      <li>Sortable columns with pagination</li>
                      <li>Action buttons for each keyword row</li>
                    </ul>
                  </InfoBlock>
                </div>
              </div>
            </section>

            {/* CSV Upload */}
            <section id="csv-upload" className="scroll-mt-24" aria-labelledby="csv-upload-heading">
              <SectionHeader icon="📤" title="CSV Upload" id="csv-upload-heading" />
              <div className="space-y-6">
                <p className="text-zinc-700 leading-relaxed text-base">
                  Import keyword data from SEMrush or other tools using CSV files. The system automatically 
                  detects and maps common column names.
                </p>
                
                <StepList
                  steps={[
                    'Click the "Upload CSV" button in the header area',
                    'Select your CSV file from your computer',
                    'Enter a name for the data source (e.g., "SEMrush Jan 2026")',
                    'Optionally select an existing data source to append data',
                    'Click "Upload" to import the data',
                  ]}
                />
                
                <InfoBlock title="Supported Columns">
                  <p className="text-zinc-600 mb-3">The system recognizes these column variations:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <code className="bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded text-zinc-800 font-mono">Keyword</code>
                    <code className="bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded text-zinc-800 font-mono">Search Volume / SV</code>
                    <code className="bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded text-zinc-800 font-mono">Keyword Difficulty / KD</code>
                    <code className="bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded text-zinc-800 font-mono">Intent</code>
                  </div>
                </InfoBlock>
                
                <TipBox>
                  You can append new data to existing data sources. This is useful for tracking 
                  keyword changes over time without losing historical data.
                </TipBox>
              </div>
            </section>

            {/* Data Table Features */}
            <section id="data-table" className="scroll-mt-24" aria-labelledby="data-table-heading">
              <SectionHeader icon="📋" title="Data Table Features" id="data-table-heading" />
              <div className="space-y-6">
                <p className="text-zinc-700 leading-relaxed text-base">
                  The data table displays all your keywords with powerful features for navigation and management.
                </p>
                
                <InfoBlock title="Column Sorting">
                  <p className="text-zinc-600">
                    Click any column header to sort the data. Click again to reverse the sort order. 
                    A sort indicator shows the current sort direction.
                  </p>
                </InfoBlock>
                
                <InfoBlock title="Search Bar">
                  <p className="text-zinc-600">
                    Use the search bar to instantly filter keywords. The search looks across all fields 
                    including keyword name, intent, and data source.
                  </p>
                </InfoBlock>
                
                <InfoBlock title="Pagination">
                  <p className="text-zinc-600">
                    Navigate through large datasets using the pagination controls at the bottom. 
                    Choose between 10, 25, 50, or 100 items per page.
                  </p>
                </InfoBlock>
                
                <InfoBlock title="Row Actions">
                  <p className="text-zinc-600 mb-3">Each row has action buttons:</p>
                  <div className="flex flex-wrap gap-2" role="list" aria-label="Available action buttons">
                    <span className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded font-medium" role="listitem">Edit</span>
                    <span className="px-3 py-1.5 bg-green-600 text-white text-sm rounded font-medium" role="listitem">Assign</span>
                    <span className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded font-medium" role="listitem">Idea</span>
                    <span className="px-3 py-1.5 bg-red-600 text-white text-sm rounded font-medium" role="listitem">Delete</span>
                  </div>
                </InfoBlock>
              </div>
            </section>

            {/* Advanced Filtering */}
            <section id="filtering" className="scroll-mt-24" aria-labelledby="filtering-heading">
              <SectionHeader icon="🔍" title="Advanced Filtering" id="filtering-heading" />
              <div className="space-y-6">
                <p className="text-zinc-700 leading-relaxed text-base">
                  Use advanced filters to find exactly the keywords you need. Filters can be combined 
                  for precise results.
                </p>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <FilterCard
                    title="KD Range"
                    description="Filter by Keyword Difficulty using min/max values (0-100)"
                  />
                  <FilterCard
                    title="SV Range"
                    description="Filter by Search Volume using min/max values"
                  />
                  <FilterCard
                    title="Intent Filter"
                    description="Select one or more intent types (Informational, Commercial, etc.)"
                  />
                  <FilterCard
                    title="Assigned Filter"
                    description="Show only keywords assigned or not assigned to websites"
                  />
                </div>
                
                <StepList
                  title="How to Use Filters"
                  steps={[
                    'Click "Show Filters" to expand the filter panel',
                    'Enter your filter criteria (KD, SV ranges, Intent types)',
                    'Click "Apply Filters" to filter the data',
                    'Click "Reset" to clear all filters',
                  ]}
                />
              </div>
            </section>

            {/* Bulk Operations */}
            <section id="bulk-operations" className="scroll-mt-24" aria-labelledby="bulk-operations-heading">
              <SectionHeader icon="⚡" title="Bulk Operations" id="bulk-operations-heading" />
              <div className="space-y-6">
                <p className="text-zinc-700 leading-relaxed text-base">
                  Perform actions on multiple keywords at once using bulk operations. This saves 
                  significant time when managing large keyword lists.
                </p>
                
                <StepList
                  title="Using Bulk Selection"
                  steps={[
                    'Check the box in the header row to select all visible keywords',
                    'Or check individual boxes to select specific keywords',
                    'The selection count shows how many keywords are selected',
                    'Use the bulk action buttons that appear when items are selected',
                  ]}
                />
                
                <InfoBlock title="Available Bulk Actions">
                  <ul className="list-disc list-inside text-zinc-600 space-y-2">
                    <li><strong className="text-zinc-900">Bulk Edit:</strong> Update fields for all selected keywords</li>
                    <li><strong className="text-zinc-900">Bulk Delete:</strong> Remove all selected keywords</li>
                    <li><strong className="text-zinc-900">Bulk Assign:</strong> Assign all selected keywords to a website</li>
                    <li><strong className="text-zinc-900">Bulk Cancel:</strong> Cancel website assignments for selected keywords</li>
                  </ul>
                </InfoBlock>
              </div>
            </section>

            {/* Website Assignment */}
            <section id="website-assignment" className="scroll-mt-24" aria-labelledby="website-assignment-heading">
              <SectionHeader icon="🌐" title="Website Assignment" id="website-assignment-heading" />
              <div className="space-y-6">
                <p className="text-zinc-700 leading-relaxed text-base">
                  Organize keywords by assigning them to specific websites. Keywords can be assigned 
                  to multiple websites and will appear in the Website Name column as comma-separated values.
                </p>
                
                <StepList
                  title="Assigning Keywords to Websites"
                  steps={[
                    'Click the "Assign" button on a keyword row',
                    'A modal will open showing available websites',
                    'Check one or more websites to assign the keyword to',
                    'Optionally add a new website by entering a name',
                    'Optionally specify a URL path for the assignment',
                    'Click "Assign to Websites" to save',
                  ]}
                />
                
                <InfoBlock title="Website Navigation">
                  <p className="text-zinc-600">
                    Use the website dropdown at the top of the data table to filter keywords by website. 
                    Select &quot;All&quot; to see all keywords, or choose a specific website to see only 
                    keywords assigned to it.
                  </p>
                </InfoBlock>
                
                <InfoBlock title="Multiple Website Assignments">
                  <p className="text-zinc-600">
                    When a keyword is assigned to multiple websites, they appear as comma-separated 
                    values in the Website Name column (e.g., &quot;site1.com, site2.com, site3.com&quot;).
                  </p>
                </InfoBlock>
                
                <TipBox>
                  You can cancel a keyword assignment by clicking &quot;Cancel Assignment&quot; when viewing 
                  a specific website&apos;s keywords. This removes the assignment but preserves the keyword data.
                </TipBox>
              </div>
            </section>

            {/* Reports & Matrix */}
            <section id="reports" className="scroll-mt-24" aria-labelledby="reports-heading">
              <SectionHeader icon="📈" title="Reports & Matrix" id="reports-heading" />
              <div className="space-y-6">
                <p className="text-zinc-700 leading-relaxed text-base">
                  The Reports page provides a comprehensive matrix view of keyword performance over time. 
                  Track changes in KD, SV, and Intent across multiple data imports.
                </p>
                
                <StepList
                  title="Accessing Reports"
                  steps={[
                    'Click "View Reports" in the Data Source sidebar',
                    'Or navigate directly to /report in your browser',
                  ]}
                />
                
                <InfoBlock title="Matrix View">
                  <p className="text-zinc-600 mb-3">
                    The matrix displays keywords as rows and dates as columns. Each date column contains:
                  </p>
                  <ul className="list-disc list-inside text-zinc-600 space-y-1">
                    <li>KD (Keyword Difficulty)</li>
                    <li>SV (Search Volume)</li>
                    <li>Intent</li>
                    <li>Present In (Data Sources)</li>
                  </ul>
                </InfoBlock>
                
                <InfoBlock title="Report Filters">
                  <ul className="list-disc list-inside text-zinc-600 space-y-2">
                    <li><strong className="text-zinc-900">KD/SV Range:</strong> Filter by numeric ranges</li>
                    <li><strong className="text-zinc-900">Intent:</strong> Filter by intent types</li>
                    <li><strong className="text-zinc-900">Data Source:</strong> Filter by specific data source</li>
                    <li><strong className="text-zinc-900">Has Changes:</strong> Show only keywords with KD/SV changes</li>
                  </ul>
                </InfoBlock>
                
                <TipBox>
                  The keyword column is frozen when scrolling horizontally, making it easy to compare 
                  metrics across multiple dates while keeping track of which keyword you&apos;re viewing.
                </TipBox>
              </div>
            </section>

            {/* Export to CSV */}
            <section id="export" className="scroll-mt-24" aria-labelledby="export-heading">
              <SectionHeader icon="💾" title="Export to CSV" id="export-heading" />
              <div className="space-y-6">
                <p className="text-zinc-700 leading-relaxed text-base">
                  Export your keyword data to CSV files for sharing, backup, or further analysis 
                  in spreadsheet applications.
                </p>
                
                <StepList
                  title="Exporting from Reports"
                  steps={[
                    'Navigate to the Reports page',
                    'Apply any desired filters (data source, KD/SV ranges, etc.)',
                    'Click "Export to CSV" button',
                    'The file will download with filtered data',
                  ]}
                />
                
                <InfoBlock title="Export Contents">
                  <p className="text-zinc-600 mb-3">The exported CSV includes these columns:</p>
                  <div className="flex flex-wrap gap-2">
                    <code className="bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded text-zinc-800 font-mono text-sm">Keyword</code>
                    <code className="bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded text-zinc-800 font-mono text-sm">Date</code>
                    <code className="bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded text-zinc-800 font-mono text-sm">KD</code>
                    <code className="bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded text-zinc-800 font-mono text-sm">SV</code>
                    <code className="bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded text-zinc-800 font-mono text-sm">Intent</code>
                    <code className="bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded text-zinc-800 font-mono text-sm">Data Sources</code>
                  </div>
                </InfoBlock>
                
                <TipBox>
                  The export respects your current filters. Use the Data Source dropdown to export 
                  data from specific sources, or keep &quot;All Data Sources&quot; selected to export everything.
                </TipBox>
              </div>
            </section>

            {/* Tips & Best Practices */}
            <section id="tips" className="scroll-mt-24" aria-labelledby="tips-heading">
              <SectionHeader icon="💡" title="Tips & Best Practices" id="tips-heading" />
              <div className="space-y-6">
                
                <InfoBlock title="Bi-Weekly Data Refresh">
                  <p className="text-zinc-600">
                    Import updated keyword data every two weeks to balance data freshness with 
                    SEMrush API limits. This ensures your metrics stay current without exhausting 
                    your daily query limits.
                  </p>
                </InfoBlock>
                
                <InfoBlock title="Use Data Source Names Wisely">
                  <p className="text-zinc-600">
                    Name your data sources with dates or descriptive names (e.g., &quot;SEMrush Jan 2026&quot;) 
                    to easily track when data was imported and compare changes over time.
                  </p>
                </InfoBlock>
                
                <InfoBlock title='Monitor the "Has Changes" Filter'>
                  <p className="text-zinc-600">
                    Regularly check the Reports page with the &quot;Has Changes&quot; filter enabled to 
                    identify keywords with significant KD or SV changes that may need attention.
                  </p>
                </InfoBlock>
                
                <InfoBlock title="Organize by Website">
                  <p className="text-zinc-600">
                    Assign keywords to websites as you distribute them to writers. This creates 
                    a clear record of which keywords are being used where and prevents duplication.
                  </p>
                </InfoBlock>
                
                <InfoBlock title="Export for Team Sharing">
                  <p className="text-zinc-600">
                    Use the export feature to create filtered keyword lists for writers or editors. 
                    Apply relevant filters first, then export to share exactly the data they need.
                  </p>
                </InfoBlock>
                
                <div className="mt-8 p-6 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <h4 className="text-lg font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                    <span aria-hidden="true">🎯</span> Pro Tip: Strategic Focus
                  </h4>
                  <p className="text-zinc-700 leading-relaxed">
                    With the automation handling bulk data management, use your freed-up time to focus on 
                    strategic work: analyzing search intent, prioritizing high-value keywords, and developing 
                    content strategies that align with your brand goals.
                  </p>
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="pt-12 pb-8 border-t border-zinc-200 text-center">
              <p className="text-zinc-500 text-sm">
                Keyword Masterlist Manager Documentation
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 mt-4 text-emerald-600 hover:text-emerald-700 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-md px-2 py-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Link>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

// Component: Section Header
const SectionHeader = ({ icon, title, id }: { icon: string; title: string; id?: string }) => (
  <div className="flex items-center gap-3 mb-6">
    <span className="text-3xl" aria-hidden="true">{icon}</span>
    <h2 id={id} className="text-2xl font-bold text-zinc-900">{title}</h2>
  </div>
);

// Component: Feature Card
const FeatureCard = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
  <div className="p-5 bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
    <div className="text-2xl mb-2" aria-hidden="true">{icon}</div>
    <h3 className="font-semibold text-zinc-900 mb-1">{title}</h3>
    <p className="text-sm text-zinc-600 leading-relaxed">{description}</p>
  </div>
);

// Component: Info Block
const InfoBlock = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="p-5 bg-white border border-zinc-200 rounded-lg shadow-sm">
    <h3 className="font-semibold text-zinc-900 mb-3">{title}</h3>
    {children}
  </div>
);

// Component: Step List
const StepList = ({ title, steps }: { title?: string; steps: string[] }) => (
  <div className="p-5 bg-white border border-zinc-200 rounded-lg shadow-sm">
    {title && <h3 className="font-semibold text-zinc-900 mb-4">{title}</h3>}
    <ol className="list-decimal list-inside space-y-3">
      {steps.map((step, index) => (
        <li key={index} className="text-zinc-700 leading-relaxed">
          {step}
        </li>
      ))}
    </ol>
  </div>
);

// Component: Filter Card
const FilterCard = ({ title, description }: { title: string; description: string }) => (
  <div className="p-5 bg-white border border-zinc-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
    <h4 className="font-semibold text-emerald-700 mb-1">{title}</h4>
    <p className="text-sm text-zinc-600 leading-relaxed">{description}</p>
  </div>
);

// Component: Tip Box
const TipBox = ({ children }: { children: React.ReactNode }) => (
  <div className="p-5 bg-amber-50 border border-amber-200 rounded-lg" role="note">
    <div className="flex gap-3">
      <span className="text-amber-600 text-lg flex-shrink-0" aria-hidden="true">💡</span>
      <p className="text-amber-900 text-sm leading-relaxed">{children}</p>
    </div>
  </div>
);

// Component: Feature Documentation Card
const FeatureDocCard = ({ 
  icon, 
  name, 
  description, 
  purpose 
}: { 
  icon: string; 
  name: string; 
  description: string; 
  purpose: string;
}) => (
  <div className="p-4 bg-white border border-zinc-200 rounded-lg shadow-sm hover:shadow-md hover:border-zinc-300 transition-all">
    <div className="flex items-start gap-3">
      <span className="text-xl flex-shrink-0" aria-hidden="true">{icon}</span>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-zinc-900 mb-1">{name}</h4>
        <p className="text-sm text-zinc-600 mb-3 leading-relaxed">{description}</p>
        <div className="flex items-start gap-2">
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex-shrink-0">
            Purpose
          </span>
          <p className="text-xs text-zinc-500 leading-relaxed">{purpose}</p>
        </div>
      </div>
    </div>
  </div>
);
