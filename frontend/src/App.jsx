// src/App.jsx
import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { useUser } from "./hooks/useUser";

export default function App() {
  const { user } = useUser();

  // Haddii weli aan la helin user (ama loading state), waxaad soo celin kartaa
  // spinner ama <Outlet /> kaliya si aanay u dhicin flicker.
  if (!user) {
    return (
      <>
     <Header />
      <Outlet />
      </>
    )
  }

  // Haddii uu yahay admin -> Sidebar layout
  if (user?.role === "admin") {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 ml-0 md:ml-64">
          <Outlet />
        </main>
      </div>
    );
  }

  // Haddii uu yahay user caadi ah -> Header layout
  if (user?.role === "user") {
    return (
      <>
        <Header />
        
          <Outlet />
      </>
    );
  }

  // Default (haddii role kale ama empty)
  return <Outlet />;
}
