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
