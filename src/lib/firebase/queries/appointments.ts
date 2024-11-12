import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AppointmentData {
  customerId: string;
  coachId: string;
  date: Date;
  status: string;
}

export async function createAppointment(data: AppointmentData) {
  const appointmentsRef = collection(db, 'appointments');
  return await addDoc(appointmentsRef, {
    ...data,
    date: Timestamp.fromDate(data.date),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
}