import { useEffect, useState } from 'react';
import { triggerScheduling } from '@/lib/scheduling';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { CoachList } from '@/components/dashboard/CoachList';
import { CustomerList } from '@/components/dashboard/CustomerList';
import { AvailabilityList } from '@/components/dashboard/AvailabilityList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

export default function AdminDashboard() {
  const [isScheduling, setIsScheduling] = useState(false);

  const handleTriggerScheduling = async () => {
    setIsScheduling(true);
    try {
      await triggerScheduling();
      toast({
        title: "Success",
        description: "Scheduling process triggered successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to trigger scheduling process",
        variant: "destructive",
      });
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <DashboardStats />
      </div>

      <div className="mb-6 flex justify-end">
        <Button 
          onClick={handleTriggerScheduling} 
          disabled={isScheduling}
        >
          {isScheduling ? "Scheduling..." : "Trigger Scheduling"}
        </Button>
      </div>

      <Card>
        <Tabs defaultValue="coaches" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="coaches">Coaches</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>
          <TabsContent value="coaches">
            <CoachList />
          </TabsContent>
          <TabsContent value="customers">
            <CustomerList />
          </TabsContent>
          <TabsContent value="availability">
            <AvailabilityList />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}