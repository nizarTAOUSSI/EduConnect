import { motion } from 'framer-motion';
import { ArrowRight, Play, Database, Server, Cpu, Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-[100svh] pt-32 pb-20 lg:pt-48 flex items-center overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] mix-blend-multiply opacity-70 animate-blob" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-purple-400/20 rounded-full blur-[120px] mix-blend-multiply opacity-70 animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[120px] mix-blend-multiply opacity-70 animate-blob animation-delay-4000" />
      
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/60 backdrop-blur-md border border-slate-200/50 shadow-sm text-sm font-semibold text-slate-700">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Système de Nouvelle Génération</span>
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            Digitaliser, <br className="hidden md:block" />
            <span className="text-gradient">Automatiser</span>, Connecter.
          </motion.h1>
          
          <motion.p 
            className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            L'application cloud intelligente pour repenser l'administration scolaire. Connectez professeurs, élèves et parents dans un écosystème en temps réel.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <a href="#fonctionnalites" className="group w-full sm:w-auto px-8 py-4 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center gap-3 transition-all hover:scale-105 hover:bg-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.15)]">
              Découvrir la plateforme
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#" className="w-full sm:w-auto px-8 py-4 rounded-full glass hover:bg-white/80 font-bold flex items-center justify-center gap-3 transition-all hover:scale-105 text-slate-800">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                <Play className="w-3 h-3 text-slate-800 fill-slate-800 ml-0.5" />
              </div>
              Espace Démo
            </a>
          </motion.div>
        </div>

        <motion.div 
          className="mt-20 relative mx-auto max-w-4xl h-[400px] flex justify-center perspective-[1000px]"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div 
            className="absolute top-10 w-full max-w-3xl h-[400px] glass rounded-3xl border border-white p-6 shadow-2xl"
            animate={{ rotateX: [10, 5, 10], rotateY: [-5, 5, -5] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="w-full h-full flex flex-col gap-4 opacity-80">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200/50">
                 <div className="flex gap-2">
                   <div className="w-3 h-3 rounded-full bg-red-400" />
                   <div className="w-3 h-3 rounded-full bg-amber-400" />
                   <div className="w-3 h-3 rounded-full bg-emerald-400" />
                 </div>
                 <div className="flex gap-3">
                   <div className="w-24 h-6 rounded-full bg-slate-200/50" />
                   <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500" />
                 </div>
              </div>
              <div className="flex gap-6 h-full">
                <div className="w-48 hidden md:flex flex-col gap-3">
                  <div className="w-full h-8 rounded-lg bg-primary/10" />
                  <div className="w-full h-8 rounded-lg bg-slate-100" />
                  <div className="w-full h-8 rounded-lg bg-slate-100" />
                  <div className="w-full h-8 rounded-lg bg-slate-100" />
                </div>
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="flex-1 h-24 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/50 p-4">
                       <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center mb-2">
                         <Database className="w-4 h-4 text-indigo-500" />
                       </div>
                       <div className="w-1/2 h-3 rounded-full bg-slate-200 mt-2" />
                    </div>
                    <div className="flex-1 h-24 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/50 p-4">
                       <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center mb-2">
                         <Cpu className="w-4 h-4 text-emerald-500" />
                       </div>
                       <div className="w-1/2 h-3 rounded-full bg-slate-200 mt-2" />
                    </div>
                  </div>
                  <div className="flex-1 rounded-2xl bg-slate-100/50 border border-slate-200/50 overflow-hidden relative">
                     <svg className="absolute bottom-0 w-full h-[60%] opacity-50" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <path d="M0,100 L0,50 Q25,30 50,60 T100,20 L100,100 Z" fill="url(#gradient)" />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="var(--color-primary-light)" />
                            <stop offset="100%" stopColor="transparent" />
                          </linearGradient>
                        </defs>
                     </svg>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="absolute -right-4 md:-right-12 top-24 glass p-4 rounded-2xl flex items-center gap-4 z-20"
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Server className="text-white w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">Synchronisation</div>
              <div className="text-xs font-medium text-emerald-500">Temps réel actif</div>
            </div>
          </motion.div>

          <motion.div 
            className="absolute -left-4 md:-left-12 bottom-12 glass p-4 rounded-2xl flex items-center gap-4 z-20"
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shadow-lg shadow-secondary/30">
              <Database className="text-white w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">Zéro Défaut</div>
              <div className="text-xs font-medium text-slate-500">Validation 100%</div>
            </div>
          </motion.div>
          
        </motion.div>
      </div>
    </section>
  );
}
