import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Target } from 'lucide-react'
import { useDate } from '../contexts/DateContext'
import { useHabits } from '../hooks/useHabits'
import DateBar from '../components/habits/DateBar'
import HabitCard from '../components/habits/HabitCard'
import HabitFormModal from '../components/habits/HabitFormModal'
import { format } from 'date-fns'

export default function HabitsPage() {
  const { activeDate } = useDate()
  const {
    habits,
    loading,
    isCompleted,
    toggleCompletion,
    getStreak,
    addHabit,
    updateHabit,
    deleteHabit,
  } = useHabits()

  const [showModal, setShowModal] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)

  const completedCount = habits.filter((h) =>
    isCompleted(h.id, activeDate)
  ).length

  async function handleSubmit(values) {
    if (editingHabit) {
      await updateHabit(editingHabit.id, values)
    } else {
      await addHabit(values)
    }
  }

  function handleEdit(habit) {
    setEditingHabit(habit)
    setShowModal(true)
  }

  function handleClose() {
    setShowModal(false)
    setEditingHabit(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Habits
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {format(activeDate, 'EEEE, MMMM d')} · {completedCount}/{habits.length} done
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingHabit(null)
            setShowModal(true)
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Habit</span>
        </motion.button>
      </div>

      {/* Date Bar */}
      <DateBar />

      {/* Habits List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bento-card h-[72px] animate-pulse-soft"
            />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bento-card flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">
            No habits yet
          </h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs">
            Start building better routines by adding your first habit.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                completed={isCompleted(habit.id, activeDate)}
                streak={getStreak(habit.id)}
                onToggle={() => toggleCompletion(habit.id, activeDate)}
                onEdit={() => handleEdit(habit)}
                onDelete={() => deleteHabit(habit.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Progress summary */}
      {habits.length > 0 && (
        <div className="bento-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Today&apos;s Progress
            </span>
            <span className="text-sm font-semibold text-emerald-500">
              {habits.length > 0
                ? Math.round((completedCount / habits.length) * 100)
                : 0}
              %
            </span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${habits.length > 0 ? (completedCount / habits.length) * 100 : 0}%`,
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
            />
          </div>
        </div>
      )}

      {/* Modal */}
      <HabitFormModal
        isOpen={showModal}
        onClose={handleClose}
        onSubmit={handleSubmit}
        editHabit={editingHabit}
      />
    </div>
  )
}
