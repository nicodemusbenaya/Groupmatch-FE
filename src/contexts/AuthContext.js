import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

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

  // FUNGSI UTAMA: Ambil data profil
  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const response = await api.get('/profile/me');
      const profileData = response.data;

      const formattedUser = {
        id: profileData.user_id,
        name: profileData.name,
        username: profileData.name,
        email: profileData.email,
        role: profileData.role,
        skills: profileData.skill ? profileData.skill.split(',') : [],
        avatar: profileData.pict,
        profileComplete: true 
      };

      setUser(formattedUser);
      localStorage.setItem('currentUser', JSON.stringify(formattedUser));
      return true; 
    } catch (error) {
      // PERBAIKAN PENTING DI SINI:
      // Jika error 404 (Profil belum ada), kita JANGAN biarkan user null.
      // Kita buat object user sementara agar tidak ditendang ke Login.
      if (error.response && error.response.status === 404) {
         console.log("User login, but no profile yet.");
         const incompleteUser = { profileComplete: false };
         setUser(incompleteUser);
         // Kita return true (artinya "Auth Sukses", meski profil belum ada)
         // agar OAuthCallback tahu tokennya valid.
         return true; 
      }
      
      // Jika error 401 (Token Invalid), baru kita return false
      if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          setUser(null);
      }
      return false;
    }
  };

  // Cek Auth saat aplikasi dibuka
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        await fetchUserProfile();
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token } = response.data;

      localStorage.setItem('token', access_token);
      await fetchUserProfile(); // Ambil profil segera

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Gagal login.' 
      };
    }
  };

  const register = async (userData) => {
    try {
      await api.post('/auth/register', {
        name: userData.name,
        email: userData.email,
        username: userData.username,
        password: userData.password,
        confirm_password: userData.password
      });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Gagal mendaftar.' 
      };
    }
  };

// src/contexts/AuthContext.js

// ... kode sebelumnya ...

  const loginWithGoogle = async () => {
    try {
      // 1. Request ke backend untuk mendapatkan URL Login (bukan redirect langsung)
      // Gunakan instance 'api' yang sudah ada agar base URL otomatis ter-handle
      const response = await api.get('/auth/google/login'); 
      
      // 2. Ambil login_url dari JSON response backend
      const { login_url } = response.data;

      // 3. Lakukan redirect di browser menggunakan URL dari Google tersebut
      if (login_url) {
        window.location.href = login_url;
      }
    } catch (error) {
      console.error("Gagal inisialisasi Google Login:", error);
      // Opsional: Tampilkan toast error disini
    }
  };

// ... sisa kode ...

  const uploadAvatar = async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await api.post('/profile/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error("Upload avatar error:", error);
      throw error;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      // Format skill menjadi string sesuai backend API
      let skillString = "";
      if (Array.isArray(profileData.skills)) {
        skillString = profileData.skills.join(',');
      } else if (typeof profileData.skills === 'string') {
        skillString = profileData.skills;
      }

      const payload = {
        name: profileData.name,
        birthdate: profileData.birthdate,
        role: profileData.role,
        skill: skillString,
        pict: profileData.avatarUrl || ""
      };

      console.log("Sending profile payload:", payload); // Debug log

      if (user?.profileComplete) {
         await api.put('/profile/', payload);
      } else {
         await api.post('/profile/', payload);
      }

      await fetchUserProfile(); // Refresh data
      return { success: true };
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
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
      uploadAvatar,
      fetchUserProfile,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};