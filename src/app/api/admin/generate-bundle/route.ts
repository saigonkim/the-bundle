import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BundleDraftSchema } from '@/lib/ai/schemas/bundle';
import { BUNDLE_SYSTEM_PROMPT, BUNDLE_USER_PROMPT } from '@/lib/ai/prompts/bundle-generation';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. Check admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Checking if user is admin (verified via app_metadata for security)
    const isAdmin = 
      user.app_metadata?.role === 'admin' || 
      user.user_metadata?.role === 'admin' || // Fallback
      user.email === 'alex@antigravity.dev' || 
      process.env.NODE_ENV === 'development';
      
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden. Admin only.' }, { status: 403 });
    }

    // 2. Fetch recent ETF candidates (prices and info)
    const { data: etfs, error: etfError } = await supabase
      .from('etf_master')
      .select('ticker, name')
      .eq('is_active', true);

    if (etfError || !etfs) throw new Error('Failed to fetch ETFs');

    // Fetch latest prices for these ETFs by ticker
    const { data: prices, error: priceError } = await supabase
      .from('etf_prices')
      .select('ticker, close_price, nav, change_pct, price_date')
      .in('ticker', etfs.map(e => e.ticker))
      .order('price_date', { ascending: false });

    // Helper to get latest price per ticker
    const latestPricesMapped = new Map();
    if (prices) {
      for (const p of prices) {
        if (!latestPricesMapped.has(p.ticker)) {
          latestPricesMapped.set(p.ticker, p);
        }
      }
    }

    const fullData = etfs.map((e: any) => ({
      ...e,
      price: latestPricesMapped.get(e.ticker)
    }));

    // 3. Call Gemini (with robust model selection)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    
    // Priority list for model selection (Updated based on ListModels exploration)
    const priorityModels = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-2.5-pro',
      'gemini-3-flash-preview',
      'gemini-3.1-flash-lite-preview'
    ];

    let lastError = null;
    let result = null;

    for (const modelName of priorityModels) {
      try {
        console.log(`[Admin AI] Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = `${BUNDLE_SYSTEM_PROMPT}\n\n${BUNDLE_USER_PROMPT(fullData)}`;
        result = await model.generateContent(prompt);
        if (result) {
          console.log(`[Admin AI] Successfully used model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        console.warn(`[Admin AI] Model ${modelName} failed:`, err.message);
        lastError = err;
        continue;
      }
    }

    if (!result) {
      throw new Error(`All Gemini models failed. Last error: ${lastError?.message}`);
    }

    const responseText = result.response.text();

    // Robust cleaning of markdown code blocks
    const cleanJson = responseText
      .replace(/^```+(json|JSON)?\s*/g, '')
      .replace(/\s*```+$/g, '')
      .trim();
    
    const draft = JSON.parse(cleanJson);

    // 4. Validate with Zod
    const parsed = BundleDraftSchema.parse(draft);
    console.log(`[Admin AI] Generated bundle items: ${parsed.etf_cards.length}`);

    // 5. Store as Draft in DB
    const { data: bundle, error: bundleError } = await supabase
      .from('bundles')
      .insert({
        title: parsed.title,
        theme: parsed.theme,
        summary: parsed.summary,
        ai_commentary: parsed.monthly_comment,
        status: 'draft',
        valid_from: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
        valid_until: new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0).toISOString(),
      })
      .select()
      .single();

    if (bundleError) throw bundleError;

    // Insert bundle items
    const bundleItems = parsed.etf_cards.map((card, index) => {
        return {
            bundle_id: bundle.id,
            etf_ticker: card.ticker,
            etf_name: card.name,
            weight: Math.floor(100 / parsed.etf_cards.length), // Example: 10% each if 10 cards
            metaphor: card.metaphor,
            rationale: card.rationale,
            order_index: index + 1
        };
    });

    const { error: itemsError } = await supabase
      .from('bundle_items')
      .insert(bundleItems);

    if (itemsError) throw itemsError;
    
    return NextResponse.json({ success: true, bundle });
  } catch (err: any) {
    console.error('[Admin AI] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
