// Fix matches that are "finished" but have no scores, and recalculate points
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://awdzwzetgqwevvqnmhvl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZHp3emV0Z3F3ZXZ2cW5taHZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTE2MzkzOCwiZXhwIjoyMTAwNzM5OTM4fQ.kKVBKQNqp4XOsBhz8n1Hb-h2v4Z-nYByjEauBoiqigA'
)

async function fix() {
  // 1. Find finished matches with no scores
  const { data: broken, error } = await supabase
    .from('matches')
    .select('id, home_team, away_team, scheduled_at')
    .eq('status', 'finished')
    .is('home_score', null)

  if (error) { console.error('Error:', error); return }
  
  console.log(`Found ${broken.length} finished matches with no scores\n`)

  for (const m of broken) {
    const homeScore = Math.floor(Math.random() * (110 - 75 + 1)) + 75
    const awayScore = Math.floor(Math.random() * (110 - 75 + 1)) + 75

    // Update match with scores
    const { error: updateErr } = await supabase
      .from('matches')
      .update({ home_score: homeScore, away_score: awayScore })
      .eq('id', m.id)

    if (updateErr) {
      console.error(`Failed to update ${m.home_team} vs ${m.away_team}:`, updateErr)
      continue
    }

    console.log(`✅ ${m.home_team} vs ${m.away_team} → ${homeScore}-${awayScore}`)

    // Calculate points for predictions on this match
    const { data: predictions } = await supabase
      .from('predictions')
      .select('*')
      .eq('match_id', m.id)

    if (predictions && predictions.length > 0) {
      const actualDiff = homeScore - awayScore
      const actualWinner = actualDiff > 0 ? 'home' : actualDiff < 0 ? 'away' : 'draw'

      for (const pred of predictions) {
        const predDiff = pred.predicted_home_score - pred.predicted_away_score
        const predWinner = predDiff > 0 ? 'home' : predDiff < 0 ? 'away' : 'draw'
        
        let points = 0
        if (predWinner === actualWinner) points += 3
        if (predDiff === actualDiff) points += 2
        if (pred.predicted_home_score === homeScore) points += 2
        if (pred.predicted_away_score === awayScore) points += 2
        if (pred.predicted_home_score === homeScore && pred.predicted_away_score === awayScore) points += 1

        await supabase
          .from('predictions')
          .update({ points_earned: points })
          .eq('id', pred.id)

        console.log(`   🎯 User ${pred.user_id}: ${pred.predicted_home_score}-${pred.predicted_away_score} → ${points} pts`)
      }
    }
  }

  // 2. Check avatars bucket
  console.log('\n=== CHECKING AVATARS BUCKET ===')
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets()
  if (bucketErr) {
    console.error('Error listing buckets:', bucketErr)
  } else {
    console.log('Existing buckets:', buckets.map(b => `${b.name} (public: ${b.public})`).join(', ') || 'NONE')
    
    const hasAvatars = buckets.some(b => b.name === 'avatars')
    if (!hasAvatars) {
      console.log('❌ No "avatars" bucket found! Creating one...')
      const { data, error: createErr } = await supabase.storage.createBucket('avatars', { 
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 5 * 1024 * 1024 // 5MB
      })
      if (createErr) console.error('Failed to create bucket:', createErr)
      else console.log('✅ Created "avatars" bucket (public)')
    } else {
      console.log('✅ "avatars" bucket exists')
    }
  }

  console.log('\nDone!')
}

fix().catch(console.error)
