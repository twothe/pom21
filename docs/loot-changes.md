# Loot Adjustments

## Entity drops

- **Witch:** Gains a 5% chance to drop one `minecraft:nether_wart`; the entry is injected through `addEntityDropWithChance`, so JER displays it just like vanilla loot.
- **Skeleton:** Gains a 1% chance to drop a `minecraft:skeleton_skull`, giving players a renewable way to farm skulls without Withers.
- **Ender Dragon:** Always drops exactly one `minecraft:dragon_head` via `addEntityDropWithChance`, keeping the guaranteed drop visible in all loot viewers.

## Fishing loot

- **Wet Sponge:** Added as a 1% treasure roll by patching `minecraft:gameplay/fishing/treasure`, so Siren Shrines or vanilla fishing can occasionally yield `minecraft:wet_sponge` without ocean monuments.

## Helper utility

- `addEntityDropWithChance(event, entityId, itemId, chance, options?)` streamlines adding future mob drops. Pass an entity ID like `minecraft:witch`, the item ID, and a decimal probability between `0` and `1`. Optional `options.poolName`, `options.count`, or `options.scale` (defaults to 100 weight units) tweak the generated loot pool without touching the helper logic.
- `addTableDropWithChance(event, tableId, itemId, chance, options?)` performs the same weighted-injection workflow for arbitrary loot tables (e.g., fishing treasure), letting us surface new rewards for subsystems beyond mob drops.
