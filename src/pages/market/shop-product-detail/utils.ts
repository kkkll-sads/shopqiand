export function mergeDisplayImages(safeShopImages: string[], skuPreviewImage: string | null): string[] {
  if (skuPreviewImage && !safeShopImages.includes(skuPreviewImage)) {
    return [skuPreviewImage, ...safeShopImages]
  }
  return safeShopImages
}

/**
 * 规格处理逻辑，兼容新旧返回格式
 */
export function getSpecsForBuySheet(rawSpecs: any[] = []): any[] {
  if (!Array.isArray(rawSpecs) || rawSpecs.length === 0) {
    return []
  }

  const firstSpec = rawSpecs[0]
  if (firstSpec && firstSpec.id && firstSpec.name && Array.isArray(firstSpec.values)) {
    return rawSpecs
      .filter((spec) => spec && spec.id && spec.name && Array.isArray(spec.values))
      .map((spec) => ({
        id: spec.id,
        name: spec.name,
        values: spec.values || [],
      }))
  }

  const specGroups = new Map<string, Set<string>>()
  rawSpecs.forEach((spec: any) => {
    if (spec && spec.name && spec.value) {
      if (!specGroups.has(spec.name)) {
        specGroups.set(spec.name, new Set())
      }
      specGroups.get(spec.name)!.add(spec.value)
    }
  })

  return Array.from(specGroups.entries()).map(([name, values], index) => ({
    id: `spec-${index}`,
    name,
    values: Array.from(values),
  }))
}
