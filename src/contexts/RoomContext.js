import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api, { SOCKET_URL } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from '../hooks/use-toast';

const RoomContext = createContext(null);

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within RoomProvider');
  }
  return context;
};

export const RoomProvider = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeRoom, setActiveRoom] = useState(null);
  const [matchmakingStatus, setMatchmakingStatus] = useState('idle'); 
  const [messages, setMessages] = useState([]);
  const [roomHistory, setRoomHistory] = useState([]); // Default empty array
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  const socketRef = useRef(null);
  const pollingRef = useRef(null);
  const isSearchingRef = useRef(false); // Ref untuk track status searching
  const hasLeftRoomRef = useRef(false); // Ref untuk track jika user sengaja keluar room

  // Simpan activeRoom ke localStorage setiap kali berubah
  useEffect(() => {
    if (activeRoom) {
      localStorage.setItem('activeRoom', JSON.stringify(activeRoom));
      console.log("Room saved to localStorage:", activeRoom.id);
    } else {
      localStorage.removeItem('activeRoom');
    }
  }, [activeRoom]);

  // Restore room dari localStorage saat aplikasi dimuat
  useEffect(() => {
    const restoreRoom = async () => {
      if (!user) return;
      
      // Jangan restore jika user baru saja sengaja keluar dari room
      if (hasLeftRoomRef.current) {
        console.log("User intentionally left room, skipping restore");
        return;
      }
      
      const savedRoom = localStorage.getItem('activeRoom');
      if (savedRoom) {
        try {
          const roomData = JSON.parse(savedRoom);
          console.log("Found saved room:", roomData.id);
          setIsReconnecting(true);
          
          // Verifikasi apakah room masih aktif di backend
          try {
            const response = await api.get(`/rooms/${roomData.id}`);
            if (response.data) {
              console.log("Room still valid, reconnecting...");
              // Update room data dengan data terbaru dari backend (isReconnect = true)
              handleMatchFound(roomData.id, response.data, true);
              toast({ title: 'Terhubung Kembali', description: 'Anda kembali ke room sebelumnya.' });
            }
          } catch (e) {
            // Room sudah tidak valid, hapus dari localStorage
            console.log("Room no longer valid:", e?.response?.status);
            localStorage.removeItem('activeRoom');
            
            // Coba cek apakah user punya room aktif lain
            try {
              const myRoomRes = await api.get('/rooms/my');
              if (myRoomRes.data && myRoomRes.data.id) {
                console.log("Found active room via /rooms/my");
                handleMatchFound(myRoomRes.data.id, myRoomRes.data, true);
                toast({ title: 'Terhubung Kembali', description: 'Anda kembali ke room aktif.' });
              }
            } catch (err) {
              // Tidak ada room aktif
              console.log("No active room found");
            }
          }
        } catch (e) {
          console.error("Error parsing saved room:", e);
          localStorage.removeItem('activeRoom');
        } finally {
          setIsReconnecting(false);
        }
      }
    };

    restoreRoom();
  }, [user]);

  const cleanupConnection = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const startMatchmaking = async () => {
    if (!user) {
      console.log("No user, cannot start matchmaking");
      return;
    }
    
    isSearchingRef.current = true;
    setMatchmakingStatus('searching');
    setMessages([]);

    try {
      // 1. Join Queue
      console.log("Joining matchmaking queue...");
      const response = await api.post('/matchmaking/join');
      const data = response.data;
      
      console.log("Matchmaking response:", data);

      // Cek berbagai kemungkinan response dari backend
      if (data.room_id || data.roomId) {
        // Match instan (sudah cukup user di queue)
        const roomId = data.room_id || data.roomId;
        console.log("Match Found immediately:", roomId);
        handleMatchFound(roomId, data);
      } else if (data.status === 'matched' && data.room) {
        // Format alternatif
        console.log("Match Found (alt format):", data.room);
        handleMatchFound(data.room.id || data.room, data.room);
      } else if (data.status === 'waiting' || data.message) {
        // Masuk antrian, mulai polling
        console.log("Joined Queue, waiting...", data.message || data.status);
        toast({ title: 'Masuk Antrian', description: data.message || 'Mencari tim...' });
        startPollingRoom();
      } else {
        // Default: masuk antrian
        console.log("Joined Queue (default behavior)");
        toast({ title: 'Masuk Antrian', description: 'Mencari tim...' });
        startPollingRoom();
      }

    } catch (error) {
      console.error("Matchmaking error:", error);
      console.error("Error response:", error.response?.data);
      isSearchingRef.current = false;
      setMatchmakingStatus('idle');
      toast({ 
        title: 'Gagal', 
        description: error.response?.data?.detail || error.response?.data?.message || 'Gagal join matchmaking.',
        variant: 'destructive'
      });
    }
  };

  // LOGIKA POLLING CERDAS (SMART POLLING)
  const startPollingRoom = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    
    console.log("Starting polling for room match...");

    pollingRef.current = setInterval(async () => {
      // Jika sudah tidak dalam status searching, stop polling
      if (!isSearchingRef.current) {
        console.log("Not in searching state (ref), stopping poll");
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        return;
      }

      try {
        // STRATEGI 1: Cek status matchmaking queue
        // Ini endpoint yang memberitahu apakah sudah match atau masih waiting
// src/contexts/RoomContext.js (Bagian startPollingRoom)

// ...
        // STRATEGI 1: Cek status matchmaking queue
        try {
            const queueStatus = await api.get('/matchmaking/status');
            console.log("Queue status response:", queueStatus.data);
            
            if (queueStatus.data) {
                const status = queueStatus.data;
                
                // KASUS A: Sudah dapat Room (Matched)
                if (status.status === 'matched' && status.room_id) {
                    console.log("Match Found via /matchmaking/status!");
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                    
                    // Kita perlu detail room (members, dll)
                    // Panggil API get room detail atau pass dummy data agar fetch ulang
                    handleMatchFound(status.room_id, { id: status.room_id, members: [] }); 
                    
                    // Fetch ulang detail room agar list member muncul
                    try {
                        const roomDetail = await api.get(`/rooms/${status.room_id}`); // Pastikan endpoint ini ada
                        if(roomDetail.data) setActiveRoom(prev => ({...prev, ...mapRoomData(roomDetail.data)}));
                    } catch(err) {
                        // Fallback: fetch list semua room jika endpoint detail spesifik tidak ada
                        const allRooms = await api.get('/rooms/');
                        const myRoom = allRooms.data.find(r => r.id === status.room_id);
                        if(myRoom) handleMatchFound(status.room_id, myRoom);
                    }
                    return;
                }
                
                // KASUS B: Masih Idle/Tidak di queue (mungkin tertendang atau error)
                if (status.status === 'idle') {
                     // Opsional: Stop polling jika server bilang user tidak antri
                     // isSearchingRef.current = false;
                }
            }
        } catch (e) {
            // Ignore error
        }
// ...
        // STRATEGI 2: Cek endpoint /rooms/my (Untuk semua member yang sudah di-assign ke room)
        try {
            const myRoomRes = await api.get('/rooms/my');
            console.log("/rooms/my response:", myRoomRes.data);
            if (myRoomRes.data && myRoomRes.data.id) {
                console.log("Match Found via /rooms/my!");
                clearInterval(pollingRef.current);
                pollingRef.current = null;
                handleMatchFound(myRoomRes.data.id, myRoomRes.data);
                return;
            }
        } catch (e) {
            // Ignore error 404 from /rooms/my (belum ada room)
            if (e?.response?.status !== 404) {
                console.log("/rooms/my check error:", e?.response?.status);
            }
        }

        // STRATEGI 3: Fallback cek SEMUA room (Untuk Member biasa)
        // Kita ambil semua room dan cari manual apakah user ada di dalamnya
        try {
            const allRoomsRes = await api.get('/rooms/'); // Backend endpoint: GET /rooms/
            const allRooms = allRoomsRes.data;
            console.log("/rooms/ response:", allRooms?.length, "rooms");
            
            if (Array.isArray(allRooms) && allRooms.length > 0) {
                // Cari room dimana user terdaftar sebagai member
                const myRoom = allRooms.find(r => {
                    // Cek leader_id
                    if (r.leader_id === user.id) return true;
                    
                    // Cek jika r.members ada dan user.id ada di dalamnya
                    if (r.members && Array.isArray(r.members)) {
                        return r.members.some(m => 
                            m.user_id === user.id || 
                            m.id === user.id ||
                            m.user?.id === user.id
                        );
                    }
                    
                    // Cek jika r.room_members ada (struktur alternatif)
                    if (r.room_members && Array.isArray(r.room_members)) {
                        return r.room_members.some(m => 
                            m.user_id === user.id || 
                            m.id === user.id
                        );
                    }
                    
                    return false;
                });

                if (myRoom) {
                    console.log("Match Found via /rooms/ list scan!", myRoom);
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                    handleMatchFound(myRoom.id, myRoom);
                    return;
                }
            }
        } catch (e) {
            if (e?.response?.status !== 404) {
                console.log("/rooms/ list check error:", e?.response?.status);
            }
        }
        
        console.log("Still waiting for match...");

      } catch (error) {
        console.log("Polling error:", error);
        if (error.response && error.response.status === 401) {
            isSearchingRef.current = false;
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            setMatchmakingStatus('idle');
        }
      }
    }, 2000); // Cek setiap 2 detik (lebih responsif)
  };

  const handleMatchFound = (roomId, roomData, isReconnect = false) => {
    isSearchingRef.current = false; // Stop polling
    setMatchmakingStatus('matched');
    
    // Mapping data member dari backend ke format frontend
    // Coba berbagai format yang mungkin dari backend
    let initialMembers = [];
    
    // Cek berbagai kemungkinan struktur data members
    const membersData = roomData?.members || roomData?.room_members || [];
    
    if (Array.isArray(membersData) && membersData.length > 0) {
        initialMembers = membersData.map(m => {
            // Handle nested user object
            const userData = m.user || m;
            return {
                id: userData.user_id || userData.id || m.user_id || m.id,
                name: userData.name || userData.username || m.username || 'User',
                username: userData.username || userData.name || m.username || 'user',
                role: userData.role || m.role || 'Member',
                avatar: userData.pict || userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username || userData.id || m.id}`
            };
        });
    }

    const newActiveRoom = {
        id: roomId.toString(),
        leaderId: roomData?.leader_id || roomData?.leaderId,
        members: initialMembers,
        status: 'active'
    };
    
    console.log("Setting active room:", newActiveRoom);
    setActiveRoom(newActiveRoom);

    connectWebSocket(roomId, isReconnect);
  };

  const connectWebSocket = (roomId, isReconnect = false) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const wsUrl = `${SOCKET_URL}/ws/rooms/${roomId}?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WS Connected");
      if (!isReconnect) {
        toast({ title: 'Tim Terbentuk!', description: 'Anda telah masuk ke ruang kolaborasi.' });
      }
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        handleSocketMessage(payload);
      } catch (e) { console.error(e); }
    };

    ws.onclose = () => console.log("WS Disconnected");
    socketRef.current = ws;
  };

  const handleSocketMessage = (payload) => {
    const { type, data } = payload;

    switch (type) {
        case 'users_list':
            // Update list member dari data real-time WebSocket
            setActiveRoom(prev => ({
                ...prev,
                members: data.map(u => ({
                    id: u.user_id,
                    name: u.name || u.username || 'User', // Prioritaskan nama lengkap
                    username: u.username,
                    role: u.role || 'Member',
                    avatar: u.pict || u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username || u.user_id}`
                }))
            }));
            break;

        case 'chat':
            setMessages(prev => [...prev, {
                id: Date.now(),
                userId: data.user_id,
                username: data.name || data.username, // Prioritaskan nama lengkap
                text: data.text,
                timestamp: new Date(),
                type: 'user'
            }]);
            break;
        default: break;
    }
  };

  const sendMessage = (text) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'chat', text }));
    }
  };

  const cancelMatchmaking = async () => {
    isSearchingRef.current = false;
    cleanupConnection();
    setMatchmakingStatus('idle');
    
    // Coba beritahu backend untuk keluar dari queue
    try {
      await api.post('/matchmaking/leave');
      console.log("Left matchmaking queue");
    } catch (e) {
      // Ignore jika endpoint tidak ada
      console.log("Leave queue endpoint not available or error:", e?.response?.status);
    }
  };

  const leaveRoom = async () => {
    // Set flag bahwa user sengaja keluar
    hasLeftRoomRef.current = true;
    isSearchingRef.current = false;
    
    // Hapus room dari localStorage DULU sebelum cleanup
    localStorage.removeItem('activeRoom');
    
    const roomId = activeRoom?.id;
    
    // Reset state segera
    setActiveRoom(null);
    setMatchmakingStatus('idle');
    setMessages([]);
    
    // Cleanup WebSocket
    cleanupConnection();
    
    // Coba beritahu backend bahwa user keluar dari room
    if (roomId) {
      try {
        await api.post(`/rooms/${roomId}/leave`);
        console.log("Left room:", roomId);
      } catch (e) {
        // Coba endpoint alternatif
        try {
          await api.delete(`/rooms/${roomId}/members/me`);
          console.log("Left room via DELETE:", roomId);
        } catch (e2) {
          console.log("Leave room endpoint error:", e?.response?.status, e2?.response?.status);
        }
      }
    }
    
    console.log("Room left successfully, localStorage cleared");
    
    // Reset flag setelah delay agar restoreRoom tidak trigger
    setTimeout(() => {
      hasLeftRoomRef.current = false;
    }, 1000);
  };

  const endSession = () => leaveRoom();

  useEffect(() => { return () => cleanupConnection(); }, []);

  return (
    <RoomContext.Provider value={{
      activeRoom,
      matchmakingStatus,
      messages,
      roomHistory,
      isReconnecting,
      startMatchmaking,
      cancelMatchmaking,
      sendMessage,
      endSession,
      leaveRoom
    }}>
      {children}
    </RoomContext.Provider>
  );
};