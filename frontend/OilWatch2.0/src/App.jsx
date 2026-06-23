import  { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LoginPage } from './components/pages/LoginPage';
import Navbar from './components/Navbar';

export default function App() {
  const [user, setUser] = useState(null);

  // 1. If not logged in, block all tabs and render the login page fullscreen
  if (!user) {
    return <LoginPage onLoginSuccess={(email) => setUser({ email })} />;
  }

  // 2. If logged in, show your global layout frames with the dynamic child content
  return (
    <div className="min-h-screen bg-[#070b0e] text-slate-100 font-sans antialiased">
      <Navbar />
      
      {/* The child components from main.jsx get injected right here */}
      <main className="p-2 md:p-4 lg:p-5">
        <Outlet />
      </main>
    </div>
  );
}