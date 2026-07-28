// Quick script to check matches and predictions state
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://awdzwzetgqwevvqnmhvl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZHp3emV0Z3F3ZXZ2cW5taHZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTE2MzkzOCwiZXhwIjoyMTAwNzM5OTM4fQ.kKVBKQNqp4XOsBhz8n1Hb-h2v4Z-nYByjEauBoiqigA'
)

async function check() {
  // 1. Check all matches
  const { data: matches, error: matchErr } = await supabase
    .from('matches')
    .select('id, home_team, away_team, status, scheduled_at, home_score, away_score')
    .order('scheduled_at', { ascending: false })
    .limit(20)

  console.log('=== MATCHES ===')
  if (matchErr) console.error('Error:', matchErr)
  else matches.forEach(m => {
    console.log(`[${m.status}] ${m.home_team} vs ${m.away_team} | ${m.scheduled_at} | Score: ${m.home_score ?? '?'}-${m.away_score ?? '?'} | ID: ${m.id}`)
  })

  // 2. Check predictions with no points
  const { data: preds, error: predErr } = await supabase
    .from('predictions')
    .select('*, matches(home_team, away_team, status, scheduled_at, home_score, away_score)')
    .order('created_at', { ascending: false })
    .limit(20)

  console.log('\n=== PREDICTIONS ===')
  if (predErr) console.error('Error:', predErr)
  else preds.forEach(p => {
    const m = p.matches
    console.log(`Prono: ${p.predicted_home_score}-${p.predicted_away_score} | Points: ${p.points_earned ?? 'N/A'} | Match: ${m?.home_team} vs ${m?.away_team} [${m?.status}] | Score réel: ${m?.home_score ?? '?'}-${m?.away_score ?? '?'}`)
  })
}

check().catch(console.error)
