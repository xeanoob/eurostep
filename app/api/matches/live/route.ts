import { NextResponse } from 'next/server'

// Force Next.js to cache this route for 60 seconds.
// This prevents multiple users opening the app at the same time from burning the Odds API quota.
export const revalidate = 60

export async function GET() {
  const ODDS_API_KEY = process.env.ODDS_API_KEY
  
  if (!ODDS_API_KEY) {
    return NextResponse.json({ error: 'Missing Odds API Key' }, { status: 500 })
  }

  const leagues = [
    { key: 'basketball_wnba', name: 'WNBA' },
    { key: 'basketball_nba', name: 'NBA' },
    // EuroLeague is mostly paused/finished during summer so we skip it to save quota, 
    // but can add it back if needed.
    { key: 'basketball_euroleague', name: 'EuroLeague' }
  ]

  let liveMatches: any[] = []

  try {
    // Fetch scores for all leagues
    // daysFrom=1 is enough since we only care about currently live matches (started today)
    const responses = await Promise.all(
      leagues.map(l => fetch(`https://api.the-odds-api.com/v4/sports/${l.key}/scores/?apiKey=${ODDS_API_KEY}&daysFrom=1`))
    )

    for (let i = 0; i < responses.length; i++) {
      const res = responses[i]
      const leagueName = leagues[i].name
      
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          for (const game of data) {
            // A game is LIVE if it's NOT completed, but it HAS scores (meaning it started)
            // Sometimes APIs also return last_update to help us know it's active.
            if (!game.completed && game.scores && game.scores.length > 0) {
              const homeScoreObj = game.scores.find((s: any) => s.name === game.home_team)
              const awayScoreObj = game.scores.find((s: any) => s.name === game.away_team)
              
              liveMatches.push({
                external_id: `oddsapi_${game.id}`,
                home_team: game.home_team,
                away_team: game.away_team,
                league_name: leagueName,
                scheduled_at: game.commence_time,
                home_score: homeScoreObj ? parseInt(homeScoreObj.score) : 0,
                away_score: awayScoreObj ? parseInt(awayScoreObj.score) : 0,
                status: 'live',
                last_update: game.last_update
              })
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, count: liveMatches.length, matches: liveMatches })

  } catch (error: any) {
    console.error('Error fetching live scores:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
