'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Check, ChevronLeft, ChevronRight, Send, Share2 } from 'lucide-react';

// Initialize Supabase client for client-side usage if needed, or better: send data to API route to avoid exposing key?
// Actually we can use API route for better control (rate limit, validation).
// But for now, let's keep it simple and submit via API route.

type Answers = {
    q1: string[];
    q2: string[];
    q3: string[];
    q4: number;
    q5: string;
    q6: string;
    q7: string[];
    other_q1?: string;
    other_q2?: string;
    other_q3?: string;
    other_q7?: string;
    city?: string;
    business_type?: string;
};

const INITIAL_ANSWERS: Answers = {
    q1: [],
    q2: [],
    q3: [],
    q4: 3,
    q5: '',
    q6: '',
    q7: [],
};

const OPTIONS = {
    q1: ['WhatsApp', 'Agenda (papel)', 'Google Agenda', 'Instagram/DM', 'Sistema/Software', 'Outro'],
    q2: ['Atraso', 'Falta', 'Horário duplicado', 'Cliente esquece', 'Não tenho problema', 'Outro'],
    q3: ['Nome', 'Telefone', 'Serviço/procedimento', 'Profissional', 'Forma de pagamento', 'Observações', 'Outro'],
    q6: ['Tranquilo', 'Dá um pouco de trabalho', 'Vira bagunça'],
    q7: ['Pagamento/PIX', 'Cadastro de clientes', 'Histórico de serviços', 'Controle financeiro', 'Estoque/produtos', 'Relatórios', 'Outro'],
    business_type: ['Salão de Beleza', 'Barbearia', 'Ambos', 'Outro'],
};

