import type { DashboardRepository, DashboardSummary } from '../features/dashboard/types'
import { ApiClient } from './api-client'

export class ApiDashboardRepository implements DashboardRepository {
  private readonly client: ApiClient
  constructor(client: ApiClient) { this.client = client }
  get(today: string, signal?: AbortSignal): Promise<DashboardSummary> {
    const path = `/api/dashboard?today=${encodeURIComponent(today)}`
    return signal ? this.client.get<DashboardSummary>(path, { signal }) : this.client.get<DashboardSummary>(path)
  }
}
