import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Label } from '@/components/ui/label';

export function AutoSchedulingToggle() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadAutoSchedulingState();
    return () => stopAutoScheduling();
  }, []);

  const loadAutoSchedulingState = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'autoScheduling'));
      const enabled = settingsDoc.exists() ? settingsDoc.data().enabled : false;
      setIsEnabled(enabled);
      if (enabled) {
        startAutoScheduling();
      }
    } catch (error) {
      console.error('Error loading auto-scheduling state:', error);
    }
  };

  const startAutoScheduling = () => {
    const id = setInterval(runAutoScheduling, 60000); // Run every minute
    setIntervalId(id);
  };

  const stopAutoScheduling = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  const handleToggle = async (checked: boolean) => {
    try {
      await setDoc(doc(db, 'settings', 'autoScheduling'), {
        enabled: checked,
        updatedAt: new Date()
      });
      setIsEnabled(checked);
      toast.success(`Auto-scheduling ${checked ? 'enabled' : 'disabled'}`);

      if (checked) {
        startAutoScheduling();
        runAutoScheduling(); // Run immediately when enabled
      } else {
        stopAutoScheduling();
      }
    } catch (error) {
      console.error('Error toggling auto-scheduling:', error);
      toast.error('Failed to toggle auto-scheduling');
    }
  };

  const runAutoScheduling = async () => {
    try {
      // Implementation of auto-scheduling logic
      // This will be called periodically when enabled
      console.log('Auto-scheduling check running...');
    } catch (error) {
      console.error('Error in auto-scheduling:', error);
      toast.error('Auto-scheduling check failed');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        id="auto-scheduling"
        checked={isEnabled}
        onCheckedChange={handleToggle}
      />
      <Label htmlFor="auto-scheduling" className="text-sm font-medium">
        Auto-Schedule
      </Label>
    </div>
  );
}