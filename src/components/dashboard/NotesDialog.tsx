import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, History, Trash2, Save } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { useDebouncedCallback } from 'use-debounce';

interface Appointment {
  id: string;
  customerId: string;
  customerName?: string;
  date: Date;
  notes?: string;
  coachId: string;
  status: 'scheduled' | 'completed' | 'missed';
}

interface NotesDialogProps {
  appointment: Appointment | null;
  onOpenChange: (open: boolean) => void;
  onNotesUpdate?: (id: string, notes: string) => void;
}

interface PreviousAppointment {
  id: string;
  date: Date;
  notes?: string;
  status: 'scheduled' | 'completed' | 'missed';
}

export function NotesDialog({ appointment, onOpenChange, onNotesUpdate }: NotesDialogProps) {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previousAppointments, setPreviousAppointments] = useState<PreviousAppointment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (appointment) {
      setNotes(appointment.notes || '');
      fetchPreviousAppointments();
    }
  }, [appointment]);

  const fetchPreviousAppointments = async () => {
    if (!appointment) return;

    try {
      setLoadingHistory(true);
      const appointmentsRef = collection(db, 'appointments');
      
      // Create a compound query index for customerId and date
      const q = query(
        appointmentsRef,
        where('customerId', '==', appointment.customerId),
        where('date', '<', appointment.date),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      const appointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      })) as PreviousAppointment[];

      setPreviousAppointments(appointments);
    } catch (error: any) {
      console.error('Error fetching previous appointments:', error);
      // Only show error toast for non-index-related errors
      if (error.code !== 'failed-precondition') {
        toast.error('Failed to load appointment history');
      }
      setPreviousAppointments([]); // Ensure empty state on error
    } finally {
      setLoadingHistory(false);
    }
  };

  const debouncedSave = useDebouncedCallback(async (value: string) => {
    if (!appointment) return;

    try {
      setIsSaving(true);
      await updateDoc(doc(db, 'appointments', appointment.id), {
        notes: value,
        updatedAt: Timestamp.now()
      });
      onNotesUpdate?.(appointment.id, value);
    } catch (error) {
      console.error('Error auto-saving notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  }, 1000);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (canEditNotes) {
      debouncedSave(value);
    }
  };

  const handleSave = async () => {
    if (!appointment) return;

    try {
      setIsLoading(true);
      await updateDoc(doc(db, 'appointments', appointment.id), {
        notes,
        updatedAt: Timestamp.now()
      });

      onNotesUpdate?.(appointment.id, notes);
      toast.success('Notes saved successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment) return;

    try {
      setIsLoading(true);
      await updateDoc(doc(db, 'appointments', appointment.id), {
        notes: '',
        updatedAt: Timestamp.now()
      });

      setNotes('');
      onNotesUpdate?.(appointment.id, '');
      toast.success('Notes deleted successfully');
    } catch (error) {
      console.error('Error deleting notes:', error);
      toast.error('Failed to delete notes');
    } finally {
      setIsLoading(false);
    }
  };

  const canEditNotes = currentUser?.uid === appointment?.coachId;

  return (
    <Dialog open={!!appointment} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 md:p-6 pb-4 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-xl md:text-2xl">
                Customer File - {appointment?.customerName}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{appointment && format(appointment.date, 'PPP p')}</span>
                <span>•</span>
                <Badge variant={
                  appointment?.status === 'completed' ? 'success' :
                  appointment?.status === 'missed' ? 'destructive' :
                  'secondary'
                }>
                  {appointment?.status}
                </Badge>
                {isSaving && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </span>
                )}
              </div>
            </div>
            {canEditNotes && (
              <div className="flex items-center gap-2">
                {notes && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Notes
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save & Close
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x overflow-hidden">
          {/* Current Notes */}
          <div className="p-4 md:p-6 flex flex-col h-full">
            <div className="font-medium text-lg mb-4">Current Appointment Notes</div>
            <Textarea
              placeholder={canEditNotes ? 
                "Enter your notes for this appointment..." : 
                "No notes available for this appointment"
              }
              className="flex-1 min-h-0 resize-none text-base p-4"
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              disabled={isLoading || !canEditNotes}
            />
          </div>

          {/* Previous Appointments */}
          <div className="p-4 md:p-6 flex flex-col h-full">
            <div className="font-medium text-lg flex items-center gap-2 mb-4">
              <History className="h-5 w-5" />
              Previous Appointments
            </div>
            {loadingHistory ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <ScrollArea className="flex-1 -mr-6 pr-6">
                <div className="space-y-6">
                  {previousAppointments.map((apt) => (
                    <div key={apt.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {format(apt.date, 'PPP p')}
                        </div>
                        <Badge variant={
                          apt.status === 'completed' ? 'success' :
                          apt.status === 'missed' ? 'destructive' :
                          'secondary'
                        }>
                          {apt.status}
                        </Badge>
                      </div>
                      <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm">
                        {apt.notes || 'No notes recorded for this appointment'}
                      </div>
                      <Separator />
                    </div>
                  ))}
                  {previousAppointments.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-[40vh] text-muted-foreground">
                      <History className="h-12 w-12 mb-4 opacity-50" />
                      <p>No previous appointments found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}