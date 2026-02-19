import SurveyForm from '@/components/SurveyForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pesquisa para Profissionais de Beleza',
  description: 'Ajude a melhorar o setor de beleza com sua opinião.',
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-0 md:p-4">
      <SurveyForm />
    </main>
  );
}
