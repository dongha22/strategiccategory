import { supabase } from './supabase'
import { ProductCategory, CategoryData, MonthlyPerformance, CustomerData, MarketShare, Facilitator, Product } from '../../types'
import { MOCK_DATA } from '../../data/mockData'

export async function getCategoryId(categoryName: ProductCategory): Promise<string | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('name', categoryName)
    .single()
  
  if (error || !data) {
    console.error('Error fetching category ID:', error)
    return null
  }
  
  return data.id
}

export async function getMonthlyPerformance(categoryId: string): Promise<MonthlyPerformance[]> {
  const { data, error } = await supabase
    .from('monthly_performance')
    .select('*')
    .eq('category_id', categoryId)
    .order('month', { ascending: true })
  
  if (error || !data) {
    console.error('Error fetching monthly performance:', error)
    return []
  }
  
  return data.map(row => ({
    month: row.month,
    lastYearActual: row.last_year_actual,
    thisYearTarget: row.this_year_target,
    thisYearActual: row.this_year_actual
  }))
}

export async function getFacilitators(categoryId: string): Promise<Facilitator[]> {
  const { data, error } = await supabase
    .from('facilitators')
    .select('*')
    .eq('category_id', categoryId)
  
  if (error || !data) {
    console.error('Error fetching facilitators:', error)
    return []
  }
  
  return data.map(row => ({
    role: row.role as Facilitator['role'],
    name: row.name
  }))
}

export async function getCustomers(categoryId: string): Promise<CustomerData[]> {
  const { data: customersData, error: customersError } = await supabase
    .from('customers')
    .select('*')
    .eq('category_id', categoryId)
  
  if (customersError || !customersData) {
    console.error('Error fetching customers:', customersError)
    return []
  }
  
  const customers: CustomerData[] = []
  
  for (const customer of customersData) {
    const { data: sharesData } = await supabase
      .from('market_shares')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('is_aggregate', false)
      .order('period', { ascending: true })
    
    const shares: MarketShare[] = (sharesData || []).map(s => ({
      period: s.period,
      cosmax: s.cosmax,
      kolmar: s.kolmar,
      others: s.others
    }))
    
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('customer_id', customer.id)
    
    const products: Product[] = (productsData || []).map(p => ({
      id: p.id,
      name: p.name,
      revenue: p.revenue,
      growth: p.growth,
      share: p.share
    }))
    
    customers.push({
      id: customer.id,
      name: customer.name,
      revenueLastYear: customer.revenue_last_year,
      revenueYTD: customer.revenue_ytd,
      growth: customer.growth,
      status: customer.status,
      shares,
      products
    })
  }
  
  return customers
}

export async function getAggregateMarketShares(categoryId: string): Promise<MarketShare[]> {
  const { data, error } = await supabase
    .from('market_shares')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_aggregate', true)
    .order('period', { ascending: true })
  
  if (error || !data) {
    console.error('Error fetching aggregate market shares:', error)
    return []
  }
  
  return data.map(row => ({
    period: row.period,
    cosmax: row.cosmax,
    kolmar: row.kolmar,
    others: row.others
  }))
}

export async function getCategoryData(categoryName: ProductCategory): Promise<CategoryData | null> {
  const categoryId = await getCategoryId(categoryName)
  
  if (!categoryId) {
    console.log(`Category ${categoryName} not found, using mock data`)
    return MOCK_DATA[categoryName]
  }
  
  const [performance, facilitators, customers, aggregateShares] = await Promise.all([
    getMonthlyPerformance(categoryId),
    getFacilitators(categoryId),
    getCustomers(categoryId),
    getAggregateMarketShares(categoryId)
  ])
  
  if (performance.length === 0 && customers.length === 0) {
    console.log(`No data for ${categoryName}, using mock data`)
    return MOCK_DATA[categoryName]
  }
  
  const fullPerformance: MonthlyPerformance[] = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const existing = performance.find(p => p.month === month)
    return existing || {
      month,
      lastYearActual: 0,
      thisYearTarget: 0,
      thisYearActual: null
    }
  })
  
  return {
    category: categoryName,
    totalPerformance: fullPerformance,
    top20AggregateShare: aggregateShares.length > 0 ? aggregateShares : MOCK_DATA[categoryName].top20AggregateShare,
    topCustomers: customers.length > 0 ? customers : MOCK_DATA[categoryName].topCustomers,
    facilitators: facilitators.length > 0 ? facilitators : MOCK_DATA[categoryName].facilitators
  }
}

