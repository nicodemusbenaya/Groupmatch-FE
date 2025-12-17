import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Jika perlu akses context langsung
import { Loader2 } from 'lucide-react';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Backend Anda sepertinya mengembalikan JSON response langsung di browser
    // bukan redirect ke frontend dengan query param.
    
    // JIKA backend Anda diubah untuk redirect ke: http://localhost:3000/auth/callback?token=...&user=...
    // Maka logika ini bisa dipakai:
    
    const token = searchParams.get('token');
    const userString = searchParams.get('user');

    if (token) {
        localStorage.setItem('token', token);
        if (userString) {
            localStorage.setItem('currentUser', userString); // Pastikan format JSON valid
        }
        // Force reload atau update context agar state user aktif
        window.location.href = '/dashboard';
    } else {
        // Jika gagal
        navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      <p className="ml-2 text-slate-600">Memproses login...</p>
    </div>
  );
};

export default OAuthCallback;