# Soul Burn for Foundry VTT

**Soul Burn** is a Foundry VTT module for giving your players a dramatic
limit-break style power: a moment where a character draws on Aether, pushes
past mortal limits, doubles their movement, and gains a temporary suite of
reality-bending actions.

It is designed to feel exciting at the table without becoming bookkeeping
homework for the GM. Players get the fantasy of "I am going beyond myself
right now." The module handles the resource, Hit Dice, movement, temporary
actions, AetherGlow recovery, token transformation, chat cards, Burnout risk,
and cleanup.

Soul Burn works especially well in heroic fantasy, science-fantasy, anime-
inspired campaigns, boss fights, desperate rescues, divine awakenings, and
any table that wants a dangerous player-controlled power spike with real
consequences.

## The Table Fantasy

Soul Burn is not just another feature button. It is a pressure valve.

A player can choose to flare with Aether and become faster, brighter, and more
dangerous for a limited number of rounds. While transformed, they gain access
to special Soul Burn actions such as Aether Surge, Channel Aether, Libra, and
Fate Shift. The longer a character keeps drawing on that power, the more their
Soul Burn resource builds. If it ever exceeds their maximum, Burnout waits at
the end of the transformation.

That gives players a delicious decision:

- Do I spend this power now?
- Do I risk another surge?
- Do I end early to recover a little Soul Burn?
- Do I drink AetherGlow to stabilize myself?
- Do I bend the rules with Fate Shift and trust the GM to adjudicate it?

It is a limit break with teeth.

## What The Module Does

- Opens a custom Soul Burn dashboard from the character sheet or world macro.
- Requires an available Hit Die to enter Soul Burn, but does not spend it on
  entry.
- Rolls the chosen Hit Die to determine duration and Soul Burn gained.
- Doubles all current movement modes, including walk, fly, swim, climb, and
  burrow.
- Adds a temporary **Soul Burn** inventory section above Weapons while active.
- Adds usable temporary Items for Aether Surge, Libra, Channel Aether, Fate
  Shift, and Exit Soul Burn.
- Tracks Soul Burn, lifetime uses, AG Tolerance, AGDR, active combat round,
  pending Burnout, and original token images.
- Restores movement, token image, visual effects, and temporary Items when Soul
  Burn ends.
- Supports AetherGlow as a healing and Soul Burn recovery tool.
- Provides GM settings for sounds, visual ripple, mechanics, Fate Shift flow,
  Constitution save requests, exhaustion, and High Stakes Mode.
- Includes a compendium pack with the Soul Burn Items and Holy Amulet of Lux
  Eterna.

## Compatibility

Primary tested baseline:

- Foundry VTT 11 Stable, build 315
- dnd5e 2.4.1

The manifest is also marked for Foundry VTT 12 and 13, with guarded API usage
where possible.

Recommended modules:

