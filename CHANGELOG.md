# Changelog

## 1.0.24

- Moved the battlefield grayscale ripple until after the full-color Sacred
  Flame power-up explosion and token transformation complete.
- Removed the feathered color-preservation aura and its continuously redrawn
  canvas, eliminating colored battlefield space and intermittent dark-circle
  artifacts around the token.
- Replaced the live backdrop-filter wave with a clipped grayscale snapshot for
  a stable outward ripple.
- During recovery, only the transformed token image is composited in color;
  its own transparency determines the exact preserved area.
- Clearing Soul Burn from Player Management now ends any active burn through
  the normal resolution path first. Burnout, restoration, the end sound, chat
  output, and configured Constitution check all resolve before the tertiary
  resource is removed.
- Saving an active character at 0 Soul Burn uses the same end-and-clear path.

## 1.0.23

- Standardized the product name as **AetherGlow** in all player-facing
  interfaces, chat messages, compendium text, settings, and documentation.

## 1.0.22

- Clarified the Give AetherGlow dialog: AetherGlow always restores HP, also
  reduces Soul Burn when present, and AG Tolerance reduces both effects.

## 1.0.21

- Fixed the root cause of the persistent chat-card-first flow: Actor state is
  stored under `flags.world.soulBurn`, while Item action metadata is stored
  under `flags.soul-burn`. Previous interception code incorrectly queried Item
  actions through the Actor-state namespace.
- Separated the module and state flag namespaces throughout the implementation.
- Added the supplied Tidy5e build's cancellable
  `tidy5e-sheet.actorPreUseItem` hook as the primary character-sheet entry
  point. Tidy is now stopped before it can call `Item#use`.
- Retained dnd5e use/display and message-creation guards as secondary defenses.
- Preserves compatibility with temporary action Items and Active Effects
  created by earlier versions under the legacy `world` namespace.
- Added a character-specific transformation-image editor to Soul Burn Player
  Management. It shows the detected default token image and provides a Foundry
  image/video browser for the transformed token.
- Replaced the per-row AGT reset with **Clear AGT**, which also blanks that
  inactive character's tertiary Soul Burn resource while preserving lifetime
  Uses and their transformation-image choice.
- Saving an inactive character with 0 Soul Burn now blanks the tertiary
  resource label, value, and maximum instead of leaving an empty Soul Burn
  tracker on the character sheet.
- **Save Changes** now closes Soul Burn Player Management after the update.
  Active Soul Burn sessions are protected from accidental resource removal.

## 1.0.20

- Keeps the activating character, TokenMagic fire, and nearby Soul Burn
  animation vivid while the surrounding battlefield is desaturated.
- Adds a feathered full-color aura that follows the activating token throughout
  the configured recovery period.
- Limits the live color-preservation redraw to the aura region at 30 FPS to
  avoid unnecessary full-canvas work.

## 1.0.19

- Added a synchronized battlefield-wide Soul Burn ripple originating from the
  activating token for every connected client viewing that scene.
- The expanding refractive wave leaves the battlefield more contrasty and
  desaturated, then smoothly restores the original canvas grading in real
  time.
- Added GM settings for contrast increase, desaturation, and recovery seconds.
  Defaults are 10%, 100%, and 60 seconds.
- Uses a canvas DOM effect rather than a version-specific PIXI shader, keeping
  the visual compatible across the supported Foundry versions.

## 1.0.18

- Intercepts Soul Burn launches at the character-sheet click itself, before
  Tidy or dnd5e can create the deprecated feature chat card.
- Retains the dnd5e Item-use and display-card guards and adds a final
  pre-creation guard for integrations that create Item cards directly.
- Successful activation remains the only point where a Soul Burn roll card is
  posted to chat.
- Removed the redundant “This feature requires an available Hit Die” footer
  from new and existing owned Soul Burn features.
- Added a gold, left-to-right Soul Burn accumulation meter beneath the
  Soul Burn/Uses/Burnout Odds line in the dashboard.

## 1.0.17

- Replaced the separate Soul Burn character-sheet tab with a Tidy-native,
  collapsible **Soul Burn** section injected above Weapons on the Inventory
  tab.
- Displays AetherSurge, Channel Aether, and Fate Shift as ordinary owned dnd5e
  Items with their normal use and chat-card workflows.
- Removed the custom Channel Aether ability chooser and Fate Shift declaration
  text box from the active Item workflow.
- Added a far-right **Exit Soul Burn** control to the Inventory section.
- Early exit now removes 1 Soul Burn point per wholly unused future combat
  round.
- In High Stakes Mode, the full multi-die total increases Soul Burn while the
  first die alone determines the active duration.
