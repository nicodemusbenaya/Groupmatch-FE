import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import api, { SOCKET_URL, getRoomHistory } from "@/services/api";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";

const RoomContext = createContext(null);

export const useRoom = () => {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used inside RoomProvider");
  return ctx;
};

export const RoomProvider = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeRoom, setActiveRoom] = useState(null);
  const [matchmakingStatus, setMatchmakingStatus] = useState("idle");
  const [messages, setMessages] = useState([]);
  const [roomHistory, setRoomHistory] = useState([]);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const socketRef = useRef(null);
  const pollingRef = useRef(null);
  const hasLeftRoomRef = useRef(false);

  /* ===========================
     LOCAL STORAGE SYNC
  ============================ */
  useEffect(() => {
    if (activeRoom) {
      localStorage.setItem("activeRoom", JSON.stringify(activeRoom));
    } else {
      localStorage.removeItem("activeRoom");
    }
  }, [activeRoom]);

  /* ===========================
     RESTORE ROOM
  ============================ */
  const restoreRoom = async () => {
    if (!user || hasLeftRoomRef.current) return;

    const saved = localStorage.getItem("activeRoom");
    if (!saved) return;

    try {
      setIsReconnecting(true);
      const parsed = JSON.parse(saved);

      const res = await api.get(`/rooms/${parsed.id}`);
      if (res.data) {
        handleMatchFound(parsed.id, res.data, true);
        toast({
          title: "Terhubung kembali",
          description: "Kembali ke room sebelumnya",
        });
      }
    } catch {
      localStorage.removeItem("activeRoom");
    } finally {
      setIsReconnecting(false);
    }
  };

  /* ===========================
     FETCH ROOM HISTORY
  ============================ */
  const fetchRoomHistory = async () => {
    if (!user) return;
    try {
      const data = await getRoomHistory();
      setRoomHistory(data);
    } catch (err) {
      console.error("Fetch room history failed", err);
      setRoomHistory([]);
    }
  };

  useEffect(() => {
    if (!user) return;
    restoreRoom();
    fetchRoomHistory();
  }, [user]);

  /* ===========================
     MATCHMAKING
  ============================ */
  const startMatchmaking = async () => {
    setMatchmakingStatus("searching");
    setMessages([]);

    try {
      const res = await api.post("/matchmaking/join");

      if (res.data?.room_id) {
        handleMatchFound(res.data.room_id, res.data);
      } else {
        startPolling();
        toast({
          title: "Mencari tim",
          description: "Sedang mencarikan tim...",
        });
      }
    } catch (err) {
      setMatchmakingStatus("idle");
      toast({
        title: "Gagal",
        description: err.response?.data?.detail || "Matchmaking gagal",
        variant: "destructive",
      });
    }
  };

  const startPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get("/matchmaking/status");
        if (res.data?.status === "matched") {
          clearInterval(pollingRef.current);
          handleMatchFound(res.data.room_id, res.data);
        }
      } catch {}
    }, 2000);
  };

  /* ===========================
     MATCH FOUND
  ============================ */
  const handleMatchFound = async (roomId, roomData, isReconnect = false) => {
    setMatchmakingStatus("matched");
    setIsReconnecting(false);

    let detail = roomData;
    if (!roomData.members) {
      const res = await api.get(`/rooms/${roomId}`);
      detail = res.data;
    }

    setActiveRoom({
      id: detail.id,
      leaderId: detail.leader_id,
      status: detail.status,
      members: detail.members.map((m) => ({
        id: m.user_id,
        name: m.name || m.username,
        username: m.username,
        role: m.role,
        avatar:
          m.pict ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.username}`,
      })),
    });

    connectWebSocket(roomId);
    toast({ title: "Tim Terbentuk!", description: "Room berhasil dibuat" });
  };

  /* ===========================
     WEBSOCKET
  ============================ */
  const connectWebSocket = (roomId, isReconnect) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const ws = new WebSocket(
      `${SOCKET_URL}/ws/rooms/${roomId}?token=${token}`
    );

    ws.onopen = () => {
      if (!isReconnect) {
        toast({
          title: "Tim terbentuk",
          description: "Anda masuk ke workspace",
        });
      }
    };

    ws.onmessage = (e) => {
      const payload = JSON.parse(e.data);
      if (payload.type === "chat") {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            userId: payload.data.user_id,
            username: payload.data.username,
            text: payload.data.text,
          },
        ]);
      }
    };

    ws.onclose = () => {};
    socketRef.current = ws;
  };

  const sendMessage = (text) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "chat", text }));
    }
  };

  /* ===========================
     LEAVE & END
  ============================ */
  const leaveRoom = async () => {
    hasLeftRoomRef.current = true;

    try {
      await api.post("/matchmaking/leave");
      fetchRoomHistory();
    } catch {}

    socketRef.current?.close();
    setActiveRoom(null);
    setMessages([]);
    setMatchmakingStatus("idle");
    localStorage.removeItem("activeRoom");

    setTimeout(() => (hasLeftRoomRef.current = false), 500);
  };

  const endSession = async () => {
    hasLeftRoomRef.current = true;

    try {
      await api.post("/matchmaking/end-room");
      fetchRoomHistory();
    } catch (err) {
      toast({
        title: "Gagal",
        description: "Tidak bisa mengakhiri sesi",
        variant: "destructive",
      });
    }

    socketRef.current?.close();
    setActiveRoom(null);
    setMessages([]);
    setMatchmakingStatus("idle");
    localStorage.removeItem("activeRoom");

    setTimeout(() => (hasLeftRoomRef.current = false), 500);
  };

  /* ===========================
     PROVIDER
  ============================ */
  return (
    <RoomContext.Provider
      value={{
        activeRoom,
        matchmakingStatus,
        messages,
        roomHistory,
        isReconnecting,
        startMatchmaking,
        sendMessage,
        leaveRoom,
        endSession,
        fetchRoomHistory,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};
