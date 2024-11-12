import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppointmentList } from '@/components/dashboard/AppointmentList';
import { CoachAvailabilityList } from '@/components/dashboard/CoachAvailabilityList';

export function CoachDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Coach Dashboard</h2>
        <p className="text-muted-foreground">
          Manage your appointments and availability schedule.
        </p>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentList />
          </CardContent>
        </Card>

        <CoachAvailabilityList />
      </div>
    </div>
  );
}