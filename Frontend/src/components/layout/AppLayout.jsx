import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  FilePlus2,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  FileSpreadsheet,
  Users,
  UserCheck,
  FolderGit2,
  Settings,
  ShieldCheck,
  LogOut,
  Bell,
  Menu,
  X,
  GraduationCap,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavItems = () => {
    if (!user) return [];

    switch (user.role) {
      case 'STUDENT':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'My Submissions', path: '/projects', icon: FolderKanban },
          { name: 'New Submission', path: '/projects/new', icon: FilePlus2, highlight: true },
          { name: 'Repository Search', path: '/projects', icon: Search }
        ];

      case 'SUPERVISOR':
        return [
          { name: 'Review Queue', path: '/dashboard', icon: Clock },
          { name: 'All Assigned Projects', path: '/projects', icon: FolderKanban },
          { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
          { name: 'Analytics', path: '/analytics', icon: BarChart3 }
        ];

      case 'COORDINATOR':
        return [
          { name: 'Evaluation Portal', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Project Repository', path: '/projects', icon: FolderKanban },
          { name: 'Reports Suite', path: '/reports', icon: FileSpreadsheet },
          { name: 'Department Analytics', path: '/analytics', icon: BarChart3 }
        ];

      case 'ADMIN':
        return [
          { name: 'Admin Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Repository Master', path: '/projects', icon: FolderKanban },
          { name: 'Users & Roles', path: '/admin/users', icon: Users },
          { name: 'Guide Assignments', path: '/admin/assignments', icon: UserCheck },
          { name: 'Cloudinary Automation', path: '/admin/repository', icon: FolderGit2 },
          { name: 'Academic Settings', path: '/admin/settings', icon: Settings },
          { name: 'System Reports', path: '/reports', icon: FileSpreadsheet },
          { name: 'System Analytics', path: '/analytics', icon: BarChart3 },
          { name: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldCheck }
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return { bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30', label: 'Administrator' };
      case 'COORDINATOR':
        return { bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30', label: 'Coordinator' };
      case 'SUPERVISOR':
        return { bg: 'bg-violet-500/15 text-violet-300 border-violet-500/30', label: 'Supervisor' };
      default:
        return { bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', label: 'Student' };
    }
  };

  const roleBadge = getRoleBadge(user?.role);

  return (
    <div className="min-h-screen flex bg-[#FAF8F7] text-[#241B20]">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 glass-sidebar text-white flex-shrink-0 shadow-2xl relative z-40">
        {/* Brand Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#5f2b48] to-[#391124] border border-white/20 flex items-center justify-center font-extrabold text-white text-sm tracking-wider shadow-lg group-hover:scale-105 transition-transform">
              KLU
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white">KLEF / KLU</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <p className="text-[11px] text-[#D4CBC4] font-medium tracking-wide">Academic Repository</p>
            </div>
          </Link>
        </div>

        {/* User Card */}
        <div className="p-4 mx-4 my-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#48182F] to-[#7e4768] border border-white/20 flex items-center justify-center text-sm font-bold text-white shadow-md">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-[#D4CBC4] truncate font-mono">{user?.registerNumber || user?.email}</p>
            </div>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between">
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border ${roleBadge.bg}`}>
              {roleBadge.label}
            </span>
            <span className="text-[10px] text-[#D4CBC4]/80 font-medium">
              {user?.department ? `${user.department} Dept` : 'KLU Academic'}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="px-4 py-1 text-[10px] font-bold text-[#D4CBC4]/60 uppercase tracking-wider">
          Main Navigation
        </div>
        <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name + item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-[#48182F] to-[#5f2b48] text-white shadow-md border border-white/20'
                    : 'text-[#D4CBC4] hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-amber-300' : 'text-[#D4CBC4]/80'}`} />
                  <span>{item.name}</span>
                </div>
                {item.highlight && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    New
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-[11px] text-[#D4CBC4]/80">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Atlas DB & Cloudinary
            </span>
            <span className="font-mono text-[10px] text-emerald-300">ONLINE</span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#D4CBC4] hover:bg-rose-500/20 hover:text-rose-200 transition-all border border-transparent hover:border-rose-500/30"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 glass-nav px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-[#756A70] hover:bg-[#EEE9E6] rounded-xl transition-colors border border-[#D8CFD2]/50"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#48182F] text-white flex lg:hidden items-center justify-center font-bold text-xs shadow-sm">
                KLU
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-extrabold text-[#241B20] tracking-tight">
                  KLU Academic Project Repository
                </h2>
                <p className="text-[10px] text-[#756A70] hidden sm:block">
                  Verified Department Submissions & Institutional Archives
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/projects"
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF8F7] hover:bg-[#EEE9E6] border border-[#D8CFD2] text-xs font-semibold text-[#756A70] hover:text-[#241B20] transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Projects</span>
            </Link>

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-[#EEE9E6] border border-transparent hover:border-[#D8CFD2] transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#48182F] to-[#5f2b48] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-[#241B20] leading-tight truncate max-w-[140px]">{user?.name}</p>
                  <p className="text-[10px] text-[#756A70] font-medium leading-none mt-0.5">{roleBadge.label}</p>
                </div>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-modal border border-[#D8CFD2] p-3 z-50 animate-fadeIn">
                  <div className="p-3 bg-[#FAF8F7] rounded-xl border border-[#D8CFD2] mb-2">
                    <p className="font-bold text-xs text-[#241B20]">{user?.name}</p>
                    <p className="text-[11px] text-[#756A70] truncate">{user?.email}</p>
                    {user?.registerNumber && (
                      <p className="text-[10px] font-mono text-[#48182F] font-bold mt-1">Reg: {user.registerNumber}</p>
                    )}
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded border ${roleBadge.bg}`}>
                        {roleBadge.label} • {user?.department || 'General'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="lg:hidden glass-sidebar text-white p-4 border-b border-[#391124] space-y-2 shadow-2xl animate-fadeIn">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 mb-3">
              <div className="w-9 h-9 rounded-lg bg-[#48182F] flex items-center justify-center font-bold text-xs text-white">
                {user?.name?.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-[#D4CBC4] truncate">{user?.email}</p>
              </div>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={'mobile-' + item.name + item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive ? 'bg-[#48182F] text-white' : 'text-[#D4CBC4] hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-amber-300" />
                    <span>{item.name}</span>
                  </div>
                  {item.highlight && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-400/20 text-amber-300">
                      New
                    </span>
                  )}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs text-rose-300 hover:bg-rose-900/30 rounded-xl font-bold transition-all mt-3 border border-rose-500/20"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fadeIn">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


