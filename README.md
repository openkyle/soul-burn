# Soul Burn for Foundry VTT

A player-facing Foundry VTT macro for the **Soul Burn** homebrew system. It
manages the character-sheet resource, Hit Dice, Burnout risk, movement, actions,
Aetherglow tolerance, token transformation, and chat output in one interface.

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
- A dedicated Tidy5e **Soul Burn** character-sheet tab while transformed.

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

The macro consumes the chosen class's Hit Die, rolls it, prompts for the
application, and posts the result to chat.

### Channel Aether

Channel Aether has two limited charges. Spend one charge to make a radiant
attack against a visible enemy. On a hit,
damage equals one Hit Die plus the character's total level. This does not
consume a Hit Die.

The macro prompts for the attack ability and rolls:

```text
Attack: 1d20 + chosen ability modifier + proficiency
Damage: largest class Hit Die + total character level
```

The dnd5e Item tracks its own two charges. Soul Burn does not store a separate
Channel-used flag and provides no reset control.

### Temporary Soul Burn action tab

When a character enters Soul Burn, the module copies AetherSurge, Channel
Aether, and Fate Shift from **Soul Burn Features** onto that Actor as managed
temporary Items. Tidy5e Sheet shows them together in a dedicated top-level
**Soul Burn** tab with clickable controls and live Channel Aether charges.

The managed copies are hidden from the normal Actions, Inventory, and Features
areas. When Soul Burn ends—manually, through Fate Shift, or through combat
expiry—the module deletes only those managed copies and the tab disappears.
Existing permanent Items with the same names are never deleted.

The owned **Soul Burn** feature is locked against player editing and deletion;
GMs can still edit it. While active, its sheet name and chat-card control become
**Exit Soul Burn**. Both return to **Soul Burn** / **Enter Soul Burn** when the
transformation ends.

### Fate Shift

The player declares a rule bend, break, or modification for GM approval. The
declaration is whispered to every active GM. Fate Shift then ends Soul Burn.

### Aetherglow and AGT

The administering character rolls:

```text
max(1, 1d20 - AGT)
```

AGT cannot exceed 19, and the final result cannot be less than 1. Aetherglow
therefore always restores at least 1 HP and provides at least 1 point of Soul
Burn recovery. Actual Soul Burn cleared cannot exceed the recipient's current
Soul Burn. The chat card shows the clamped formula, result, actual Soul Burn
cleared, resource values, and AGT change. There is no “Aetherglow Blocked”
value.

## Compatibility and requirements

- Primary baseline: **Foundry VTT 11 Stable, build 315**
- Primary baseline: **dnd5e 2.4.1**
- Forward-compatible manifest and guarded APIs for Foundry VTT 12 and 13
- An Actor with dnd5e class items and Hit Dice
- The Actor's third resource configured as **Soul Burn**

Three audio effects are bundled with the module:

- `AetherUp3.ogg` plays when Soul Burn activates.
- `AetherGlow.ogg` plays when Aetherglow is consumed.
- `RagePowerDown.ogg` plays when Soul Burn ends and the token transforms back.

The GM can change any sound under **Configure Settings → Module Settings →
Soul Burn Settings**. The settings panel includes Browse, Preview, and Restore
Bundled Sound controls.

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

### Holy Amulet of Lux Eterna

The compendium's Legendary **Holy Amulet of Lux Eterna** equipment is the only
Aetherglow trigger; there is no separate Aetherglow macro. It is a 1 lb.
trinket worth 230 gp with six limited charges. Its chat-card button asks which
player character or active-scene NPC receives the Aetherglow. Vehicles are
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
- If a player gives it to an Actor they do not own, an active GM securely
  performs the document update.
- Direct activation spends a charge. A normal dnd5e item use spends its charge
  when it posts the card, and that chat-card button is locked after resolution.

### GM player management

Under **Configure Settings → Module Settings → Soul Burn Players**, the GM can
review and edit player Soul Burn, lifetime uses, and AGT. Active entries also
show their individually tracked combat rounds. The screen includes per-player
and party-wide AGT resets.

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

Configure the ending sound and optional Constitution check under **Configure
Settings → Module Settings → Soul Burn Settings**. The ending-sound field uses
Foundry's audio browser and includes Preview and Restore Bundled Sound buttons.

That screen also includes optional **High Stakes Mode**. When enabled, the
first lifetime Soul Burn use rolls `1` chosen Hit Die, the second rolls `2`,
the third rolls `3`, and so on. The summed result increases Soul Burn and sets
the combat duration. Entry still requires an available Hit Die without
expending it. The dashboard and confirmation show the multi-die formula and
its exact Burnout odds.

## Interface

The primary dialog intentionally follows the original campaign interface:

- Character name and Hit Die
- `Soul Burn: current / maximum`
- Use count and live Burnout odds
- **Player Uses** for the campaign roster and AGT
- **More Info** for the complete rules
- **SOUL BURN** with a separate risk-confirmation dialog

When the character is actively Soul Burning, the dialog retains Player Uses
and More Info, then presents one full-width **End Soul Burn** button. The three
combat actions remain together in the dedicated Soul Burn sheet tab.

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
- AGT
- Active/inactive state
- Pending Burnout
- Combat start/end rounds
- Original token image paths for restoration

## Animation behavior

Activation preserves the supplied sequence:

1. Play `AetherUp3.ogg`.
2. Wait 700 ms.
3. Play the yellow JB2A Sacred Flame effect for 5.4 seconds at 2× scale.
4. Apply the animated white TokenMagic fire filter.
5. Swap the token to the campaign-specific transformed image.

Animation calls are guarded. If Sequencer, JB2A, TokenMagic, or a transformed
image is unavailable, the mechanical activation still completes.

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
