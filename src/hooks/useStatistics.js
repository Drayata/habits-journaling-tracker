import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useDate } from '../contexts/DateContext'
import { format, eachDayOfInterval } from 'date-fns'

export function useStatistics() {
  const { user } = useAuth()
  const { monthStart, monthEnd, monthStartStr, monthEndStr, daysInMonth } =
    useDate()
  const [completionTrend, setCompletionTrend] = useState([])
  const [moodCorrelation, setMoodCorrelation] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    if (!user) return
    setLoading(true)

    // Fetch all data in parallel, scoped to the selected month
    const [habitsRes, completionsRes, journalsRes] = await Promise.all([
      supabase
        .from('habits')
        .select('id')
        .eq('user_id', user.id),
      supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_date', monthStartStr)
        .lte('completed_date', monthEndStr),
      supabase
        .from('journals')
        .select('entry_date, mood')
        .eq('user_id', user.id)
        .gte('entry_date', monthStartStr)
        .lte('entry_date', monthEndStr),
    ])

    const habits = habitsRes.data || []
    const completions = completionsRes.data || []
    const journals = journalsRes.data || []
    const habitCount = habits.length

    // ===== 1. Daily Completion Rate Trend (entire month) =====
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const trend = days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const dayCompletions = completions.filter(
        (c) => c.completed_date === dateStr
      ).length
      const rate = habitCount > 0 ? Math.round((dayCompletions / habitCount) * 100) : 0
      return {
        date: format(day, 'MMM d'),
        dateRaw: dateStr,
        rate,
        completed: dayCompletions,
        total: habitCount,
      }
    })
    setCompletionTrend(trend)

    // ===== 2. Mood vs Completion Correlation =====
    // Group journal days by mood, then calculate average completion rate for each mood
    const moodMap = {}
    journals.forEach((j) => {
      if (j.mood == null) return
      if (!moodMap[j.mood]) {
        moodMap[j.mood] = { totalRate: 0, count: 0 }
      }
      const dayCompletions = completions.filter(
        (c) => c.completed_date === j.entry_date
      ).length
      const rate = habitCount > 0 ? (dayCompletions / habitCount) * 100 : 0
      moodMap[j.mood].totalRate += rate
      moodMap[j.mood].count += 1
    })

    const moodLabels = ['😢 Awful', '😕 Bad', '😐 Okay', '🙂 Good', '😄 Great']
    const moodData = [1, 2, 3, 4, 5].map((m) => ({
      mood: moodLabels[m - 1],
      moodValue: m,
      avgCompletion: moodMap[m]
        ? Math.round(moodMap[m].totalRate / moodMap[m].count)
        : 0,
      entries: moodMap[m]?.count || 0,
    }))
    setMoodCorrelation(moodData)

    setLoading(false)
  }, [user, monthStartStr, monthEndStr, monthStart, monthEnd])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    completionTrend,
    moodCorrelation,
    loading,
    daysInMonth,
    refetch: fetchStats,
  }
}
