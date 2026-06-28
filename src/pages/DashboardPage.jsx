import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  Flame,
  TrendingUp,
  Calendar,
  BookOpen,
  ChevronRight,
  Sparkles,
  BarChart3,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDate } from '../contexts/DateContext'
import { useHabits } from '../hooks/useHabits'
import { useJournal } from '../hooks/useJournal'
import ProgressRing from '../components/dashboard/ProgressRing'
import HeatmapGrid from '../components/dashboard/HeatmapGrid'
import JournalWidget from '../components/dashboard/JournalWidget'

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const { activeDate } = useDate()
  const {
    habits,
    completions,
    loading,
    isCompleted,
    toggleCompletion,
    getCompletionRate,
    getBestStreak,
  } = useHabits()
  const { journal } = useJournal(activeDate)

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const todayRate = getCompletionRate(activeDate)
  const bestStreak = getBestStreak()
  const completedToday = habits.filter((h) =>
    isCompleted(h.id, activeDate)
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">
            {greeting}, {firstName} ✨
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Link
          to="/stats"
          className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
        >
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">Statistics</span>
        </Link>
      </motion.div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* ===== Daily Progress Ring ===== */}
        <motion.div
          custom={0}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bento-card flex flex-col items-center justify-center py-6 md:row-span-2"
        >
          <ProgressRing progress={todayRate} size={140} strokeWidth={10} />
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 mt-4">
            {completedToday} of {habits.length} habits
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            completed today
          </p>
        </motion.div>

        {/* ===== Streak Card ===== */}
        <motion.div
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bento-card"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/30 rounded-xl flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Best Streak
            </span>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {bestStreak}
            <span className="text-lg text-zinc-500 dark:text-zinc-400 font-normal ml-1">days</span>
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {bestStreak > 0 ? 'Keep the momentum going! 🔥' : 'Start your first streak today!'}
          </p>
        </motion.div>

        {/* ===== Quick Stats ===== */}
        <motion.div
          custom={2}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bento-card"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
            </div>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Overview
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {habits.length}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Active Habits</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {completions.length}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Completions</p>
            </div>
          </div>
        </motion.div>

        {/* ===== Heatmap ===== */}
        <motion.div
          custom={3}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bento-card md:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-300">
                Activity (4 weeks)
              </h3>
            </div>
            <Link
              to="/habits"
              className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-400 font-medium transition-colors"
            >
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="h-[150px] flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <HeatmapGrid completions={completions} habitCount={habits.length} />
          )}
        </motion.div>

        {/* ===== Today's Habits Quick List ===== */}
        <motion.div
          custom={4}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bento-card lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-300">
                Today&apos;s Habits
              </h3>
            </div>
            <Link
              to="/habits"
              className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-400 font-medium transition-colors"
            >
              Manage <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {habits.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4 text-center">
              No habits yet. <Link to="/habits" className="text-indigo-500 hover:underline">Create one!</Link>
            </p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto hide-scrollbar">
              {habits.map((habit) => {
                const done = isCompleted(habit.id, activeDate)
                return (
                  <motion.button
                    key={habit.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleCompletion(habit.id, activeDate)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      done
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50'
                        : 'bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        done
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-zinc-300 dark:border-zinc-600'
                      }`}
                    >
                      {done && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        done
                          ? 'text-emerald-900 dark:text-emerald-400'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {habit.title}
                    </span>
                    <div
                      className="w-2 h-2 rounded-full ml-auto"
                      style={{ backgroundColor: habit.color_hint }}
                    />
                  </motion.button>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* ===== Journal Widget ===== */}
        <motion.div
          custom={5}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bento-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-300">
                Journal
              </h3>
            </div>
            <Link
              to="/journal"
              className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-400 font-medium transition-colors"
            >
              Write <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <JournalWidget journal={journal} />
        </motion.div>
      </div>
    </div>
  )
}
