import { Timestamp } from 'firebase/firestore';

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface DayAvailability {
  dayOfWeek: number;
  timeSlots: TimeSlot[];
}

export interface Availability {
  id: string;
  coachId: string;
  startDate: Timestamp;
  endDate: Timestamp;
  selectedDays: { [key: string]: string[] };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'coach' | 'customer';
  status: 'active' | 'inactive';
  lastAppointmentDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}