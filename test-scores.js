const ODDS_API_KEY = 'f52b63e52b308e8ba5933d2642d4eb7e'

async function testScores() {
  const sports = ['basketball_euroleague', 'basketball_wnba']

  for (const sport of sports) {
    console.log(`\n=== ${sport.toUpperCase()} ===`)
    try {
      const url = `https://api.the-odds-api.com/v4/sports/${sport}/scores/?apiKey=${ODDS_API_KEY}&daysFrom=3`
      const res = await fetch(url)
      const data = await res.json()
      
      if (Array.isArray(data)) {
        const completed = data.filter(m => m.completed)
        const pending = data.filter(m => !m.completed)
        console.log(`${completed.length} completed, ${pending.length} pending/live`)
        completed.forEach(m => {
          const homeScore = m.scores?.find(s => s.name === m.home_team)
          const awayScore = m.scores?.find(s => s.name === m.away_team)
          console.log(`  ✅ ${m.home_team} ${homeScore?.score ?? '?'} - ${awayScore?.score ?? '?'} ${m.away_team} (${m.commence_time}) [id: ${m.id}]`)
        })
        pending.forEach(m => {
          console.log(`  ⏳ ${m.home_team} vs ${m.away_team} (${m.commence_time}) [id: ${m.id}]`)
        })
      } else {
        console.log('Response:', JSON.stringify(data))
      }
    } catch (e) {
      console.error('Error:', e.message)
    }
  }
}

testScores()
