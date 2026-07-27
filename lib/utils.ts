import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple hash function for deterministic odds
function stringHash(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}

// Generate realistic looking odds based on team names
export function generateOdds(homeTeam: string, awayTeam: string) {
  // Use hash of both names to ensure it's always deterministic
  const combined = homeTeam + awayTeam
  const hash = Math.abs(stringHash(combined))
  
  // Base probability for home team (between 25% and 75%)
  const homeProb = 0.25 + ((hash % 50) / 100)
  const awayProb = 1 - homeProb
  
  // Convert probability to odds (with a 5% bookmaker margin)
  const margin = 1.05
  
  let homeOdds = (1 / (homeProb * margin))
  let awayOdds = (1 / (awayProb * margin))
  
  // Format to 2 decimal places
  return {
    home: Number(Math.max(1.01, homeOdds).toFixed(2)),
    away: Number(Math.max(1.01, awayOdds).toFixed(2))
  }
}
