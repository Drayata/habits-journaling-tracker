import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useDate } from '../contexts/DateContext'
import {
  format,
  subDays,
  startOfDay,
  eachDayOfInterval,
} from 'date-fns'
import { isHabitActiveOnDate } from '../utils/habitUtils'

export function useHabits() {
  const { user } = useAuth()
  const { monthStartStr, monthEndStr, monthStart, monthEnd } = useDate()
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

  // Fetch completions scoped to the selected month
  const fetchCompletions = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', user.id)
      .gte('completed_date', monthStartStr)
      .lte('completed_date', monthEndStr)
    if (!error && data) setCompletions(data)
  }, [user, monthStartStr, monthEndStr])

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
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return 0

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
      if (!isHabitActiveOnDate(habit, checkDate)) break
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

  // Get the best streak within the selected month
  function getBestStreak() {
    if (habits.length === 0) return 0

    // Get all days in the month
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

    let bestStreak = 0

    for (const habit of habits) {
      const habitDates = new Set(
        completions
          .filter((c) => c.habit_id === habit.id)
          .map((c) => c.completed_date)
      )

      let currentStreak = 0
      for (const day of monthDays) {
        if (!isHabitActiveOnDate(habit, day)) {
          currentStreak = 0
          continue
        }

        const dateStr = format(day, 'yyyy-MM-dd')
        if (habitDates.has(dateStr)) {
          currentStreak++
          bestStreak = Math.max(bestStreak, currentStreak)
        } else {
          currentStreak = 0
        }
      }
    }

    return bestStreak
  }

  // Get active habits for a specific date
  function getActiveHabits(date) {
    return habits.filter(habit => isHabitActiveOnDate(habit, date))
  }

  // Get completions count for a specific date
  function getCompletedCount(date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    return completions.filter((c) => c.completed_date === dateStr).length
  }

  // Get completion rate for a date (0-1)
  function getCompletionRate(date) {
    const activeHabits = getActiveHabits(date)
    if (activeHabits.length === 0) return 0
    return getCompletedCount(date) / activeHabits.length
  }

  // Get total completions count for the active month
  function getMonthlyCompletionCount() {
    return completions.length
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
    // Optimistic soft delete
    const habitIndex = habits.findIndex((h) => h.id === habitId)
    if (habitIndex === -1) return
    const removed = habits[habitIndex]
    const archivedDate = new Date().toISOString()
    
    setHabits((prev) => 
      prev.map(h => h.id === habitId ? { ...h, is_archived: true, archived_at: archivedDate } : h)
    )

    const { error } = await supabase
      .from('habits')
      .update({ is_archived: true, archived_at: archivedDate })
      .eq('id', habitId)

    if (error) {
      // Rollback
      setHabits((prev) => prev.map(h => h.id === habitId ? removed : h))
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
    getActiveHabits,
    getCompletedCount,
    getCompletionRate,
    getMonthlyCompletionCount,
    addHabit,
    updateHabit,
    deleteHabit,
    refetch: () => Promise.all([fetchHabits(), fetchCompletions()]),
  }
}
