import Image from 'next/image'

const players = [
  {
    rank: 2,
    name: 'Sarah',
    points: 118,
    avatar: '/avatars/sarah.png',
    size: 'size-14',
  },
  {
    rank: 1,
    name: 'Léo',
    points: 125,
    avatar: '/avatars/leo.png',
    size: 'size-20',
  },
  {
    rank: 3,
    name: 'Max',
    points: 112,
    avatar: '/avatars/max.png',
    size: 'size-14',
  },
]

export function LeaguePodium() {
  return (
    <section aria-label="Classement de la Ligue des Potes" className="px-5">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="font-display text-lg uppercase tracking-wide">
          La Ligue des Potes
        </h2>
        <a
          href="#"
          className="text-xs font-semibold uppercase tracking-widest text-primary"
        >
          Voir tout
        </a>
      </div>

      <ol className="flex items-end justify-center gap-10">
        {players.map((player) => (
          <li
            key={player.rank}
            className="flex flex-col items-center gap-2"
            style={{ order: player.rank === 1 ? 1 : player.rank === 2 ? 0 : 2 }}
          >
            <div className="relative">
              <div
                className={`${player.size} relative overflow-hidden rounded-full ${
                  player.rank === 1
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                    : 'ring-1 ring-border'
                }`}
              >
                <Image
                  src={player.avatar || '/placeholder.svg'}
                  alt={`Avatar de ${player.name}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <span
                className={`absolute -bottom-1.5 left-1/2 flex size-6 -translate-x-1/2 items-center justify-center rounded-full font-display text-xs ${
                  player.rank === 1
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground ring-1 ring-border'
                }`}
              >
                {player.rank}
              </span>
            </div>
            <div className="flex flex-col items-center pt-2">
              <span className="text-sm font-semibold">{player.name}</span>
              <span
                className={`font-display text-base tabular-nums ${
                  player.rank === 1 ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {player.points}
                <span className="ml-1 text-[10px] uppercase tracking-widest">pts</span>
              </span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
