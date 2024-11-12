import { Timestamp } from 'firebase/firestore';
import { addMinutes, isBefore, isAfter, startOfDay, setHours, setMinutes } from 'date-fns';

const SESSION_TIMES = {
  session1: { start: { hours: 17, minutes: 0 }, end: { hours: 20, minutes: 0 } },
  session2: { start: { hours: 20, minutes: 0 }, end: { hours: 22, minutes: 0 } }
};

const APPOINTMENT_DURATION = 15; // minutes

export function generateTimeSlots(
  availability: any,
  existingAppointments: Date[],
  now: Date = new Date()
) {
  const slots: Date[] = [];
  const startDate = availability.startDate.toDate();
  const endDate = availability.endDate.toDate();
  
  // Skip if availability is in the past
  if (isAfter(now, endDate)) return slots;
  
  // Start from today or availability start date, whichever is later
  let currentDate = startOfDay(isBefore(startDate, now) ? now : startDate);
  
  while (isBefore(currentDate, endDate)) {
    const dayOfWeek = currentDate.getDay().toString();
    const selectedSessions = availability.selectedDays[dayOfWeek] || [];

    for (const session of selectedSessions) {
      const sessionTimes = SESSION_TIMES[session as keyof typeof SESSION_TIMES];
      if (!sessionTimes) continue;

      let slotTime = new Date(currentDate);
      slotTime = setHours(slotTime, sessionTimes.start.hours);
      slotTime = setMinutes(slotTime, sessionTimes.start.minutes);
      
      const sessionEnd = new Date(currentDate);
      sessionEnd.setHours(sessionTimes.end.hours, sessionTimes.end.minutes, 0, 0);

      // Generate slots for this session
      while (isBefore(slotTime, sessionEnd)) {
        // Skip slots in the past
        if (isAfter(slotTime, now)) {
          // Check if slot is already booked
          const isBooked = existingAppointments.some(
            apt => apt.getTime() === slotTime.getTime()
          );
          
          if (!isBooked) {
            slots.push(new Date(slotTime));
          }
        }
        
        slotTime = addMinutes(slotTime, APPOINTMENT_DURATION);
      }
    }

    currentDate = addMinutes(currentDate, 24 * 60); // Next day
  }

  return slots.sort((a, b) => a.getTime() - b.getTime());
}

// Re-export the function with the old name for backward compatibility
export const generateAvailableTimeSlots = generateTimeSlots;