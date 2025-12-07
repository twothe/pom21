# Loot Adjustments

## Entity drops

- **Witch:** Gains a 5% chance to drop one `minecraft:nether_wart`; the entry is injected through `addEntityDropWithChance`, so JER displays it just like vanilla loot.
- **Ender Dragon:** Always drops exactly one `minecraft:dragon_head` via `addEntityDropWithChance`, keeping the guaranteed drop visible in all loot viewers.

## Helper utility

- `addEntityDropWithChance(event, entityId, itemId, chance, options?)` streamlines adding future mob drops. Pass an entity ID like `minecraft:witch`, the item ID, and a decimal probability between `0` and `1`. Optional `options.poolName`, `options.count`, or `options.scale` (defaults to 100 weight units) tweak the generated loot pool without touching the helper logic.
