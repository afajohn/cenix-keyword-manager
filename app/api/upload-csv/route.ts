import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const dataSource = formData.get('dataSource') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!dataSource || !dataSource.trim()) {
      return NextResponse.json(
        { error: 'Data source is required' },
        { status: 400 }
      );
    }

    // Read CSV file content (file itself is not stored, only the data)
    const text = await file.text();

    return new Promise<NextResponse>((resolve) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const data = results.data as Record<string, any>[];
            const errors: string[] = [];

            if (data.length === 0) {
              return resolve(
                NextResponse.json(
                  { error: 'CSV file is empty or has no valid data' },
                  { status: 400 }
                )
              );
            }

            // Store only the parsed data records in Firestore (not the CSV file)
            const batch: Promise<unknown>[] = [];

            for (let i = 0; i < data.length; i++) {
              const row = data[i];
              const sanitizedRow: Record<string, any> = {};

              Object.keys(row).forEach((key) => {
                const value = row[key];
                if (value !== null && value !== undefined && value !== '') {
                  sanitizedRow[key.trim()] = String(value).trim();
                }
              });

              if (Object.keys(sanitizedRow).length > 0) {
                batch.push(
                  addDoc(collection(db, 'records'), {
                    ...sanitizedRow,
                    dataSource: dataSource.trim(),
                    createdAt: new Date().toISOString(),
                  }).catch((error: any) => {
                    errors.push(`Row ${i + 1}: ${error.message}`);
                    return undefined;
                  })
                );
              }
            }

            await Promise.all(batch);

            if (errors.length > 0) {
              return resolve(
                NextResponse.json(
                  {
                    success: true,
                    message: `Imported ${data.length - errors.length} records. ${errors.length} errors occurred.`,
                    errors,
                  },
                  { status: 200 }
                )
              );
            }

            resolve(
              NextResponse.json(
                {
                  success: true,
                  message: `Successfully imported ${data.length} records`,
                  count: data.length,
                },
                { status: 200 }
              )
            );
          } catch (error: any) {
            resolve(
              NextResponse.json(
                { error: error.message || 'Failed to import data' },
                { status: 500 }
              )
            );
          }
        },
        error: (error: Error) => {
          resolve(
            NextResponse.json(
              { error: `CSV parsing error: ${error.message}` },
              { status: 400 }
            )
          );
        },
      });
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process file' },
      { status: 500 }
    );
  }
}