export async function uploadPerformanceData(
  categoryName: ProductCategory,
  performance: MonthlyPerformance[]
): Promise<void> {
  const categoryId = await getCategoryId(categoryName)
  
  if (!categoryId) {
    throw new Error(`Category ${categoryName} not found`)
  }
  
  const { error: deleteError } = await supabase
    .from('monthly_performance')
    .delete()
    .eq('category_id', categoryId)
  
  if (deleteError) {
    throw new Error(`Failed to clear existing performance data: ${deleteError.message}`)
  }
  
  const rows = performance.map(p => ({
    category_id: categoryId,
    month: p.month,
    last_year_actual: p.lastYearActual,
    this_year_target: p.thisYearTarget,
    this_year_actual: p.thisYearActual
  }))
  
  const { error: insertError } = await supabase
    .from('monthly_performance')
    .insert(rows)
  
  if (insertError) {
    throw new Error(`Failed to insert performance data: ${insertError.message}`)
  }
}

export async function uploadCustomerData(
  categoryName: ProductCategory,
  customers: CustomerData[],
  aggregateShares: MarketShare[]
): Promise<void> {
  const categoryId = await getCategoryId(categoryName)
  
  if (!categoryId) {
    throw new Error(`Category ${categoryName} not found`)
  }
  
  const { error: deleteCustomersError } = await supabase
    .from('customers')
    .delete()
    .eq('category_id', categoryId)
  
  if (deleteCustomersError) {
    throw new Error(`Failed to clear existing customer data: ${deleteCustomersError.message}`)
  }
  
  const { error: deleteSharesError } = await supabase
    .from('market_shares')
    .delete()
    .eq('category_id', categoryId)
    .eq('is_aggregate', true)
  
  if (deleteSharesError) {
    throw new Error(`Failed to clear existing aggregate shares: ${deleteSharesError.message}`)
  }
  
  for (const customer of customers) {
    const { data: insertedCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({
        category_id: categoryId,
        name: customer.name,
        revenue_last_year: customer.revenueLastYear,
        revenue_ytd: customer.revenueYTD,
        growth: customer.growth,
        status: customer.status
      })
      .select('id')
      .single()
    
    if (customerError || !insertedCustomer) {
      throw new Error(`Failed to insert customer ${customer.name}: ${customerError?.message}`)
    }
    
    const customerId = insertedCustomer.id
    
    if (customer.products.length > 0) {
      const productRows = customer.products.map(p => ({
        customer_id: customerId,
        name: p.name,
        revenue: p.revenue,
        growth: p.growth,
        share: p.share
      }))
      
      const { error: productsError } = await supabase
        .from('products')
        .insert(productRows)
      
      if (productsError) {
        throw new Error(`Failed to insert products for ${customer.name}: ${productsError.message}`)
      }
    }
    
    if (customer.shares.length > 0) {
      const shareRows = customer.shares.map(s => ({
        category_id: categoryId,
        customer_id: customerId,
        period: s.period,
        cosmax: s.cosmax,
        kolmar: s.kolmar,
        others: s.others,
        is_aggregate: false
      }))
      
      const { error: sharesError } = await supabase
        .from('market_shares')
        .insert(shareRows)
      
      if (sharesError) {
        throw new Error(`Failed to insert market shares for ${customer.name}: ${sharesError.message}`)
      }
    }
  }
  
  if (aggregateShares.length > 0) {
    const aggregateRows = aggregateShares.map(s => ({
      category_id: categoryId,
      customer_id: null,
      period: s.period,
      cosmax: s.cosmax,
      kolmar: s.kolmar,
      others: s.others,
      is_aggregate: true
    }))
    
    const { error: aggregateError } = await supabase
      .from('market_shares')
      .insert(aggregateRows)
    
    if (aggregateError) {
      throw new Error(`Failed to insert aggregate market shares: ${aggregateError.message}`)
    }
  }
}

export async function clearCategoryData(categoryName: ProductCategory): Promise<void> {
  const categoryId = await getCategoryId(categoryName)
  
  if (!categoryId) {
    throw new Error(`Category ${categoryName} not found`)
  }
  
  const { error: customersError } = await supabase
    .from('customers')
    .delete()
    .eq('category_id', categoryId)
  
  if (customersError) {
    throw new Error(`Failed to clear customers: ${customersError.message}`)
  }
  
  const { error: sharesError } = await supabase
    .from('market_shares')
    .delete()
    .eq('category_id', categoryId)
    .eq('is_aggregate', true)
  
  if (sharesError) {
    throw new Error(`Failed to clear aggregate shares: ${sharesError.message}`)
  }
  
  const { error: perfError } = await supabase
    .from('monthly_performance')
    .delete()
    .eq('category_id', categoryId)
  
  if (perfError) {
    throw new Error(`Failed to clear performance data: ${perfError.message}`)
  }
}

export async function getUsers(): Promise<import('../types/auth').AppUser[]> {
  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw new Error(error.message)
  return data.map(row => ({
    id: row.id,
    email: row.email,
    role: row.role as import('../types/auth').UserRole,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at
  }))
}

export async function updateUserStatus(userId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('app_users')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', userId)
  
  if (error) throw new Error(error.message)
}

export async function updateUserRole(userId: string, role: import('../types/auth').UserRole): Promise<void> {
  const { error } = await supabase
    .from('app_users')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)
  
  if (error) throw new Error(error.message)
}

