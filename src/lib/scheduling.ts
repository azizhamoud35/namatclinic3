import { collection, query, where, getDocs, addDoc, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { addMonths, isBefore, startOfDay, endOfDay } from 'date-fns';
import { generateTimeSlots } from './appointments';

export async function triggerScheduling() {
  try {
    // Get all active customers without upcoming appointments
    const customersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'customer'),
      where('status', '==', 'active')
    );
    const customersSnapshot = await getDocs(customersQuery);
    const customers = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get all approved availabilities
    const availabilitiesQuery = query(
      collection(db, 'availabilities'),
      where('status', '==', 'approved')
    );
    const availabilitiesSnapshot = await getDocs(availabilitiesQuery);
    const availabilities = availabilitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // For each customer
    for (const customer of customers) {
      // Check if customer already has an upcoming appointment
      const now = new Date();
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('customerId', '==', customer.uid),
        where('date', '>=', now)
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      
      if (appointmentsSnapshot.empty) {
        // Customer needs an appointment
        let appointmentScheduled = false;

        // Try each availability
        for (const availability of availabilities) {
          if (appointmentScheduled) break;

          const startDate = availability.startDate.toDate();
          const endDate = availability.endDate.toDate();

          // Only consider current and future availabilities
          if (isBefore(endDate, now)) continue;

          // Generate all possible time slots for this availability
          const slots = generateTimeSlots(availability);

          // Try each slot until we find one that works
          for (const slot of slots) {
            // Check if slot is already taken
            const slotStart = startOfDay(slot);
            const slotEnd = endOfDay(slot);
            
            const existingAppointmentsQuery = query(
              collection(db, 'appointments'),
              where('coachId', '==', availability.coachId),
              where('date', '>=', slotStart),
              where('date', '<=', slotEnd)
            );
            const existingAppointmentsSnapshot = await getDocs(existingAppointmentsQuery);

            if (existingAppointmentsSnapshot.empty) {
              // Slot is available, create appointment
              await addDoc(collection(db, 'appointments'), {
                customerId: customer.uid,
                coachId: availability.coachId,
                date: Timestamp.fromDate(slot),
                status: 'scheduled',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
              });

              appointmentScheduled = true;
              break;
            }
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error in scheduling process:', error);
    throw error;
  }
}

export async function scheduleManualAppointment(
  customerId: string,
  coachId: string,
  date: Date
) {
  try {
    // Validate the appointment doesn't overlap with existing ones
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    const existingAppointmentsQuery = query(
      collection(db, 'appointments'),
      where('coachId', '==', coachId),
      where('date', '>=', dayStart),
      where('date', '<=', dayEnd)
    );
    
    const existingAppointmentsSnapshot = await getDocs(existingAppointmentsQuery);
    
    if (!existingAppointmentsSnapshot.empty) {
      throw new Error('Time slot already taken');
    }

    // Create the appointment
    const appointmentRef = await addDoc(collection(db, 'appointments'), {
      customerId,
      coachId,
      date: Timestamp.fromDate(date),
      status: 'scheduled',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // Update customer's next appointment date
    const customerRef = doc(db, 'users', customerId);
    await updateDoc(customerRef, {
      nextAppointment: Timestamp.fromDate(addMonths(date, 1))
    });

    return appointmentRef.id;
  } catch (error) {
    console.error('Error in manual scheduling:', error);
    throw error;
  }
}