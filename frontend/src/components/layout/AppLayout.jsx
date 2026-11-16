import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  Truck,
  Settings,
  LogOut,
  Building2,
  Menu,
  X,
  Package,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AppLayout() {
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Products & Stock', href: '/products', icon: Boxes },
    { name: 'Stock Movements', href: '/stock-movements', icon: ArrowLeftRight },
    { name: 'Suppliers', href: '/suppliers', icon: Truck },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const currentNav = navigation.find((n) => location.pathname.startsWith(n.href)) || {
    name: 'Dashboard',
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row antialiased">
      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Package className="w-4 h-4" />
          </div>
          <span className="font-bold text-base text-slate-900 tracking-tight">StockFlow</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Backdrop for Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop Permanent / Mobile Slide-Over) */}
      <aside
        className={`fixed md:sticky top-0 z-50 md:z-20 h-screen w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo & Brand Header */}
          <div className="p-5 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shadow-indigo-600/20">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-bold text-base text-slate-900 tracking-tight">StockFlow</h1>
                  <span className="text-[11px] font-medium text-slate-400">Inventory OS</span>
                </div>
              </div>

              {/* Close button on mobile */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Organization Pill */}
            <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 shrink-0 shadow-xs">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {organization?.name || 'Workspace'}
                  </p>
                </div>
                <p className="text-[10px] text-slate-400 truncate">Live Multi-Tenant</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Workspace Menu
            </div>
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-indigo-50/90 text-indigo-700 font-semibold border border-indigo-100 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Info & Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3 p-1.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 border border-indigo-200/60 shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/50">
              {user?.role || 'admin'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/70 hover:border-rose-200/80 transition-all duration-150"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Desktop Sticky Header */}
        <header className="hidden md:flex sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/70 px-8 py-3.5 items-center justify-between">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">StockFlow</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-800">{currentNav.name}</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Live API Health Pill */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-[11px] font-semibold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Database</span>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              <span>{organization?.name || 'Production Workspace'}</span>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
