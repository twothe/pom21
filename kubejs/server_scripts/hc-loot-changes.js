// kubejs/server_scripts/hc-changes.js
// Add a 5% chance for witches to drop either Blaze Powder or Nether Wart.
LootJS.modifiers((event) => {
	const witchPool = event.addEntityModifier("minecraft:witch")
	witchPool.randomChance(0.1).addLoot("minecraft:nether_wart")
})
