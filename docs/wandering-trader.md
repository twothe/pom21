# Wandering Trader Tweaks

## Menril Sapling Trade

- **File:** `kubejs/server_scripts/wandering-trader-menril.js`
- **Trigger:** Uses `MoreJS.wandererTrades(event => { ... })`, the event that MoreJS wires up to `TradingManager.invokeWanderingTradeEvent` (level 1 = vanilla *generic*, level 2 = vanilla *rare*).
- **Trade:** Adds 4 × `minecraft:emerald` → 1 × `integrateddynamics:menril_sapling` as another level-1 option.
- **Tuning:** The returned `SimpleTrade` is configured with `.maxUses(4)`, `.villagerExperience(1)`, and `.priceMultiplier(0.05)`, so the offer behaves like an ordinary sapling sale and still spawns only when the trader randomly selects it from the shared level-1 table.

Adjust the costs or rewards by editing the `Item.of(...)` entries or by chaining different `maxUses`/`villagerExperience`/`priceMultiplier` calls on the returned trade builder.
