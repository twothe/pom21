// kubejs/server_scripts/create_milling_equivalents.js
// Haunt 1 Diamond into 1 Amethyst Shard

ServerEvents.recipes((event) => {
	event.custom({
		type: "create:haunting",
		ingredients: [{ item: "minecraft:diamond" }],
		results: [{ id: "minecraft:amethyst_shard" }],
	})
})
