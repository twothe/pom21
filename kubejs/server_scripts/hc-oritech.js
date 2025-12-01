/**
 * Extends Create's crushed iron washing output with Oritech nickel support.
 */

ServerEvents.recipes((event) => {
	const recipeId = "create:splashing/crushed_raw_iron"
	event.remove({ id: recipeId })
	event
		.custom({
			type: "create:splashing",
			ingredients: [{ item: "create:crushed_raw_iron" }],
			results: [
				{ count: 9, id: "minecraft:iron_nugget" },
				{ chance: 0.75, id: "minecraft:redstone" },
				{ chance: 0.5, id: "oritech:small_nickel_clump" },
			],
		})
		.id(recipeId)
})
