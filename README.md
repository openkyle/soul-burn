# Soul Burn for Foundry VTT

A player-facing Foundry VTT macro for the **Soul Burn** homebrew system. It
manages the character-sheet resource, Hit Dice, Burnout risk, movement, actions,
AetherGlow tolerance, token transformation, and chat output in one interface.

The macro is designed for both workflows:

- A player runs it from their hotbar or character sheet.
- A GM selects a player-owned token and runs the same macro for that character.

## Soul Burn rules

Soul Burn is a Bonus Action reservoir granted through interaction with Aether.
Entering Soul Burn requires at least one available Hit Die. The chosen die is
rolled to determine the Soul Burn increase and round duration, but it is not
expended. Hit Dice are expended afterward by AetherSurge.

While Soul Burn is active, the character receives:

- Double movement.
- One free Soul Burn action each turn.
- Access to AetherSurge, Channel Aether, and Fate Shift.
- A collapsible **Soul Burn** Item section containing the three attacks and an
  Exit Soul Burn Item above Weapons on Tidy5e's Inventory tab while transformed.

### Maximum and Burnout

Maximum Soul Burn is the sum of the maximum results of all class Hit Dice.

For example, a level 10 Barbarian has ten d12 Hit Dice and a maximum Soul Burn
of 120.

The macro treats the character sheet's **tertiary resource maximum** as
authoritative when it is configured. If it is blank or zero, the macro
calculates and fills it from the character's classes.

If current Soul Burn exceeds that maximum, Burnout is marked as pending. The
soul is destroyed at the end of the current burn period. For safety, the macro
announces this result but never deletes the Actor. The final chat card is titled
with the character's name and selects one of ten character-specific Burnout
finales at random.

### AetherSurge

After an attack hits, spend and roll one available class Hit Die. Apply the
result to either:

- The attack roll; or
- The damage roll as Radiant damage.

Using the temporary Item makes its ordinary dnd5e roll and expends the largest
available class Hit Die. The player applies the result to either the attack or
damage roll described by the feature.

### Channel Aether

Channel Aether has a number of uses equal to the character's proficiency bonus.
Spend one use to make a radiant attack against a visible enemy. On a hit,
damage equals one Hit Die plus the character's total level. This does not
consume a Hit Die. All uses return on a short or long rest.

The temporary Item uses the character's normal spellcasting attack and rolls:

```text
Attack: 1d20 + spellcasting ability modifier + proficiency
Damage: largest class Hit Die + total character level
```

The native dnd5e Item tracks its own proficiency-based uses. Soul Burn does not
store a separate Channel-used flag and provides no reset control.

### Temporary Soul Burn Item section

When a character enters Soul Burn, the module copies AetherSurge, Channel
Aether, and Fate Shift from **Soul Burn Features** onto that Actor as managed
temporary Items. It also creates a managed **Exit Soul Burn** Item from the
permanent Soul Burn feature. Tidy5e Sheet shows all four as regular usable rows
in a collapsible **Soul Burn** section above Weapons on the Inventory tab.

The Item name and dice icon both perform the same native dnd5e Item use. The
information icon opens the locked Item sheet for details. Native Item use
handles attack rolls, Channel Aether charges, and other system consumption;
module hooks handle AetherSurge's Hit Die and the Fate Shift/Exit ending
workflows.

Channel Aether uses dnd5e's native attack and damage workflow. It has a number
of uses equal to the actor's proficiency bonus and refreshes on a short or long
rest; the module does not add a second chat-card button or ability-selection
dialog. AetherSurge expends one real class Hit Die after each successful native
Item use, and its Inventory row shows the actor's remaining and maximum Hit
Dice.

Clicking an Item name expands an inline Tidy-style detail panel with its
requirements, range, and description. Only the dice icon uses the Item. The
information icon opens the complete locked Item sheet.

The four managed copies are hidden from duplicate Actions and Features
listings. When Soul Burn ends—through Exit Soul Burn, combat expiry, or Fate
Shift when its optional auto-end setting is enabled—the module deletes only
those managed copies and the Inventory section disappears. The permanent Soul
Burn feature remains in Features.

The owned **Soul Burn** feature is locked against player editing and deletion;
GMs can still edit it. While active, its sheet name and chat-card control become
**Exit Soul Burn**. Both return to **Soul Burn** / **Enter Soul Burn** when the
transformation ends.

