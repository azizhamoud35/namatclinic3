import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { generateTimeSlots } from '@/lib/scheduling/slots';
import { createAppointment } from '@/lib/firebase';

interface ManualSchedulingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface TimeSlot {
  date: Date;
  coachId: string;
  availabilityId: string;
}

export function ManualSchedulingDialog({ open, onOpenChange }: ManualSchedulingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<User[]>([]);
  const [coaches, setCoaches] = useState<User[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedCoach, setSelectedCoach] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  useEffect(() => {
    if (open) {
      fetchUsers();
      setSelectedCustomer('');
      setSelectedCoach('');
      setSelectedSlot('');
      setAvailableSlots([]);
    }
  }, [open]);

  useEffect(() => {
    if (selectedCoach) {
      fetchAvailableSlots(selectedCoach);
    } else {
      setAvailableSlots([]);
    }
  }, [selectedCoach]);

  const fetchUsers = async () => {
    try {
      // Get all customers
      const customersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'customer')
      );

      // Get coaches
      const coachesQuery = query(
        collection(db, 'users'),
        where('role', '==', 'coach')
      );

      const [customersSnapshot, coachesSnapshot] = await Promise.all([
        getDocs(customersQuery),
        getDocs(coachesQuery)
      ]);

      setCustomers(customersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[]);

      setCoaches(coachesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[]);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  const fetchAvailableSlots = async (coachId: string) => {
    try {
      setLoading(true);
      
      // Get approved availabilities
      const availabilitiesQuery = query(
        collection(db, 'availabilities'),
        where('coachId', '==', coachId),
        where('status', '==', 'approved')
      );
      
      // Get existing appointments
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('coachId', '==', coachId),
        where('date', '>=', Timestamp.fromDate(new Date()))
      );

      const [availabilitiesSnapshot, appointmentsSnapshot] = await Promise.all([
        getDocs(availabilitiesQuery),
        getDocs(appointmentsQuery)
      ]);

      // Get all booked slots
      const bookedSlots = appointmentsSnapshot.docs.map(doc => 
        doc.data().date.toDate().getTime()
      );

      const slots: TimeSlot[] = [];

      // Generate available slots for each availability
      availabilitiesSnapshot.docs.forEach(doc => {
        const availability = { id: doc.id, ...doc.data() };
        const availabilitySlots = generateTimeSlots(
          availability.startDate.toDate(),
          availability.endDate.toDate(),
          availability.selectedDays || {}
        );

        // Filter out booked slots
        const availableSlots = availabilitySlots.filter(slot => 
          !bookedSlots.includes(slot.getTime())
        );

        slots.push(...availableSlots.map(date => ({
          date,
          coachId,
          availabilityId: doc.id
        })));
      });

      setAvailableSlots(slots.sort((a, b) => a.date.getTime() - b.date.getTime()));
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error('Failed to fetch available slots');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!selectedCustomer || !selectedCoach || !selectedSlot) {
      toast.error('Please select all required fields');
      return;
    }

    try {
      setLoading(true);
      const slot = availableSlots.find(s => s.date.getTime() === parseInt(selectedSlot));
      if (!slot) throw new Error('Invalid slot selected');

      // Double-check that the slot is still available
      const doubleCheckQuery = query(
        collection(db, 'appointments'),
        where('coachId', '==', selectedCoach),
        where('date', '==', Timestamp.fromDate(slot.date))
      );
      
      const doubleCheckSnapshot = await getDocs(doubleCheckQuery);
      
      if (!doubleCheckSnapshot.empty) {
        toast.error('This slot has just been booked. Please select another time.');
        await fetchAvailableSlots(selectedCoach);
        return;
      }

      await createAppointment({
        customerId: selectedCustomer,
        coachId: selectedCoach,
        date: slot.date,
        status: 'scheduled'
      });

      toast.success('Appointment scheduled successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      toast.error('Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manual Scheduling</DialogTitle>
          <DialogDescription>
            Schedule an appointment for a specific customer with a coach.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Customer</Label>
            <Select
              value={selectedCustomer}
              onValueChange={setSelectedCustomer}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName} ({customer.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Coach</Label>
            <Select
              value={selectedCoach}
              onValueChange={(value) => {
                setSelectedCoach(value);
                setSelectedSlot('');
              }}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select coach" />
              </SelectTrigger>
              <SelectContent>
                {coaches.map((coach) => (
                  <SelectItem key={coach.id} value={coach.id}>
                    {coach.firstName} {coach.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCoach && (
            <div className="space-y-2">
              <Label>Available Time Slots</Label>
              <Select
                value={selectedSlot}
                onValueChange={setSelectedSlot}
                disabled={loading || availableSlots.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    loading ? "Loading slots..." :
                    availableSlots.length === 0 ? "No available slots" :
                    "Select time slot"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableSlots.map((slot) => (
                    <SelectItem
                      key={slot.date.getTime()}
                      value={slot.date.getTime().toString()}
                    >
                      {format(slot.date, 'PPP p')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSchedule}
              disabled={loading || !selectedCustomer || !selectedCoach || !selectedSlot}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                'Schedule Appointment'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}