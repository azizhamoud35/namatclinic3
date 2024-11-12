import { collection, query, where, getDocs, Timestamp, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { generateTimeSlots } from './slots';
import { createAppointment } from '@/lib/firebase';

export async function triggerScheduling() {
  try {
    console.log('🚀 Starting scheduling process...');
    let appointmentsCreated = 0;

    await runTransaction(db, async (transaction) => {
      // Step 1: Get all customers
      console.log('📋 Step 1: Fetching customers...');
      const customersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'customer')
      );
      
      const customersSnapshot = await getDocs(customersQuery);
      const customers = customersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(`✅ Found ${customers.length} customers:`, customers);

      // Step 2: Get approved availabilities
      console.log('📅 Step 2: Fetching approved availabilities...');
      const availabilitiesQuery = query(
        collection(db, 'availabilities'),
        where('status', '==', 'approved')
      );
      
      const availabilitiesSnapshot = await getDocs(availabilitiesQuery);
      const availabilities = availabilitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(`✅ Found ${availabilities.length} approved availabilities:`, availabilities);

      if (availabilities.length === 0) {
        console.log('⚠️ No approved availabilities found. Exiting...');
        return;
      }

      // Step 3: Get existing appointments
      console.log('🔍 Step 3: Checking existing appointments...');
      const now = new Date();
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('date', '>=', Timestamp.fromDate(now))
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const bookedSlots = new Map();
      
      appointmentsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const dateTime = data.date.toDate().getTime();
        if (!bookedSlots.has(dateTime)) {
          bookedSlots.set(dateTime, new Set());
        }
        bookedSlots.get(dateTime).add(data.coachId);
      });
      console.log(`✅ Found ${appointmentsSnapshot.size} existing appointments`);
      console.log('📊 Booked slots:', Object.fromEntries(bookedSlots));

      // Step 4: Process each customer
      console.log('👥 Step 4: Processing customers...');
      for (const customer of customers) {
        console.log(`\n🔄 Processing customer ${customer.id}...`);
        
        // Check existing appointments
        const upcomingApptsQuery = query(
          collection(db, 'appointments'),
          where('customerId', '==', customer.id),
          where('date', '>=', Timestamp.now())
        );
        
        const upcomingApptsSnapshot = await getDocs(upcomingApptsQuery);
        
        if (upcomingApptsSnapshot.empty) {
          console.log(`✅ Customer ${customer.id} needs an appointment`);
          let appointmentCreated = false;

          // Try each availability
          for (const availability of availabilities) {
            if (appointmentCreated) break;

            console.log(`\n📅 Checking availability ${availability.id}`);
            console.log('Availability details:', {
              startDate: availability.startDate.toDate(),
              endDate: availability.endDate.toDate(),
              selectedDays: availability.selectedDays
            });

            // Generate slots
            const slots = generateTimeSlots(
              availability.startDate.toDate(),
              availability.endDate.toDate(),
              availability.selectedDays || {}
            );

            console.log(`✅ Generated ${slots.length} potential slots:`, 
              slots.map(s => s.toISOString())
            );

            // Try each slot
            for (const slot of slots) {
              const slotTime = slot.getTime();
              const bookedCoaches = bookedSlots.get(slotTime) || new Set();

              console.log(`\n⏰ Checking slot ${slot.toISOString()}`);
              console.log(`Booked coaches for this slot:`, Array.from(bookedCoaches));

              // Check availability
              if (!bookedCoaches.has(availability.coachId)) {
                console.log(`✅ Slot is available for coach ${availability.coachId}`);

                try {
                  // Double-check availability
                  const doubleCheckQuery = query(
                    collection(db, 'appointments'),
                    where('coachId', '==', availability.coachId),
                    where('date', '==', Timestamp.fromDate(slot))
                  );
                  
                  const doubleCheckSnapshot = await getDocs(doubleCheckQuery);
                  
                  if (doubleCheckSnapshot.empty) {
                    console.log('🎯 Creating appointment...');
                    
                    // Create appointment
                    await createAppointment({
                      customerId: customer.id,
                      coachId: availability.coachId,
                      date: slot,
                      status: 'scheduled'
                    });

                    // Update tracking
                    if (!bookedSlots.has(slotTime)) {
                      bookedSlots.set(slotTime, new Set());
                    }
                    bookedSlots.get(slotTime).add(availability.coachId);

                    appointmentCreated = true;
                    appointmentsCreated++;
                    console.log(`✅ Created appointment for customer ${customer.id}`);
                    break;
                  } else {
                    console.log('⚠️ Slot was just taken, trying next slot');
                  }
                } catch (error) {
                  console.error('❌ Error creating appointment:', error);
                  continue;
                }
              } else {
                console.log('⚠️ Slot is already booked for this coach');
              }
            }
          }
        } else {
          console.log(`ℹ️ Customer ${customer.id} already has upcoming appointments`);
        }
      }
    });

    console.log(`\n🎉 Scheduling process completed. Created ${appointmentsCreated} appointments.`);
    
    if (appointmentsCreated === 0) {
      toast.info('No new appointments were needed');
    } else {
      toast.success(`Created ${appointmentsCreated} new appointments`);
    }

    return { success: true, appointmentsCreated };
  } catch (error) {
    console.error('❌ Error in scheduling process:', error);
    toast.error('Failed to complete scheduling process');
    throw error;
  }
}