export default function SurveyForm() {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Answers>(INITIAL_ANSWERS);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Load draft from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('survey_draft');
        if (saved) {
            try {
                setAnswers(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse draft', e);
            }
        }
    }, []);

    // Save draft on change
    useEffect(() => {
        localStorage.setItem('survey_draft', JSON.stringify(answers));
    }, [answers]);

    const handleMultiSelect = (question: keyof Answers, option: string) => {
        setAnswers((prev) => {
            const current = (prev[question] as string[]) || [];
            if (current.includes(option)) {
                return { ...prev, [question]: current.filter((i) => i !== option) };
            } else {
                return { ...prev, [question]: [...current, option] };
            }
        });
    };

    const handleSingleSelect = (question: keyof Answers, value: string | number) => {
        setAnswers((prev) => ({ ...prev, [question]: value }));
    };

    const handleChange = (field: keyof Answers, value: any) => {
        setAnswers((prev) => ({ ...prev, [field]: value }));
    };

    const nextStep = () => {
        if (step < 9) setStep(step + 1);
    };

    const prevStep = () => {
        if (step > 0) setStep(step - 1);
    };

    const submitSurvey = async () => {
        setLoading(true);
        try {
            const payload = {
                ...answers,
                // formatted for DB
                q1: { options: answers.q1, other: answers.other_q1 },
                q2: { options: answers.q2, other: answers.other_q2 },
                q3: { options: answers.q3, other: answers.other_q3 },
                q7: { options: answers.q7, other: answers.other_q7 },
                source: new URLSearchParams(window.location.search).get('src') || 'direct',
            };

            const res = await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Failed to submit');

            setSubmitted(true);
            localStorage.removeItem('survey_draft');
            setStep(10); // Thank you screen
        } catch (error) {
            alert('Erro ao enviar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const shareLink = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Pesquisa para Profissionais de Beleza',
                    text: 'Participe desta pesquisa rápida para ajudar a melhorar a gestão do nosso setor!',
                    url: window.location.href,
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            alert('Link copiado para a área de transferência!');
            navigator.clipboard.writeText(window.location.href);
        }
    };

    if (step === 10) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-6 animate-slide-in-bottom duration-500">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                    <Check size={40} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Obrigado!</h1>
                <p className="text-gray-600">
                    Sua resposta ajuda muito a entender os desafios do setor.
                </p>
                <button
                    onClick={shareLink}
                    className="w-full max-w-xs bg-blue-600 text-white font-semibold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <Share2 size={20} />
                    Enviar para outro profissional
                </button>
            </div>
        );
    }

    // Progress Bar
    const progress = Math.min((step / 9) * 100, 100);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative">
            {/* Header / Progress */}
            {step > 0 && step < 10 && (
                <div className="w-full bg-gray-200 h-2">
                    <div
                        className="bg-blue-600 h-2 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            <main className="flex-1 flex flex-col p-6 overflow-y-auto">
                {step === 0 && (
                    <div className="flex-1 flex flex-col justify-center gap-6 animate-zoom-in duration-500">
                        <h1 className="text-3xl font-extrabold text-blue-900 leading-tight">
                            Pesquisa rápida <br />
                            <span className="text-blue-600">Agenda do Salão</span>
                        </h1>
                        <p className="text-lg text-gray-600">
                            Leva apenas 1 minuto. Ajude a mapear os maiores desafios de agendamento em salões e barbearias.
                        </p>
                        <div className="flex-1" />
                        <button
                            onClick={nextStep}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-5 rounded-2xl shadow-xl active:scale-95 transition-transform"
                        >
                            Começar
                        </button>
                    </div>
                )}

                {step === 1 && (
                    <QuestionStep
                        title="Hoje você agenda seus clientes como?"
                        subtitle="Pode marcar mais de uma opção."
                        onNext={nextStep}
                        onPrev={prevStep}
                        canNext={answers.q1.length > 0}
                    >
                        <div className="grid grid-cols-1 gap-3">
                            {OPTIONS.q1.map((opt) => (
                                <SelectButton
                                    key={opt}
                                    label={opt}
                                    selected={answers.q1.includes(opt)}
                                    onClick={() => handleMultiSelect('q1', opt)}
                                />
                            ))}
                            {answers.q1.includes('Outro') && (
                                <input
                                    type="text"
                                    placeholder="Qual outro?"
                                    className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-all"
                                    value={answers.other_q1 || ''}
                                    onChange={(e) => handleChange('other_q1', e.target.value)}
                                    autoFocus
                                />
                            )}
                        </div>
                    </QuestionStep>
                )}

                {step === 2 && (
                    <QuestionStep
                        title="Costuma dar problema de horário?"
                        subtitle="O que mais acontece no dia a dia?"
                        onNext={nextStep}
                        onPrev={prevStep}
                        canNext={answers.q2.length > 0}
                    >
                        <div className="grid grid-cols-1 gap-3">
                            {OPTIONS.q2.map((opt) => (
                                <SelectButton
                                    key={opt}
                                    label={opt}
                                    selected={answers.q2.includes(opt)}
                                    onClick={() => handleMultiSelect('q2', opt)}
                                />
                            ))}
                            {answers.q2.includes('Outro') && (
                                <input
                                    type="text"
                                    placeholder="Qual outro problema?"
                                    className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-all"
                                    value={answers.other_q2 || ''}
                                    onChange={(e) => handleChange('other_q2', e.target.value)}
                                />
                            )}
                        </div>
                    </QuestionStep>
                )}

                {step === 3 && (
                    <QuestionStep
                        title="O que você sempre precisa saber  do cliente pra marcar?"
                        subtitle="Informações essenciais."
                        onNext={nextStep}
                        onPrev={prevStep}
                        canNext={answers.q3.length > 0}
                    >
                        <div className="grid grid-cols-1 gap-3">
                            {OPTIONS.q3.map((opt) => (
                                <SelectButton
                                    key={opt}
                                    label={opt}
                                    selected={answers.q3.includes(opt)}
                                    onClick={() => handleMultiSelect('q3', opt)}
                                />
                            ))}
                            {answers.q3.includes('Outro') && (
                                <input
                                    type="text"
                                    placeholder="O que mais?"
                                    className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-all"
                                    value={answers.other_q3 || ''}
                                    onChange={(e) => handleChange('other_q3', e.target.value)}
                                />
                            )}
                        </div>
                    </QuestionStep>
                )}

                {step === 4 && (
                    <QuestionStep
                        title="Você perde muito tempo respondendo msg só pra falar horários?"
                        subtitle={`Escala de 1 a 5: ${answers.q4}`}
                        onNext={nextStep}
                        onPrev={prevStep}
                        canNext={true}
                    >
                        <div className="flex flex-col gap-6 items-center py-6">
                            <div className="flex justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-widest px-1">
                                <span>Nunca</span>
                                <span>Demais</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                step="1"
                                value={answers.q4}
                                onChange={(e) => handleSingleSelect('q4', parseInt(e.target.value))}
                                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="text-4xl font-bold text-blue-600">{answers.q4}</div>
                        </div>
                    </QuestionStep>
                )}

                {step === 5 && (
                    <QuestionStep
                        title="Ajudaria se o cliente pudesse agendar sozinho?"
                        subtitle="E receber lembrete automático."
                        onNext={nextStep}
                        onPrev={prevStep}
                        canNext={!!answers.q5}
                    >
                        <div className="grid grid-cols-1 gap-4">
                            {['Sim, muito!', 'Não, prefiro eu marcar', 'Talvez/Não sei'].map((opt) => (
                                <SelectButton
                                    key={opt}
                                    label={opt}
                                    selected={answers.q5 === opt}
                                    onClick={() => handleSingleSelect('q5', opt)}
                                    className="text-center justify-center py-6"
                                />
                            ))}
                        </div>
                    </QuestionStep>
                )}

                {step === 6 && (
                    <QuestionStep
                        title="Remarcar ou encaixar alguém é...?"
                        subtitle="Como você sente isso na rotina."
                        onNext={nextStep}
                        onPrev={prevStep}
                        canNext={!!answers.q6}
                    >
                        <div className="grid grid-cols-1 gap-4">
                            {OPTIONS.q6.map((opt) => (
                                <SelectButton
                                    key={opt}
                                    label={opt}
                                    selected={answers.q6 === opt}
                                    onClick={() => handleSingleSelect('q6', opt)}
                                />
                            ))}
                        </div>
                    </QuestionStep>
                )}

                {step === 7 && (
                    <QuestionStep
                        title="Além da agenda, o que facilitaria seu dia?"
                        subtitle="Funcionalidades extras."
                        onNext={nextStep}
                        onPrev={prevStep}
                        canNext={answers.q7.length > 0}
                    >
                        <div className="grid grid-cols-1 gap-3">
                            {OPTIONS.q7.map((opt) => (
                                <SelectButton
                                    key={opt}
                                    label={opt}
                                    selected={answers.q7.includes(opt)}
                                    onClick={() => handleMultiSelect('q7', opt)}
                                />
                            ))}
                            {answers.q7.includes('Outro') && (
                                <input
                                    type="text"
                                    placeholder="O que mais?"
                                    className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-all"
                                    value={answers.other_q7 || ''}
                                    onChange={(e) => handleChange('other_q7', e.target.value)}
                                />
                            )}
                        </div>
                    </QuestionStep>
                )}

                {step === 8 && (
                    <QuestionStep
                        title="Quase lá! Só mais uns detalhes."
                        subtitle="Para categorizar sua resposta."
                        onNext={nextStep}
                        onPrev={prevStep}
                        canNext={!!answers.business_type}
                    >
                        <div className="flex flex-col gap-4">
                            <label className="text-sm font-bold text-gray-600 uppercase">Seu Negócio</label>
                            <div className="grid grid-cols-2 gap-3">
                                {OPTIONS.business_type.map((opt) => (
                                    <SelectButton
                                        key={opt}
                                        label={opt}
                                        selected={answers.business_type === opt}
                                        onClick={() => handleSingleSelect('business_type', opt)}
                                        className="text-sm py-3 px-2 justify-center"
                                    />
                                ))}
                            </div>

                            <label className="text-sm font-bold text-gray-600 uppercase mt-4">Sua Cidade (Opcional)</label>
                            <input
                                type="text"
                                placeholder="Ex: São Paulo - SP"
                                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none"
                                value={answers.city || ''}
                                onChange={(e) => handleChange('city', e.target.value)}
                            />
                        </div>
                    </QuestionStep>
                )}

                {step === 9 && (
                    <div className="flex-1 flex flex-col animate-slide-in-bottom duration-500">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Revisão</h2>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-y-auto mb-6 space-y-4 text-sm">
                            <ReviewItem label="Agendamento" value={answers.q1.join(', ')} />
                            <ReviewItem label="Problemas" value={answers.q2.join(', ')} />
                            <ReviewItem label="Dados" value={answers.q3.join(', ')} />
                            <ReviewItem label="Tempo perdido" value={`${answers.q4}/5`} />
                            <ReviewItem label="Auto Agendamento" value={answers.q5} />
                            <ReviewItem label="Remarcação" value={answers.q6} />
                            <ReviewItem label="Extras" value={answers.q7.join(', ')} />
                            <ReviewItem label="Negócio" value={answers.business_type} />
                            <ReviewItem label="Cidade" value={answers.city} />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={prevStep}
                                className="flex-1 bg-gray-200 text-gray-700 font-bold py-4 rounded-xl"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={submitSurvey}
                                disabled={loading}
                                className="flex-[2] bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
                            >
                                {loading ? 'Enviando...' : 'Confirmar e Enviar'}
                                {!loading && <Send size={20} />}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// Subcomponents

function QuestionStep({
    title,
    subtitle,
    children,
    onNext,
    onPrev,
    canNext,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    onNext: () => void;
    onPrev: () => void;
    canNext: boolean;
}) {
    return (
        <div className="flex-1 flex flex-col h-full animate-slide-in-right duration-300">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-2">{title}</h2>
                {subtitle && <p className="text-gray-500">{subtitle}</p>}
            </div>

            <div className="flex-1 overflow-y-auto pb-4">
                {children}
            </div>

            <div className="pt-4 flex gap-3 mt-auto bg-gray-50 bg-opacity-90 backdrop-blur-sm sticky bottom-0">
                <button
                    onClick={onPrev}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold p-4 rounded-xl transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={onNext}
                    disabled={!canNext}
                    className={`flex-1 font-bold p-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2
            ${canNext ? 'bg-blue-600 text-white active:scale-95' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
          `}
                >
                    Próximo <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}

function SelectButton({
    label,
    selected,
    onClick,
    className = '',
}: {
    label: string;
    selected: boolean;
    onClick: () => void;
    className?: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`relative w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group
        ${selected
                    ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-md transform scale-[1.01]'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-gray-50'
                } ${className}`}
        >
            <span className="font-semibold text-lg">{label}</span>
            {selected && <div className="bg-blue-600 text-white rounded-full p-1"><Check size={16} /></div>}
        </button>
    );
}

function ReviewItem({ label, value }: { label: string; value: any }) {
    if (!value) return null;
    return (
        <div className="border-b border-gray-100 last:border-0 pb-2 last:pb-0">
            <span className="text-xs font-bold text-gray-400 uppercase block mb-1">{label}</span>
            <span className="text-gray-800 font-medium">{value}</span>
        </div>
    );
}
