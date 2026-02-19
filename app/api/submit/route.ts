
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            q1, q2, q3, q4, q5, q6, q7,
            city, source, business_type
        } = body;

        // Get IP
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';
        const userAgent = req.headers.get('user-agent') || 'unknown';

        // Rate Limit: 10 per hour per IP
        const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();

        const { count, error: countError } = await supabaseAdmin
            .from('survey_responses')
            .select('id', { count: 'exact', head: true })
            .eq('ip', ip)
            .gt('created_at', oneHourAgo);

        if (countError) {
            console.error('Rate limit check error:', countError);
            return NextResponse.json({ error: 'Service Unavailable' }, { status: 500 });
        }

        if (count !== null && count >= 10) {
            return NextResponse.json(
                { error: 'Muitas tentativas. Tente novamente mais tarde.' },
                { status: 429 }
            );
        }

        // Insert Data
        const { error: insertError } = await supabaseAdmin
            .from('survey_responses')
            .insert({
                q1, q2, q3, q4, q5, q6, q7,
                city,
                source,
                business_type,
                user_agent: userAgent,
                ip: ip,
                created_at: new Date().toISOString(), // Optional, default is now()
            });

        if (insertError) {
            console.error('Insert error:', insertError);
            return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
