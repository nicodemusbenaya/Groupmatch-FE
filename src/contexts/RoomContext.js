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
  
  const socketRef = useRef(null);
  const pollingRef = useRef(null);

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
    if (!user) return;
    setMatchmakingStatus('searching');
    setMessages([]);

    try {
      // 1. Join Queue
      const response = await api.post('/matchmaking/join');
      const data = response.data;

      if (data.room_id) {
        // Match instan (user terakhir)
        console.log("Match Found immediately:", data.room_id);
        handleMatchFound(data.room_id, { leader_id: data.leader_id });
      } else {
        // Masuk antrian
        console.log("Joined Queue, waiting...");
        toast({ title: 'Masuk Antrian', description: 'Mencari tim...' });
        startPollingRoom();
      }

    } catch (error) {
      console.error("Matchmaking error:", error);
      setMatchmakingStatus('idle');
      toast({ 
        title: 'Gagal', 
        description: error.response?.data?.detail || 'Gagal join matchmaking.',
        variant: 'destructive'
      });
    }
  };

  // LOGIKA POLLING CERDAS (SMART POLLING)
  const startPollingRoom = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        // STRATEGI 1: Cek endpoint /rooms/my (Hanya bekerja untuk Leader)
        try {
            const myRoomRes = await api.get('/rooms/my');
            if (myRoomRes.data && myRoomRes.data.id) {
                console.log("Match Found via /rooms/my!");
                clearInterval(pollingRef.current);
                handleMatchFound(myRoomRes.data.id, myRoomRes.data);
                return;
            }
        } catch (e) {
            // Ignore error 404 from /rooms/my
        }

        // STRATEGI 2: Fallback cek SEMUA room (Untuk Member biasa)
        // Kita ambil semua room dan cari manual apakah user ada di dalamnya
        const allRoomsRes = await api.get('/rooms/'); // Backend endpoint: GET /rooms/
        const allRooms = allRoomsRes.data;
        
        if (Array.isArray(allRooms)) {
            // Cari room dimana user terdaftar sebagai member
            // Asumsi backend 'Room' object punya field 'members' atau 'room_members'
            const myRoom = allRooms.find(r => {
                // Cek jika r.members ada dan user.id ada di dalamnya
                if (r.members && Array.isArray(r.members)) {
                    return r.members.some(m => m.user_id === user.id || m.id === user.id);
                }
                return false;
            });

            if (myRoom) {
                console.log("Match Found via /rooms/ list scan!");
                clearInterval(pollingRef.current);
                handleMatchFound(myRoom.id, myRoom);
            }
        }

      } catch (error) {
        console.log("Polling checking...", error);
        if (error.response && error.response.status === 401) {
            clearInterval(pollingRef.current);
            setMatchmakingStatus('idle');
        }
      }
    }, 3000); // Cek setiap 3 detik
  };

  const handleMatchFound = (roomId, roomData) => {
    setMatchmakingStatus('matched');
    
    // Mapping data member dari backend ke format frontend
    // Jika backend belum kirim member lengkap, kita tunggu WebSocket users_list
    let initialMembers = [];
    if (roomData && roomData.members) {
        initialMembers = roomData.members.map(m => ({
            id: m.user_id || m.id,
            name: m.username || m.name || 'User',
            username: m.username || 'user',
            role: 'Member',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.username || m.id}`
        }));
    }

    setActiveRoom({
        id: roomId.toString(),
        leaderId: roomData?.leader_id,
        members: initialMembers,
        status: 'active'
    });

    connectWebSocket(roomId);
  };

  const connectWebSocket = (roomId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const wsUrl = `${SOCKET_URL}/ws/rooms/${roomId}?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WS Connected");
      toast({ title: 'Tim Terbentuk!', description: 'Anda telah masuk ke ruang kolaborasi.' });
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
                    name: u.username,
                    username: u.username,
                    role: 'Member', // Backend belum kirim role via WS
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`
                }))
            }));
            break;

        case 'chat':
            setMessages(prev => [...prev, {
                id: Date.now(),
                userId: data.user_id,
                username: data.username,
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

  const leaveRoom = () => {
    cleanupConnection();
    setActiveRoom(null);
    setMatchmakingStatus('idle');
    setMessages([]);
  };

  const endSession = () => leaveRoom();

  useEffect(() => { return () => cleanupConnection(); }, []);

  return (
    <RoomContext.Provider value={{
      activeRoom,
      matchmakingStatus,
      messages,
      roomHistory,
      startMatchmaking,
      sendMessage,
      endSession,
      leaveRoom
    }}>
      {children}
    </RoomContext.Provider>
  );
};