- [Tidy5e Sheet](https://foundryvtt.com/packages/tidy5e-sheet), for the active
  Soul Burn inventory section.
- [Sequencer](https://foundryvtt.com/packages/sequencer), for transformation
  animation playback.
- JB2A Patreon or JB2A D&D5e, for the Sacred Flame style power-up animation.
- TokenMagic FX, for the persistent animated token fire filter.

The mechanics still work without the animation modules. Missing visual
dependencies are reported, but Soul Burn still activates, tracks resources, and
cleans itself up.

## Installation

1. Open Foundry's **Add-on Modules** tab.
2. Click **Install Module**.
3. Paste the latest manifest URL:

```text
https://github.com/openkyle/soul-burn/releases/latest/download/module.json
```

4. Enable **Soul Burn** in your world.
5. Reload Foundry once.
6. Open **Compendium Packs -> Soul Burn -> Soul Burn Features**.
7. Drag **Soul Burn** onto any player character who should have access.

The module also creates a player-visible **Soul Burn** world macro as an
optional hotbar launcher.

## Giving Soul Burn To A Player

Drag the **Soul Burn** feature from the **Soul Burn Features** compendium onto a
character sheet.

When the feature is added, the module prepares the character's tertiary
resource for Soul Burn. The resource is stored at:

```text
system.resources.tertiary.value
system.resources.tertiary.max
system.resources.tertiary.label
```

The label is set to `Soul Burn`, the current value starts at `0`, and the
maximum is calculated from the character's class Hit Dice when blank.

Maximum Soul Burn is the sum of the maximum values of all class Hit Dice. For
example, a level 10 Barbarian with ten d12 Hit Dice has a maximum Soul Burn of
120.

If a player no longer has active Soul Burn and their current Soul Burn is 0, GM
management tools can clear the tertiary resource back to blank.

## Core Play Flow

1. The player clicks **Soul Burn** on their character sheet or macro hotbar.
2. The custom Soul Burn dashboard opens first.
3. The player chooses to activate Soul Burn.
4. The module confirms the roll and Burnout odds.
5. The player rolls the chosen Hit Die.
6. Soul Burn begins.
7. The activation chat card posts the duration, Soul Burn gained, movement
   change, and combat tracking.
8. The character gains the temporary Soul Burn inventory section.
9. The player uses Soul Burn actions directly from the Inventory tab.
10. Soul Burn ends by expiry, Exit Soul Burn, GM management, or optional Fate
    Shift automation.

The initial Soul Burn click is never supposed to create a normal dnd5e chat
card first. The menu is the entry point. The chat card appears only after
activation succeeds.

## Soul Burn While Active

While Soul Burning, a character gains:

- Double movement.
- One free Soul Burn action each turn.
- Temporary access to Aether Surge, Libra, Channel Aether, Fate Shift, and Exit
  Soul Burn.

With Tidy5e Sheet, these appear as regular usable Items in a collapsible **Soul
Burn** section above Weapons on the Inventory tab. The Item images act like the
roll buttons. Item details can be expanded in the same general style as Tidy5e
inventory rows.

When Soul Burn ends, the temporary Items are removed and the section disappears.
The permanent Soul Burn feature remains on the character sheet.

## Soul Burn Moves

### Aether Surge

**Aether Surge** is the direct power spike.

After an attack hits, the player spends and rolls one available class Hit Die.
They add the result to either the attack roll or the damage roll, but not both.
Added damage is Radiant.

The module expends a real class Hit Die when Aether Surge is used. The active
Inventory row shows remaining Hit Dice.

Aether Surge is self-oriented. It does not apply its Item result to a selected
target, and it does not disturb the player's current target selection.

### Libra

**Libra** is the scan.

Read the balance of an enemy's body and defenses. Target one enemy you can see.
Libra reveals its current Hit Points, Armor Class, damage vulnerabilities,
condition immunities, and the ranges of all attacks it possesses.

Libra also reads the target's tertiary resource when it is labeled **Nether
Index** or **Soul Burn**, which is useful for enemies and special tokens that
carry their own hidden Aether state.

Libra can be used once and returns on a long rest.

### Channel Aether

**Channel Aether** is the radiant beam.

The character gathers Aether and makes a radiant attack against a visible enemy.
On a hit, the target takes Radiant damage equal to the character's largest Hit
Die plus total character level. This does not consume a Hit Die.

Channel Aether has uses equal to the character's proficiency bonus and returns
on a short or long rest. It uses Foundry/dnd5e's native Item attack and damage
workflow.

### Fate Shift

**Fate Shift** is the rule-bend.

The player declares an action that bends, breaks, or modifies the normal rules
of the game. The GM approves and adjudicates it. This is not permission to
manifest infinite resources or simply wish an enemy dead.

Scholars have long collected exploits and chronicled it in the Book of Soul
Burn.

The GM can choose whether Fate Shift uses a countdown timer or a player-facing
confirmation button. The native Item use is delayed until the timer resolves or
the button is pressed. Fate Shift only ends Soul Burn automatically if the GM
enables **Automatically End Soul Burn on Fate Shift**.

### Exit Soul Burn

**Exit Soul Burn** ends the current transformation.

Ending resolves the full Soul Burn end workflow: movement restoration, token
restoration, ending sound, visual cleanup, Burnout resolution, and optional
Constitution save request.

If the character exits early during the same combat in which Soul Burn began,
each wholly unused future round reduces current Soul Burn by 1. The current
round is already being used and is not refunded. Outside combat, early ending
does not reduce Soul Burn.

## AetherGlow And AGT

AetherGlow is administered through the **Holy Amulet of Lux Eterna**, included
in the compendium as a Legendary equipment Item with 6 charges.

AetherGlow always restores HP. If the recipient has Soul Burn, it also reduces
Soul Burn. Both effects are reduced by AG Tolerance, and each exposure
increases tolerance by 1 up to a maximum of 19.

The administered roll is:

```text
max(1, 1d20 - AGT)
```

That means AetherGlow always gives at least a spark of life, even when a
character has become highly tolerant.

The AetherGlow workflow:

- The administering character rolls the AetherGlow.
- The recipient heals from the final result.
- If the recipient has Soul Burn, their Soul Burn is reduced by the same final
  result, clamped at their current Soul Burn.
- The recipient's AGT increases by 1, to a maximum of 19.
- Player characters are listed first in the recipient picker.
- Active-scene NPCs are listed beneath players.
- Vehicles are excluded.

## High Stakes Mode

High Stakes Mode turns Soul Burn into a rising temptation.

Normally, each activation rolls one chosen Hit Die. With High Stakes Mode
enabled, the number of dice increases with lifetime Soul Burn uses:

```text
first use: 1 die
second use: 2 dice
third use: 3 dice
fourth use: 4 dice
```

The total roll adds to Soul Burn. The first die alone determines the duration
in rounds.

This makes later activations more explosive and more dangerous. The player may
get a bigger burst, but their soul climbs closer to Burnout.

### AetherGlow Reduces Soul Burn Die

This optional High Stakes setting creates push-and-pull.

When enabled, AetherGlow exposure reduces the character's future High Stakes
Soul Burn die progression by one step. It does not remove lifetime uses. Uses
continue increasing normally.

The effective formula is:

```text
next dice = max(1, Lifetime Uses + 1 - AGDR)
```

The Soul Burn dashboard displays this as **AG Die Reduction**. Player Uses
abbreviates it as **AGDR**.

## Burnout

If current Soul Burn ever exceeds maximum Soul Burn, Burnout becomes pending.
The character's soul is destroyed when the current burn period ends.

The module announces Burnout with a character-specific chat card and one of ten
finale texts. It does not delete the Actor. The table keeps narrative control
over the last farewell, the body collapsing into ash, and any epilogue.

## Combat Duration

When Soul Burn starts during an active combat, the module records:

- Combat ID.
- Activation round.
- Duration rolled.
- Ending round.

If Soul Burn begins in round `R` and lasts `N` rounds, it remains active through
round `R + N - 1` and ends when round `R + N` begins.

If no active combat round is found, duration is tracked manually and reported
that way in chat.

## Movement Automation

At activation, the module reads the character's current movement speeds and
applies a managed Active Effect that doubles every nonzero movement mode:

- Walk
- Fly
- Swim
- Climb
- Burrow

The Actor's base values are not permanently overwritten. Ending Soul Burn
removes the managed effect and restores normal sheet display.

## Visuals And Sounds

The module bundles three sounds:

- `AetherUp3.ogg`, played when Soul Burn activates.
- `AetherGlow.ogg`, played when AetherGlow is consumed.
- `RagePowerDown.ogg`, played when Soul Burn ends.

In **Configure Settings -> Module Settings -> Soul Burn Settings**, the GM can
set each sound path, browse for a file, preview it, restore the bundled
default, and control its volume.

The Visuals tab controls:

- Use Sequencer/JB2A Transformation.
- Use TokenMagic FX.
- Battlefield ripple delay.
- Contrast increase.
- Desaturation.
- Return-to-normal duration.
- Show AGT in the inventory bar.
- Show rounds remaining in the inventory bar.

The intended visual sequence is:

1. Full-color transformation animation plays.
2. The token transforms.
3. A grayscale ripple expands outward from the character.
4. The battlefield becomes desaturated and contrasty.
5. The transformed token and its token effects remain in color.
6. The battlefield fades back to normal over the configured real-time duration.

## GM Settings

Soul Burn settings are organized into three tabs.

### Sounds

- Soul Burn power-up sound and volume.
- Soul Burn ending sound and volume.
- AetherGlow drinking sound and volume.
- Browse, preview, and restore bundled default controls.

### Visuals

- Enable or disable Sequencer/JB2A transformation support.
- Enable or disable TokenMagic FX support.
- Configure battlefield ripple delay.
- Configure contrast, desaturation, and return time.
- Show or hide AGT in the Soul Burn inventory bar.
- Show or hide rounds remaining in the Soul Burn inventory bar.

### Mechanics

- High Stakes Mode.
- AetherGlow Reduces Soul Burn Die.
- Constitution save request on Soul Burn end.
- Constitution save DC.
- Escalating Constitution save DC.
- Apply exhaustion on failed Constitution save.
- Fate Shift countdown seconds.
- Fate Shift message.
- Fate Shift button mode.
- Automatically End Soul Burn on Fate Shift.

Constitution saves are requested in chat for the owning player to roll. The
module does not silently roll them for the player.

## GM Player Management

Under **Configure Settings -> Module Settings -> Soul Burn Players**, the GM can
review and edit:

- Current Soul Burn.
- Lifetime Uses.
- AGT.
- AGDR.
- Active or inactive status.
- Active combat duration tracking.
- Character-specific transformed token image.

The GM can clear AGT per character or reset all AGT. Clearing an inactive
character at 0 Soul Burn can also blank the tertiary resource so Soul Burn no
longer remains on the sheet as a resource label.

If the GM clears or resets Soul Burn while a character is actively burning, the
module first resolves the full end workflow. Burnout checks are not skipped.

## Compendium Contents

The **Soul Burn Features** compendium contains:

- Soul Burn
- Aether Surge
- Libra
- Channel Aether
- Fate Shift
- Holy Amulet of Lux Eterna

Drag **Soul Burn** and the amulet onto player character sheets. The active-burn
temporary Items are copied automatically while Soul Burn is active.

## Frequently Asked Questions

### Is Soul Burn a class feature?

No. It is written as a campaign power that can be granted to any character.
That makes it easy to use as a relic awakening, divine mark, Aether infection,
boss-fight reward, or party-wide limit-break system.

### Does entering Soul Burn spend a Hit Die?

No. The character must have at least one available Hit Die to enter Soul Burn,
but entry only rolls the chosen die. Aether Surge is the move that spends Hit
Dice.

### Why does Soul Burn use the tertiary resource?

The third resource slot is visible on dnd5e sheets and works well as a
character-facing reservoir. For enemies, the same slot can be labeled **Nether
Index** or **Soul Burn**, and Libra can read it.

### Does Soul Burn delete a character on Burnout?

No. Burnout is absolute in the rules, but the module does not delete Actors.
It posts the result and leaves the GM and table in control of the final scene.

### Can a player use Soul Burn without a selected token?

Yes, if the user has an assigned character. The module resolves the actor from
the controlled token first, then from the user's assigned character.

### Can the GM activate Soul Burn for a player?

Yes. A GM can select a player-owned token and run the same workflow for that
character.

### Does it work without Tidy5e Sheet?

The core mechanics still work. Tidy5e is recommended because the active Soul
Burn inventory section is designed to sit cleanly above Weapons on the Tidy5e
Inventory tab.

### Does AetherGlow work on characters without Soul Burn?

Yes. AetherGlow always heals. If the recipient does not have a Soul Burn
resource, the module heals them and does not rename or overwrite their tertiary
resource.

### Why does AetherGlow always heal at least 1?

Because AetherGlow is life itself. AGT can dull the effect, but it cannot make
the result negative or entirely inert.

### What is AGT?

AGT is AG Tolerance. It is subtracted from AetherGlow's healing and Soul Burn
recovery roll. Each AetherGlow exposure increases AGT by 1, to a maximum of 19.

### What is AGDR?

AGDR is AetherGlow Die Reduction. When the optional High Stakes setting is
enabled, AetherGlow can reduce the next High Stakes Soul Burn die progression.
It does not reduce lifetime uses.

### Can Fate Shift automatically end Soul Burn?

Yes, but it is off by default. Enable **Automatically End Soul Burn on Fate
Shift** in Mechanics if you want Fate Shift to close the transformation after
its timer or confirmation button resolves.

### What happens if Soul Burn ends outside combat?

It ends normally, but early-end Soul Burn point recovery only applies inside
the tracked combat where Soul Burn began.

### Can I change the sounds and transformed token images?

Yes. Sounds are configurable in GM settings. Character-specific transformed
token images are configured in Soul Burn Player Management.

### Does Libra reveal hidden GM-only information?

Libra publishes the fields the module can read from the target Actor: HP, AC,
damage vulnerabilities, condition immunities, attack ranges, and qualifying
tertiary resources. Use it as an intentional player-facing scan power.

### Does the module include JB2A or TokenMagic assets?

No. It can call those modules when installed, but it does not redistribute
third-party animation packages or token art.

## Technical Notes

- Actor state is stored in `flags.world.soulBurn`.
- Module Item metadata uses `flags.soul-burn`.
- The Soul Burn resource remains in `system.resources.tertiary`.
- Temporary Soul Burn Items are managed copies and are removed on end.
- The permanent Soul Burn feature remains on the character sheet.
- The module never deletes an Actor.
- The module syntax can be checked with:

```bash
node --check scripts/soul-burn.js
```

## License

This repository does not grant redistribution rights to JB2A, TokenMagic, sound,
token art, or other third-party/campaign assets. Those assets are referenced or
integrated with when available, but they are not included unless explicitly
bundled in this module.
