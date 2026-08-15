import { createContext, useContext, type ReactNode } from 'react'
import type { DashboardRepository } from './types'

const DashboardRepositoryContext = createContext<DashboardRepository | undefined>(undefined)

export function DashboardRepositoryProvider({ repository, children }: { repository: DashboardRepository; children: ReactNode }) {
  return <DashboardRepositoryContext value={repository}>{children}</DashboardRepositoryContext>
}

export function useDashboardRepository(): DashboardRepository {
  const repository = useContext(DashboardRepositoryContext)
  if (!repository) throw new Error('Dashboard repository is not configured')
  return repository
}
