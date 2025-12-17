import React, { createContext, useContext, useState } from 'react';
import { getDummyUsersForMatchmaking, getRandomBotResponse } from '../mock/mockData';
import { useAuth } from './AuthContext';

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
  const [activeRoom, setActiveRoom] = useState(null);
  const [matchmakingStatus, setMatchmakingStatus] = useState('idle'); // idle, searching, matched
  const [roomHistory, setRoomHistory] = useState([]);
  const [messages, setMessages] = useState([]);

  const startMatchmaking = () => {
    setMatchmakingStatus('searching');
    
    // Simulate matchmaking delay (3 seconds)
    setTimeout(() => {
      const dummyUsers = getDummyUsersForMatchmaking(user.role);
      const allMembers = [user, ...dummyUsers];
      
      // Random leader selection
      const leaderId = allMembers[Math.floor(Math.random() * allMembers.length)].id;
      
      const newRoom = {
        id: 'room-' + Date.now(),
        status: 'active',
        leaderId,
        members: allMembers,
        createdAt: new Date()
      };
      
      setActiveRoom(newRoom);
      setMatchmakingStatus('matched');
      setMessages([{
        id: 'welcome',
        type: 'system',
        text: 'Welcome! Your group has been formed. Start collaborating!',
        timestamp: new Date()
      }]);
    }, 3000);
  };

  const sendMessage = (text) => {
    if (!activeRoom || !text.trim()) return;
    
    const newMessage = {
      id: 'msg-' + Date.now(),
      userId: user.id,
      username: user.username,
      text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Simulate bot response after 1-2 seconds
    setTimeout(() => {
      const botMember = activeRoom.members.find(m => m.id !== user.id && m.id.startsWith('bot'));
      if (botMember) {
        const botMessage = {
          id: 'msg-bot-' + Date.now(),
          userId: botMember.id,
          username: botMember.username,
          text: getRandomBotResponse(),
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      }
    }, 1000 + Math.random() * 1000);
  };

  const endSession = () => {
    if (activeRoom) {
      const endedRoom = { ...activeRoom, status: 'ended', endedAt: new Date() };
      setRoomHistory(prev => [endedRoom, ...prev]);
      setActiveRoom(null);
      setMatchmakingStatus('idle');
      setMessages([]);
    }
  };

  const leaveRoom = () => {
    // REVISI: Simpan room ke history saat member keluar (leave), bukan hanya saat endSession
    if (activeRoom) {
      const leftRoom = { ...activeRoom, status: 'left', endedAt: new Date() };
      setRoomHistory(prev => [leftRoom, ...prev]);
    }
    
    setActiveRoom(null);
    setMatchmakingStatus('idle');
    setMessages([]);
  };

  return (
    <RoomContext.Provider value={{
      activeRoom,
      matchmakingStatus,
      roomHistory,
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