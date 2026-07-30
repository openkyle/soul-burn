# Changelog

## 1.0.50

- Soul Burn activation now tracks combat duration only when the current combat
  is actually started, belongs to the active token's scene, and includes that
  token as a combatant. Populated but unstarted encounters no longer inherit
  stale previous-combat round tracking.
- Soul Burn activation now saves state and posts the activation chat card while
  the transformation animation continues instead of waiting for the full visual
  sequence to finish.
- Early-exit ending cards now explicitly report unused combat round Soul Burn
  reduction whenever unused future rounds are available.

## 1.0.49

- Rewrote the GitHub README as a full module guide with a stronger Soul Burn
  pitch, player-facing limit-break framing, move explanations, setup steps,
  GM settings guidance, and an expanded FAQ.
- Updated the manifest description to better communicate Soul Burn as an
  exciting Aether-powered player transformation system.

## 1.0.48

- Replaced Fate Shift's automation reminder text with the Book of Soul Burn
  lore line in generated Items, the compendium Item, and the rules dialog.

## 1.0.47

- Moved **Libra** directly after **Aether Surge** in the active Soul Burn
  inventory order and compendium pack order.
- Simplified Libra's player-facing description and tightened the Soul Burn
  activation chat card wording.

## 1.0.46

- Libra now reads the target's tertiary sheet resource and reports it when it
  is labeled **Nether Index** or **Soul Burn**.

## 1.0.45

- Replaced the bundled Soul Burn and Exit Soul Burn artwork with the new
  ascension icon.
- Added the new bundled Libra icon and applied it to both the compendium Item
  and temporary active-burn Item.

## 1.0.44

- Added **Libra**, a fifth temporary Soul Burn action copied from the module
  compendium while Soul Burn is active.
- Libra requires exactly one targeted, non-vehicle enemy and uses Foundry's
  native 1/1 long-rest Item charge and recovery workflow.
- A successful use posts the target's current HP, Armor Class, damage
  vulnerabilities, condition immunities, and a maximum-range summary derived
  from every legacy or activity-based attack on the target.

## 1.0.43

- Added **Use TokenMagic FX** to the Visuals settings tab. It controls the
  persistent token fire filter and reports whether TokenMagic FX is active.
- Added **Use Sequencer/JB2A Transformation** to the Visuals settings tab. It
  controls the full-color Sacred Flame transformation and reports the status
  of both required animation modules.
- Both integrations remain enabled by default to preserve existing worlds.
  Disabling one skips only that optional visual path; Soul Burn mechanics,
  token transformation, sounds, and the battlefield ripple still run.
- Added support for the JB2A Patreon and free D&D5e module paths.
- Reduced the Soul Burn roll confirmation width and corrected the Rules
  dialog's Foundry options placement so it opens substantially wider with less
  vertical wrapping.

## 1.0.42

- Narrowed the permanent Soul Burn feature's capture-phase launcher to its
  item name, image, and explicit use button.
- Tidy/Foundry bookmark, edit, duplicate, delete, configuration, ownership,
  and other row controls now retain their native click behavior instead of
  opening the Soul Burn dashboard.
- The narrow launcher still runs before Tidy's deprecated chat-card path, so
  using Soul Burn continues to open the dashboard first.

## 1.0.41

- Restored the intended visual separation: the ripple grades the battlefield
  to grayscale while the activating token and its live TokenFX remain visible
  in color through an alpha-shaped cutout.
- Rebuilt the ripple as a fixed full-canvas grade animated with `clip-path`.
  This avoids scaling and rewriting the token mask on every timer frame.
- The cutout is refreshed only when the camera or affected Token moves, with
  identical geometry writes cached and updates coalesced to one animation
  frame.
- No duplicate token image, canvas readback, colored aura, or module-created
  glow is rendered.

## 1.0.40

- Removed the live token alpha-mask tracker from the battlefield ripple. It
  was continuously invalidating Foundry's canvas compositor and could cause
  intermittent token flashing and character-sheet redraw artifacts.
- The effect is now one stable expanding grayscale/contrast layer followed by
  its configured fade back to normal. Existing Sequencer and TokenMagic
  animations continue running on the canvas without module-driven redraws.
- Removed the colored ripple glow and secondary blur ring, leaving a clean,
  neutral grayscale wave.

## 1.0.39

- Moved the compact **AG Die Reduction** line directly beneath **Next Soul
  Burn Roll** in the primary dashboard.

## 1.0.38

- Made the Soul Burn dashboard an actor-scoped singleton. Repeated Foundry,
  dnd5e, or Tidy5e use events now focus the existing window instead of opening
  duplicate instances.

## 1.0.37

- Added the GM option **Fate Shift Uses Confirmation Button**. Disabled keeps
  the original countdown; enabled shows the descriptive prompt and waits for
  the player to press **Fate Shift**.
