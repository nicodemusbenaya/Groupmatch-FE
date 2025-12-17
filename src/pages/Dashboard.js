import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRoom } from '../contexts/RoomContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Tag, Users, LogOut, Loader2, Zap, Settings, UserCircle, ArrowRight } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Destructure dengan nilai default aman
  const { 
    startMatchmaking, 
    matchmakingStatus = 'idle', 
    roomHistory = [], 
    activeRoom 
  } = useRoom();
  
  const { toast } = useToast();

  const handleStartMatchmaking = () => {
    startMatchmaking();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewProfile = () => {
    navigate('/profile-setup');
  };

  const handleSettings = () => {
    toast({ title: 'Coming Soon', description: 'Fitur pengaturan segera hadir!' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white shadow-sm border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/dashboard" className="cursor-pointer hover:opacity-80 transition-opacity">
              <h1 className="text-2xl font-bold text-cyan-600 tracking-tight">TeamSync</h1>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 hover:bg-cyan-50 pl-2 pr-1 py-1 h-auto rounded-full transition-colors">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500">@{user?.username}</p>
                  </div>
                  <Avatar className="h-10 w-10 border-2 border-cyan-500 shadow-sm">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-cyan-100 text-cyan-600 font-semibold">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border border-slate-200 shadow-xl rounded-xl mt-2">
                <DropdownMenuLabel className="text-slate-900 px-4 py-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs text-slate-500 leading-none mt-1">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem className="cursor-pointer hover:bg-cyan-50" onClick={handleViewProfile}>
                  <UserCircle className="mr-3 h-4 w-4 text-cyan-600" /> Lihat Profil
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-cyan-50" onClick={handleSettings}>
                  <Settings className="mr-3 h-4 w-4 text-cyan-600" /> Pengaturan
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem className="cursor-pointer hover:bg-red-50 text-red-600" onClick={handleLogout}>
                  <LogOut className="mr-3 h-4 w-4" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Selamat Datang, {user?.name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Sistem kami akan mencarikan rekan tim terbaik sesuai dengan skill dan role Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1 lg:sticky lg:top-24">
            <Card className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
              <CardContent className="space-y-6 pt-0 relative">
                <div className="flex flex-col items-center text-center -mt-12">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-md mb-3">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-cyan-100 text-cyan-600 text-2xl font-bold">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-xl text-slate-900">{user?.name}</h3>
                  <p className="text-sm text-slate-500 mb-3 font-medium">@{user?.username}</p>
                  <Badge className="bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200 rounded-full px-4 py-1.5">
                    {user?.role || 'User'}
                  </Badge>
                </div>
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Tag className="h-3 w-3" /> Skills
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {user?.skills?.length > 0 ? (
                        user.skills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-slate-600 bg-slate-50">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">Belum ada skill</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <Card className={`rounded-3xl shadow-lg border-2 overflow-hidden transition-all ${
              activeRoom 
                ? 'border-green-200 bg-gradient-to-br from-white to-green-50/50 shadow-green-100' 
                : 'border-cyan-100 bg-gradient-to-br from-white to-cyan-50/50 shadow-cyan-100'
            }`}>
              <CardHeader className="text-center pb-2 pt-8">
                <div className={`mx-auto p-4 rounded-full mb-4 inline-flex ${
                  activeRoom ? 'bg-green-100 text-green-600' : 'bg-cyan-100 text-cyan-600'
                }`}>
                  <Zap className="h-8 w-8" fill="currentColor" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">
                  {activeRoom ? 'Tim Anda Aktif' : 'Mulai Matchmaking'}
                </CardTitle>
                <CardDescription className="text-slate-600 text-base max-w-md mx-auto mt-2">
                  {activeRoom 
                    ? 'Sesi kolaborasi sedang berlangsung. Kembali ke ruang tim.'
                    : 'Temukan rekan tim yang tepat sekarang.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center pb-10 pt-4 px-8">
                {activeRoom ? (
                  <Button size="lg" className="w-full max-w-sm bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg h-14" onClick={() => navigate('/room')}>
                    Kembali ke Ruang Tim <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <>
                    {matchmakingStatus === 'idle' && (
                      <Button size="lg" className="w-full max-w-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-lg h-14" onClick={handleStartMatchmaking}>
                        Cari Tim Sekarang
                      </Button>
                    )}
                    {matchmakingStatus === 'searching' && (
                      <div className="flex flex-col items-center py-2 animate-pulse">
                        <Loader2 className="h-12 w-12 text-cyan-500 mb-4 animate-spin" />
                        <p className="text-cyan-700 font-medium bg-cyan-50 px-4 py-2 rounded-lg">
                          Sedang mencari rekan tim...
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <div>
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-slate-500" /> Riwayat Tim
                </h3>
              </div>
              <Card className="bg-white rounded-2xl shadow-sm border border-slate-100">
                <CardContent className="p-0">
                  {roomHistory.length === 0 ? (
                    <div className="text-center py-16 px-4">
                      <div className="bg-slate-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-slate-300" />
                      </div>
                      <h4 className="text-slate-900 font-medium mb-1">Belum ada riwayat</h4>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {roomHistory.map((room) => (
                        <div key={room.id} className="p-5 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-cyan-100 rounded-xl flex items-center justify-center text-cyan-600 font-bold">
                              #{room.id ? room.id.slice(-2) : '??'}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">Tim #{room.id}</h4>
                            </div>
                          </div>
                          <Badge variant="secondary">Selesai</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;