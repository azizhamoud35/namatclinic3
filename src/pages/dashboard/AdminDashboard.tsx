import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { CoachList } from '@/components/dashboard/CoachList';
import { CustomerList } from '@/components/dashboard/CustomerList';
import { AvailabilityList } from '@/components/dashboard/AvailabilityList';
import { AppointmentsList } from '@/components/dashboard/AppointmentsList';
import { WorkingHoursSettings } from '@/components/dashboard/WorkingHoursSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Settings2 } from 'lucide-react';

export function AdminDashboard() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Dashboard</h2>
            <p className="text-muted-foreground">
              Manage your coaches and customers from one place.
            </p>
          </div>
          <Button 
            variant="outline"
            onClick={() => setShowSettings(true)}
            className="w-full sm:w-auto"
          >
            <Settings2 className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardStats stats={{
          totalCoaches: 0,
          totalCustomers: 0,
          activeCustomers: 0,
          pendingAppointments: 0,
        }} />
      </div>

      <Card className="p-4 md:p-6">
        <Tabs defaultValue="coaches" className="space-y-6">
          <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 gap-2">
            <TabsTrigger value="coaches">Coaches</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
          </TabsList>
          <TabsContent value="coaches" className="space-y-6">
            <CoachList />
          </TabsContent>
          <TabsContent value="customers" className="space-y-6">
            <CustomerList />
          </TabsContent>
          <TabsContent value="availability" className="space-y-6">
            <AvailabilityList />
          </TabsContent>
          <TabsContent value="appointments" className="space-y-6">
            <AppointmentsList />
          </TabsContent>
        </Tabs>
      </Card>

      <WorkingHoursSettings 
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </div>
  );
}