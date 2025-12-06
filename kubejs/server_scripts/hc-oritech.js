/**
 * Aligns Create's crushed iron washing with Oritech drops and wires Fluxite acquisition into the Enderic Laser.
 */

ServerEvents.recipes((event) => {
	extendCrushedIronSplashing(event) // allows to get Platin
	addAmethystFluxiteLaser(event) // allows to get budding Amethyst cluster
})

function extendCrushedIronSplashing(event) {
	const recipeId = "create:splashing/crushed_raw_iron"
	event.remove({ id: recipeId })
	event
		.custom({
			type: "create:splashing",
			ingredients: [{ item: "create:crushed_raw_iron" }],
			results: [
				{ count: 9, id: "minecraft:iron_nugget" },
				{ chance: 0.75, id: "minecraft:redstone" },
				{ chance: 0.1, id: "oritech:small_nickel_clump" },
			],
		})
		.id(recipeId)
}

function addAmethystFluxiteLaser(event) {
	const recipeId = "kubejs:oritech/laser/amethyst_block_fluxite"
	event
		.custom({
			type: "oritech:laser",
			fluidInput: {
				amount: 0,
				fluid: "minecraft:empty",
			},
			fluidOutputs: [],
			ingredients: [{ item: "minecraft:amethyst_block" }],
			results: [{ count: 1, id: "oritech:fluxite" }],
			time: 1,
		})
		.id(recipeId)
}