export async function countActiveAdmins(): Promise<number> {
  const { count, error } = await supabase
    .from('app_users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin')
    .eq('is_active', true)
  
  if (error) throw new Error(error.message)
  return count || 0
}

// ====== Data Management CRUD Functions ======

export async function upsertMonthlyPerformance(
  categoryName: ProductCategory,
  month: number,
  data: { lastYearActual: number; thisYearTarget: number; thisYearActual: number | null }
): Promise<void> {
  const categoryId = await getCategoryId(categoryName)
  if (!categoryId) throw new Error(`Category ${categoryName} not found`)

  // Check if row exists
  const { data: existing } = await supabase
    .from('monthly_performance')
    .select('id')
    .eq('category_id', categoryId)
    .eq('month', month)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('monthly_performance')
      .update({
        last_year_actual: data.lastYearActual,
        this_year_target: data.thisYearTarget,
        this_year_actual: data.thisYearActual,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('monthly_performance')
      .insert({
        category_id: categoryId,
        month,
        last_year_actual: data.lastYearActual,
        this_year_target: data.thisYearTarget,
        this_year_actual: data.thisYearActual
      })
    if (error) throw new Error(error.message)
  }
}

export async function upsertFacilitator(
  categoryName: ProductCategory,
  role: string,
  name: string
): Promise<void> {
  const categoryId = await getCategoryId(categoryName)
  if (!categoryId) throw new Error(`Category ${categoryName} not found`)

  const { data: existing } = await supabase
    .from('facilitators')
    .select('id')
    .eq('category_id', categoryId)
    .eq('role', role)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('facilitators')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('facilitators')
      .insert({ category_id: categoryId, role, name })
    if (error) throw new Error(error.message)
  }
}

export async function upsertCustomer(
  categoryName: ProductCategory,
  customerData: {
    id?: string
    name: string
    revenueLastYear: number
    revenueYTD: number
    growth: number
    status: string
  }
): Promise<string> {
  const categoryId = await getCategoryId(categoryName)
  if (!categoryId) throw new Error(`Category ${categoryName} not found`)

  if (customerData.id) {
    const { error } = await supabase
      .from('customers')
      .update({
        name: customerData.name,
        revenue_last_year: customerData.revenueLastYear,
        revenue_ytd: customerData.revenueYTD,
        growth: customerData.growth,
        status: customerData.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerData.id)
    if (error) throw new Error(error.message)
    return customerData.id
  } else {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        category_id: categoryId,
        name: customerData.name,
        revenue_last_year: customerData.revenueLastYear,
        revenue_ytd: customerData.revenueYTD,
        growth: customerData.growth,
        status: customerData.status
      })
      .select('id')
      .single()
    if (error || !data) throw new Error(error?.message || 'Failed to insert customer')
    return data.id
  }
}

export async function deleteCustomer(customerId: string): Promise<void> {
  // Products and market_shares should cascade or be deleted first
  const { error: prodErr } = await supabase.from('products').delete().eq('customer_id', customerId)
  if (prodErr) throw new Error(prodErr.message)
  
  const { error: shareErr } = await supabase.from('market_shares').delete().eq('customer_id', customerId)
  if (shareErr) throw new Error(shareErr.message)
  
  const { error } = await supabase.from('customers').delete().eq('id', customerId)
  if (error) throw new Error(error.message)
}
