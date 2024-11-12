import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { triggerScheduling } from '@/lib/scheduling';

const DAYS = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday'
};

const SESSIONS = {
  'session1': '5:00 PM - 8:00 PM',
  'session2': '8:00 PM - 10:00 PM'
};

export function AvailabilityList() {
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchAvailabilities = async () => {
    try {
      const availabilitiesQuery = query(
        collection(db, 'availabilities'),
        where('status', 'in', ['pending', 'approved'])
      );
      const availabilitiesSnapshot = await getDocs(availabilitiesQuery);
      
      const availabilitiesData = await Promise.all(
        availabilitiesSnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const coachDoc = await getDocs(
            query(collection(db, 'users'), where('uid', '==', data.coachId))
          );
          const coachData = coachDoc.docs[0]?.data() || {};
          
          return {
            id: doc.id,
            ...data,
            coach: coachData
          };
        })
      );
      
      setAvailabilities(availabilitiesData);
    } catch (error) {
      console.error('Error fetching availabilities:', error);
      toast.error('Failed to fetch availabilities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailabilities();
  }, []);

  const handleApprove = async (availabilityId: string) => {
    try {
      setProcessingId(availabilityId);
      
      // First update the availability status
      await updateDoc(doc(db, 'availabilities', availabilityId), {
        status: 'approved',
        updatedAt: Timestamp.now()
      });

      toast.success('Availability approved');
      
      // Then trigger scheduling
      await triggerScheduling();
      toast.success('Appointments scheduled successfully');
      
      await fetchAvailabilities();
    } catch (error) {
      console.error('Error approving availability:', error);
      toast.error('Failed to approve availability');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (availabilityId: string) => {
    try {
      setProcessingId(availabilityId);
      await updateDoc(doc(db, 'availabilities', availabilityId), {
        status: 'rejected',
        updatedAt: Timestamp.now()
      });
      
      toast.success('Availability rejected');
      await fetchAvailabilities();
    } catch (error) {
      console.error('Error rejecting availability:', error);
      toast.error('Failed to reject availability');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (availabilityId: string) => {
    try {
      setProcessingId(availabilityId);
      await deleteDoc(doc(db, 'availabilities', availabilityId));
      
      toast.success('Availability deleted');
      await fetchAvailabilities();
    } catch (error) {
      console.error('Error deleting availability:', error);
      toast.error('Failed to delete availability');
    } finally {
      setProcessingId(null);
    }
  };

  const renderDaySchedule = (selectedDays: { [key: string]: string[] }) => {
    if (!selectedDays) return null;

    return Object.entries(selectedDays).map(([day, sessions]) => (
      <div key={day} className="flex flex-col gap-1 p-2 bg-secondary/50 rounded-lg">
        <span className="font-medium text-sm">{DAYS[day as keyof typeof DAYS]}</span>
        <div className="flex flex-wrap gap-1">
          {sessions.map((session, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {SESSIONS[session as keyof typeof SESSIONS]}
            </Badge>
          ))}
        </div>
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {availabilities.map((availability) => (
        <div
          key={availability.id}
          className="rounded-lg border bg-card text-card-foreground shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">
                {availability.coachName || 'Unknown Coach'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {format(availability.startDate.toDate(), 'PPP')} - {format(availability.endDate.toDate(), 'PPP')}
              </p>
            </div>
            <Badge variant={availability.status === 'approved' ? 'success' : 'secondary'}>
              {availability.status}
            </Badge>
          </div>
          
          <div className="grid gap-2 mb-4">
            {renderDaySchedule(availability.selectedDays)}
          </div>

          <div className="flex items-center gap-2">
            {availability.status === 'pending' && (
              <>
                <Button
                  onClick={() => handleApprove(availability.id)}
                  disabled={!!processingId}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processingId === availability.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
                <Button
                  onClick={() => handleReject(availability.id)}
                  disabled={!!processingId}
                  variant="destructive"
                >
                  {processingId === availability.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
              </>
            )}
            {availability.status === 'approved' && (
              <Button
                onClick={() => handleDelete(availability.id)}
                disabled={!!processingId}
                variant="destructive"
              >
                {processingId === availability.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </Button>
            )}
          </div>
        </div>
      ))}
      
      {availabilities.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No availabilities found
        </div>
      )}
    </div>
  );
}