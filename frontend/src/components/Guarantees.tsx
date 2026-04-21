import { motion } from 'framer-motion';
import { Activity, ShieldCheck, Cpu } from 'lucide-react';

const guarantees = [
  {
    title: 'Automatisation Stratégique',
    description: 'Une réduction drastique des tâches manuelles. Oubliez les erreurs humaines avec des barèmes pré-validés.',
    icon: <Cpu className="w-10 h-10 text-primary" />,
    gradient: 'from-blue-600/20 via-indigo-500/20 to-purple-500/20'
  },
  {
    title: 'Zéro Défaut Garanti',
    description: 'Une intégrité parfaite. Les flux de validation en cascade bloquent tout écart statistique détecté.',
    icon: <Activity className="w-10 h-10 text-emerald-500" />,
    gradient: 'from-emerald-500/20 via-teal-500/20 to-cyan-500/20'
  },
  {
    title: 'Sécurité Architecturale',
    description: 'Une forteresse numérique. Chiffrement AES-256 et architecture RBAC assurant la confidentialité absolue de vos données.',
    icon: <ShieldCheck className="w-10 h-10 text-rose-500" />,
    gradient: 'from-rose-500/20 via-orange-500/20 to-amber-500/20'
  }
];

export default function Guarantees() {
  return (
    <section id="securite" className="py-32 bg-slate-900 relative">
      
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="mb-20 grid lg:grid-cols-2 gap-12 items-end">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-white/10 text-sm font-bold text-slate-300 tracking-widest uppercase mb-6 backdrop-blur-sm border border-white/10">
              Infrastructure
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Des fondations bâties sur la fiabilité absolue.
            </h2>
          </motion.div>
          <motion.div
             initial={{ opacity: 0, x: 30 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          >
            <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-lg lg:ml-auto">
              Nous utilisons les mêmes standards de sécurité que l'industrie financière pour garantir que vos données restent privées, précises et toujours disponibles.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {guarantees.map((guarantee, index) => (
            <motion.div
              key={guarantee.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
              className="group relative bg-slate-800/50 backdrop-blur-md rounded-3xl p-10 border border-slate-700/50 hover:border-slate-600 transition-colors duration-500 overflow-hidden"
            >
              <div className={`absolute -inset-px rounded-3xl bg-gradient-to-br ${guarantee.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10`} />
              
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/80 shadow-inner shadow-white/5 border border-slate-700/50 flex items-center justify-center mb-8 transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                  {guarantee.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{guarantee.title}</h3>
                <p className="text-slate-400 font-medium leading-relaxed text-lg">
                  {guarantee.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
