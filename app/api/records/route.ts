import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';

export async function GET() {
  try {
    const recordsRef = collection(db, 'records');
    const q = query(recordsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const records = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, data: records }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch records' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ...recordData } = body;

    const docRef = await addDoc(collection(db, 'records'), {
      ...recordData,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Record created successfully',
        id: docRef.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create record' },
      { status: 500 }
    );
  }
}
