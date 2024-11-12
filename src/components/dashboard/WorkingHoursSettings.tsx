import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Settings2 } from 'lucide-react';
import { triggerScheduling } from '@/lib/scheduling';

interface WorkingHoursSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkingHoursSettings({ open, onOpenChange }: WorkingHoursSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [workingHours, setWorkingHours] = useState({
    session1Start: '17:00',
    session1End: '20:00',
    session2Start: '20:00',
    session2End: '22:00',
  });

  useEffect(() => {
    fetchWorkingHours();
  }, []);

  const fetchWorkingHours = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'workingHours'));
      if (settingsDoc.exists()) {
        setWorkingHours(settingsDoc.data());
      }
    } catch (error) {
      console.error('Error fetching working hours:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await setDoc(doc(db, 'settings', 'workingHours'), {
        ...workingHours,
        updatedAt: new Date(),
      });

      // Trigger scheduling when working hours are updated
      await triggerScheduling();

      toast.success('Working hours updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating working hours:', error);
      toast.error('Failed to update working hours');
    } finally {
      setIsLoading(false);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Working Hours Settings</DialogTitle>
          <DialogDescription>
            Configure the default working hours for coaching sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">First Session (5:00 PM - 8:00 PM)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Select
                    value={workingHours.session1Start}
                    onValueChange={(value) =>
                      setWorkingHours({ ...workingHours, session1Start: value })
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Select
                    value={workingHours.session1End}
                    onValueChange={(value) =>
                      setWorkingHours({ ...workingHours, session1End: value })
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Second Session (8:00 PM - 10:00 PM)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Select
                    value={workingHours.session2Start}
                    onValueChange={(value) =>
                      setWorkingHours({ ...workingHours, session2Start: value })
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Select
                    value={workingHours.session2End}
                    onValueChange={(value) =>
                      setWorkingHours({ ...workingHours, session2End: value })
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}