**Exit Soul Burn** immediately resolves the normal end workflow, including
Burnout and any configured Constitution check. If the character exits during
the same combat in which the burn began, each wholly unused future round in
the duration removes 1 point from the character's Soul Burn resource. The
current round is already in use and is not counted. The reduction is clamped
at zero. Ending Soul Burn outside combat—or after its tracked combat is no
longer active—does not reduce the resource.

When Soul Burn ends, the exact pre-transformation token image recorded at
activation is restored. Restoration resolves the recorded TokenDocument UUID,
so it also works if the GM is viewing another scene when the burn ends.

### Fate Shift

Fate Shift is used as a normal dnd5e Item. Its description provides the
rule-bending terms. Using it opens a real-time countdown and progress bar. The
GM controls the countdown length and message under the Mechanics settings;
`{seconds}` is replaced with the live remaining time. **Automatically End Soul
Burn on Fate Shift** is disabled by default. When enabled, the normal ending
animation and workflow begin only after the full countdown completes. When
disabled, Fate Shift leaves Soul Burn active.

### AetherGlow and AGT

The administering character rolls:

```text
max(1, 1d20 - AGT)
```

AGT cannot exceed 19, and the final result cannot be less than 1. AetherGlow
therefore always restores at least 1 HP and provides at least 1 point of Soul
Burn recovery. Actual Soul Burn cleared cannot exceed the recipient's current
Soul Burn. The chat card shows the clamped formula, result, actual Soul Burn
cleared, resource values, and AGT change. There is no “AetherGlow Blocked”
value.

The optional High-Stakes setting **AetherGlow Reduces Soul Burn Die** is
disabled by default. When enabled, each AetherGlow exposure received by a
Soul Burn character lowers their future Uses-based activation progression by
one die, to a minimum of one. This is stored independently from Lifetime Uses:
AetherGlow never restores or removes a Use, and each later Soul Burn activation
still increases Uses normally. For example, after three activations the next
roll would normally be four dice; one reduction step makes it three dice.

## Compatibility and requirements

- Primary baseline: **Foundry VTT 11 Stable, build 315**
- Primary baseline: **dnd5e 2.4.1**
- Forward-compatible manifest and guarded APIs for Foundry VTT 12 and 13
- An Actor with dnd5e class items and Hit Dice
- The Actor's third resource configured as **Soul Burn**

Three audio effects are bundled with the module:

- `AetherUp3.ogg` plays when Soul Burn activates.
- `AetherGlow.ogg` plays when AetherGlow is consumed.
- `RagePowerDown.ogg` plays when Soul Burn ends and the token transforms back.

The GM can change any sound under **Configure Settings → Module Settings →
Soul Burn Settings**. The settings panel includes Browse, Preview, and Restore
Bundled Sound controls. It also configures the synchronized battlefield
ripple's contrast increase, desaturation, and real-time recovery duration. The
Visuals tab also provides a **Delay** in seconds after the completed power-up;
its default is 0. The panel is organized into **Sounds**, **Visuals**, and
**Mechanics** tabs.

Mechanics can require a Constitution check when Soul Burn ends. The optional
**Apply Exhaustion on Failed Check** setting automatically enables that check
and adds one dnd5e exhaustion level after a failure, to a maximum of 6.

The mechanics work without animation modules. These optional modules preserve
the supplied transformation:

