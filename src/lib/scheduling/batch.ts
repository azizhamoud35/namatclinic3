import { collection, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { User } from './types';

export async function createAppointmentBatch(
  batch: ReturnType<typeof writeBatch>,
  customer: User,
  coachId: string,
  slot: Date
) {
  const newAppointmentRef = doc(collection(db, 'appointments'));
  batch.set(newAppointmentRef, {
    customerId: customer.id,
    coachId,
    date: Timestamp.fromDate(slot),
    status: 'scheduled',
    createdAt: Timestamp.now()
  });

  const customerRef = doc(db, 'users', customer.id);
  batch.update(customerRef, {
    lastAppointmentDate: Timestamp.fromDate(slot)
  });
}