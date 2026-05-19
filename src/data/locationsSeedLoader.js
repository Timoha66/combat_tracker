import { locDb } from './locationsDb'
import seedData from './seedLocations.json'

export async function loadLocationsSeedIfEmpty() {
  const count = await locDb.locations.count()
  if (count === 0) {
    await locDb.locations.bulkAdd(seedData)
    console.log(`[Seed] Загружено ${seedData.length} локаций`)
  }
}
