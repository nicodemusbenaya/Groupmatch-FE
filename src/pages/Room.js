import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRoom } from '../contexts/RoomContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { ScrollArea } from '../components/ui/scroll-area';
import { Crown, Send, LogOut, Users, Copy, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const Room = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    activeRoom,
    messages,
    sendMessage,
    endSession,
    leaveRoom,
    isReconnecting
  } = useRoom();

  const { toast } = useToast();
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef(null);

  // 🔐 cegah redirect saat initial render
  const isInitialLoadRef = useRef(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * 🔁 REDIRECT LOGIC (AMAN SAAT REFRESH)
   */
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    if (isReconnecting) return;

    const hasSavedRoom = localStorage.getItem('activeRoom');
    if (!activeRoom && !hasSavedRoom) {
      navigate('/dashboard');
    }
  }, [activeRoom, isReconnecting, navigate]);

  /**
   * ⏳ LOADING STATE
   */
  if (isReconnecting) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-12 w-12 text-cyan-500 animate-spin mb-4" />
        <p className="text-cyan-700 font-medium">
          Menghubungkan kembali ke room...
        </p>
      </div>
    );
  }

  if (!activeRoom && localStorage.getItem('activeRoom')) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-12 w-12 text-cyan-500 animate-spin mb-4" />
        <p className="text-cyan-700 font-medium">Memuat room...</p>
      </div>
    );
  }

  if (!activeRoom) return null;

  const isLeader = activeRoom.leader_id === user?.id;

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    sendMessage(messageInput);
    setMessageInput('');
  };

  const handleEndSession = async () => {
    await endSession();
    toast({
      title: 'Sesi selesai',
      description: 'Room telah ditutup oleh leader.'
    });
    navigate('/dashboard');
  };

  const handleLeaveRoom = async () => {
    await leaveRoom();
    toast({
      title: 'Keluar dari room',
      description: 'Anda telah meninggalkan tim.'
    });
    navigate('/dashboard');
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(activeRoom.id);
    toast({
      title: 'Disalin',
      description: 'ID Room disalin ke clipboard.'
    });
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-cyan-50 border-b p-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Room ID:</span>
            <code className="bg-white px-2 py-1 rounded border text-sm font-mono">
              {activeRoom.id}
            </code>
            <Button size="icon" variant="ghost" onClick={handleCopyRoomId}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <Badge className="bg-cyan-500">
            {activeRoom.members.length} Anggota
          </Badge>
        </div>
      </div>

      {/* Navbar */}
      <div className="bg-white border-b p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Team Workspace</h1>
          <div className="flex gap-2">
            {isLeader && (
              <Button variant="destructive" onClick={handleEndSession}>
                <Crown className="mr-2 h-4 w-4" /> End Session
              </Button>
            )}
            <Button variant="outline" onClick={handleLeaveRoom}>
              <LogOut className="mr-2 h-4 w-4" /> Keluar
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex max-w-7xl mx-auto w-full p-4 gap-4 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 hidden md:flex bg-white rounded-xl border flex-col">
          <div className="p-4 border-b bg-slate-50">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" /> Anggota
            </h3>
          </div>
          <div className="flex-1 p-3 space-y-2 overflow-y-auto">
            {activeRoom.members.map((m) => (
              <div key={m.user_id} className="flex gap-3 p-2 rounded hover:bg-slate-50">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={m.pict || ''} />
                  <AvatarFallback>{m.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {m.name}
                    {m.user_id === activeRoom.leader_id && (
                      <Crown className="inline h-3 w-3 ml-1 text-yellow-500" />
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {m.role || 'Member'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 bg-white rounded-xl border flex flex-col overflow-hidden">
          <div className="p-4 border-b font-semibold">Chat Room</div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => {
                const isMe = msg.userId === user?.id;
                return (
                  <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{msg.username?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className={`max-w-[70%] ${isMe ? 'text-right' : ''}`}>
                      <p className="text-xs mb-1">
                        {isMe ? 'Anda' : msg.username}
                      </p>
                      <div className={`px-4 py-2 rounded text-sm ${isMe ? 'bg-cyan-500 text-white' : 'bg-slate-100'}`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2 bg-slate-50">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Ketik pesan..."
            />
            <Button type="submit" disabled={!messageInput.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Room;
