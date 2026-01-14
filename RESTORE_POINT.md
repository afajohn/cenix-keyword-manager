# KWMaster - Restore Point Documentation

**Date**: Today's Session  
**Status**: Fully Functional CRUD Application with CSV Import, Filtering, and Bulk Operations

---

## 📋 Project Overview

A Next.js + Firebase Firestore application for managing keyword data imported from CSV files. The application provides a complete CRUD interface with advanced filtering, sorting, pagination, and bulk operations.

---

## 🏗️ Architecture & Tech Stack

- **Framework**: Next.js (App Router)
- **Database**: Firebase Firestore
- **Styling**: Tailwind CSS (Light theme only - no dark mode)
- **CSV Parsing**: PapaParse (`papaparse`)
- **Language**: TypeScript

---

## 📊 Data Model

Each record in Firestore contains:

- `id` - Document ID (auto-generated)
- `dataSource` - User-provided source identifier (string)
- `createdAt` - ISO timestamp (used for "Timestamp" column)
- `updatedAt` - ISO timestamp (set on updates)
- `Keyword` - Keyword text (case-insensitive field matching)
- `KD` - Keyword Difficulty (numeric)
- `SV` - Search Volume (numeric)
- `Intent` - Intent type(s) (string, can contain multiple)
- `url` - URL field (stored as lowercase, displayed as "URL")

**Note**: CSV headers can be any case (e.g., `keyword`, `Keyword`, `KEYWORD`) - the system handles case-insensitive matching.

---

## 🗂️ File Structure

```
KWMaster/
├── app/
│   ├── api/
│   │   ├── records/
│   │   │   ├── [id]/
│   │   │   │   └── route.ts          # GET, PUT, DELETE single record
│   │   │   └── route.ts              # GET all records
│   │   └── upload-csv/
│   │       └── route.ts              # POST CSV upload handler
│   ├── globals.css                   # Light theme only
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Main page (integrates components)
├── components/
│   ├── CSVUpload.tsx                 # CSV upload form (horizontal layout)
│   ├── DataSourceSidebar.tsx         # Left sidebar for data source filtering
│   └── DataTable.tsx                 # Main data table with all features
├── lib/
│   └── firebase.ts                   # Firebase initialization
└── RESTORE_POINT.md                  # This file
```

---

## 🔧 Key Features Implemented

### 1. CSV Upload & Import

**Component**: `components/CSVUpload.tsx`

- **Layout**: Horizontal (data source input + file input + upload button in one row)
- **Functionality**:
  - User enters data source name (required)
  - User selects CSV file
  - Uploads to `/api/upload-csv` via FormData
  - Only parsed data is stored (CSV file itself is not stored)

**API Route**: `app/api/upload-csv/route.ts`

- Parses CSV using PapaParse with `header: true`, `skipEmptyLines: true`
- Sanitizes each row (trims keys and values, removes empty fields)
- Stores each row as a Firestore document with:
  - All CSV columns (case-preserved but matched case-insensitively)
  - `dataSource` (from form)
  - `createdAt` (ISO timestamp)

### 2. Data Source Sidebar

**Component**: `components/DataSourceSidebar.tsx`

- Fetches unique `dataSource` values from all records
- Displays "All Sources" + individual source buttons
- Clicking a source filters the main table
- Updates when new data is uploaded (via `refreshKey` prop)

### 3. Data Table

**Component**: `components/DataTable.tsx` (Main component - 860 lines)

#### Columns Displayed

```
['Timestamp', 'Keyword', 'KD', 'SV', 'Intent', 'URL']
```

#### Field Mapping Logic

- **`getFieldKey(record, column)`**: Case-insensitive, whitespace-insensitive field matching
  - Special case: `'Timestamp'` → `'createdAt'` (or any `createdat`-like key)
  - Handles CSV headers in any case (e.g., `keyword`, `Keyword`, `KEYWORD`)
- **`getCellValue(record, column)`**: Formats display values
  - Timestamp: `MM-DD-YYYY hh:mm:ss AM/PM` (12-hour format)
  - Empty/null values: Display as "`-`"

#### Search & Sort

- **Global Search**: Case-insensitive search across all record fields
- **Sortable Columns**: Click any column header to sort
  - Numeric sorting for KD/SV (and any numeric-looking fields)
  - String sorting for text fields
  - Cycles: none → asc → desc

#### Pagination

- Default: 10 items per page
- Page controls at bottom (Previous/Next + page numbers)
- Auto-resets to page 1 on:
  - Search query change
  - Data source filter change
  - Filter apply/reset

