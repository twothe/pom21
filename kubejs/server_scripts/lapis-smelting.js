// priority: 0

ServerEvents.recipes((event) => {
	function smeltAllTo(targetItem, prefix, list) {
		list.forEach((item) => event.smelting(targetItem, prefix + item))
	}

	smeltAllTo("minecraft:lapis_lazuli", "mekanismtools:lapis_lazuli_", ["pickaxe", "axe", "shovel", "hoe", "paxel", "sword", "helmet", "chestplate", "leggings", "boots", "shield"])
})

ServerEvents.tags("item", (event) => {})
