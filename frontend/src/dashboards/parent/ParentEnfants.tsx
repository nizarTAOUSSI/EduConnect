import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ParentEnfants() {
  const { t } = useTranslation();
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('parent_children.title')}</h1>
        <p className="text-slate-500 mt-1">{t('parent_children.subtitle')}</p>
      </div>
      <div className="bg-white rounded-3xl border border-slate-200/60 p-12 shadow-sm text-center">
        <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-600 mb-2">{t('common.coming_soon')}</h3>
        <p className="text-slate-400">{t('common.section_available_soon')}</p>
      </div>
    </div>
  );
}
