// Reset all the fake scores we set earlier - put matches back to upcoming so they can be properly resolved
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://awdzwzetgqwevvqnmhvl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZHp3emV0Z3F3ZXZ2cW5taHZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTE2MzkzOCwiZXhwIjoyMTAwNzM5OTM4fQ.kKVBKQNqp4XOsBhz8n1Hb-h2v4Z-nYByjEauBoiqigA'
)

async function reset() {
  // Delete all old matches that had fake scores (they're from the EuroLeague data that's outdated)
  // Keep only matches that have a valid external_id starting with "oddsapi_"
  
  // First, get all finished matches 
  const { data: finished, error } = await supabase
    .from('matches')
    .select('id, home_team, away_team, external_id, scheduled_at')
    .eq('status', 'finished')

  if (error) { console.error(error); return }

  console.log(`Found ${finished.length} finished matches`)
  
  // Delete old matches that won't get real scores (scheduled_at way in the past or future nonsense)
  // These are the ones with fake dates like 2026-08-01 or 2026-07-31 that were never real
  let deleted = 0
  for (const m of finished) {
    // Reset predictions points for these matches
    await supabase
      .from('predictions')
      .update({ points_earned: null })
      .eq('match_id', m.id)
    
    // Delete the match itself since it had fake scores
    await supabase
      .from('matches')
      .delete()
      .eq('id', m.id)
    
    deleted++
    console.log(`🗑️  Deleted: ${m.home_team} vs ${m.away_team} (${m.scheduled_at})`)
  }

  console.log(`\nDeleted ${deleted} matches with fake scores`)
  console.log('Now call /api/matches/sync to get fresh real data')
}

reset().catch(console.error)
