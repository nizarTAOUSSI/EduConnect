import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, BookOpen, User, Users, CheckCircle2 } from 'lucide-react';

const tabs = [
  {
    id: 'admin',
    label: 'Administration',
    icon: <Settings className="w-5 h-5" />,
    color: 'text-indigo-500',
    content: {
      title: 'Contrôle Total & Supervision',
      description: 'L\'administration dispose d\'un outil puissant pour piloter l\'établissement : configuration avancée des cursus, centralisation des données et tableaux de bord analytiques.',
      features: ['Tableaux de bord analytiques', 'Gestion fine des droits', 'Supervision globale en temps réel']
    }
  },
  {
    id: 'profs',
    label: 'Professeurs',
    icon: <BookOpen className="w-5 h-5" />,
    color: 'text-amber-500',
    content: {
      title: 'Efficacité Pédagogique',
      description: 'Gagnez un temps précieux. Saisissez les évaluations intuitivement; le moteur intelligent applique instantanément les barèmes et calcule les moyennes certifiées.',
      features: ['Grilles d\'évaluation personnalisables', 'Calcul automatisé sans erreur', 'Génération rapide d\'appréciations']
    }
  },
  {
    id: 'etudiants',
    label: 'Étudiants',
    icon: <User className="w-5 h-5" />,
    color: 'text-emerald-500',
    content: {
      title: 'Autonomie & Transparence',
      description: 'Un espace personnel moderne pour visualiser son parcours, consulter ses relevés digitalisés et interagir rapidement via la plateforme de réclamation.',
      features: ['Relevés de notes interactifs', 'Graphiques de progression', 'Hub de réclamations intégré']
    }
  },
  {
    id: 'parents',
    label: 'Parents',
    icon: <Users className="w-5 h-5" />,
    color: 'text-sky-500',
    content: {
      title: 'Connexion Ininterrompue',
      description: 'Une application partenaire rassurante pour rester connecté à la scolarité de vos enfants, avec des alertes configurables et un accès transparent aux résultats.',
      features: ['Alertes personnalisables', 'Vue globale du parcours', 'Accès sécurisé multi-enfants']
    }
  }
];

export default function Ecosystem() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const activeContent = tabs.find(t => t.id === activeTab)?.content;

  return (
    <section id="ecosysteme" className="py-32 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-50 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[100px] -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">L'Écosystème Connecté</h2>
            <p className="text-slate-500 text-xl font-medium">
              Une plateforme modulaire conçue spécifiquement pour répondre aux exigences technologiques de chaque utilisateur.
            </p>
          </motion.div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden ring-1 ring-slate-900/5">
          <div className="flex flex-col lg:flex-row min-h-[500px]">
            
            <div className="w-full lg:w-[35%] bg-slate-50/50 border-b lg:border-b-0 lg:border-r border-slate-100 p-6 lg:p-10 relative z-10">
              <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-4 px-6 py-5 rounded-2xl transition-all whitespace-nowrap lg:whitespace-normal font-bold text-left group overflow-hidden w-full
                        ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="active-tab"
                          className="absolute inset-0 bg-white shadow-sm ring-1 ring-slate-200/50 rounded-2xl"
                          initial={false}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <div className={`relative z-10 p-2.5 rounded-xl transition-colors duration-300 ${isActive ? tab.color + ' bg-slate-50' : 'bg-slate-100/80 text-slate-400 group-hover:bg-slate-200/80 group-hover:text-slate-500'}`}>
                        {tab.icon}
                      </div>
                      <span className="relative z-10 text-lg">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Area */}
            <div className="w-full lg:w-[65%] p-8 lg:p-16 relative flex items-center bg-white z-0">
              {/* Decorative graphic background */}
              <div className="absolute right-0 bottom-0 w-64 h-64 bg-slate-50 rounded-tl-[100px] -z-10" />
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="max-w-xl"
                >
                  <div className="w-12 h-1 bg-gradient-to-r from-primary to-purple-500 rounded-full mb-8" />
                  <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">{activeContent?.title}</h3>
                  <p className="text-xl text-slate-500 leading-relaxed mb-10 font-medium">
                    {activeContent?.description}
                  </p>
                  
                  <ul className="space-y-5">
                    {activeContent?.features.map((feature, i) => (
                      <motion.li 
                        key={i} 
                        className="flex items-center gap-4 text-slate-700 font-semibold text-lg"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 + 0.2 }}
                      >
                         <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                        {feature}
                      </motion.li>
                    ))}
                  </ul>
                  
                  <div className="mt-14">
                     <button className="h-12 px-6 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold transition-colors flex items-center gap-2 text-sm ring-1 ring-slate-200">
                      Explorer la solution détaillée
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            
          </div>
        </div>

      </div>
    </section>
  );
}