- Both Fate Shift modes now suppress the native Item use, charge consumption,
  and chat card until their selected gate completes.
- Fate Shift snapshots wholly unused future combat rounds before its native
  Item workflow and supplies that value to automatic ending, ensuring those
  remaining rounds reduce current Soul Burn.
- Simplified the Soul Burn dashboard to **AG Die Reduction: X** and Player Uses
  to **AGDR: X**.
- Slightly widened Soul Burn Rules, Player Uses, and Confirm Soul Burn, and
  removed the die-reduction progression paragraph from the confirmation dialog.
- Added independent 0–100% Power-Up, Ending, and AetherGlow volume settings;
  both preview and shared playback now use their configured levels.
- Moved **Show AGT in Inventory Bar** and **Show Rounds Remaining in Inventory
  Bar** from Mechanics to Visuals.

## 1.0.36

- Replaced the grayscale effect's duplicated DOM token image with a live
  token-alpha cutout in the ripple layer.
- Removed the rectangular image border and synthetic glow that surrounded the
  transformed token while the battlefield grade was active.
- The real canvas token and its TokenMagic animation now show directly through
  the grayscale layer throughout ripple expansion and recovery.
- Fate Shift now suppresses its native Item use and chat card until the
  animated countdown reaches zero. At that point it performs one native use,
  consumes the charge, posts the card, and then applies the optional automatic
  end-of-burn workflow.

## 1.0.35

- Reduced the Soul Burn Inventory attack-name text to `0.72rem` without
  changing the uses, activation, AGT, or rounds text.

## 1.0.34

- Moved the grayscale ripple's built-in cue 3 seconds earlier in the
  5.4-second power-up timeline.
- Changed the GM ripple **Delay** default to 1 second. Delay is now an explicit
  offset from the early cue, with no hidden wait for the animation endpoint.
- The transformed token image is now applied before TokenMagic so the managed
  fire filter attaches to the final token mesh instead of disappearing during
  the texture swap.
- Added a synchronized fire-preservation treatment to the full-color token
  repaint while the battlefield backdrop filter is active. The persistent fire
  no longer appears to vanish until grayscale recovery completes.
- End-of-burn Constitution resolution now posts a one-use saving throw request
  to chat. The owning player invokes their native dnd5e Constitution save from
  that card; the module no longer rolls it automatically.
- Failure and optional exhaustion are resolved only after the player submits
  the requested save. Escalating DC details remain attached to the request and
  result.

## 1.0.33

- Made **Aether Surge** explicitly self-targeting in both the compendium source
  and every managed Actor copy.
- Existing battlefield targets are no longer attached to Aether Surge or
  treated as recipients. The player's target selection remains intact for the
  triggering attack.

## 1.0.32

- Added the optional **Escalating Constitution DC** mechanic. The first
  lifetime Soul Burn use checks against the configured base DC, every later
  use adds 2, and a failed escalating check automatically adds one exhaustion
  level.
- Added separate GM toggles for showing **AGT** and **rounds remaining** in the
  active Soul Burn Inventory heading. Both displays default to enabled.
- The Inventory heading now shows the compact `AGT: X` label with an
  information shortcut to Soul Burn Player Uses.
- Soul Burn action portraits are now the use controls. Hovering or focusing a
  portrait replaces it with the d20 icon; the redundant right-side die button
  was removed.
- Tightened the active Soul Burn Inventory typography and row dimensions.
- Corrected the player-facing action name to **Aether Surge** throughout the
  compendium, owned temporary Items, dialogs, cards, rules, and documentation.

## 1.0.31

- Added the optional GM Mechanics setting **AetherGlow Reduces Soul Burn Die**,
  disabled by default and dependent on High-Stakes Mode.
- Each qualifying AetherGlow exposure now records one persistent reduction
  step against the recipient's future Uses-based activation dice, to a minimum
  of one die. Lifetime Uses are never restored or removed and continue
  increasing normally on later activations.
- When enabled, the progression offset and adjusted next roll appear in the
  AetherGlow result, Soul Burn dashboard, Player Uses dialog, player-management
  status, confirmation, activation result, rules, and AetherGlow card note.
  When disabled, those mechanics and conditional interface additions are inert.
- The Soul Burn Rules window is wider, and every section heading is explicitly
  bold.

## 1.0.30

- Added a GM Visuals setting named **Delay**, measured in seconds, controlling
  the wait between the completed full-color power-up and the battlefield
  ripple. The default is 0 seconds.
- The live ripple now retains its backdrop-filter layer during recovery and
  repaints only the activating token's transparent source media above it. This
  keeps the token colored without a circular color aura or WebGL readback.
