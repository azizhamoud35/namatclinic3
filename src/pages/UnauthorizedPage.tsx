import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30">
      <div className="text-center space-y-6 p-8 rounded-lg bg-background/95 backdrop-blur shadow-lg">
        <div className="flex flex-col items-center gap-4">
          <ShieldAlert className="h-16 w-16 text-destructive" />
          <h1 className="text-4xl font-bold">Unauthorized Access</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          You don't have permission to access this page.
        </p>
        <Button 
          size="lg"
          className="px-8" 
          onClick={() => navigate('/login')}
        >
          Return to Login
        </Button>
      </div>
    </div>
  );
}