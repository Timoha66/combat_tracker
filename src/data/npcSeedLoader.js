import { npcDb } from './npcDb'
import seedFactions from './seedFactions.json'
import seedNpcs from './seedNpcs.json'

export async function loadNpcSeedIfEmpty() {
  const count = await npcDb.factions.count()
  if (count > 0) return

  const factionIds = await npcDb.factions.bulkAdd(seedFactions, { allKeys: true })
  const slugToId = {}
  seedFactions.forEach((f, i) => { slugToId[f.slug] = factionIds[i] })

  const npcsWithIds = seedNpcs.map(n => ({
    ...n,
    factionId: slugToId[n.factionSlug] ?? null,
  }))
  await npcDb.npcs.bulkAdd(npcsWithIds)
  console.log(`[Seed] Загружено ${seedFactions.length} фракций и ${npcsWithIds.length} НПС`)
}
