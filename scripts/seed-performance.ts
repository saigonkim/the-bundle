import { createAdminClient } from '@/lib/supabase/admin';

async function seedPerformanceData() {
  const supabase = createAdminClient();
  
  // Get all users
  const { data: users } = await supabase.from('user_subscriptions').select('user_id');
  
  if (!users) return;

  const today = new Date();
  const logs = [];

  for (const user of users) {
    for (let i = 20; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const score = Math.min(100, 10 + (20 - i) * 1.5); // Growing score
      const mockRoi = -2 + (20 - i) * 0.4 + (Math.random() * 0.5); // Growing ROI

      logs.push({
        user_id: user.user_id,
        patience_score: score,
        roi: mockRoi,
        recorded_date: date.toISOString().split('T')[0]
      });
    }
  }

  const { error } = await supabase.from('patience_logs').upsert(logs, { onConflict: 'user_id,recorded_date' });
  if (error) console.error(error);
  else console.log('Successfully seeded performance logs');
}

seedPerformanceData();
