import { FirebaseError } from 'firebase/app';
import { toast } from 'sonner';

export function handleFirebaseError(error: unknown, defaultMessage: string = 'An error occurred') {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'unavailable':
        toast.error('Connection lost. Please check your internet connection and try again.');
        break;
      case 'permission-denied':
        toast.error('You don\'t have permission to perform this action.');
        break;
      case 'not-found':
        toast.error('The requested resource was not found.');
        break;
      case 'failed-precondition':
        toast.error('Operation failed. Please try again.');
        break;
      case 'cancelled':
        toast.error('Operation was cancelled. Please try again.');
        break;
      case 'deadline-exceeded':
        toast.error('Operation timed out. Please try again.');
        break;
      case 'resource-exhausted':
        toast.error('Too many requests. Please try again later.');
        break;
      default:
        toast.error(error.message || defaultMessage);
    }
  } else {
    toast.error(defaultMessage);
  }
}