import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Heart, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { useStatistics } from '../hooks/useStatistics'
import { useHabits } from '../hooks/useHabits'
import HeatmapGrid from '../components/dashboard/HeatmapGrid'

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="font-medium text-slate-900 dark:text-zinc-100 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {entry.value}%
        </p>
      ))}
    </div>
  )
}

function MoodTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="font-medium text-slate-900 dark:text-zinc-100 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-medium">
          Avg completion: {entry.value}%
        </p>
      ))}
      {payload[0]?.payload?.entries > 0 && (
        <p className="text-zinc-400 mt-0.5">{payload[0].payload.entries} entries</p>
      )}
    </div>
  )
}

export default function StatsPage() {
  const { completionTrend, moodCorrelation, loading } = useStatistics()
  const { habits, completions } = useHabits()

  // Calculate summary stats
  const avgCompletion =
    completionTrend.length > 0
      ? Math.round(
          completionTrend.reduce((sum, d) => sum + d.rate, 0) /
            completionTrend.length
        )
      : 0

  const bestDay = completionTrend.reduce(
    (best, d) => (d.rate > best.rate ? d : best),
    { rate: 0, date: '-' }
  )

  const activeDays = completionTrend.filter((d) => d.completed > 0).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">
            Statistics
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Your habit insights from the last 30 days
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div
              custom={0}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bento-card text-center py-5"
            >
              <p className="text-3xl font-bold text-indigo-500">{avgCompletion}%</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 font-medium uppercase tracking-wider">
                Avg Completion
              </p>
            </motion.div>
            <motion.div
              custom={1}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bento-card text-center py-5"
            >
              <p className="text-3xl font-bold text-emerald-500">{bestDay.date}</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 font-medium uppercase tracking-wider">
                Best Day ({bestDay.rate}%)
              </p>
            </motion.div>
            <motion.div
              custom={2}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bento-card text-center py-5"
            >
              <p className="text-3xl font-bold text-amber-500">{activeDays}/30</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 font-medium uppercase tracking-wider">
                Active Days
              </p>
            </motion.div>
          </div>

          {/* Completion Rate Line Chart */}
          <motion.div
            custom={3}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="bento-card"
          >
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                Daily Completion Rate
              </h3>
            </div>
            <div className="h-[280px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={completionTrend}>
                  <defs>
                    <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="text-slate-100 dark:text-zinc-800"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#a1a1aa' }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#a1a1aa' }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    name="Completion"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#completionGradient)"
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: '#6366f1',
                      stroke: '#fff',
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Mood Correlation Bar Chart */}
          <motion.div
            custom={4}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="bento-card"
          >
            <div className="flex items-center gap-2 mb-5">
              <Heart className="w-4 h-4 text-pink-500" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                Mood vs. Habit Completion
              </h3>
            </div>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mb-4 -mt-2">
              Average completion rate grouped by your daily mood
            </p>
            <div className="h-[250px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moodCorrelation} barSize={36}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="text-slate-100 dark:text-zinc-800"
                  />
                  <XAxis
                    dataKey="mood"
                    tick={{ fontSize: 11, fill: '#a1a1aa' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#a1a1aa' }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<MoodTooltip />} />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <Bar
                    dataKey="avgCompletion"
                    name="Avg Completion"
                    fill="url(#barGradient)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Enhanced Heatmap */}
          <motion.div
            custom={5}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="bento-card"
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                Activity Heatmap (4 Weeks)
              </h3>
            </div>
            <HeatmapGrid completions={completions} habitCount={habits.length} />
          </motion.div>
        </>
      )}
    </div>
  )
}
