import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateMatchPoints } from '@/lib/predictions'

export async function GET() {
  return POST()
}

export async function POST() {
  try {
    const supabase = await createClient()

    const ODDS_API_KEY = process.env.ODDS_API_KEY
    let selectedMatches: any[] = []

    // 1. Fetch from The-Odds-API (EuroLeague + WNBA)
    if (ODDS_API_KEY) {
      try {
        const [euroResponse, wnbaResponse] = await Promise.all([
          fetch(`https://api.the-odds-api.com/v4/sports/basketball_euroleague/odds/?apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h`),
          fetch(`https://api.the-odds-api.com/v4/sports/basketball_wnba/odds/?apiKey=${ODDS_API_KEY}&regions=us,eu&markets=h2h`)
        ])

        const parseOdds = async (response: Response, leagueName: string) => {
          if (!response.ok) return []
          const data = await response.json()
          if (Array.isArray(data) && data.length > 0) {
            return data.filter((m: any) => new Date(m.commence_time) > new Date()).map((m: any) => {
              const bookmaker = m.bookmakers?.[0]
              const market = bookmaker?.markets?.find((mk: any) => mk.key === 'h2h')
              const homeOutcome = market?.outcomes?.find((o: any) => o.name === m.home_team)
              const awayOutcome = market?.outcomes?.find((o: any) => o.name === m.away_team)

              return {
                external_id: `oddsapi_${m.id}`,
                home_team: m.home_team,
                away_team: m.away_team,
                league_name: leagueName,
                scheduled_at: m.commence_time,
                status: 'upcoming',
                home_odds: homeOutcome?.price || 1.85,
                away_odds: awayOutcome?.price || 1.85
              }
            })
          }
          return []
        }

        const euroMatches = await parseOdds(euroResponse, 'EuroLeague')
        const wnbaMatches = await parseOdds(wnbaResponse, 'WNBA')

        // Take up to 10 matches total (prioritize Euroleague if both active, but mix them)
        selectedMatches = [...euroMatches, ...wnbaMatches]
          .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
          .slice(0, 10)

        console.log('Successfully fetched from The-Odds-API:', selectedMatches.length, 'matches')
      } catch (e) {
        console.error('The-Odds-API fetch failed', e)
      }
    } else {
       console.error('ODDS_API_KEY is not defined in environment variables')
    }

    // 2. Resolve finished matches (mocking scores since odds api doesn't have them)
    const { data: matchesToFinish } = await supabase
      .from('matches')
      .select('id')
      .eq('status', 'upcoming')
      .lt('scheduled_at', new Date().toISOString())

    if (matchesToFinish && matchesToFinish.length > 0) {
      for (const m of matchesToFinish) {
        const homeScore = Math.floor(Math.random() * (120 - 70 + 1)) + 70
        const awayScore = Math.floor(Math.random() * (120 - 70 + 1)) + 70
        
        await supabase
          .from('matches')
          .update({ 
            status: 'finished',
            home_score: homeScore,
            away_score: awayScore
          })
          .eq('id', m.id)

        // Calculate points for all users who predicted this match
        await calculateMatchPoints(m.id, homeScore, awayScore, supabase)
      }
    }

    // 3. Upsert into database
    let insertedCount = 0
    if (selectedMatches.length > 0) {
      const { data, error } = await supabase
        .from('matches')
        .upsert(selectedMatches, { onConflict: 'external_id' })
        .select()

      if (error) {
        console.error('Supabase error:', error)
        return NextResponse.json({ error: 'Failed to save matches', supabase_error: error.message, code: error.code, details: error.details, hint: error.hint }, { status: 500 })
      }
      insertedCount = data.length
    }

    return NextResponse.json({ success: true, count: insertedCount, matches: selectedMatches })
  } catch (error: any) {
    console.error('Error syncing matches:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
