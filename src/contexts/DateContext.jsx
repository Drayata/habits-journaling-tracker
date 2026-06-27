import { createContext, useContext, useState } from 'react'

const DateContext = createContext({})

export function DateProvider({ children }) {
  const [activeDate, setActiveDate] = useState(new Date())

  return (
    <DateContext.Provider value={{ activeDate, setActiveDate }}>
      {children}
    </DateContext.Provider>
  )
}

export function useDate() {
  const context = useContext(DateContext)
  if (!context) {
    throw new Error('useDate must be used within a DateProvider')
  }
  return context
}
