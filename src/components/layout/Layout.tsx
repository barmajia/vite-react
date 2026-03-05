import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const noLayoutRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];

export function Layout() {
  const location = useLocation();
  const showLayout = !noLayoutRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      {showLayout && <Header />}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <Outlet />
        </div>
      </main>
      {showLayout && <Footer />}
    </div>
  );
}
