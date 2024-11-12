import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config';

export async function getApprovedAvailabilities() {
  const q = query(
    collection(db, 'availabilities'),
    where('status', '==', 'approved')
  );
  return getDocs(q);
}