#### Custom Filters (with Apply Button)

**Filter Types**:

1. **KD Range Filter**
   - Min/Max numeric inputs
   - Applied only when "Apply Filters" is clicked

2. **SV Range Filter**
   - Min/Max numeric inputs
   - Applied only when "Apply Filters" is clicked

3. **Intent Filter**
   - Fixed options: `Navigational`, `Informational`, `Commercial`, `Transactional`
   - Multi-select checkboxes
   - **Logic**: Uses "contains" matching (case-insensitive)
     - If a row's intent string contains any selected intent, it matches
     - Example: Row with "Navigational, Commercial" matches if either is selected

**Filter State Management**:

- **Input State** (draft): `kdMinInput`, `kdMaxInput`, `svMinInput`, `svMaxInput`, `selectedIntentsInput`
- **Applied State** (active): `kdMinFilter`, `kdMaxFilter`, `svMinFilter`, `svMaxFilter`, `selectedIntentsFilter`
- **Apply Filters Button**: Copies input → applied state, resets to page 1
- **Reset Button**: Clears all inputs and applied filters, resets to page 1

#### Bulk Operations

**Row Selection**:
- Individual row checkboxes
- "Select all on current page" checkbox in header

**Bulk Edit**:
- Field dropdown: `Keyword`, `KD`, `SV`, `Intent`, `URL`
- Value input field
- Applies same value to all selected rows
- Uses `fieldKeyMap` for field name mapping:
  ```typescript
  {
    Keyword: 'Keyword',
    KD: 'KD',
    SV: 'SV',
    Intent: 'Intent',
    URL: 'url'  // Maps to lowercase 'url' in database
  }
  ```

**Bulk Delete**:
- Deletes all selected records
- Confirmation via success/error messages

#### Inline Row Editing

- Click "Edit" button on any row
- All columns become editable text inputs (except Timestamp - read-only)
- **URL field is fully editable** via inline edit
- "Save" button: Updates record via `/api/records/[id]` PUT
- "Cancel" button: Discards changes
- "Delete" button: Deletes single record

---

## 🔌 API Routes

### GET `/api/records`

Fetches all records from Firestore `records` collection.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "doc-id",
      "keyword": "...",
      "kd": "...",
      // ... all fields
    }
  ]
}
```

### GET `/api/records/[id]`

Fetches a single record by ID.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "doc-id",
    // ... all fields
  }
}
```

### PUT `/api/records/[id]`

Updates a record with provided fields.

**Request Body**:
```json
{
  "keyword": "new value",
  "url": "https://example.com",
  // ... any fields to update
}
```

**Response**:
```json
{
  "success": true,
  "message": "Record updated successfully"
}
```

**Note**: Automatically sets `updatedAt` timestamp.

### DELETE `/api/records/[id]`

Deletes a record by ID.

**Response**:
```json
{
  "success": true,
  "message": "Record deleted successfully"
}
```

### POST `/api/upload-csv`

Uploads and imports CSV data.

**Request**: `FormData` with:
- `file`: CSV file
- `dataSource`: String (required)

**Response**:
```json
{
  "success": true,
  "message": "Successfully imported X records",
  "count": X
}
```

---

## 🎨 UI/UX Design Decisions

### Theme

- **Light mode only** - No dark mode support
- High contrast for readability and accessibility
- Removed all dark mode classes from components

### Layout

- **Header**: Compact horizontal layout (data source input + file input + upload button)
- **Left Sidebar**: Data source filter (collapsible/expandable)
- **Main Content**: Data table (prominent, takes most space)
- **Window mode** preferred (not fullscreen) for easier navigation on single monitor

### Color Scheme

- Primary actions: Blue (`bg-blue-600`)
- Success: Green (`bg-green-600`)
- Danger: Red (`bg-red-600`)
- Background: White (`bg-white`)
- Borders: Zinc (`border-zinc-200`, `border-zinc-300`)
- Text: Zinc (`text-zinc-900`, `text-zinc-700`)

---

## 🔐 Firebase Configuration

### Environment Variables Required

