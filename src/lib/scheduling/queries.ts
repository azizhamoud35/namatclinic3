import { collection, query, where, getDocs, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function getCustomersWithoutAppointments() {
  const customersSnapshot = await getDocs(
    query(collection(db, 'users'), where('role', '==', 'customer'))
  );
  
  const customers = customersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  const now = new Date();
  const results = [];

  for (const customer of customers) {
    // Simple query without compound index
    const appointmentsSnapshot = await getDocs(
      query(
        collection(db, 'appointments'),
        where('customerId', '==', customer.id)
      )
    );

    // Filter appointments in memory
    const hasUpcoming = appointmentsSnapshot.docs.some(doc => {
      const appointmentDate = doc.data().date.toDate();
      return appointmentDate >= now;
    });

    if (!hasUpcoming) {
      results.push(customer);
    }
  }

  return results;
}

export async function getActiveCoaches() {
  const coachesSnapshot = await getDocs(
    query(collection(db, 'users'), where('role', '==', 'coach'))
  );
  
  return coachesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function getCoachAvailabilities(coachId: string) {
  const availabilitiesSnapshot = await getDocs(
    query(
      collection(db, 'availabilities'),
      where('coachId', '==', coachId),
      where('status', '==', 'approved')
    )
  );
  
  return availabilitiesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function isSlotAvailable(coachId: string, slot: Date) {
  const slotTimestamp = Timestamp.fromDate(slot);
  const snapshot = await getDocs(
    query(
      collection(db, 'appointments'),
      where('coachId', '==', coachId)
    )
  );

  // Check slot availability in memory
  return !snapshot.docs.some(doc => {
    const appointmentDate = doc.data().date.toDate();
    return appointmentDate.getTime() === slot.getTime();
  });
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