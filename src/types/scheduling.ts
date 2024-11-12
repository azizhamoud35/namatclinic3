import { Timestamp } from 'firebase/firestore';

export interface TimeSlot {
  date: Date;
  coachId: string;
  availabilityId: string;
}

export interface SchedulingAvailability {
  id: string;
  coachId: string;
  startDate: Timestamp;
  endDate: Timestamp;
  selectedDays: {
    [key: number]: string[]; // day of week -> array of time slots
  };
  status: 'pending' | 'approved' | 'rejected';
}