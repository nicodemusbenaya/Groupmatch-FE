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
  const [matchmakingStatus, setMatchmakingStatus] = useState('idle'); // idle, searching, matched
  const [messages, setMessages] = useState([]);
  
  // WebSocket Reference
  const socketRef = useRef(null);
  // Polling Interval Reference
  const pollingRef = useRef(null);

  // Fungsi Helper: Bersihkan koneksi saat unmount atau room berakhir
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

  // 1. Fungsi Memulai Matchmaking
  const startMatchmaking = async () => {
    setMatchmakingStatus('searching');
    setMessages([]);

    try {
      // Panggil API Backend
      const response = await api.post('/matchmaking/join');
      const data = response.data;

      if (data.room_id) {
        // KASUS A: Langsung dapat room (misal user terakhir yang melengkapi tim)
        console.log("Match Found immediately:", data.room_id);
        handleMatchFound(data.room_id);
      } else {
        // KASUS B: Masuk antrian (Queue)
        console.log("Joined Queue, waiting for match...");
        toast({ title: 'Masuk Antrian', description: 'Mencari anggota tim lain...' });
        
        // Mulai Polling untuk mengecek status Room
        startPollingRoom();
      }

    } catch (error) {
      console.error("Matchmaking error:", error);
      setMatchmakingStatus('idle');
      toast({ 
        title: 'Gagal', 
        description: error.response?.data?.detail || 'Gagal bergabung ke matchmaking.',
        variant: 'destructive'
      });
    }
  };

  // 2. Fungsi Polling (Cek Room secara berkala)
  const startPollingRoom = () => {
    // Cek setiap 3 detik
    pollingRef.current = setInterval(async () => {
      try {
        const response = await api.get('/rooms/my');
        // Backend mengembalikan object Room jika ada, atau message jika tidak
        if (response.data && response.data.id) {
            console.log("Match Found via Polling!", response.data.id);
            clearInterval(pollingRef.current); // Stop polling
            handleMatchFound(response.data.id, response.data);
        }
      } catch (error) {
        // Abaikan error 404/belum ketemu room, lanjut polling
        // Tapi jika error auth (401), stop polling
        if (error.response && error.response.status === 401) {
            clearInterval(pollingRef.current);
            setMatchmakingStatus('idle');
        }
      }
    }, 3000);
  };

  // 3. Handler saat Room Ditemukan
  const handleMatchFound = (roomId, roomData = null) => {
    setMatchmakingStatus('matched');
    
    // Set data awal room (nanti diperlengkap via WebSocket)
    setActiveRoom(prev => ({
        id: roomId.toString(),
        leaderId: roomData?.leader_id,
        members: [], // Akan diisi oleh WebSocket
        status: 'active'
    }));

    // Sambungkan WebSocket
    connectWebSocket(roomId);
  };

  // 4. Koneksi WebSocket
  const connectWebSocket = (roomId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // URL: ws://localhost:8000/ws/rooms/{id}?token={token}
    const wsUrl = `${SOCKET_URL}/ws/rooms/${roomId}?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("Connected to Chat Room");
      toast({ title: 'Terhubung!', description: 'Anda telah masuk ke dalam tim.' });
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        handleSocketMessage(payload);
      } catch (e) {
        console.error("Invalid WS message", e);
      }
    };

    ws.onclose = () => {
      console.log("Disconnected from Chat Room");
    };

    socketRef.current = ws;
  };

  // 5. Handle Pesan dari WebSocket
  const handleSocketMessage = (payload) => {
    const { type, data } = payload;

    switch (type) {
        case 'users_list':
            // Backend mengirim list user saat connect
            // data format: [{ user_id, username }, ...]
            setActiveRoom(prev => ({
                ...prev,
                members: data.map(u => ({
                    id: u.user_id,
                    name: u.username, // Backend pakai 'username'
                    username: u.username,
                    role: 'Member', // Backend belum kirim role di ws list, default dulu
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}` // Generate avatar
                }))
            }));
            break;

        case 'user_join':
            toast({ description: `${data.username} bergabung.` });
            // Refresh member list logic bisa ditambahkan disini atau via users_list
            break;

        case 'chat':
            setMessages(prev => [...prev, {
                id: Date.now(), // Generate local ID
                userId: data.user_id,
                username: data.username,
                text: data.text,
                timestamp: new Date(),
                type: 'user'
            }]);
            break;
            
        default:
            break;
    }
  };

  const sendMessage = (text) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const payload = {
        type: 'chat',
        text: text
      };
      socketRef.current.send(JSON.stringify(payload));
    } else {
        toast({ title: "Koneksi terputus", variant: "destructive" });
    }
  };

  const leaveRoom = () => {
    cleanupConnection();
    setActiveRoom(null);
    setMatchmakingStatus('idle');
    setMessages([]);
  };

  const endSession = () => {
    // Logic untuk mengakhiri sesi di backend belum ada di router yang Anda upload
    // Jadi kita perlakukan sama dengan leaveRoom dulu
    leaveRoom();
  };

  // Cleanup effect
  useEffect(() => {
    return () => cleanupConnection();
  }, []);

  return (
    <RoomContext.Provider value={{
      activeRoom,
      matchmakingStatus,
      messages,
      startMatchmaking,
      sendMessage,
      endSession,
      leaveRoom
    }}>
      {children}
    </RoomContext.Provider>
  );
};
