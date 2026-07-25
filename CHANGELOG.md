# Changelog

## 1.0.3

- Replaced the Soul Burn, AetherStrike, Channel Aether, and Fate Shift icons
  with the supplied campaign art.
- Consolidated all player content into the **Soul Burn Features** Item
  compendium and removed the redundant Macro compendium.
- Converted Aetherglow into a usable consumable Item with recipient selection.
- Added GM-mediated Aetherglow resolution when a player gives it to another
  player's Actor.
- Aetherglow now releases Soul Burn for configured Actors or heals `1d20` HP
  without touching unrelated tertiary resources.
- Added a GM player-management settings screen for Soul Burn, uses, AG
  Tolerance, Channel Aether, and active/Burnout status.
- Dropping the Soul Burn feature now configures the Actor's tertiary resource,
  and existing feature holders are repaired on the next GM world load.
- Hardened chat-card action buttons for Foundry V11/dnd5e 2.4.1.

## 1.0.2

- Added the **Soul Burn Features** compendium with Soul Burn, AetherStrike,
  Channel Aether, Fate Shift, and Aetherglow character features.
- Added the **Soul Burn Macros** compendium with the launcher macro.
- Added functional feature-sheet buttons that call the owning Actor's module
  workflow.

## 1.0.1

- Bundled `AetherUp3.ogg` as the Soul Burn activation sound.
- Bundled `AetherGlow.ogg` as the Aetherglow drinking sound.
- Added a GM-only Foundry settings panel with Browse, Preview, and Restore
  Default controls for both sounds.

## 1.0.0

- Packaged Soul Burn as an installable Foundry module.
- Added Foundry 11 build 315 / dnd5e 2.4.1 as the primary baseline.
- Added guarded forward compatibility for Foundry 12 and 13.
- Added a managed world macro and character-sheet header control.
- Made the character sheet's tertiary resource authoritative.
- Added player/GM Actor and token resolution.
- Added multiclass-aware Hit Die consumption.
- Added Burnout odds and pending Burnout tracking.
- Added AetherStrike, Channel Aether, Fate Shift, and Aetherglow workflows.
- Added managed double-movement Active Effect.
- Preserved the supplied Sequencer, JB2A, TokenMagic, and token-swap animation.
- Added safe animation fallbacks and token-image restoration.
- Recreated the original Player Uses, More Info, confirmation, and chat-card UI.
