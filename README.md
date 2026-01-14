# Keyword Masterlist Manager

A Next.js application for automated keyword management that transforms time-consuming manual processes into an efficient, scalable system. This tool enables SEO teams to focus on strategic work rather than administrative tasks.

## 🎯 Project Overview

This application automates the keyword masterlist management process, addressing critical pain points in SEO workflows:

- **Time Savings**: Reduces manual data entry from hours to minutes
- **Data Freshness**: Enables on-demand updates instead of quarterly cycles
- **Error Reduction**: Eliminates duplication and manual entry errors
- **Strategic Focus**: Frees SEO professionals to focus on research and strategy

### Key Value Propositions

1. **Massive Time Savings & Efficiency Gains**
   - Reduces manual data entry from hours to minutes
   - Bulk CSV import and automated processing
   - Instant data population from CSV files

2. **Real-Time Data Freshness**
   - On-demand CSV imports whenever new data is available
   - Prevents writers from using outdated keywords
   - Enables bi-weekly or as-needed updates instead of quarterly

3. **Error Reduction & Data Integrity**
   - Structured database with validation
   - Automated deduplication capabilities
   - Consistent data structure

4. **Strategic Focus Shift**
   - Automation handles bulk operations
   - SEOs can focus on keyword research, intent analysis, and content strategy

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database in your Firebase project
   - Go to Firestore Database in the Firebase Console
   - Click "Create database"
   - Start in **test mode** (for development) or **production mode** (requires security rules)
3. **Configure Firestore Security Rules** (IMPORTANT!)
   
   Go to Firestore Database > Rules tab and update the rules to allow read/write access:
   
   **For Development (Test Mode):**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
   
   **For Production (Recommended):**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /records/{recordId} {
         allow read, write: if true; // Adjust based on your security needs
       }
     }
   }
   ```
   
   ⚠️ **Warning**: The test mode rules allow anyone to read/write. For production, implement proper authentication and authorization.

4. Create a `.env.local` file in the root directory with your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

You can find these values in your Firebase project settings under "General" > "Your apps" > "Web app" config.

### 3. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## ✨ Features

### Core Functionality

- **CSV Upload & Import**: Bulk import keyword data from CSV files
  - Support for multiple data sources
  - Append to existing data sources or create new ones
  - Automatic data validation and processing

- **Data Management**:
  - View all records in a sortable, searchable table
  - Edit records inline or in bulk
  - Delete records individually or in bulk
  - Filter by data source, website assignment, and custom criteria

- **Website Assignment**:
  - Assign keywords to specific websites and URL paths
  - View keywords by website in dedicated pages
  - Bulk edit and cancel assignments
  - Track website-specific keyword distributions

- **Advanced Filtering**:
  - Filter by data source
  - Numeric range filters for KD and SV
  - Multi-select checkbox filter for Intent (Navigational, Informational, Commercial, Transactional)
  - Filter by website assignment status
  - Dynamic search across all fields

- **Keyword Change Report** (`/report`):
  - Track keyword changes over time
  - Compare metrics (KD, SV, Intent) across different timestamps
  - View full history for each keyword
  - Sortable and searchable history table
  - Export to CSV with full keyword history
  - Filter by data source
  - Sort keywords by entry count or name
  - Pagination for large datasets

### Data Table Features

- **Dynamic Search**: Real-time search across all record fields
- **Sortable Columns**: Click column headers to sort (ascending/descending)
- **Pagination**: Configurable items per page (10, 25, 50, 100)
- **Bulk Operations**:
  - Bulk edit multiple records at once
  - Bulk delete selected records
  - Bulk inline editing on website pages
- **Column Management**:
  - Timestamp (formatted as MM-DD-YYYY hh:mm:ss AM/PM)
  - Keyword, KD, SV, Intent, URL
  - Dynamic columns based on filters (Website Name when filtering by assignment)

### Report Features

- **Keyword History Tracking**: View all historical entries for each keyword
- **Change Comparison**: Compare keyword metrics between two selected dates
- **Export Functionality**: Export all keywords or selected keyword to CSV
- **Data Organization**: 
  - Grouped by keyword
  - Sorted by timestamp (descending by default)
  - Filtered by data source

## 📊 Business Impact

### Time Savings
- **40-80+ hours saved per SEO per year**
- Reduces update time from hours to minutes
- Faster project turnaround with instant keyword distribution

### Data Quality
- Real-time data freshness prevents outdated keyword usage
- Automated validation reduces errors
- Consistent data structure across all operations

### Strategic Benefits
- More time for keyword research and discovery
- Better content strategy development
- Improved writer experience with current, relevant keywords

## 📝 Usage Guide

### Uploading CSV Files

1. Click "Upload CSV" in the header
2. Select a data source:
   - Choose from existing data sources (appends to existing data)
   - Or create a new data source name
3. Select your CSV file
4. Click "Upload CSV"
5. Data will be automatically imported and displayed in the table

### Managing Keywords

- **View Records**: All records are displayed in the main table
- **Search**: Use the search bar to find specific keywords
- **Filter**: Use the custom filters section to narrow down results
- **Edit**: Click "Edit" on any row to modify data inline
- **Delete**: Click "Delete" to remove a record
- **Bulk Actions**: Select multiple records using checkboxes for bulk operations

### Website Assignment

1. Select keywords using checkboxes
2. Use bulk edit to assign "Website Name" and "Website URL Path"
3. View assigned keywords by clicking website links above the table
4. On website pages, use bulk inline editing to modify multiple keywords at once

### Generating Reports

1. Click "Generate Report" button next to the Records heading
2. Select a keyword from the left panel to view its history
3. Use date dropdowns to compare metrics between two timestamps
4. Export to CSV for offline analysis

## 🛠️ Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: Firebase Firestore
- **Styling**: Tailwind CSS
- **CSV Parsing**: PapaParse
- **Language**: TypeScript

## 📚 Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## 🚢 Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 📄 License

This project is proprietary software. All rights reserved.
