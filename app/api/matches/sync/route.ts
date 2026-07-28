import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateMatchPoints } from '@/lib/predictions'

export async function GET(request: NextRequest) {
  // Verify request is from Vercel Cron or has the secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret) {
    const { searchParams } = new URL(request.url)
    const querySecret = searchParams.get('secret')
    if (authHeader !== `Bearer ${cronSecret}` && querySecret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return syncMatches()
}

export async function POST() {
  return syncMatches()
}

async function syncMatches() {
  try {
    const supabase = createAdminClient()

    const ODDS_API_KEY = process.env.ODDS_API_KEY
    let selectedMatches: any[] = []

    // 1. Fetch from The-Odds-API (EuroLeague + WNBA + NBA)
    if (ODDS_API_KEY) {
      try {
        const leagues = [
          { key: 'basketball_euroleague', name: 'EuroLeague', regions: 'eu' },
          { key: 'basketball_wnba', name: 'WNBA', regions: 'us,eu' },
          { key: 'basketball_nba', name: 'NBA', regions: 'us,eu' },
        ]

        const responses = await Promise.all(
          leagues.map(l => fetch(`https://api.the-odds-api.com/v4/sports/${l.key}/odds/?apiKey=${ODDS_API_KEY}&regions=${l.regions}&markets=h2h`))
        )

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

        const allMatches = await Promise.all(
          responses.map((res, i) => parseOdds(res, leagues[i].name))
        )

        // Merge all leagues, sort by date, keep up to 20
        selectedMatches = allMatches.flat()
          .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
          .slice(0, 20)

        console.log('Successfully fetched from The-Odds-API:', selectedMatches.length, 'matches')
      } catch (e) {
        console.error('The-Odds-API fetch failed', e)
      }
    } else {
       console.error('ODDS_API_KEY is not defined in environment variables')
    }

    // 2. Resolve finished matches using real scores from The-Odds-API
    const { data: matchesToFinish } = await supabase
      .from('matches')
      .select('id, external_id, home_team, away_team, league_name')
      .eq('status', 'upcoming')
      .lt('scheduled_at', new Date().toISOString())

    if (matchesToFinish && matchesToFinish.length > 0 && ODDS_API_KEY) {
      // Fetch real scores from the API (daysFrom=3 covers recent matches)
      const scoresMap = new Map<string, { homeScore: number; awayScore: number }>()
      
      try {
        const leagueToSport: Record<string, string> = {
          'WNBA': 'basketball_wnba',
          'NBA': 'basketball_nba',
          'EuroLeague': 'basketball_euroleague',
        }
        const sportKeys = [...new Set(matchesToFinish.map(m => 
          leagueToSport[m.league_name] || 'basketball_euroleague'
        ))]
        
        await Promise.all(sportKeys.map(async (sportKey) => {
          const scoresRes = await fetch(
            `https://api.the-odds-api.com/v4/sports/${sportKey}/scores/?apiKey=${ODDS_API_KEY}&daysFrom=3`
          )
          if (scoresRes.ok) {
            const scoresData = await scoresRes.json()
            if (Array.isArray(scoresData)) {
              for (const game of scoresData) {
                if (game.completed && game.scores) {
                  const homeScore = game.scores.find((s: any) => s.name === game.home_team)
                  const awayScore = game.scores.find((s: any) => s.name === game.away_team)
                  if (homeScore && awayScore) {
                    scoresMap.set(`oddsapi_${game.id}`, {
                      homeScore: parseInt(homeScore.score),
                      awayScore: parseInt(awayScore.score)
                    })
                  }
                }
              }
            }
          }
        }))
        console.log(`Fetched real scores for ${scoresMap.size} completed matches`)
      } catch (e) {
        console.error('Failed to fetch scores:', e)
      }

      // Only resolve matches that have real scores
      await Promise.all(matchesToFinish.map(async (m) => {
        const realScore = scoresMap.get(m.external_id)
        if (!realScore) return // Skip — no real score yet

        await supabase
          .from('matches')
          .update({ 
            status: 'finished',
            home_score: realScore.homeScore,
            away_score: realScore.awayScore
          })
          .eq('id', m.id)

        // Calculate points for all users who predicted this match
        await calculateMatchPoints(m.id, realScore.homeScore, realScore.awayScore, supabase)
      }))
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
        return NextResponse.json({ error: 'Failed to save matches', details: error.message }, { status: 500 })
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
