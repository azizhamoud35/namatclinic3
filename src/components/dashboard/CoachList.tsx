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
import { AddCoachDialog } from './AddCoachDialog';
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

export function CoachList() {
  const [coaches, setCoaches] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddCoach, setShowAddCoach] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [processingDelete, setProcessingDelete] = useState(false);

  const fetchCoaches = async () => {
    try {
      setIsLoading(true);
      const coachesQuery = query(
        collection(db, 'users'),
        where('role', '==', 'coach')
      );
      const snapshot = await getDocs(coachesQuery);
      const coachesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      }) as User[];
      setCoaches(coachesData);
    } catch (error) {
      console.error('Error fetching coaches:', error);
      toast.error('Failed to fetch coaches');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoaches();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setProcessingDelete(true);
      await deleteDoc(doc(db, 'users', deleteId));
      setCoaches(prev => prev.filter(coach => coach.id !== deleteId));
      toast.success('Coach deleted successfully');
    } catch (error) {
      console.error('Error deleting coach:', error);
      toast.error('Failed to delete coach');
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
        <Button onClick={() => setShowAddCoach(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Coach
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
            {coaches.map((coach) => (
              <TableRow key={coach.id}>
                <TableCell className="font-medium">
                  {coach.firstName} {coach.lastName}
                </TableCell>
                <TableCell>{coach.email}</TableCell>
                <TableCell>
                  {formatDistanceToNow(coach.createdAt, { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <Badge variant={coach.status === 'active' ? 'success' : 'secondary'}>
                    {coach.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(coach.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {coaches.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No coaches found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AddCoachDialog
        open={showAddCoach}
        onOpenChange={setShowAddCoach}
        onSuccess={fetchCoaches}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coach</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this coach? This action cannot be undone.
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