- The full JB2A power-up animation completes in color before the configurable
  ripple delay begins.
- Removed Inventory-row hover color changes and slightly reduced Soul Burn
  Item typography.
- Added **Automatically End Soul Burn on Fate Shift**, disabled by default.
  The countdown always completes before an enabled end workflow begins; when
  disabled, Fate Shift does not end Soul Burn.
- Normalized Foundry Token texture objects to their actual source paths in the
  transformation editor, activation capture, overlay, and exit restoration.
  Legacy `[object Object]` values fall back to the Actor's prototype-token
  image.

## 1.0.29

- Channel Aether now has uses equal to the character's proficiency bonus and
  regains all uses on a short or long rest.
- Removed the module-added Channel Aether chat button and ability-selection
  dialog. Channel Aether now uses only dnd5e's native Attack and Damage
  controls.
- AetherSurge continues to expend one real class Hit Die per use. Its active
  Inventory row now displays current and maximum Hit Dice.
- Soul Burn Item names now expand inline Tidy-style details containing their
  requirements, ranges, and descriptions. The dice icon remains the use
  control, while the information icon opens the full locked Item sheet.
- Ending Soul Burn now restores every recorded transformed TokenDocument by
  UUID, including a token no longer on the currently viewed scene.

## 1.0.28

- Updated the managed Exit Soul Burn Item with the complete immediate
  resolution and early-combat-exit rule.
- Codified the early-exit calculation as wholly unused future rounds in the
  same tracked combat. The current round does not count, and no reduction
  occurs outside that combat.
- The calculated reduction is applied directly to the character's Soul Burn
  resource before the ending chat report, clamped so it cannot fall below zero.

## 1.0.27

- Restored the original live backdrop-filter black-and-white ripple.
- Removed the WebGL canvas snapshot, clipped grayscale copy, duplicated
  full-color token media, and all color-preservation aura behavior. GPU
  readback can intermittently produce an opaque black snapshot; the live
  effect does not perform that readback.
- Ripple playback now begins one full second after the Sacred Flame animation,
  TokenMagic effect, and transformed token image have completed.
- Each client resolves the origin from the exact live token ID through its own
  camera transform. Transmitted scene coordinates are only a fallback, avoiding
  offset origins for clients with different pan and zoom states.
- Fixed the small player-only square beneath the permanent Soul Burn feature.
  It was a decorative lock pseudo-element wrapping into a new TidySheet grid
  cell. Player edit/delete enforcement remains active.

## 1.0.26

- Reduced the height, icon size, controls, and typography of the active
  TidySheet Soul Burn Inventory section.
- Clicking a Soul Burn Item name now performs the same native Item use as its
  dice button. Item names no longer have a separate chat-card-only behavior;
  the information icon remains details-only.
- Fate Shift now opens a real-time countdown dialog with a golden progress bar
  before completing the end-of-burn workflow.
- Added GM Mechanics settings for Fate Shift countdown seconds and customizable
  countdown copy. The message supports a live `{seconds}` placeholder.

## 1.0.25

- Soul Burn chat-card controls are now generated from the Item's
  `flags.soul-burn.action` metadata instead of relying on editable description
  HTML. Editing rich text can no longer turn the AetherGlow or Channel Aether
  controls into inert text.
- Legacy description buttons are removed from rendered cards before the
  module-generated control is inserted, preventing duplicates.
- Chat cards now record whether normal dnd5e Item use already spent a limited
  charge. A button on a merely displayed Item card spends the charge itself,
  while a card created through Item use never spends it twice.

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
- Reorganized GM configuration into **Sounds**, **Visuals**, and **Mechanics**
  tabs, with all three audio controls together under Sounds.
- Added **Apply Exhaustion on Failed Check**. Enabling it also enables the
  Constitution end check; a failure adds one dnd5e exhaustion level, capped at
  level 6, and reports the change on the ending chat card.
- Fixed the root cause of the missing Inventory section: the supplied Tidy fork
  exports `TAB_ID_CHARACTER_INVENTORY`, while the old selector requested the
  nonexistent `TAB_CHARACTER_INVENTORY` and therefore targeted an `undefined`
  tab.
- Replaced that registration with the fork's documented
  `tidy5e-sheet.renderActorSheet` injection path, targeting the live Inventory
  items container after its Svelte render.
- The active Inventory section now contains four actual managed dnd5e Items:
  AetherSurge, Channel Aether, Fate Shift, and Exit Soul Burn.
- Exit Soul Burn is cloned from the permanent feature, uses the normal Item
  workflow, and removes all four managed Items and the section after the normal
  ending workflow. The permanent Features entry is never removed.
- Added Item-card, native-use, and locked-details controls to every Soul Burn
  Inventory row so rolls, charges, and resource consumption remain system-led.

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
