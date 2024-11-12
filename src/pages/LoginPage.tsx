import { LoginForm } from '@/components/auth/LoginForm';

export function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary/30 px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-2">
          <img src="/namatclinic.png" alt="Namat Logo" className="h-16 w-26" />
          <h1 className="text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-[#7dda55] to-[#7dda55]/70 bg-clip-text text-transparent">
           
          </h1>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}