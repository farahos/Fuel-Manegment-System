import { Link, useLocation } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa6";

const Header = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation(); // ✅ si aan u ogaano meesha hadda la joogo

  useEffect(() => {
    // if (!user) navigate("/login");
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ function fudud oo hubinaya haddii link-gu yahay active
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-blue-600 text-white p-2 shadow-lg sticky top-0 z-50">
      <div className="flex justify-between items-center max-w-6xl mx-auto">
        {/* Logo / Title */}
        <div className="flex items-center space-x-2">
          {user ? (
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 text-white">
                <FaUser className="text-xl" />
                <span className="text-xl md:text-2xl font-bold uppercase">
                  {user?.username}
                </span>
              </div>
            </Link>
          ) : (
            <h1 className="text-xl md:text-2xl font-bold text-white">
              SUUQA IIBKA SAAMIGA
            </h1>
          )}
        </div>

        {/* Mobile Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-indigo-400 transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-6 items-center">
          {user ? (
            <>
              <li>
                <Link
                  to="/"
                  className={`relative group px-2 py-1 font-medium transition-colors duration-300 ${
                    isActive("/") ? "text-yellow-300" : "hover:text-yellow-300"
                  }`}
                >
                  Home
                  {isActive("/") && (
                    <span className="absolute left-0 -bottom-1 w-full h-0.5 bg-yellow-300"></span>
                  )}
                </Link>
              </li>

              <li>
                <button
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  Kabax
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link
                  to="/"
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                    isActive("/") ? "bg-yellow-300 text-blue-700" : "bg-white text-blue-600 hover:bg-indigo-50"
                  }`}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                    isActive("/login") ? "bg-yellow-300 text-blue-700" : "bg-white text-blue-600 hover:bg-indigo-50"
                  }`}
                >
                  Gal Hadda
                </Link>
              </li>
              <li>
                <Link
                  to="/Register"
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                    isActive("/Register")
                      ? "bg-yellow-300 text-blue-700"
                      : "bg-white text-blue-600 hover:bg-indigo-50"
                  }`}
                >
                  Is diiwaan geli
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div ref={menuRef} className="md:hidden mt-4 bg-indigo-500 rounded-lg p-4 animate-fadeIn">
          <ul className="flex flex-col space-y-4 text-center">
            <li>
              <Link
                to="/"
                className={`block py-3 px-4 rounded-lg font-medium transition-colors duration-300 ${
                  isActive("/") ? "bg-yellow-400 text-blue-700" : "hover:bg-indigo-600 hover:text-yellow-300"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
            </li>
            {user ? (
              <li>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300"
                >
                  Kabax
                </button>
              </li>
            ) : (
              <>
                <li>
                  <Link
                    to="/login"
                    className={`block py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                      isActive("/login")
                        ? "bg-yellow-400 text-blue-700"
                        : "bg-white text-indigo-600 hover:bg-indigo-50"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Gal Hadda
                  </Link>
                </li>
                <li>
                  <Link
                    to="/Register"
                    className={`block py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                      isActive("/Register")
                        ? "bg-yellow-400 text-blue-700"
                        : "bg-white text-indigo-600 hover:bg-indigo-50"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Is diiwaan geli
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Header;
