// BUGFIX: Make Psi's CAD Assembler & Spell Programmer mineable with any pickaxe.

ServerEvents.tags("block", (event) => {
	const targets = ["psi:cad_assembler", "psi:programmer"]
	event.add("minecraft:mineable/pickaxe", targets)
	event.remove("minecraft:needs_stone_tool", targets)
	event.remove("minecraft:needs_iron_tool", targets)
	event.remove("minecraft:needs_diamond_tool", targets)
})