- AetherSurge's normal Item use now expends the character's largest available
  Hit Die on dnd5e 2.4.1 and newer supported versions.

## 1.0.16

- Intercepts Tidy's direct `Item#displayCard` path on dnd5e 2.4.1 as well as
  the ordinary Item-use path.
- Supports the cancellable `preDisplayCardV2` path used by newer dnd5e
  releases.
- Clicking Soul Burn now suppresses the initial dnd5e chat card and opens the
  Luminara dashboard first. Chat remains unchanged if activation is cancelled;
  successful activation posts only the button-free roll result.

## 1.0.15

- Refreshes every open Actor sheet application after Soul Burn state changes,
  including sheets moved into a separate browser window by PopOut!.
- Keeps the same application open while Tidy rebuilds the conditional Soul
  Burn tab; the player does not need to close and reopen their sheet.

## 1.0.14

- Clicking the owned Soul Burn feature now opens the module dashboard directly
  without first posting the ordinary dnd5e Item chat card.
- Successful activation posts one button-free Soul Burn result card containing
  the Hit Die roll, duration, Soul Burn total, movement, and combat-round
  tracking.
- Added ten randomized Burnout finale narratives. Burnout cards now use the
  character's name in both the title and narrative instead of the generic
  exceeded-maximum message.
- Added compatibility with the supplied Foundry 11 Tidy5e fork by preserving
  each character's selected tab order and adding the native Soul Burn tab
  immediately after Actions.

## 1.0.13

- Replaced the Give AetherGlow help text with the campaign wording supplied by
  the GM.

## 1.0.12

- Rewrote the Give AetherGlow recipient note into a shorter, clearer
  explanation of recipient ordering, the minimum-1 AGT roll, Soul Burn
  recovery, healing, and exposure.

## 1.0.11

- Added a **Scene NPCs** group beneath **Player Characters** in the Give
  AetherGlow recipient dropdown.
- Includes each NPC Actor represented by a token on the active scene, supports
  linked and unlinked tokens, deduplicates shared linked Actors, and continues
  to exclude vehicles.
- Changed all user-facing legacy tolerance labels to **AGT** without changing or
  resetting the existing stored tolerance values.
- Added optional GM-controlled **High Stakes Mode**. The first lifetime Soul
  Burn use rolls one chosen Hit Die, the second rolls two, the third rolls
  three, and so on; the total determines both Soul Burn gained and rounds.
- Added exact multi-die Burnout probability calculations to the dashboard and
  activation confirmation.
- Clarified and enforced that the AetherGlow administrator makes the `1d20`
  roll; the recipient receives its effects but is not the roll's chat speaker.
- Changed AetherGlow administration to roll `max(1, 1d20 - AGT)`.
- AGT remains capped at 19, while AetherGlow always restores at least 1 HP and
  provides at least 1 point of Soul Burn recovery.
- Removed the misleading AetherGlow Blocked field. Chat now reports the
  recovery result and the amount of existing Soul Burn actually cleared.

## 1.0.10

- Added an upgrade cleanup for the stale, unopenable `AetherSurgeFeat`
  compendium index record introduced by v1.0.8.
- Soul Burn Features now displays only the canonical, clickable AetherSurge
  entry after updating and reloading, including on installations whose
  compendium index retained the obsolete record.
- Simplified the active Luminara dashboard to Player Uses, More Info, and one
  centered full-width **End Soul Burn** button; combat actions remain in the
  dedicated Soul Burn sheet tab.
- Reduced More Info rules-dialog typography and spacing.

## 1.0.9

- Reuses existing owned AetherSurge, Channel Aether, and Fate Shift Items while
  Soul Burn is active instead of creating duplicate managed copies.
- Automatically removes a managed temporary duplicate when a permanent action
  Item already exists.
- Migrates legacy owned AetherStrike Items to AetherSurge, including their
  action flag, icon, description button, and displayed name.
- Preserves AetherSurge's original compendium document ID so module upgrades
  replace AetherStrike instead of leaving a second stale compendium entry.
- Isolates both reused and temporary Soul Burn actions in the dedicated Tidy
  tab while active; only module-created temporary Items are deleted on exit.

## 1.0.8

- Renamed AetherStrike to **AetherSurge** throughout the module, compendium,
  chat cards, rules, action tab, icons, and documentation.
- Added automatic cleanup of legacy managed AetherStrike action copies.
- Locked the owned Soul Burn feature against player edits and deletion while
  preserving its usable chat-card workflow; GMs retain full control.
- While the transformation is active, the owned feature is renamed **Exit Soul
  Burn** and its chat-card button ends Soul Burn.
- When the transformation ends, the feature returns to **Soul Burn** and its
  button returns to Enter Soul Burn.
