import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; 

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchUserProfile } = useAuth(); 
  const processedRef = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
        if (processedRef.current) return;
        
        // Coba ambil token dari query params dengan berbagai kemungkinan nama
        let token = searchParams.get('token') || 
                    searchParams.get('access_token') ||
                    searchParams.get('jwt');
        
        // Juga cek dari hash fragment (beberapa OAuth provider menggunakan ini)
        if (!token && location.hash) {
            const hashParams = new URLSearchParams(location.hash.substring(1));
            token = hashParams.get('token') || 
                    hashParams.get('access_token') ||
                    hashParams.get('jwt');
        }
        
        console.log("OAuth Callback - URL:", window.location.href);
        console.log("OAuth Callback - Token found:", token ? "Yes" : "No");
        
        if (token) {
            processedRef.current = true;
            localStorage.setItem('token', token);
            console.log("Token saved to localStorage");
            
            // Panggil fetch untuk memastikan token valid & cek status profil
            const isAuthSuccess = await fetchUserProfile();
            console.log("Auth success:", isAuthSuccess);
            
            if (isAuthSuccess) {
                // Beri delay agar state React sempat terupdate
                setTimeout(() => {
                   const savedUser = localStorage.getItem('currentUser');
                   console.log("Saved user:", savedUser);
                   
                   if (savedUser) {
                       const userData = JSON.parse(savedUser);
                       if (userData.profileComplete) {
                           console.log("Redirecting to dashboard");
                           navigate('/dashboard', { replace: true });
                       } else {
                           console.log("Redirecting to profile-setup");
                           navigate('/profile-setup', { replace: true });
                       }
                   } else {
                       // Jika tidak ada currentUser tapi auth sukses, 
                       // berarti profil belum dibuat
                       console.log("No saved user, redirecting to profile-setup");
                       navigate('/profile-setup', { replace: true });
                   }
                }, 200);
            } else {
                console.log("Auth failed, redirecting to login");
                localStorage.removeItem('token');
                navigate('/login', { replace: true });
            }
        } else {
            console.log("No token found in URL, redirecting to login");
            if (!processedRef.current) {
                processedRef.current = true;
                navigate('/login', { replace: true });
            }
        }
    };

    handleCallback();
  }, [searchParams, location, navigate, fetchUserProfile]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      <p className="ml-2 text-slate-600">Sinkronisasi data akun...</p>
    </div>
  );
};

export default OAuthCallback;