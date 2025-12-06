/**
	Register a Menril sapling trade as another *option* in the wandering trader's
	generic offer pool via MoreJS' dedicated wandererTrades event. Level 1 within
	that event corresponds to the vanilla "generic" table, level 2 to the "rare"
	entry, so we keep the behaviour probabilistic.
*/

MoreJS.wandererTrades((event) => {
	event.addTrade(2, Item.of("minecraft:emerald", 4), Item.of("integrateddynamics:menril_sapling", 1)).maxUses(4).villagerExperience(1).priceMultiplier(0.05)
	
	for (const item of ["ars_nouveau:mendosteen_pod", "ars_nouveau:bastion_pod", "ars_nouveau:frostaya_pod", "ars_nouveau:bombegranate_pod", "ars_elemental:flashpine_pod"]) {
		event.addTrade(2, Item.of("minecraft:emerald", 2), Item.of(item, 1)).maxUses(8).villagerExperience(1).priceMultiplier(0.05)
	}
	event.addTrade(2, Item.of("minecraft:emerald", 8), Item.of("minecraft:spore_blossom", 1)).maxUses(2).villagerExperience(1).priceMultiplier(0.05)
})
