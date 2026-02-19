import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
    const token = req.headers.get('x-admin-token');

    if (!token || token !== process.env.ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fetch all responses needed for stats (limit up to 2000 for performance on free tier)
        // For a real production app with massive data, rely on DB aggregation.
        // For MVP, fetch and aggregate in Node.js is fine and simpler.
        const { data, error } = await supabaseAdmin
            .from('survey_responses')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(2000);

        if (error) throw error;

        const today = new Date().toISOString().split('T')[0];
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const stats: {
            total: number;
            todayCount: number;
            last7Days: number;
            q1: Record<string, number>;
            q2: Record<string, number>;
            q3: Record<string, number>;
            q4: { avg: number; hist: Record<string, number> };
            q5: Record<string, number>;
            q6: Record<string, number>;
            recent: any[];
        } = {
            total: data.length,
            todayCount: data.filter((r: any) => r.created_at.startsWith(today)).length,
            last7Days: data.filter((r: any) => new Date(r.created_at) > sevenDaysAgo).length,
            q1: {},
            q2: {},
            q3: {},
            q4: { avg: 0, hist: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 } },
            q5: {},
            q6: {},
            recent: data.slice(0, 50).map((r: any) => ({
                id: r.id,
                created_at: r.created_at,
                business_type: r.business_type,
                city: r.city,
                source: r.source,
            })),
        };

        let q4Sum = 0;
        let q4Count = 0;

        data.forEach((r: any) => {
            // Q1 (Multi)
            if (Array.isArray(r.q1?.options)) {
                r.q1.options.forEach((opt: string) => {
                    stats.q1[opt] = (stats.q1[opt] || 0) + 1;
                });
            }

            // Q2 (Multi)
            if (Array.isArray(r.q2?.options)) {
                r.q2.options.forEach((opt: string) => {
                    stats.q2[opt] = (stats.q2[opt] || 0) + 1;
                });
            }

            // Q3 (Multi)
            if (Array.isArray(r.q3?.options)) {
                r.q3.options.forEach((opt: string) => {
                    stats.q3[opt] = (stats.q3[opt] || 0) + 1;
                });
            }

            // Q4 (Scale 1-5)
            if (r.q4) {
                const val = String(r.q4);
                stats.q4.hist[val] = (stats.q4.hist[val] || 0) + 1;
                q4Sum += Number(r.q4);
                q4Count++;
            }

            // Q5 (Single)
            if (typeof r.q5 === 'string') {
                stats.q5[r.q5] = (stats.q5[r.q5] || 0) + 1;
            }

            // Q6 (Single)
            if (typeof r.q6 === 'string') {
                stats.q6[r.q6] = (stats.q6[r.q6] || 0) + 1;
            }
        });

        stats.q4.avg = q4Count > 0 ? parseFloat((q4Sum / q4Count).toFixed(2)) : 0;

        return NextResponse.json(stats);
    } catch (error: any) {
        console.error('Stats API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
