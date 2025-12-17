import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRoom } from '../contexts/RoomContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { ROLES } from '../mock/mockData';
import { Tag, Users, LogOut, Loader2, Zap, Settings, UserCircle, ArrowRight } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { startMatchmaking, matchmakingStatus, roomHistory, activeRoom } = useRoom();
  const { toast } = useToast();

  const handleStartMatchmaking = () => {
    startMatchmaking();
  };

  // Efek untuk navigasi otomatis opsional
  React.useEffect(() => {
     if (matchmakingStatus === 'matched' && activeRoom && !window.location.pathname.includes('/room')) {
        // Logika redirect otomatis dihapus agar user punya kontrol penuh
     }
  }, [matchmakingStatus, activeRoom, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewProfile = () => {
    navigate('/profile-setup');
  };

  const handleSettings = () => {
    toast({
      title: 'Coming Soon',
      description: 'Settings feature coming soon!',
      duration: 3000,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/dashboard" className="cursor-pointer hover:opacity-80 transition-opacity">
              <h1 className="text-2xl font-bold text-cyan-600 tracking-tight">TeamSync</h1>
            </Link>
            
            {/* User Profile Menu */}
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
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-cyan-50 focus:bg-cyan-50 text-slate-700 px-4 py-2.5"
                  onClick={handleViewProfile}
                >
                  <UserCircle className="mr-3 h-4 w-4 text-cyan-600" />
                  <span className="font-medium">Lihat Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-cyan-50 focus:bg-cyan-50 text-slate-700 px-4 py-2.5"
                  onClick={handleSettings}
                >
                  <Settings className="mr-3 h-4 w-4 text-cyan-600" />
                  <span className="font-medium">Pengaturan</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-red-50 focus:bg-red-50 text-red-600 px-4 py-2.5"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="font-medium">Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Selamat Datang, {user?.name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Siap untuk berkolaborasi? Sistem kami akan mencarikan rekan tim terbaik yang sesuai dengan skill dan role Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Profile Card */}
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
                  <Badge className="bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200 rounded-full px-4 py-1.5 transition-colors">
                    {user?.role}
                  </Badge>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Tag className="h-3 w-3" />
                      Skills
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {user?.skills?.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-slate-600 border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium bg-slate-50">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Main Actions */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* FEATURED: Auto Matchmaking Card */}
            <Card className={`rounded-3xl shadow-lg border-2 overflow-hidden transition-all duration-300 transform hover:-translate-y-1 ${
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
                    ? 'Sesi kolaborasi Anda sedang berlangsung. Kembali ke ruang tim untuk melanjutkan.'
                    : 'Sistem cerdas kami akan menghubungkan Anda dengan rekan tim yang memiliki skill komplementer.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center pb-10 pt-4 px-8">
                {activeRoom ? (
                  <Button 
                    size="lg" 
                    className="w-full max-w-sm bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg shadow-green-200 font-bold text-lg h-14 transition-all"
                    onClick={() => navigate('/room')}
                  >
                    Kembali ke Ruang Tim <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <>
                    {matchmakingStatus === 'idle' && (
                      <Button 
                        size="lg" 
                        className="w-full max-w-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-lg shadow-cyan-200 font-bold text-lg h-14 transition-all"
                        onClick={handleStartMatchmaking}
                      >
                        Cari Tim Sekarang
                      </Button>
                    )}
                    {matchmakingStatus === 'searching' && (
                      <div className="flex flex-col items-center py-2 animate-pulse">
                        <Loader2 className="h-12 w-12 text-cyan-500 mb-4 animate-spin" />
                        <p className="text-cyan-700 font-medium bg-cyan-50 px-4 py-2 rounded-lg">
                          Sedang mencari rekan tim terbaik...
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Room History Section */}
            <div>
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-slate-500" />
                  Riwayat Tim
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
                      <p className="text-slate-500 text-sm">Mulai matchmaking untuk membentuk tim pertama Anda!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {roomHistory.map((room) => (
                        <div key={room.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-cyan-100 rounded-xl flex items-center justify-center text-cyan-600 font-bold text-lg">
                              #{room.id.slice(-2)}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                                Tim #{room.id.slice(-8)}
                              </h4>
                              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                <span>{new Date(room.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span>{new Date(room.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                              {room.members.slice(0, 4).map((member) => (
                                <Avatar key={member.id} className="h-9 w-9 border-2 border-white ring-1 ring-slate-100">
                                  <AvatarImage src={member.avatar} />
                                  <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-bold">
                                    {member.name?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {room.members.length > 4 && (
                                <div className="h-9 w-9 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500 ring-1 ring-slate-100">
                                  +{room.members.length - 4}
                                </div>
                              )}
                            </div>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                              Selesai
                            </Badge>
                          </div>
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