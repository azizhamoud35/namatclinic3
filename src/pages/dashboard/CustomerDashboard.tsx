import { AppointmentList } from '@/components/dashboard/AppointmentList';
import { Card } from '@/components/ui/card';

export function CustomerDashboard() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight">Customer Dashboard</h2>

      <Card className="p-6">
        <AppointmentList />
      </Card>
    </div>
  );
}