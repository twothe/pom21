// kubejs/server_scripts/create_milling_equivalents.js
// Create blaze rods for HC challenge

ServerEvents.recipes((event) => {
	event.custom({
		type: "ars_nouveau:enchanting_apparatus",
		reagent: { item: "createaddition:gold_rod" },
		pedestalItems: [
			{ item: "ars_nouveau:fire_essence" },
			{ item: "minecraft:gunpowder" },
			{ item: "minecraft:redstone" },
			{ item: "minecraft:fire_charge" }
		],
		result: { id: "minecraft:blaze_rod", count: 1 },
		sourceCost: 1000,
		keepNbtOfReagent: false
	})
})
