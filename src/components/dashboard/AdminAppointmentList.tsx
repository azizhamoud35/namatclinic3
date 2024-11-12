import { useState, useEffect } from 'react';
import { collection, query, getDocs, deleteDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  coachId: string;
  customerId: string;
  date: Date;
  status: string;
  coachName?: string;
  customerName?: string;
}

export function AdminAppointmentList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [processingDelete, setProcessingDelete] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        orderBy('date', 'desc')
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      
      const appointmentsData = await Promise.all(
        appointmentsSnapshot.docs.map(async (doc) => {
          const data = doc.data();
          
          // Fetch coach and customer names
          const [coachDoc, customerDoc] = await Promise.all([
            getDocs(query(collection(db, 'users'), where('id', '==', data.coachId))),
            getDocs(query(collection(db, 'users'), where('id', '==', data.customerId)))
          ]);

          const coachData = coachDoc.docs[0]?.data();
          const customerData = customerDoc.docs[0]?.data();

          return {
            id: doc.id,
            ...data,
            date: data.date.toDate(),
            coachName: coachData ? `${coachData.firstName} ${coachData.lastName}` : 'Unknown Coach',
            customerName: customerData ? `${customerData.firstName} ${customerData.lastName}` : 'Unknown Customer'
          };
        })
      );

      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setProcessingDelete(true);
      await deleteDoc(doc(db, 'appointments', deleteId));
      setAppointments(prev => prev.filter(apt => apt.id !== deleteId));
      toast.success('Appointment deleted successfully');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to delete appointment');
    } finally {
      setProcessingDelete(false);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          className="flex items-center justify-between p-4 border rounded-lg bg-card"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{appointment.customerName}</span>
              <span className="text-muted-foreground">with</span>
              <span className="font-medium">{appointment.coachName}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {format(appointment.date, 'PPP p')}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant={
              appointment.status === 'completed' ? 'success' :
              appointment.status === 'missed' ? 'destructive' :
              'secondary'
            }>
              {appointment.status}
            </Badge>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setDeleteId(appointment.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      {appointments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No appointments found
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={processingDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {processingDelete ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}