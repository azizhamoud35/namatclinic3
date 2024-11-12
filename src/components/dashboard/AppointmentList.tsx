import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { NotesDialog } from './NotesDialog';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  customerId: string;
  customerName?: string;
  date: Date;
  status: 'scheduled' | 'completed' | 'missed';
  notes?: string;
  coachId: string;
}

export function AppointmentList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.uid) {
      fetchAppointments();
    }
  }, [currentUser]);

  const fetchAppointments = async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('coachId', '==', currentUser.uid),
        where('date', '>=', Timestamp.now())
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      
      // Get all unique customer IDs
      const customerIds = new Set(
        appointmentsSnapshot.docs.map(doc => doc.data().customerId)
      );

      // Fetch all customers in one query
      const customersSnapshot = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'customer'))
      );
      
      // Create a map of customer IDs to names
      const customerNames = new Map();
      customersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        customerNames.set(doc.id, `${data.firstName} ${data.lastName}`);
      });

      const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        customerName: customerNames.get(doc.data().customerId) || 'Unknown Customer'
      }));

      setAppointments(appointmentsData.sort((a, b) => a.date.getTime() - b.date.getTime()));
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appointmentId: string, status: 'completed' | 'missed') => {
    try {
      setProcessingId(appointmentId);
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status,
        updatedAt: Timestamp.now()
      });
      
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId ? { ...apt, status } : apt
      ));
      
      toast.success(`Appointment marked as ${status}`);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Failed to update appointment status');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No upcoming appointments
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-card gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{appointment.customerName}</span>
              <Badge variant={
                appointment.status === 'completed' ? 'success' :
                appointment.status === 'missed' ? 'destructive' :
                'secondary'
              }>
                {appointment.status}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {format(appointment.date, 'PPP p')}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {appointment.status === 'scheduled' && (
              <>
                <Button
                  variant="outline"
                  className="border-green-500 hover:bg-green-500 hover:text-white"
                  onClick={() => handleUpdateStatus(appointment.id, 'completed')}
                  disabled={!!processingId}
                >
                  {processingId === appointment.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Attended
                </Button>
                <Button
                  variant="outline"
                  className="border-red-500 hover:bg-red-500 hover:text-white"
                  onClick={() => handleUpdateStatus(appointment.id, 'missed')}
                  disabled={!!processingId}
                >
                  {processingId === appointment.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Did Not Attend
                </Button>
              </>
            )}
            <Button
              onClick={() => setSelectedAppointment(appointment)}
              className="border-[#004250] text-[#004250] hover:bg-[#004250] hover:text-white"
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              Open File
            </Button>
          </div>
        </div>
      ))}

      <NotesDialog
        appointment={selectedAppointment}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
        onNotesUpdate={(id, notes) => {
          setAppointments(prev => prev.map(apt => 
            apt.id === id ? { ...apt, notes } : apt
          ));
        }}
      />
    </div>
  );
}