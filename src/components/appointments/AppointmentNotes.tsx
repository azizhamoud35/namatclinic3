import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { History, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import type { Appointment } from '@/lib/firebase/queries/appointments';

interface AppointmentNotesProps {
  appointment: Appointment & { customerName?: string };
  notes: string;
  onNotesChange: (notes: string) => void;
  onDeleteNotes: () => void;
  isLoading: boolean;
  previousAppointments: Appointment[];
}

export function AppointmentNotes({
  appointment,
  notes,
  onNotesChange,
  onDeleteNotes,
  isLoading,
  previousAppointments
}: AppointmentNotesProps) {
  const { currentUser } = useAuth();
  const canEdit = currentUser?.uid === appointment.coachId;

  return (
    <div className="flex-1 min-h-0 grid grid-cols-2 gap-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-medium">Current Appointment Notes</div>
          {canEdit && notes && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeleteNotes}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Textarea
          placeholder={canEdit ? "Enter your notes for this appointment..." : "No notes available"}
          className="h-[300px] resize-none"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          disabled={isLoading || !canEdit}
        />
      </div>

      <div className="space-y-4">
        <div className="font-medium flex items-center gap-2">
          <History className="h-4 w-4" />
          Previous Appointments
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {previousAppointments.map((apt) => (
                <div key={apt.id} className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    {format(apt.date, 'PPP p')}
                  </div>
                  <div className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                    {apt.notes || 'No notes recorded'}
                  </div>
                  <Separator />
                </div>
              ))}
              {previousAppointments.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No previous appointments found
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}