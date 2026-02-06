import { useState, useEffect, useCallback } from 'react'
import { ProductCategory, CategoryData } from '../../types'
import { getCategoryData } from '../lib/database'
import { MOCK_DATA } from '../../data/mockData'

export function useDashboardData(category: ProductCategory) {
  const [data, setData] = useState<CategoryData>(MOCK_DATA[category])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const categoryData = await getCategoryData(category)
      if (categoryData) {
        setData(categoryData)
      } else {
        setData(MOCK_DATA[category])
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      setData(MOCK_DATA[category])
    } finally {
      setLoading(false)
    }
  }, [category])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { data, loading, error, refresh }
}
