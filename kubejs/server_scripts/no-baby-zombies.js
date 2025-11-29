// kubejs/server_scripts/no_baby_undead_convert.js
// Convert baby undead to adults reliably on 1.21.x (Rhino-safe, no ES spreads).

const POM_NOBABY_TARGETS = ["minecraft:zombie", "minecraft:husk", "minecraft:drowned", "minecraft:zombie_villager", "minecraft:zombified_piglin"]

function isTarget(id) {
	for (let i = 0; i < POM_NOBABY_TARGETS.length; i++) if (POM_NOBABY_TARGETS[i] === id) return true
	return false
}

function isBaby(ent) {
	try {
		if (ent.isBaby && ent.isBaby()) return true
	} catch (e) {}
	try {
		let nbt = ent.nbt || {}
		if (nbt.IsBaby === 1) return true
		if (typeof nbt.Age === "number" && nbt.Age < 0) return true // generic ageable hint
	} catch (e2) {}
	return false
}

EntityEvents.spawned(function (e) {
	let id = String(e.entity.type)
	if (!isTarget(id)) return

	// Defer by 1 tick so finalizeSpawn has applied the baby flag.
	e.server.scheduleInTicks(1, function () {
		let ent = e.entity
		if (!ent || ent.removed) return

		if (!isBaby(ent)) return

		// 1) Prefer API
		let changed = false
		try {
			if (ent.setBaby && typeof ent.setBaby === "function") {
				ent.setBaby(false)
				changed = true
			}
		} catch (e1) {}

		// 2) NBT fallback (Rhino-safe object literal)
		try {
			// mergeNbt merges only provided keys; we don't need to clone the full NBT
			ent.mergeNbt({ IsBaby: 0, Age: 0 })
			changed = true
		} catch (e2) {}

		// 3) Try to refresh dimensions (if available) so hitbox updates immediately
		try {
			if (ent.refreshDimensions && typeof ent.refreshDimensions === "function") {
				ent.refreshDimensions()
			}
		} catch (e3) {}
	})
})
