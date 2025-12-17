import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api'; // Import api instance yang baru dibuat

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cek status login saat aplikasi dimuat
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('currentUser');
      
      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
        // Opsional: Anda bisa menambahkan endpoint /auth/me di backend 
        // untuk memvalidasi token & mengambil data user terbaru
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      // Panggil endpoint Login Backend
      const response = await api.post('/auth/login', {
        email, 
        password
      });

      // Backend me-return: { access_token, user, ... }
      const { access_token, user } = response.data;

      // Simpan data
      localStorage.setItem('token', access_token);
      localStorage.setItem('currentUser', JSON.stringify(user));
      setUser(user);

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Gagal login. Periksa email dan password.' 
      };
    }
  };

  const register = async (userData) => {
    try {
      // Sesuaikan payload dengan schema RegisterRequest di backend
      const payload = {
        name: userData.name,
        email: userData.email,
        username: userData.username,
        password: userData.password,
        // birthdate, role, skills dikirim nanti di profile setup atau sesuaikan schema backend
      };

      await api.post('/auth/register', payload);
      
      // Setelah register sukses, bisa langsung login otomatis atau minta login ulang
      // Di sini kita minta login ulang untuk keamanan flow
      return { success: true };
    } catch (error) {
      console.error("Register error:", error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Gagal mendaftar.' 
      };
    }
  };

  const loginWithGoogle = () => {
    // Redirect user ke endpoint backend yang akan mengarahkan ke Google
    // Endpoint ini didapat dari router.py: @router.get("/google/login")
    window.location.href = 'http://localhost:8000/auth/google/login';
  };

  const updateProfile = async (profileData) => {
    // Karena backend Anda punya profile_router, idealnya panggil API update profile di sini
    // Contoh sederhana update state lokal dulu sementara backend profile disambungkan:
    const updatedUser = { ...user, ...profileData, profileComplete: true };
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // TODO: Panggil API: await api.put('/profile/update', profileData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      loginWithGoogle,
      register,
      updateProfile,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};