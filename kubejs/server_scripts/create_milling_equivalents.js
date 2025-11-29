// kubejs/server_scripts/create_milling_equivalents.js
// Deterministic milling recipes for Create's resource stones.

ServerEvents.recipes((event) => {
	const SCALE = 5 / 30
	const roundChance = (value) => Math.round(value * 1000) / 1000
	const scaleChance = (inputChance) => {
		const base = inputChance == null ? 1 : inputChance
		const clamped = Math.max(0, Math.min(1, base * SCALE))
		return roundChance(clamped)
	}
	const scaleResult = (result) => {
		const scaled = {}
		const id = result.id ?? result.item
		if (id) scaled.id = id
		if (result.tag) scaled.tag = result.tag
		if (result.count !== undefined) scaled.count = result.count
		if (result.fluid) scaled.fluid = result.fluid
		if (result.amount !== undefined) scaled.amount = result.amount
		const chance = scaleChance(result.chance)
		if (chance >= 1) return scaled
		scaled.chance = chance
		return scaled
	}
	const createId = (name) => `kubejs:create/milling/${name}`
	const recipes = [
		{
			name: "asurine",
			ingredient: "#create:stone_types/asurine",
			processingTime: 250,
			results: [
				{ id: "create:crushed_raw_zinc", chance: 0.3 },
				{ id: "create:zinc_nugget", chance: 0.3 },
			],
		},
		{
			name: "veridium",
			ingredient: "#create:stone_types/veridium",
			processingTime: 250,
			results: [
				{ id: "create:crushed_raw_copper", chance: 0.8 },
				{ id: "create:copper_nugget", chance: 0.8 },
			],
		},
		{
			name: "crimsite",
			ingredient: "#create:stone_types/crimsite",
			processingTime: 250,
			results: [
				{ id: "create:crushed_raw_iron", chance: 0.4 },
				{ id: "minecraft:iron_nugget", chance: 0.4 },
			],
		},
		{
			name: "ochrum",
			ingredient: "#create:stone_types/ochrum",
			processingTime: 250,
			results: [
				{ id: "create:crushed_raw_gold", chance: 0.2 },
				{ id: "minecraft:gold_nugget", chance: 0.2 },
			],
		},
	]
	const buildIngredient = (value) => {
		if (typeof value === "string" && value.startsWith("#")) {
			return { tag: value.substring(1) }
		}
		return { item: value }
	}
	const emitRecipe = (recipe) => {
		const scaledResults = []
		for (let i = 0; i < recipe.results.length; i++) {
			scaledResults.push(scaleResult(recipe.results[i]))
		}
		const json = {
			type: "create:milling",
			ingredients: [buildIngredient(recipe.ingredient)],
			results: scaledResults,
			processing_time: Math.max(50, Math.ceil(recipe.processingTime ?? 250)),
		}
		event.custom(json).id(createId(recipe.name))
	}
	for (let i = 0; i < recipes.length; i++) {
		emitRecipe(recipes[i])
	}
})