- [Sequencer](https://foundryvtt.com/packages/sequencer)
- JB2A Patreon, using the Sacred Flame asset path in the macro
- TokenMagic FX

Transformed token images currently use campaign-specific Forge asset URLs.
Configure the constant at the top of
[`scripts/soul-burn.js`](./scripts/soul-burn.js) if those assets move.

## Installation

1. Open Foundry's **Add-on Modules** tab.
2. Click **Install Module**.
3. Paste the manifest URL from the latest GitHub release.
4. Enable **Soul Burn** in the world and reload once.
5. The module creates a player-visible **Soul Burn** world macro as an optional
   hotbar launcher.
6. Ensure each player owns their Actor and has that Actor assigned as their
   user character.
7. On the character sheet, set the tertiary resource label to `Soul Burn`.
   Set its current value to `0` and its maximum to the intended maximum.

## Compendiums

The module includes one compendium pack:

- **Soul Burn Features** contains Soul Burn, AetherSurge, Channel Aether,
  Fate Shift, and the Holy Amulet of Lux Eterna. Drag these onto a player
  character sheet.
  Each feature includes a button that runs its module-managed action for the
  owning Actor.

In Foundry V11, open the **Compendium Packs** sidebar, expand the **Soul Burn**
package section, and open **Soul Burn Features**. The GM can drag features
directly onto character sheets.

No journal named `H4H` or `SoulBurn` is required. Persistent per-character
metadata is stored in:

```text
flags.world.soulBurn
```

The Soul Burn total itself remains visible and editable on the sheet at:

```text
system.resources.tertiary.value
system.resources.tertiary.max
system.resources.tertiary.label
```

Dropping the Soul Burn feature onto a character automatically labels the
tertiary resource `Soul Burn` and calculates its maximum when blank. Characters
who already had the feature are repaired the next time a GM loads the world.
Clicking the feature opens the Luminara dashboard directly and does not post an
initial dnd5e Item card. Cancelling leaves chat unchanged. Completing activation
posts one button-free Soul Burn result card with the Hit Die roll, duration,
movement, Soul Burn total, and combat-round details.

The interaction is stopped at Tidy5e's cancellable pre-use hook before
`Item#use` executes. dnd5e display and message-creation hooks remain as
fallbacks. Actor state uses `flags.world.soulBurn`; module Item metadata uses
`flags.soul-burn`, and these namespaces are intentionally separate.

### Holy Amulet of Lux Eterna

The compendium's Legendary **Holy Amulet of Lux Eterna** equipment is the only
AetherGlow trigger; there is no separate AetherGlow macro. It is a 1 lb.
trinket worth 230 gp with six limited charges. Its chat-card button asks which
player character or active-scene NPC receives the AetherGlow. Vehicles are
excluded.

- The administrator makes the `1d20` roll; the recipient does not roll.
- Every recipient heals from that administration roll.
- A recipient with `Soul Burn` as the tertiary resource also releases Soul
  Burn using that roll after AGT.
- A recipient without that resource is still healed, and their unrelated
  tertiary resource is never renamed or changed.
- The amulet removes charmed, poisoned, petrified, temporary ability-score
  reductions, and temporary maximum-HP reductions.
- Every exposure raises AGT by 1, to a maximum of 19.
- When the optional High-Stakes AetherGlow reduction setting is enabled, every
  qualifying exposure also lowers the recipient's future activation
  progression by one die without changing Lifetime Uses.
- If a player gives it to an Actor they do not own, an active GM securely
  performs the document update.
- Direct activation spends a charge. A normal dnd5e item use spends its charge
  when it posts the card, and that chat-card button is locked after resolution.
- The actionable AetherGlow chat-card button is generated from module Item
  flags, not stored in editable rich-text descriptions. Its description may
  therefore be edited without turning that control into text or removing its
  behavior.

### GM player management

Under **Configure Settings → Module Settings → Soul Burn Players**, the GM can
review and edit player Soul Burn, lifetime uses, and AGT. Active entries also
show their individually tracked combat rounds. The screen includes per-player
and party-wide AGT resets. Each row also includes a character-specific
transformation-image editor. It automatically displays the current token or
prototype-token image and provides a Foundry browser for the Soul Burn image.

The per-character **Clear AGT** control resets AGT and blanks the tertiary Soul
Burn resource for an inactive character. It preserves lifetime Uses and the
configured transformation image. Starting Soul Burn again restores the resource
only after the player confirms activation.

Saving an inactive character at **0 Soul Burn** also removes that tertiary
resource from their sheet. **Save Changes** closes Player Management after the
update. If either clear path is used during an active burn, the module first
runs the complete normal ending workflow—including Burnout resolution, visual
and movement restoration, end sound, chat output, and the configured
Constitution check—then removes the resource.

### Combat duration and ending

When Soul Burn activates during a started Combat encounter, the module stores
the Combat ID, activation round, and that character's rolled duration. A
duration of `N` rounds that begins in round `R` remains active through round
`R + N - 1`; the primary active GM client restores the transformation when
round `R + N` begins.

At activation, the module reads the character's current walk, fly, swim, climb,
and burrow speeds. Every nonzero speed is doubled through a managed
multiplicative Active Effect, so the doubled values appear on the character
sheet. The Actor's underlying values are not permanently overwritten. Removing
the effect restores the current base speeds automatically, and both activation
and ending cards report the movement values.

The activation card logs the starting and expiry rounds. Automatic expiry:

- Removes the managed movement effect and TokenMagic fire.
- Restores the original token image.
- Plays the configured ending sound.
- Posts a transformation-ending chat card.
- Resolves pending Burnout messaging.
- Optionally rolls a Constitution ability check against the GM-configured DC.
- Optionally applies one exhaustion level when that check fails.

Configure the ending sound and optional Constitution check under **Configure
Settings → Module Settings → Soul Burn Settings**. The ending-sound field uses
Foundry's audio browser and includes Preview and Restore Bundled Sound buttons.

That screen also includes optional **High Stakes Mode**. When enabled, the
first lifetime Soul Burn use rolls `1` chosen Hit Die, the second rolls `2`,
the third rolls `3`, and so on. The summed result increases Soul Burn, while
only the first die determines the combat duration. Entry still requires an
available Hit Die without expending it. The dashboard and confirmation show
the multi-die formula and its exact Burnout odds.

The dependent **AetherGlow Reduces Soul Burn Die** setting creates a persistent
push-and-pull against that progression. Its effective formula is:

```text
next dice = max(1, Lifetime Uses + 1 - AetherGlow reduction steps)
```

The reduction counter is separate from Lifetime Uses. Consuming AetherGlow
does not alter Uses; later Soul Burn activations still increment Uses normally.

Ending Soul Burn early refunds 1 Soul Burn point for each wholly unused future
combat round. The current, partially used round is not refunded.

## Interface

The primary dialog intentionally follows the original campaign interface:

- Character name and Hit Die
- `Soul Burn: current / maximum`
- Use count and live Burnout odds
- A gold progress meter that fills left-to-right as Soul Burn approaches its
  maximum
- **Player Uses** for the campaign roster and AGT
- **More Info** for the complete rules
- **SOUL BURN** with a separate risk-confirmation dialog

When the character is actively Soul Burning, the dialog retains Player Uses
and More Info, then presents one full-width **End Soul Burn** button. The three
combat Items also remain together above Weapons on the Inventory tab.

## Token and Actor resolution

The macro uses this order:

1. One controlled token.
2. The executing user's assigned character.
3. That character's only active token.
4. A token chooser if the character has multiple active tokens.
5. Actor-only operation if the assigned character has no token on the scene.

Non-GM users cannot run the macro against an Actor they do not own.

## Persistent state

Soul Burn metadata is stored on each Actor instead of in a shared journal. This
avoids journal permission failures and character-name parsing bugs.

Stored metadata includes:

- Total lifetime uses
- High-Stakes AetherGlow die-reduction steps
- AGT
- Active/inactive state
- Pending Burnout
- Combat start/end rounds
- Original token image paths for restoration

## Animation behavior

Activation preserves the supplied sequence:

1. Play `AetherUp3.ogg`.
2. Wait 700 ms.
3. Play the yellow JB2A Sacred Flame explosion for 5.4 seconds at 2× scale.
4. Apply the animated white TokenMagic fire filter.
5. Swap the token to the campaign-specific transformed image.
6. Wait for the GM-configured ripple **Delay** after the completed full-color
   transformation. The default is 0 seconds.
7. Send the live grayscale refractive ripple outward from the transformed token
   for all clients viewing the scene. Each client resolves the token through
   its own camera transform so the origin remains correct at different pans and
   zoom levels.
8. Leave the battlefield at the configured contrast and desaturation, then
   fade it back to its original grading over the configured real-time duration.

The ripple uses the original live backdrop-filter implementation. It does not
copy or read back the WebGL canvas. During the ripple and recovery, the
activating token's transparent source image or video is positioned above the
grade and follows the live token and camera. This keeps only the token colored,
without preserving a circular area around it or risking GPU-readback black
artifacts. The full JB2A power-up completes before the ripple delay begins, so
the power-up animation is never desaturated.

The ripple defaults to 10% additional contrast, 100% desaturation, and a
60-second return to normal. Animation calls are guarded. If the canvas,
Sequencer, JB2A, TokenMagic, or a transformed image is unavailable, the
mechanical activation still completes.

Ending Soul Burn removes the managed movement effect, removes the macro's
TokenMagic filter, and restores the original token image.

## Design notes

- Multiclass characters may choose which available class Hit Die to spend.
- The resource update and class Hit Die update are performed on the Actor the
  macro resolved, never on an unrelated initially selected token.
- A managed Active Effect doubles each existing movement type.
- The source text mentions both `+15 ft` and double movement. This implementation
  follows the detailed Soul Burn rule and uses **double movement**.
- Duration is recorded in combat rounds and shown when it has elapsed. Ending
  remains deliberate so the table can resolve the final action and Burnout in
  the correct narrative order.

## Validation

The module JavaScript can be syntax-checked directly:

```bash
node --check scripts/soul-burn.js
```

## License

This repository does not grant redistribution rights to JB2A, TokenMagic, sound,
token art, or other third-party/campaign assets. Those assets are referenced but
not included.
