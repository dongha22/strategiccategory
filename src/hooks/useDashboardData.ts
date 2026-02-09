import { useState, useEffect, useCallback } from 'react'
import { ProductCategory, CategoryData } from '../../types'
import { getCategoryData } from '../lib/database'
import { MOCK_DATA } from '../../data/mockData'

export function useDashboardData(category: ProductCategory) {
  const [data, setData] = useState<CategoryData>(MOCK_DATA[category])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout

    const loadData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const categoryData = await getCategoryData(category)
        if (isMounted) {
          if (categoryData) {
            setData(categoryData)
          } else {
            setData(MOCK_DATA[category])
          }
          setLoading(false)
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch data')
          setData(MOCK_DATA[category])
          setLoading(false)
        }
      }
    }

    // Set a timeout to fallback to mock data if loading takes too long
    timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Dashboard data loading timed out, using mock data')
        setData(MOCK_DATA[category])
        setLoading(false)
        setError('Data loading timeout - displaying mock data')
      }
    }, 5000)

    loadData()

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [category])

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
      console.error('Failed to refresh dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh data')
      setData(MOCK_DATA[category])
    } finally {
      setLoading(false)
    }
  }, [category])

  return { data, loading, error, refresh }
}
