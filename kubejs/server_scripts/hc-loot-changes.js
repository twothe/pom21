/**
 * Aligns mob drops with pack expectations by editing the base loot tables so data-driven tools like JER pick them up.
 */
const SINGLE_ROLL = NumberProvider.constant(1)
const DEFAULT_WEIGHT_SCALE = 100

/**
 * Guarantees the referenced loot table exists before applying custom pools.
 * @param {LootTableEventJS} event
 * @param {string} tableId
 * @returns {MutableLootTable | null}
 */
const ensureTable = (event, tableId) => {
	if (!event.hasLootTable(tableId)) {
		throw `[LootJS] Missing loot table ${tableId}`
	}
	return event.getLootTable(tableId)
}

const normalizeEntityTableId = (entityId) => {
	if (entityId.indexOf(":entities/") !== -1) {
		return entityId
	}
	const parts = entityId.split(":")
	if (parts.length !== 2 || !parts[0] || !parts[1]) {
		throw `Invalid entity id '${entityId}'. Expected namespace:path`
	}
	return `${parts[0]}:entities/${parts[1]}`
}

/**
 * Adds a loot pool with a weighted chance into any loot table.
 * @param {LootTableEventJS} event
 * @param {string} tableId loot table identifier
 * @param {string} itemId namespaced item ID
 * @param {number} chance value between 0 and 1 (inclusive)
 * @param {{poolName?: string, count?: number, scale?: number}} options optional overrides
 */
const addTableDropWithChance = (event, tableId, itemId, chance, options) => {
	const settings = options || {}
	if (chance <= 0 || chance > 1) {
		throw `Chance ${chance} for ${tableId} -> ${itemId} is outside (0,1]`
	}
	const table = ensureTable(event, tableId)
	const scaleBase = settings.scale && settings.scale > 0 ? settings.scale : DEFAULT_WEIGHT_SCALE
	const chanced = chance !== 1
	const successWeight = chanced ? Math.max(1, Math.round(chance * scaleBase)) : 1
	const failureWeight = chanced ? Math.max(0, scaleBase - successWeight) : 0
	const pool = table.createPool()
	const fallbackName = tableId.replace(/[/:]/g, "_") + "_" + itemId.replace(":", "_")
	pool.name(settings.poolName || `kubejs_${fallbackName}`)
	pool.rolls(SINGLE_ROLL)
	pool.addEntry(LootEntry.of(Item.of(itemId, settings.count || 1)).withWeight(successWeight))
	if (failureWeight > 0) {
		pool.addEntry(LootEntry.empty().withWeight(failureWeight))
	}
}

/**
 * Entity-specific convenience wrapper around addTableDropWithChance.
 */
const addEntityDropWithChance = (event, entityId, itemId, chance, options) => {
	const tableId = normalizeEntityTableId(entityId)
	addTableDropWithChance(event, tableId, itemId, chance, options)
}

LootJS.lootTables((event) => {
	addEntityDropWithChance(event, "minecraft:witch", "minecraft:nether_wart", 0.05, { poolName: "kubejs_witch_nether_wart" })
	addEntityDropWithChance(event, "minecraft:skeleton", "minecraft:skeleton_skull", 0.01, { poolName: "kubejs_skeleton_skull" })
	addEntityDropWithChance(event, "minecraft:ender_dragon", "minecraft:dragon_head", 1, { poolName: "kubejs_ender_dragon_head" })
	addTableDropWithChance(event, "minecraft:gameplay/fishing/treasure", "minecraft:wet_sponge", 0.01, { poolName: "kubejs_fishing_wet_sponge" })
})
