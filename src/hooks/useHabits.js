import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { format, subDays, isAfter, isBefore, startOfDay } from 'date-fns'

export function useHabits() {
  const { user } = useAuth()
  const [habits, setHabits] = useState([])
  const [completions, setCompletions] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch all habits for the user
  const fetchHabits = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    if (!error && data) setHabits(data)
  }, [user])

  // Fetch completions for the last 35 days (covers 4-week heatmap + streak calc)
  const fetchCompletions = useCallback(async () => {
    if (!user) return
    const since = format(subDays(new Date(), 35), 'yyyy-MM-dd')
    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', user.id)
      .gte('completed_date', since)
    if (!error && data) setCompletions(data)
  }, [user])

  useEffect(() => {
    if (user) {
      setLoading(true)
      Promise.all([fetchHabits(), fetchCompletions()]).finally(() =>
        setLoading(false)
      )
    }
  }, [user, fetchHabits, fetchCompletions])

  // Check if a habit is completed for a specific date
  function isCompleted(habitId, date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    return completions.some(
      (c) => c.habit_id === habitId && c.completed_date === dateStr
    )
  }

  // Toggle habit completion with optimistic UI
  async function toggleCompletion(habitId, date) {
    if (!user) return
    const dateStr = format(date, 'yyyy-MM-dd')
    const existing = completions.find(
      (c) => c.habit_id === habitId && c.completed_date === dateStr
    )

    if (existing) {
      // Optimistic delete
      setCompletions((prev) => prev.filter((c) => c.id !== existing.id))
      const { error } = await supabase
        .from('habit_completions')
        .delete()
        .eq('id', existing.id)
      if (error) {
        // Rollback on error
        setCompletions((prev) => [...prev, existing])
      }
    } else {
      // Optimistic insert
      const tempId = crypto.randomUUID()
      const optimistic = {
        id: tempId,
        habit_id: habitId,
        user_id: user.id,
        completed_date: dateStr,
      }
      setCompletions((prev) => [...prev, optimistic])

      const { data, error } = await supabase
        .from('habit_completions')
        .insert({
          habit_id: habitId,
          user_id: user.id,
          completed_date: dateStr,
        })
        .select()
        .single()

      if (error) {
        // Rollback
        setCompletions((prev) => prev.filter((c) => c.id !== tempId))
      } else if (data) {
        // Replace temp with real
        setCompletions((prev) =>
          prev.map((c) => (c.id === tempId ? data : c))
        )
      }
    }
  }

  // Calculate streak for a habit (consecutive days ending today)
  function getStreak(habitId) {
    const habitCompletions = completions
      .filter((c) => c.habit_id === habitId)
      .map((c) => c.completed_date)
      .sort()
      .reverse()

    if (habitCompletions.length === 0) return 0

    let streak = 0
    let checkDate = startOfDay(new Date())

    // Check if today is completed; if not, start from yesterday
    const todayStr = format(checkDate, 'yyyy-MM-dd')
    if (!habitCompletions.includes(todayStr)) {
      checkDate = subDays(checkDate, 1)
    }

    for (let i = 0; i < 365; i++) {
      const dateStr = format(checkDate, 'yyyy-MM-dd')
      if (habitCompletions.includes(dateStr)) {
        streak++
        checkDate = subDays(checkDate, 1)
      } else {
        break
      }
    }

    return streak
  }

  // Get the best (longest) current streak across all habits
  function getBestStreak() {
    if (habits.length === 0) return 0
    return Math.max(...habits.map((h) => getStreak(h.id)), 0)
  }

  // Get completions count for a specific date
  function getCompletedCount(date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    return completions.filter((c) => c.completed_date === dateStr).length
  }

  // Get completion rate for a date (0-1)
  function getCompletionRate(date) {
    if (habits.length === 0) return 0
    return getCompletedCount(date) / habits.length
  }

  // CRUD: Add habit
  async function addHabit({ title, frequency = 'daily', color_hint = '#10b981' }) {
    if (!user) return
    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: user.id,
        title,
        frequency,
        color_hint,
      })
      .select()
      .single()
    if (!error && data) {
      setHabits((prev) => [...prev, data])
    }
    return { data, error }
  }

  // CRUD: Update habit
  async function updateHabit(habitId, updates) {
    const { data, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', habitId)
      .select()
      .single()
    if (!error && data) {
      setHabits((prev) => prev.map((h) => (h.id === habitId ? data : h)))
    }
    return { data, error }
  }

  // CRUD: Delete habit
  async function deleteHabit(habitId) {
    // Optimistic delete
    const removed = habits.find((h) => h.id === habitId)
    setHabits((prev) => prev.filter((h) => h.id !== habitId))
    setCompletions((prev) => prev.filter((c) => c.habit_id !== habitId))

    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)

    if (error && removed) {
      // Rollback
      setHabits((prev) => [...prev, removed])
      await fetchCompletions()
    }
  }

  return {
    habits,
    completions,
    loading,
    isCompleted,
    toggleCompletion,
    getStreak,
    getBestStreak,
    getCompletedCount,
    getCompletionRate,
    addHabit,
    updateHabit,
    deleteHabit,
    refetch: () => Promise.all([fetchHabits(), fetchCompletions()]),
  }
}
