import { motion } from 'framer-motion';
import { Globe, Zap, MessageSquare, ArrowUpRight } from 'lucide-react';

const features = [
  {
    title: 'Accessibilité Globale',
    description: 'Une plateforme centralisée et accessible en ligne 24/7 depuis n\'importe quel appareil avec une interface adaptative ultra-rapide.',
    icon: <Globe className="w-7 h-7 text-primary" />,
    gradient: 'from-blue-500/10 to-indigo-500/10',
    border: 'group-hover:border-indigo-500/50',
    delay: 0.1
  },
  {
    title: 'Moteur de Calcul Fiable',
    description: 'Automatisation complète des calculs complexes : les moyennes et les crédits sont générés instantanément, sans aucune erreur humaine.',
    icon: <Zap className="w-7 h-7 text-amber-500" />,
    gradient: 'from-amber-500/10 to-orange-500/10',
    border: 'group-hover:border-amber-500/50',
    delay: 0.2
  },
  {
    title: 'Communication Fluide',
    description: 'Transparence totale, suivi des résultats et notifications en temps réel pour tous les acteurs grâce à notre système de messagerie intégré.',
    icon: <MessageSquare className="w-7 h-7 text-emerald-500" />,
    gradient: 'from-emerald-500/10 to-teal-500/10',
    border: 'group-hover:border-emerald-500/50',
    delay: 0.3
  }
];

export default function Features() {
  return (
    <section id="fonctionnalites" className="py-32 relative bg-[#fafafa]">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-slate-200/50 text-sm font-bold text-slate-500 tracking-widest uppercase mb-6">
              L'Architecture du Succès
            </div>
            <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Notre Solution Digitale</h3>
            <p className="text-slate-500 text-xl font-medium">
              Repensez la gestion de votre établissement avec une architecture conçue pour la rapidité, la fiabilité absolue et l'élégance.
            </p>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: feature.delay, ease: "easeOut" }}
              className={`group relative bg-white rounded-[2rem] p-8 md:p-10 border border-slate-200/60 shadow-lg shadow-slate-200/20 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden ${feature.border}`}
            >
              <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${feature.gradient} rounded-full blur-3xl -mr-20 -mt-20 opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                    {feature.icon}
                  </div>
                  <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-colors duration-300">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
                
                <h4 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">{feature.title}</h4>
                <p className="text-slate-500 text-lg leading-relaxed font-medium">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
