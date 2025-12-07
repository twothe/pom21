# KubeJS Integration Notes

## Global scripting rules

- Always use tabs inside `.js` files (system requirement).
- Validate all `Item.of(...)` identifiers before wiring them into trades/recipes so `/reload` output stays useful.
- Keep this file and feature-specific docs (e.g., `docs/wandering-trader.md`) in sync with whatever we learn from the jar sources. Online MoreJS docs drift; rely on actual class files.

## MoreJS event group (sources: `com.almostreliable.morejs.core.Events`, `Plugin`)

- The plugin registers an event group named **`MoreJS`** (not `MoreJSEvents`). Its interesting hooks include:
	- `MoreJS.villagerTrades` — fires with `VillagerTradingEventJS` for profession tables.
	- `MoreJS.wandererTrades` — fires with `WandererTradingEventJS` for the wandering trader.
	- Other exposed hooks (`playerStartTrading`, `updateOffer`, etc.) can be discovered in `Events.class` if needed.
- These events fire after `com.almostreliable.morejs.features.villager.TradingManager` clones the vanilla trade tables and get re-run whenever NeoForge raises `TagsUpdatedEvent` (see `VillagerTradingManagerMixin`), so `/reload` and datapack changes will refresh our additions automatically.

## `WandererTradingEventJS` recap (sources: `...events/WandererTradingEventJS`, `TradingManager`)

- `level` must be **1 or 2** (`checkLevel` enforces it). Level 1 corresponds to `VillagerTrades.WANDERING_TRADER_TRADES`"generic" entries, level 2 to the single "rare" entry.
- `event.addTrade(level, buys, sell)` accepts either `TradeItem` instances or anything coercible to an `ItemStack` (the plugin registers a type wrapper so passing `Item.of(...)` works). When you need multiple costs, pass an array: `event.addTrade(1, [Item.of(...), Item.of(...)], Item.of(...))`.
- The helper returns a `SimpleTrade`, which extends `TransformableTrade`. Default values from the class are `maxUses=16`, `villagerExperience=2`, and `priceMultiplier=0.05`. Chain `.maxUses(...)`, `.villagerExperience(...)`, `.priceMultiplier(...)`, or `.transform(...)` to tune those fields immediately after `addTrade`.
- Removal helpers are available:
	- `removeVanillaTypedTrades(level)` / `removeModdedTypedTrades(level)` drop entries from a single pool.
	- The parameterless counterparts clear both pools.
- Internally the event clones the vanilla `WANDERING_TRADER_TRADES` table, lets scripts mutate the clone, and writes it back (see `TradingManager.invokeWanderingTradeEvent`). That means mutations are deterministic and survive future refreshes.

## TradeItem helpers (sources: `...features/villager/TradeItem`, `MoreJSBinding`)

- `TradeItem.of(ItemStack)`, `TradeItem.of(ItemStack, count)`, and `TradeItem.of(ItemStack, min, max)` build reusable cost/output descriptors backed by `IntRange`.
- Because the plugin registers `TradeItem` and `IntRange` type wrappers, Rhino will automatically call those factories when you pass `Item.of(...)` or `[min, max]` ranges into `event.addTrade`. Use the explicit helpers when you need clarity or want to share descriptors.

## Practical pattern for wandering-trader trades

```js
const GENERIC_LEVEL = 1

MoreJS.wandererTrades(event => {
	event
		.addTrade(GENERIC_LEVEL, Item.of("minecraft:emerald", 4), Item.of("mod:item", 1))
		.maxUses(4)
		.villagerExperience(1)
		.priceMultiplier(0.05)
})
```

- Remember that the event only **offers** new choices; the trader still randomly selects a subset of level-1 trades every time it spawns.

## Ars Nouveau Enchanting Apparatus recipes

- Use `event.custom({ type: "ars_nouveau:enchanting_apparatus", ... })` inside `ServerEvents.recipes` to inject new apparatus crafts. The serializer expects:
	- `reagent`: a single catalyst ingredient (center item) defined via `{ item: "mod:item" }` or `{ tag: "namespace:tag" }`.
	- `pedestalItems`: array of ingredient objects for each pedestal. Order does **not** matter; matching is multiset-based via `RecipeMatcher`.
- `result`: `{ id: "mod:item", count: N }` stack returned after crafting. (`id` is required per Ars Nouveau's serializer even though many vanilla recipes accept `item`.)
	- `sourceCost`: integer source requirement (0+). Values >0 consume source from nearby jars/sourcelinks.
	- `keepNbtOfReagent` (optional): defaults to `false`; set `true` if the reagent's components should copy onto the output.
- Example (see `kubejs/server_scripts/blaze-rod-hc.js`): turning a `createaddition:gold_rod` reagent plus four pedestals into a `minecraft:blaze_rod` with `sourceCost: 1000`.

## Create fan processing tweaks

- Overwrite built-in recipes (e.g., `create:splashing/crushed_raw_iron`) by calling `event.remove({ id })` before emitting a new `event.custom({ type: "create:splashing", ... }).id(id)` payload; this keeps JEI entries stable and avoids duplicate recipe IDs.
- Each fan-processing serializer (`create:splashing`, `create:haunting`, etc.) expects an explicit `results` array; optional drops use `{ chance: 0.xx, id: "namespace:item" }` while guaranteed items can set `count`.
- When extending a default recipe with extra drops (like adding a 50% `oritech:nickel_nugget` to crushed iron washing or introducing a diamond→amethyst haunting), copy the original JSON from the Create jar, merge the new entries, and keep identifiers consistent so mods referencing the default recipe keep working.

## Oritech Enderic Laser recipes

- `oritech:laser` payloads always declare `fluidInput`, `fluidOutputs`, `ingredients`, `results`, and `time` (see `data/oritech/recipe/laser/*.json` inside the mod jar); zero-fluid entries still use `minecraft:empty` with `amount: 0` and an empty `fluidOutputs` array.
- Emit new recipes through `event.custom({ type: "oritech:laser", ... }).id(<kubejs id>)` so JEI displays a single entry and future removals can address it directly.
- Pack tweak: the Enderic Laser now accepts `minecraft:amethyst_block` and outputs one `oritech:fluxite`, mirroring the vanilla amethyst cluster recipe but giving players a bulk conversion option.

## Gateways: Tidal Guardians

- `kubejs/data/kubejs/gateways/gateways/tidal_guardians.json` defines the `kubejs:tidal_guardians` Gateway (medium teal) that escalates through four Guardian waves before a heavily buffed Elder Guardian finale; remember that loot-table rewards require a `desc` key mirroring vanilla examples. `kubejs/server_scripts/gateways.js` wires the crafting recipe to produce the gate pearl via vanilla items.
- Guardian waves spawn 4→7 mobs with incremental health, armor, damage, knockback resistance, and speed modifiers so progression feels noticeable while staying manageable.
- The Elder Guardian gains +120 HP, +45% damage, +8 armor, +60% knockback resistance, +25% speed, and +1.5 attack knockback, making the capstone fight demand proper gear and ocean-style tactics.
- Successfully clearing the gate yields Guardian/Elder Guardian loot plus an extra roll on `minecraft:chests/ocean_ruin_warm` for oceanic curios.
- Craft the associated gate pearl with `gateways:gate_recipe` (pattern `PSP/WHW/PNP`): `P` prismarine shard, `S` sea lantern, `W` wet sponge, `H` heart of the sea, `N` nautilus shell — all vanilla items obtainable from ocean exploration.
