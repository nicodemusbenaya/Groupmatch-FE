import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRoom } from '../contexts/RoomContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { ScrollArea } from '../components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Crown, Send, LogOut, Users, Copy, Settings, UserCircle, Home, Eye, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const Room = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { activeRoom, messages, sendMessage, endSession, leaveRoom, isReconnecting } = useRoom();
  const { toast } = useToast();
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Hanya redirect jika tidak ada room DAN tidak sedang reconnecting
    if (!activeRoom && !isReconnecting) {
      // Cek apakah ada saved room di localStorage
      const savedRoom = localStorage.getItem('activeRoom');
      if (!savedRoom) {
        navigate('/dashboard');
      }
    }
  }, [activeRoom, isReconnecting, navigate]);

  // Tampilkan loading jika sedang reconnecting
  if (isReconnecting) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-12 w-12 text-cyan-500 animate-spin mb-4" />
        <p className="text-cyan-700 font-medium">Menghubungkan kembali ke room...</p>
      </div>
    );
  }

  // Jika ada saved room tapi belum ter-load, tampilkan loading
  if (!activeRoom && localStorage.getItem('activeRoom')) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-12 w-12 text-cyan-500 animate-spin mb-4" />
        <p className="text-cyan-700 font-medium">Memuat room...</p>
      </div>
    );
  }

  if (!activeRoom) return null;

  // Backend mengirim 'leader_id' (snake_case) di object Room, tapi kita mapping di context
  const isLeader = activeRoom.leaderId === user?.id;
  
  // Mencari object leader di array members
  const leader = activeRoom.members.find(m => m.id === activeRoom.leaderId);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim()) {
      sendMessage(messageInput);
      setMessageInput('');
    }
  };

  const handleEndSession = async () => {
    await endSession();
    toast({ title: 'Sesi selesai', description: 'Anda telah meninggalkan room.' });
    navigate('/dashboard');
  };

  const handleLeaveRoom = async () => {
    await leaveRoom();
    toast({ title: 'Keluar dari room', description: 'Anda telah keluar dari tim.' });
    navigate('/dashboard');
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(activeRoom.id);
    toast({ title: 'Disalin!', description: 'ID Room disalin ke clipboard.' });
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header Info Room */}
      <div className="bg-cyan-50 border-b border-cyan-100 p-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-cyan-900">Room ID:</span>
            <code className="bg-white px-2 py-1 rounded border border-cyan-200 text-sm font-mono">
              {activeRoom.id}
            </code>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCopyRoomCode}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <Badge className="bg-cyan-500">{activeRoom.members.length} Anggota</Badge>
        </div>
      </div>

      {/* Navbar */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold text-slate-800">Team Workspace</h1>
            <div className="flex gap-2">
                <Button variant="outline" onClick={handleLeaveRoom}>
                    <LogOut className="mr-2 h-4 w-4" /> Keluar
                </Button>
            </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full p-4 gap-4">
        {/* Sidebar Member List */}
        <div className="w-64 hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-slate-50">
                <h3 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" /> Anggota
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {activeRoom.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                         <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">
                                {member.name}
                                {member.id === activeRoom.leaderId && <Crown className="inline h-3 w-3 ml-1 text-yellow-500"/>}
                            </p>
                            <p className="text-xs text-slate-500">{member.role || 'Member'}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border flex flex-col overflow-hidden">
            <div className="p-4 border-b">
                <h3 className="font-semibold">Chat Room</h3>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg, idx) => {
                    const isMe = msg.userId === user?.id;
                    return (
                        <div key={idx} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                             <Avatar className="h-8 w-8 mt-1">
                                <AvatarFallback className={isMe ? 'bg-cyan-100 text-cyan-600' : 'bg-slate-100'}>
                                    {msg.username?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-slate-600">
                                        {isMe ? 'Anda' : msg.username}
                                    </span>
                                </div>
                                <div className={`px-4 py-2 rounded-lg text-sm ${
                                    isMe ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-800'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-slate-50">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input 
                        value={messageInput} 
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Ketik pesan..." 
                        className="bg-white"
                    />
                    <Button type="submit" disabled={!messageInput.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
