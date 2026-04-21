
import { ArrowUpRight } from 'lucide-react';
import logo from '../assets/Logo.png';

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-16 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -transla  te-x-1/2 w-full max-w-lg h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-10">
          
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12">
                <img src={logo} alt="Logo" className="w-full h-full" />
              </div>
              <span className="text-2xl font-extrabold text-white tracking-tight">
                EduConnect
              </span>
            </div>
            <p className="text-slate-400 font-medium text-center md:text-left max-w-xs">
              L'application web pour l'optimisation des flux pédagogiques et administratifs.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-6">
            <nav className="flex flex-wrap justify-center gap-8 text-sm font-bold text-slate-400">
              <a href="#" className="hover:text-white transition-colors">Fonctionnalités</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
              <a href="#" className="hover:text-white transition-colors flex items-center gap-1">
                Connexion <ArrowUpRight className="w-3 h-3" />
              </a>
            </nav>
            <p className="text-sm font-medium text-slate-500">
              &copy; {new Date().getFullYear()} EduConnect Inc. Tous droits réservés.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
