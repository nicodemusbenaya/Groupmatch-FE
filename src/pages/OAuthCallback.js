import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; 

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchUserProfile, user } = useAuth(); 
  const processedRef = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
        if (processedRef.current) return;
        
        const token = searchParams.get('token');
        if (token) {
            processedRef.current = true;
            localStorage.setItem('token', token);
            
            // Panggil fetch untuk memastikan token valid & cek status profil
            const isAuthSuccess = await fetchUserProfile();
            
            if (isAuthSuccess) {
                // Cek state user yang baru saja di-set oleh fetchUserProfile
                // Kita beri sedikit delay agar state React sempat terupdate
                setTimeout(() => {
                   // Cek apakah user sudah lengkap profilnya?
                   // Karena kita di dalam async function, kita cek manual atau asumsikan dari return value
                   // Logika: Jika auth sukses, kita coba ke dashboard. 
                   // Nanti Dashboard/ProtectedRoute akan redirect ke setup jika profil belum lengkap
                   // Tapi lebih aman kita arahkan manual:
                   
                   // Kita baca ulang token/user
                   const savedUser = localStorage.getItem('currentUser');
                   if (savedUser && JSON.parse(savedUser).profileComplete) {
                       navigate('/dashboard', { replace: true });
                   } else {
                       navigate('/profile-setup', { replace: true });
                   }
                }, 100);
            } else {
                // Token invalid
                navigate('/login', { replace: true });
            }
        } else {
            if (!processedRef.current) navigate('/login', { replace: true });
        }
    };

    handleCallback();
  }, [searchParams, navigate, fetchUserProfile]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      <p className="ml-2 text-slate-600">Sinkronisasi data akun...</p>
    </div>
  );
};

export default OAuthCallback;