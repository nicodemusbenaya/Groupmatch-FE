import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRoom } from '../contexts/RoomContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Tag,
  Users,
  LogOut,
  Loader2,
  Zap,
  Settings,
  UserCircle,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    startMatchmaking,
    leaveRoom,
    matchmakingStatus,
    roomHistory = [],
    activeRoom,
  } = useRoom();
  const { toast } = useToast();

  /* ===============================
     AUTO NAVIGATE KE ROOM
  =============================== */
  useEffect(() => {
    if (activeRoom && matchmakingStatus === 'matched') {
      const t = setTimeout(() => navigate('/room'), 1200);
      return () => clearTimeout(t);
    }
  }, [activeRoom, matchmakingStatus, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ================= HEADER ================= */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between">
          <Link to="/dashboard">
            <h1 className="text-2xl font-bold text-cyan-600">TeamSync</h1>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex gap-3">
                <Avatar>
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <p className="text-xs text-slate-500">@{user?.username}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile-setup')}>
                <UserCircle className="mr-2 h-4 w-4" /> Profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast({ title: 'Coming soon' })}>
                <Settings className="mr-2 h-4 w-4" /> Pengaturan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PROFILE */}
        <Card className="lg:sticky lg:top-24">
          <CardContent className="pt-8 text-center">
            <Avatar className="mx-auto h-24 w-24 mb-4">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-bold">{user?.name}</h3>
            <p className="text-sm text-slate-500">@{user?.username}</p>

            <div className="mt-6">
              <p className="text-xs uppercase text-slate-400 mb-2 flex items-center justify-center gap-1">
                <Tag className="h-3 w-3" /> Skills
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {user?.skills?.length ? (
                  user.skills.map((s, i) => (
                    <Badge key={i} variant="outline">{s}</Badge>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Belum ada skill</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MATCHMAKING */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader className="text-center">
              <Zap className="mx-auto h-10 w-10 text-cyan-600" />
              <CardTitle>
                {activeRoom ? 'Tim Aktif' : 'Mulai Matchmaking'}
              </CardTitle>
              <CardDescription>
                {activeRoom
                  ? 'Kembali ke room aktif'
                  : 'Temukan rekan tim terbaik'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              {activeRoom ? (
                <Button size="lg" onClick={() => navigate('/room')}>
                  Kembali ke Room <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : matchmakingStatus === 'searching' ? (
                <div className="text-center">
                  <Loader2 className="mx-auto h-10 w-10 animate-spin text-cyan-600 mb-4" />
                  <Button variant="outline" onClick={leaveRoom}>
                    Batalkan
                  </Button>
                </div>
              ) : matchmakingStatus === 'matched' ? (
                <CheckCircle className="h-10 w-10 text-green-600" />
              ) : (
                <Button size="lg" onClick={startMatchmaking}>
                  Cari Tim Sekarang
                </Button>
              )}
            </CardContent>
          </Card>

          {/* HISTORY */}
          <Card>
            <CardHeader>
              <CardTitle className="flex gap-2 items-center">
                <Users className="h-5 w-5" /> Riwayat Tim
              </CardTitle>
            </CardHeader>
            <CardContent>
              {roomHistory.length === 0 ? (
                <p className="text-sm text-slate-400 text-center">
                  Belum ada riwayat tim
                </p>
              ) : (
                roomHistory.map((r) => (
                  <div key={r.id} className="p-3 border rounded mb-2">
                    <strong>Room #{r.room_id}</strong>
                    <p className="text-xs text-slate-500">{r.action}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
