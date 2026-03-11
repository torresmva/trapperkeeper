import { ActivityDay } from '../../types';

interface Props {
  activity: ActivityDay[];
}

function getColor(count: number): string {
  if (count === 0) return 'var(--activity-0)';
  if (count === 1) return 'var(--activity-1)';
  if (count === 2) return 'var(--activity-2)';
  if (count <= 4) return 'var(--activity-3)';
  return 'var(--activity-4)';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function ActivityBoard({ activity }: Props) {
  const cellSize = 10;
  const gap = 2;
  const cellTotal = cellSize + gap;

  // Build 53 weeks x 7 days grid
  const weeks: (ActivityDay | null)[][] = [];
  let weekIndex = 0;

  // Pad the start to align with day of week
  const firstDate = activity.length > 0 ? new Date(activity[0].date) : new Date();
  const startDay = firstDate.getDay(); // 0=Sun

  let currentWeek: (ActivityDay | null)[] = [];
  for (let i = 0; i < startDay; i++) {
    currentWeek.push(null);
  }

  for (const day of activity) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const width = weeks.length * cellTotal + 32;
  const height = 7 * cellTotal + 20;

  // Month labels
  const monthLabels: { label: string; x: number }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks.length; w++) {
    for (const day of weeks[w]) {
      if (day) {
        const month = new Date(day.date).getMonth();
        if (month !== lastMonth) {
          monthLabels.push({ label: MONTHS[month], x: w * cellTotal + 32 });
          lastMonth = month;
        }
        break;
      }
    }
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={width} height={height} style={{ display: 'block' }}>
        {/* Day labels */}
        <text x={0} y={24} fontSize={9} fill="var(--text-muted)" fontFamily="JetBrains Mono">M</text>
        <text x={0} y={48} fontSize={9} fill="var(--text-muted)" fontFamily="JetBrains Mono">W</text>
        <text x={0} y={72} fontSize={9} fill="var(--text-muted)" fontFamily="JetBrains Mono">F</text>

        {/* Month labels */}
        {monthLabels.map((m, i) => (
          <text key={i} x={m.x} y={10} fontSize={9} fill="var(--text-muted)" fontFamily="JetBrains Mono">
            {m.label}
          </text>
        ))}

        {/* Cells */}
        {weeks.map((week, w) =>
          week.map((day, d) => {
            if (!day) return null;
            return (
              <rect
                key={`${w}-${d}`}
                x={w * cellTotal + 32}
                y={d * cellTotal + 14}
                width={cellSize}
                height={cellSize}
                fill={getColor(day.count)}
                rx={1}
                style={{ imageRendering: 'pixelated' }}
              >
                <title>{`${day.date}: ${day.count} entries`}</title>
              </rect>
            );
          })
        )}
      </svg>
    </div>
  );
}
