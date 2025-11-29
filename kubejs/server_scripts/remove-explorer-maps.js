// kubejs/server_scripts/remove-explorer-maps.js

LootJS.lootTables((event) => {
	event.modifyLootTables(LootType.CHEST).replaceItem("minecraft:map", "minecraft:paper")
	event.modifyLootTables(LootType.CHEST).replaceItem("ars_additions:exploration_warp_scroll", "minecraft:paper")
})

LootJS.modifiers((event) => {
	event.addTableModifier(LootType.CHEST).removeLoot("minecraft:filled_map")
	event.addTableModifier(LootType.CHEST).removeLoot("ars_additions:exploration_warp_scroll")
})
