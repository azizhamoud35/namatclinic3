import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config';

export async function getActiveCustomers() {
  try {
    const customersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'customer')
    );
    const snapshot = await getDocs(customersQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
}

export async function getActiveCoaches() {
  try {
    const coachesQuery = query(
      collection(db, 'users'),
      where('role', '==', 'coach')
    );
    const snapshot = await getDocs(coachesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching coaches:', error);
    throw error;
  }
}