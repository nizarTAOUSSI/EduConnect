import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../assets/Logo.png';
import { LoginModal, SignupModal } from './AuthModals';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const dashboardPath =
    user?.role === 'admin'
      ? '/dashboard/admin'
      : user?.role === 'enseignant'
        ? '/dashboard/enseignant'
        : user?.role === 'parent'
          ? '/dashboard/parent'
          : '/dashboard/etudiant';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  return (
    <>
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 w-full z-40 transition-all duration-500 ${isScrolled ? 'py-3' : 'py-6'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex justify-between items-center transition-all duration-500 rounded-full px-6 py-3 ${isScrolled ? 'glass' : 'bg-transparent'}`}>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-12">
                <img src={logo} alt="Logo" className="w-full h-full" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                EduConnect
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
              <a href="#fonctionnalites" className="hover:text-primary transition-colors">Fonctionnalités</a>
              <a href="#ecosysteme" className="hover:text-primary transition-colors">Écosystème</a>
              <a href="#securite" className="hover:text-primary transition-colors">Sécurité</a>
            </nav>

            <div className="hidden md:flex items-center gap-5">
              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <Link
                    to={dashboardPath}
                    className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-4 py-2 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    Mon tableau de bord
                  </Link>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-slate-900">
                      {user?.first_name} {user?.last_name}
                    </span>
                    <span className="text-xs text-slate-500 capitalize">
                      {user?.role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => setShowLogin(true)}
                    className="font-semibold text-sm text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Se connecter
                  </button>
                  <button 
                    onClick={() => setShowSignup(true)}
                    className="group relative bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all overflow-hidden flex items-center gap-2"
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/50 to-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity blur-md"></div>
                    <span className="relative z-10">Démarrer</span>
                    <ChevronRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                  </button>
                </>
              )}
            </div>

            <button className="md:hidden text-slate-900 absolute right-6 z-50" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="md:hidden absolute top-[calc(100%+10px)] left-4 right-4 glass rounded-2xl p-6 flex flex-col gap-4 shadow-2xl origin-top"
            >
              <a href="#fonctionnalites" onClick={() => setMobileMenuOpen(false)} className="text-slate-700 font-semibold text-lg py-2">Fonctionnalités</a>
              <a href="#ecosysteme" onClick={() => setMobileMenuOpen(false)} className="text-slate-700 font-semibold text-lg py-2">Écosystème</a>
              <a href="#securite" onClick={() => setMobileMenuOpen(false)} className="text-slate-700 font-semibold text-lg py-2">Sécurité</a>
              <div className="h-px w-full bg-slate-200/50 my-2" />
              {isAuthenticated ? (
                <>
                  <div className="text-slate-700 font-semibold text-lg py-2">
                    {user?.first_name} {user?.last_name}
                  </div>
                  <Link
                    to={dashboardPath}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-xl text-center font-semibold transition-colors"
                  >
                    Mon tableau de bord
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl text-center font-semibold transition-colors"
                  >
                    Se déconnecter
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      setShowLogin(true);
                      setMobileMenuOpen(false);
                    }}
                    className="text-slate-700 font-semibold text-lg py-2"
                  >
                    Se connecter
                  </button>
                  <button 
                    onClick={() => {
                      setShowSignup(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-slate-900 text-white px-4 py-4 rounded-xl text-center font-bold mt-2 shadow-lg shadow-slate-900/20"
                  >
                    Démarrer gratuitement
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <LoginModal 
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToSignup={() => {
          setShowLogin(false);
          setShowSignup(true);
        }}
      />

      <SignupModal
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onSwitchToLogin={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
      />
    </>
  );
}
