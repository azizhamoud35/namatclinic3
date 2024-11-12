import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config';
import type { User } from '@/types';

export async function getCustomers(): Promise<User[]> {
  console.log('Fetching customers...');
  
  const customersQuery = query(
    collection(db, 'users'),
    where('role', '==', 'customer')
  );
  
  const snapshot = await getDocs(customersQuery);
  const customers = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as User[];
  
  console.log(`Found ${customers.length} customers`);
  return customers;
}