Create `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### Firestore Security Rules (Development)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /records/{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ Note**: These are development rules. Update for production with proper authentication.

---

## 📝 Key Implementation Details

### Case-Insensitive Field Matching

The system handles CSV headers in any case:
- CSV with `keyword` → Matches `Keyword` column
- CSV with `URL` → Matches `url` field in database
- CSV with `intent` → Matches `Intent` column

This is handled by `getFieldKey()` function which:
1. Converts column name to lowercase
2. Searches record keys case-insensitively
3. Matches ignoring whitespace

### Intent Filter Logic

The Intent filter uses "contains" matching:
- Row intent: `"Navigational, Commercial"`
- Selected filter: `["Navigational"]`
- **Result**: ✅ Matches (contains "Navigational")

- Row intent: `"Informational"`
- Selected filter: `["Navigational", "Commercial"]`
- **Result**: ❌ No match (doesn't contain either)

### Filter Apply Pattern

Filters use a two-state pattern:
1. **Input state**: User types/selects (no effect on table)
2. **Applied state**: Active filters (affects table display)
3. **Apply button**: Transfers input → applied
4. **Reset button**: Clears both states

This prevents table flickering while user is adjusting filter values.

### URL Field Handling

- **Storage**: Lowercase `url` in Firestore
- **Display**: "URL" column header
- **Editable**: Via inline edit and bulk edit
- **CSV Import**: If CSV has `url` column (any case), it's imported and displayed

---

## 🐛 Known Issues / Technical Debt

### Linter Warnings

There are some TypeScript `any` type warnings in `DataTable.tsx`:
- Line 8: `[key: string]: any` in Record interface
- Line 54, 259, 297, 302, 343, 396: Error handling with `any`

These are non-breaking but should be addressed for better type safety.

### Unused Variables

Some destructured variables in error handling are unused (warnings only):
- `id`, `createdAt`, `updatedAt` in some catch blocks

---

## 🚀 How to Resume Work Tomorrow

### Quick Start

1. **Verify Environment**: Ensure `.env.local` exists with Firebase config
2. **Install Dependencies**: `npm install` (if needed)
3. **Run Dev Server**: `npm run dev`
4. **Check Firebase**: Verify Firestore rules are set (development rules are fine)

### Current State

- ✅ All core features working
- ✅ CSV upload functional
- ✅ Data table with all filters, sorting, pagination
- ✅ Bulk operations working
- ✅ URL field integrated
- ✅ Light theme applied throughout

### Next Steps (Suggestions)

When resuming, consider:
1. **URL Validation**: Add URL format validation for the URL field
2. **Export Functionality**: Export filtered data to CSV
3. **Data Source Stats**: Show record counts per data source
4. **Type Safety**: Fix TypeScript `any` warnings
5. **Error Handling**: Improve error messages and handling
6. **Performance**: Optimize for large datasets (virtual scrolling?)

---

## 📚 Dependencies

```json
{
  "firebase": "^latest",
  "papaparse": "^latest",
  "@types/papaparse": "^latest",
  "next": "^latest",
  "react": "^latest",
  "react-dom": "^latest",
  "tailwindcss": "^latest"
}
```

---

## 🔄 Data Flow

```
1. User uploads CSV → CSVUpload component
2. FormData sent to /api/upload-csv
3. PapaParse parses CSV
4. Each row saved to Firestore 'records' collection
5. DataSourceSidebar fetches unique dataSources
6. DataTable fetches all records
7. Filters/sorting applied client-side
8. Pagination displays subset
9. User edits → PUT /api/records/[id]
10. User deletes → DELETE /api/records/[id]
```

---

## 💡 Tips for Tomorrow

1. **Test with Real Data**: Upload a CSV with `url` column to verify URL field works
2. **Check Console**: Look for any runtime errors or warnings
3. **Firebase Console**: Verify records are being created with correct structure
4. **Filter Testing**: Test Intent filter with rows containing multiple intents
5. **Bulk Operations**: Test bulk edit with URL field

---

## 📞 Quick Reference

### Main Component Files

- **`components/DataTable.tsx`**: All table logic (860 lines) - main file to modify
- **`components/CSVUpload.tsx`**: Upload form
- **`components/DataSourceSidebar.tsx`**: Source filter sidebar
- **`app/api/upload-csv/route.ts`**: CSV import handler
- **`app/api/records/[id]/route.ts`**: CRUD operations

### Key Functions in DataTable.tsx

- `getFieldKey(record, column)`: Maps display column to database field
- `getCellValue(record, column)`: Formats cell display value
- `handleSort(column)`: Handles column sorting
- `handleBulkEdit()`: Applies bulk edit to selected rows
- `handleEdit(record)`: Starts inline edit mode
- `handleSaveEdit()`: Saves inline edit changes

---

**Last Updated**: Today's Session  
**Status**: ✅ Fully Functional - Ready for Next Features
