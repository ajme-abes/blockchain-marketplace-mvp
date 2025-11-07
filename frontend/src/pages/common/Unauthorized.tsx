// src/pages/common/Unauthorized.tsx
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <ShieldAlert className="h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-md">
          You don't have permission to access this page. Please contact support if you believe this is an error.
        </p>
        <div className="flex gap-4">
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline">Go to Dashboard</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Unauthorized;