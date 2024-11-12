import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface Appointment {
  id: string;
  customerName: string;
  date: Date;
  status: string;
  notes?: string;
}

export function CoachAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    async function fetchAppointments() {
      if (!currentUser) return;

      try {
        // Create a query with a single orderBy clause
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('coachId', '==', currentUser.uid),
          orderBy('date')
        );

        const querySnapshot = await getDocs(appointmentsQuery);
        const appointmentsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate(),
        })) as Appointment[];

        setAppointments(appointmentsList);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAppointments();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No appointments scheduled
          </p>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{appointment.customerName}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(appointment.date, 'PPP p')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      appointment.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {appointment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}