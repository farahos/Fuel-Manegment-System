// src/components/Sidebar.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Fuel,
  History,
  Gauge,
  ShoppingCart,
  MapPin,
  Truck,
  LogOut,
} from "lucide-react";

const Sidebar = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  const linkCls = (path) =>
    `group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
      isActive(path)
        ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`;

  // ===== MENU CONFIG (ROLE BASED) =====
  const adminMenu = [
    { to: "/admin-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/customers", label: "Customers", icon: Users },
    { to: "/employees", label: "Employees", icon: Briefcase },
    { to: "/suppliers", label: "Suppliers", icon: Truck },
    { to: "/fuels", label: "Fuels", icon: Fuel },
    { to: "/fuel_order_history", label: "Order History", icon: History },
    { to: "/pumps", label: "Pumps", icon: Gauge },
    { to: "/sales", label: "Sales", icon: ShoppingCart },
    { to: "/stations", label: "Stations", icon: MapPin },
  ];

  const staffMenu = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/sales", label: "Sales", icon: ShoppingCart },
    { to: "/customers", label: "Customers", icon: Users },
    { to: "/pumps", label: "Pumps", icon: Gauge },
  ];

  const menu = user.role === "admin" ? adminMenu : staffMenu;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-slate-100 shadow-xl flex flex-col">
      {/* Brand */}
      <div className="px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30 flex items-center justify-center">
            <Fuel className="text-emerald-400" size={18} />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">FMS</h1>
            <p className="text-xs text-slate-400">
              {user.role === "admin" ? "Admin Panel" : "Staff Panel"} · {user.username}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} className={linkCls(item.to)}>
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-rose-500/15 hover:text-rose-400 transition-all"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
