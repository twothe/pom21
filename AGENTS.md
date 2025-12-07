# AGENTS.md

## Overview
- Primary language is English; ensure every instruction from the system/User prompt is enforced.
- Before modifying gameplay logic, inspect existing KubeJS scripts/configs to avoid regressions.
- Prefer simple, declarative solutions; avoid external dependencies beyond the modpack tooling (KubeJS, data packs, etc.).

## Coding Conventions
- Use tabs for indentation within code/scripts to honor the global prompt requirement.
- Favor small, pure helper functions and validate all inputs explicitly; surface descriptive errors rather than silently correcting data.
- Document any new classes/modules/scripts with concise intent-focused doc comments.

## Documentation
- Maintain out-of-code documentation inside `docs/`; update or create files whenever global behavior changes.

## Workflow Notes
- Update this file whenever new project-specific constraints or discoveries emerge.
- When iterating recipe data via `ServerEvents.recipes`, convert `recipe.json` through `JsonIO.toString` + `JSON.parse` (or similar) before inspecting fields; the direct `RecipeJS.json` object is not a standard JS object and causes ingredient arrays to be missed.
- Create's built-in crushing data for Asurine/Veridium/Crimsite/Ochrum lives under `mods/create-*/data/create/recipe/crushing/*.json`; only these four stones expose ore results in 6.0.8, so milling equivalents must be defined explicitly.
- When targeting Create stone variants, prefer the `create:stone_types/<stone>` item tags so slabs/stairs/walls share the same processing behavior.
- When emitting custom Create recipes (milling, crushing, etc.) via KubeJS, build the JSON explicitly with `event.custom({ type: "create:milling", ingredients: [...], results: [...], processing_time: N })`; the chained helper like `event.recipes.create.milling(...)` is unavailable on NeoForge 2101.7.x and will throw constructor/`processingTime` errors.
- Keep Rhino happy by avoiding `const`-scoped loops when repeatedly using the same identifier (e.g., `scaledResults`); prefer helper functions with `let` loops to prevent "redeclaration" exceptions.
- Gateways to Eternity datapack entries belong under `data/<namespace>/gateways/...`; define them as datapack JSON (e.g., `kubejs/data/kubejs/gateways/gateways/<id>.json`) and ensure reward objects reproduce mandatory fields like `desc` for loot-table rewards before pairing the matching `gateways:gate_recipe` payload with `ServerEvents.recipes`.
