import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AddCustomerDialog } from './AddCustomerDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function CustomerList() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [processingDelete, setProcessingDelete] = useState(false);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const customersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'customer')
      );
      const snapshot = await getDocs(customersQuery);
      const customersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      }) as User[];
      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setProcessingDelete(true);
      await deleteDoc(doc(db, 'users', deleteId));
      setCustomers(prev => prev.filter(customer => customer.id !== deleteId));
      toast.success('Customer deleted successfully');
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    } finally {
      setProcessingDelete(false);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowAddCustomer(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">
                  {customer.firstName} {customer.lastName}
                </TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>
                  {formatDistanceToNow(customer.createdAt, { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <Badge variant={customer.status === 'active' ? 'success' : 'secondary'}>
                    {customer.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(customer.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No customers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AddCustomerDialog
        open={showAddCustomer}
        onOpenChange={setShowAddCustomer}
        onSuccess={fetchCustomers}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this customer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={processingDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {processingDelete ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}