- Enter Soul Burn now opens the original Luminara dashboard with Player Uses,
  More Info, status, Burnout odds, and the final activation control instead of
  skipping directly to Hit Die confirmation.
- Entering Soul Burn now requires and rolls an available Hit Die without
  expending it; AetherSurge remains the action that consumes Hit Dice.

## 1.0.7

- Added a dedicated **Soul Burn** top tab to Tidy5e character sheets.
- Entering Soul Burn copies managed temporary versions of AetherSurge,
  Channel Aether, and Fate Shift from the module compendium to the character.
- The dedicated tab presents the three actions with their supplied artwork,
  activation details, clickable workflows, and Channel Aether's live charges.
- Managed Soul Burn actions are hidden from ordinary Tidy Actions, Inventory,
  and Features areas so they appear only in the dedicated tab.
- Ending Soul Burn removes only the module-managed temporary action copies and
  removes the tab from the sheet.
- World startup repairs missing actions for active characters and clears stale
  managed copies from inactive characters.

## 1.0.6

- Removed all Channel Aether flags, GM tracking, checkboxes, and reset controls.
- Channel Aether now has exactly two Item charges; the dnd5e Item is the only
  source of truth for its remaining uses.
- Added direct-use charge spending and single-resolution locking for Channel
  Aether chat cards.
- Confirmed that only character Actors appear in Player Uses and GM player
  management; vehicles and NPCs are excluded.
- Simplified persistent Soul Burn bookkeeping to lifetime Uses and AGT
  plus active transformation/combat state.

## 1.0.5

- Added per-character combat tracking for Soul Burn duration.
- Activation records the Combat encounter, starting round, rolled duration, and
  automatic expiry round in Actor state and chat.
- Added GM-authoritative automatic transformation restoration when each
  character's individual expiry round begins.
- Added a transformation-ending chat card and configurable ending sound.
- Bundled `RagePowerDown.ogg` as the default transformation-ending sound.
- Added an optional end-of-burn Constitution ability check with a GM-defined
  DC from 1–30.
- Expanded **Soul Burn Settings** with Browse, Preview, and Clear controls for
  the ending sound.
- Added tracked combat rounds to the GM player-management screen.
- Added explicit movement snapshots and chat reporting for walk, fly, swim,
  climb, and burrow speeds; all nonzero speeds double while active and restore
  when the managed effect ends.

## 1.0.4

- Replaced AetherGlow Charge with the Legendary equipment item **Holy Amulet
  of Lux Eterna**, using the supplied amulet art.
- Configured the amulet as a trinket with 6 limited charges, one-action use,
  healing action type, 1 lb. weight, and 230 gp value.
- One `1d20` roll now heals every recipient and also releases Soul Burn for
  configured recipients after applying AGT.
- Added removal of charmed, poisoned, petrified, temporary ability-score
  reductions, and temporary maximum-HP reductions.
- Added direct-use charge spending and one-use locking for AetherGlow chat
  cards.
- Removed the Soul Burn character-sheet header control. Soul Burn now enters
  through the feature's chat-card button.

## 1.0.3

- Replaced the Soul Burn, AetherSurge, Channel Aether, and Fate Shift icons
  with the supplied campaign art.
- Consolidated all player content into the **Soul Burn Features** Item
  compendium and removed the redundant Macro compendium.
- Converted AetherGlow into a usable consumable Item with recipient selection.
- Added GM-mediated AetherGlow resolution when a player gives it to another
  player's Actor.
- AetherGlow now releases Soul Burn for configured Actors or heals `1d20` HP
  without touching unrelated tertiary resources.
- Added a GM player-management settings screen for Soul Burn, uses, AGT, and
  active/Burnout status.
- Dropping the Soul Burn feature now configures the Actor's tertiary resource,
  and existing feature holders are repaired on the next GM world load.
- Hardened chat-card action buttons for Foundry V11/dnd5e 2.4.1.

## 1.0.2

- Added the **Soul Burn Features** compendium with Soul Burn, AetherSurge,
  Channel Aether, Fate Shift, and AetherGlow character features.
- Added the **Soul Burn Macros** compendium with the launcher macro.
- Added functional feature-sheet buttons that call the owning Actor's module
  workflow.

## 1.0.1

- Bundled `AetherUp3.ogg` as the Soul Burn activation sound.
- Bundled `AetherGlow.ogg` as the AetherGlow drinking sound.
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
- Added AetherSurge, Channel Aether, Fate Shift, and AetherGlow workflows.
- Added managed double-movement Active Effect.
- Preserved the supplied Sequencer, JB2A, TokenMagic, and token-swap animation.
- Added safe animation fallbacks and token-image restoration.
- Recreated the original Player Uses, More Info, confirmation, and chat-card UI.
