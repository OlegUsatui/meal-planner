export interface AccountExportImage {
  path: string
  fileName: string
  signedUrl: string
}

export interface AccountExportManifestV1 {
  version: 1
  exportedAt: string
  account: { id: string; email: string | null }
  data: {
    profile: unknown
    recipes: unknown[]
    products: unknown[]
    recipeIngredients: unknown[]
    mealPlanEntries: unknown[]
  }
  references: {
    recipes: Array<{ id: string; name: string }>
    products: Array<{ id: string; name: string }>
  }
  images: AccountExportImage[]
}
