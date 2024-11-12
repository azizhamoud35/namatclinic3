import { collection, query, where, getDocs, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateTimeSlots } from '@/lib/appointments';
import { toast } from 'sonner';

export async function getCustomersWithoutAppointments() {
  const customersQuery = query(
    collection(db, 'users'),
    where('role', '==', 'customer')
  );
  const snapshot = await getDocs(customersQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getActiveCoaches() {
  const coachesQuery = query(
    collection(db, 'users'),
    where('role', '==', 'coach')
  );
  const snapshot = await getDocs(coachesQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getCoachAvailabilities(coachId: string) {
  const availabilitiesQuery = query(
    collection(db, 'availabilities'),
    where('coachId', '==', coachId),
    where('status', '==', 'approved')
  );
  const snapshot = await getDocs(availabilitiesQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function checkExistingAppointments(customerId: string, date: Date) {
  const appointmentsQuery = query(
    collection(db, 'appointments'),
    where('customerId', '==', customerId),
    where('date', '>=', Timestamp.fromDate(date))
  );
  const snapshot = await getDocs(appointmentsQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function checkSlotAvailability(coachId: string, slot: Date) {
  const existingBookingQuery = query(
    collection(db, 'appointments'),
    where('coachId', '==', coachId),
    where('date', '==', Timestamp.fromDate(slot))
  );
  const snapshot = await getDocs(existingBookingQuery);
  return snapshot.empty;
}

export async function createAppointment(customerId: string, coachId: string, slot: Date) {
  return await addDoc(collection(db, 'appointments'), {
    customerId,
    coachId,
    date: Timestamp.fromDate(slot),
    status: 'scheduled',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
}