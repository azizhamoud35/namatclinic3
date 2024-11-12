import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config';
import type { Availability } from '@/types';

export async function getApprovedAvailabilities(): Promise<Availability[]> {
  console.log('Fetching approved availabilities...');
  const availabilitiesQuery = query(
    collection(db, 'availabilities'),
    where('status', '==', 'approved')
  );
  
  const snapshot = await getDocs(availabilitiesQuery);
  const availabilities = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Availability[];
  
  console.log(`Found ${availabilities.length} approved availabilities`);
  return availabilities;
}