import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2, Calendar, Edit } from 'lucide-react';
import { AvailabilityScheduler } from './AvailabilityScheduler';

interface Availability {
  id: string;
  startDate: Timestamp;
  endDate: Timestamp;
  selectedDays: { [key: number]: string[] };
  status: 'pending' | 'approved' | 'rejected';
}

export function CoachAvailabilityList() {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduler, setShowScheduler] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchAvailabilities();
  }, [currentUser]);

  const fetchAvailabilities = async () => {
    if (!currentUser?.uid) return;

    try {
      const availabilitiesRef = collection(db, 'availabilities');
      const q = query(
        availabilitiesRef,
        where('coachId', '==', currentUser.uid),
        where('status', '==', 'approved')
      );
      const querySnapshot = await getDocs(q);
      
      const availabilityData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Availability[];

      setAvailabilities(availabilityData);
    } catch (error) {
      console.error('Error fetching availabilities:', error);
      toast.error('Failed to load availabilities');
    } finally {
      setLoading(false);
    }
  };

  const renderSelectedDays = (selectedDays: { [key: number]: string[] } | undefined) => {
    if (!selectedDays) return null;
    
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return Object.entries(selectedDays).map(([day, sessions]) => {
      if (!sessions || !Array.isArray(sessions)) return null;
      return (
        <Badge key={day} variant="secondary" className="mr-1 mb-1">
          {weekDays[Number(day)]}: {sessions.map(s => s === 'session1' ? '5-8' : '8-10').join(', ')}
        </Badge>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-semibold tracking-tight">Your Availability</h3>
          <p className="text-sm text-muted-foreground">
            View and manage your approved availability schedules
          </p>
        </div>
        <Button onClick={() => setShowScheduler(true)}>
          <Calendar className="mr-2 h-4 w-4" />
          Submit New Schedule
        </Button>
      </div>

      {showScheduler ? (
        <Card>
          <CardHeader>
            <CardTitle>Submit New Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <AvailabilityScheduler 
              onSubmitSuccess={() => {
                setShowScheduler(false);
                fetchAvailabilities();
              }}
              onCancel={() => setShowScheduler(false)}
            />
          </CardContent>
        </Card>
      ) : availabilities.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <Calendar className="h-12 w-12 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="font-semibold tracking-tight">No Approved Schedules</h3>
                <p className="text-sm text-muted-foreground">
                  You don't have any approved availability schedules yet.
                </p>
              </div>
              <Button onClick={() => setShowScheduler(true)}>
                Submit Your First Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {availabilities.map((availability) => (
            <Card key={availability.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {format(availability.startDate.toDate(), 'PPP')} - {format(availability.endDate.toDate(), 'PPP')}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {renderSelectedDays(availability.selectedDays)}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowScheduler(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Request Change
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}