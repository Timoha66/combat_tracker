import { db } from './bestiaryDb'
import seedData from './seedBestiary.json'

/**
 * Загружает стартовый бестиарий при первом запуске.
 * Вызывается один раз — если база пустая.
 */
export async function loadSeedIfEmpty() {
  const count = await db.creatures.count()
  if (count === 0) {
    await db.creatures.bulkAdd(seedData)
    console.log(`[Seed] Загружено ${seedData.length} существ по умолчанию`)
  }
}
