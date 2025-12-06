// kubejs/server_scripts/create_milling_equivalents.js
// Create chorus for HC challenge

ServerEvents.recipes((event) => {
	event.custom({
		type: "ars_nouveau:enchanting_apparatus",
		reagent: { item: "minecraft:golden_apple" },
		pedestalItems: [{ item: "ars_nouveau:conjuration_essence" }, { item: "minecraft:ender_pearl" }, { item: "ars_nouveau:earth_essence" }, { item: "minecraft:ender_pearl" }],
		result: { id: "minecraft:chorus_fruit", count: 1 },
		sourceCost: 2000,
		keepNbtOfReagent: false,
	})

	event.custom({
		type: "ars_nouveau:enchanting_apparatus",
		reagent: { item: "minecraft:end_stone" },
		pedestalItems: [
			{ item: "ars_nouveau:conjuration_essence" },
			{ item: "minecraft:chorus_fruit" },
			{ item: "oritech:fluxite_block" },
			{ item: "minecraft:chorus_fruit" },
			{ item: "ars_nouveau:conjuration_essence" },
			{ item: "minecraft:chorus_fruit" },
			{ item: "oritech:fluxite_block" },
			{ item: "minecraft:chorus_fruit" },
		],
		result: { id: "minecraft:chorus_flower", count: 1 },
		sourceCost: 10000,
		keepNbtOfReagent: false,
	})
})
