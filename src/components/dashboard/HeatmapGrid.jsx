import { format, subDays, startOfWeek, addDays } from 'date-fns'
import { motion } from 'framer-motion'

export default function HeatmapGrid({ completions, habitCount }) {
  // Generate 4 weeks (28 days) of data
  const today = new Date()
  const weeks = []

  // Start from 4 weeks ago, aligned to Monday
  const startDate = startOfWeek(subDays(today, 27), { weekStartsOn: 1 })

  for (let w = 0; w < 4; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(startDate, w * 7 + d)
      const dateStr = format(date, 'yyyy-MM-dd')
      const count = completions.filter(
        (c) => c.completed_date === dateStr
      ).length
      week.push({
        date,
        dateStr,
        count,
        isFuture: date > today,
      })
    }
    weeks.push(week)
  }

  function getIntensity(count) {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800'
    if (habitCount === 0) return 'bg-emerald-200 dark:bg-emerald-900'
    const ratio = count / habitCount
    if (ratio <= 0.25) return 'bg-emerald-200 dark:bg-emerald-900/60'
    if (ratio <= 0.5) return 'bg-emerald-300 dark:bg-emerald-800'
    if (ratio <= 0.75) return 'bg-emerald-400 dark:bg-emerald-600'
    return 'bg-emerald-500 dark:bg-emerald-500'
  }

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <div className="space-y-2">
      {/* Day labels */}
      <div className="flex gap-1.5 ml-0">
        {dayLabels.map((label, i) => (
          <div
            key={i}
            className="w-7 h-4 flex items-center justify-center text-[10px] text-slate-400 dark:text-slate-500 font-medium"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Grid */}
      {weeks.map((week, wi) => (
        <div key={wi} className="flex gap-1.5">
          {week.map((day, di) => (
            <motion.div
              key={day.dateStr}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: (wi * 7 + di) * 0.02,
                type: 'spring',
                stiffness: 300,
                damping: 20,
              }}
              title={`${format(day.date, 'MMM d')}: ${day.count} habit${day.count !== 1 ? 's' : ''}`}
              className={`w-7 h-7 rounded-md transition-colors ${
                day.isFuture
                  ? 'bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800'
                  : getIntensity(day.count)
              }`}
            />
          ))}
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 pt-1">
        <span className="text-[10px] text-slate-400 mr-1">Less</span>
        <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800" />
        <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900/60" />
        <div className="w-3 h-3 rounded-sm bg-emerald-300 dark:bg-emerald-800" />
        <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-600" />
        <div className="w-3 h-3 rounded-sm bg-emerald-500" />
        <span className="text-[10px] text-slate-400 ml-1">More</span>
      </div>
    </div>
  )
}
