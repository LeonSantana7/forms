'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = sessionStorage.getItem('admin_token');
        if (!token) {
            router.push('/admin');
            return;
        }

        fetch('/api/admin/stats', {
            headers: { 'x-admin-token': token },
        })
            .then((res) => {
                if (res.status === 401) {
                    router.push('/admin');
                    throw new Error('Unauthorized');
                }
                return res.json();
            })
            .then((data) => {
                setStats(data);
                setLoading(false);
            })
            .catch((err) => console.error(err));
    }, [router]);

    if (loading) return <div className="p-10 text-center">Carregando dashboard...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard de Respostas</h1>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <KPICard title="Total de Respostas" value={stats.total} />
                    <KPICard title="Hoje" value={stats.todayCount} color="text-green-600" />
                    <KPICard title="Últimos 7 dias" value={stats.last7Days} color="text-blue-600" />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    <ChartCard title="Q1: Canais de Agendamento">
                        <Bar
                            data={{
                                labels: Object.keys(stats.q1),
                                datasets: [
                                    {
                                        label: 'Respostas',
                                        data: Object.values(stats.q1),
                                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                                    },
                                ],
                            }}
                        />
                    </ChartCard>

                    <ChartCard title="Q2: Problemas Comuns">
                        <Bar
                            data={{
                                labels: Object.keys(stats.q2),
                                datasets: [
                                    {
                                        label: 'Respostas',
                                        data: Object.values(stats.q2),
                                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                                    },
                                ],
                            }}
                        />
                    </ChartCard>

                    <ChartCard title="Q5: Agendamento Automático?">
                        <Pie
                            data={{
                                labels: Object.keys(stats.q5),
                                datasets: [
                                    {
                                        data: Object.values(stats.q5),
                                        backgroundColor: [
                                            'rgba(75, 192, 192, 0.6)',
                                            'rgba(255, 206, 86, 0.6)',
                                            'rgba(255, 99, 132, 0.6)',
                                        ],
                                    },
                                ],
                            }}
                        />
                    </ChartCard>

                    <ChartCard title="Q6: Remarcação">
                        <Doughnut
                            data={{
                                labels: Object.keys(stats.q6),
                                datasets: [
                                    {
                                        data: Object.values(stats.q6),
                                        backgroundColor: [
                                            'rgba(153, 102, 255, 0.6)',
                                            'rgba(255, 159, 64, 0.6)',
                                            'rgba(255, 99, 132, 0.6)',
                                        ],
                                    },
                                ],
                            }}
                        />
                    </ChartCard>

                    <ChartCard title={`Q4: Tempo Perdido (Média: ${stats.q4.avg})`}>
                        <Bar
                            data={{
                                labels: ['1 (Nunca)', '2', '3', '4', '5 (Demais)'],
                                datasets: [
                                    {
                                        label: 'Distribuição',
                                        data: [
                                            stats.q4.hist[1] || 0,
                                            stats.q4.hist[2] || 0,
                                            stats.q4.hist[3] || 0,
                                            stats.q4.hist[4] || 0,
                                            stats.q4.hist[5] || 0,
                                        ],
                                        backgroundColor: 'rgba(255, 205, 86, 0.6)',
                                    },
                                ],
                            }}
                        />
                    </ChartCard>
                </div>

                {/* Table */}
                <div className="bg-white p-6 rounded-xl shadow-sm overflow-hidden">
                    <h2 className="text-xl font-bold mb-4">Últimas Respostas</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-3 font-semibold text-gray-600">Data</th>
                                    <th className="p-3 font-semibold text-gray-600">Negócio</th>
                                    <th className="p-3 font-semibold text-gray-600">Cidade</th>
                                    <th className="p-3 font-semibold text-gray-600">Origem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recent.map((row: any) => (
                                    <tr key={row.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-3">{new Date(row.created_at).toLocaleDateString()}</td>
                                        <td className="p-3">{row.business_type || '-'}</td>
                                        <td className="p-3">{row.city || '-'}</td>
                                        <td className="p-3">{row.source || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, color = 'text-gray-900' }: { title: string; value: number | string; color?: string }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</h3>
            <div className={`text-4xl font-bold ${color}`}>{value}</div>
        </div>
    );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-80">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
            <div className="flex-1 min-h-0 relative w-full h-full flex justify-center">
                {children}
            </div>
        </div>
    );
}
