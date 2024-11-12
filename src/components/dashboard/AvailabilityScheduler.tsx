import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDoc, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

const formSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
});

interface AvailabilitySchedulerProps {
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

export function AvailabilityScheduler({ onSubmitSuccess, onCancel }: AvailabilitySchedulerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState<{ [key: number]: string[] }>({});
  const { currentUser, userData } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: new Date(),
      endDate: new Date(),
    },
  });

  const weekDays = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  const sessions = [
    { value: 'session1', label: '5:00 PM - 8:00 PM' },
    { value: 'session2', label: '8:00 PM - 10:00 PM' },
  ];

  const toggleSession = (dayIndex: number, session: string) => {
    setSelectedDays(prev => {
      const currentSessions = prev[dayIndex] || [];
      const newSessions = currentSessions.includes(session)
        ? currentSessions.filter(s => s !== session)
        : [...currentSessions, session];

      const newSelectedDays = {
        ...prev,
        [dayIndex]: newSessions,
      };

      // Remove the day if no sessions are selected
      if (newSessions.length === 0) {
        delete newSelectedDays[dayIndex];
      }

      return newSelectedDays;
    });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !userData) return;

    try {
      setIsLoading(true);

      // Validate that at least one day and session is selected
      if (Object.keys(selectedDays).length === 0) {
        toast.error('Please select at least one day and session');
        return;
      }

      // Check if dates are valid
      if (values.endDate < values.startDate) {
        toast.error('End date cannot be before start date');
        return;
      }

      // Check for existing overlapping availabilities
      const availabilitiesRef = collection(db, 'availabilities');
      const q = query(
        availabilitiesRef,
        where('coachId', '==', currentUser.uid),
        where('status', 'in', ['pending', 'approved'])
      );
      const querySnapshot = await getDocs(q);
      
      const hasOverlap = querySnapshot.docs.some(doc => {
        const availability = doc.data();
        const existingStart = availability.startDate.toDate();
        const existingEnd = availability.endDate.toDate();
        return (
          (values.startDate <= existingEnd && values.endDate >= existingStart) ||
          (existingStart <= values.endDate && existingEnd >= values.startDate)
        );
      });

      if (hasOverlap) {
        toast.error('Selected dates overlap with existing availability');
        return;
      }

      // Create availability document
      await addDoc(collection(db, 'availabilities'), {
        coachId: currentUser.uid,
        coachName: `${userData.firstName} ${userData.lastName}`,
        startDate: Timestamp.fromDate(values.startDate),
        endDate: Timestamp.fromDate(values.endDate),
        selectedDays,
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      toast.success('Availability schedule submitted for approval');
      onSubmitSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit availability');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Select Available Days & Sessions</h3>
          <div className="grid gap-4">
            {weekDays.map((day) => (
              <div key={day.value} className="flex items-center justify-between p-4 border rounded-lg">
                <span className="font-medium">{day.label}</span>
                <div className="flex gap-4">
                  {sessions.map((session) => (
                    <div key={session.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${day.value}-${session.value}`}
                        checked={selectedDays[day.value]?.includes(session.value)}
                        onCheckedChange={() => toggleSession(day.value, session.value)}
                      />
                      <label
                        htmlFor={`${day.value}-${session.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {session.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Schedule'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}