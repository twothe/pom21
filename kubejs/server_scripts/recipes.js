// priority: 0

ServerEvents.recipes((event) => {
	function removeAllFor() {
		var ids = Array.prototype.slice.call(arguments) // "Rest-Parameter"
		ids.forEach(function (id) {
			try {
				event.remove({ output: id })
			} catch (err) {
				console.error("Failed to remove recipe: ", err)
			}
		})
	}

	// Conveience
	event.shaped("16x minecraft:stick", ["W", "W"], { W: "#minecraft:logs" })
	event.shaped("4x minecraft:chest", ["WWW", "W W", "WWW"], { W: "#minecraft:logs" })

	// Balancing
	removeAllFor("ars_additions:source_spawner", "ars_additions:ender_source_jar")
	removeAllFor("mekanism:upgrade_energy", "mekanismgenerators:wind_generator") // Balance mod through power
	removeAllFor("oritech:spawner_controller_block")
	removeAllFor("oritech:spawner_cage_block")

	// Recipe clash
	removeAllFor("mekanism:block_charcoal")

	// unification
	event.blasting("mekanism:ingot_uranium", "oritech:uranium_dust")
})

ServerEvents.tags("item", (event) => {
	// Remove all other chests from chest tags, so you can actually craft things without going crazy
	event.removeAll("forge:chests")
	event.removeAll("forge:chests/wooden")
	event.add("forge:chests", "minecraft:chest")
	event.add("forge:chests/wooden", "minecraft:chest")
})
