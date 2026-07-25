/**
 * SOUL BURN — Foundry VTT / dnd5e world macro
 *
 * Mechanical state is stored on the Actor, not in a journal. The macro works
 * from a controlled token or from the executing user's assigned character.
 * Sequencer and TokenMagic FX are optional; the original animation is retained.
 */

const SB = {
  scope: "world",
  key: "soulBurn",
  effectName: "Soul Burn",
  pack: "soul-burn.soul-burn-features",
  temporaryActions: ["surge", "channel", "fate"],
  transformedTokenRoot:
    "https://assets.forge-vtt.com/62bf9a2b7fa42ce7966f6738/STARPG/CharTokens/AstrumKnights",
  defaultPowerUpSound: "modules/soul-burn/sounds/AetherUp3.ogg",
  defaultAetherglowSound: "modules/soul-burn/sounds/AetherGlow.ogg",
  defaultEndSound: "modules/soul-burn/sounds/RagePowerDown.ogg",
  sacredFlame:
    "modules/jb2a_patreon/Library/Cantrip/Sacred_Flame/SacredFlameTarget_01_Regular_Yellow_400x400.webm"
};

function soundPath(setting) {
  return game.settings.get("soul-burn", setting);
}

class SoulBurnSoundSettings extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "soul-burn-sound-settings",
      title: "Soul Burn Settings",
      template: "modules/soul-burn/templates/sound-settings.hbs",
      width: 620,
      closeOnSubmit: true
    });
  }

  getData() {
    return {
      powerUpSound: soundPath("powerUpSound"),
      aetherglowSound: soundPath("aetherglowSound"),
      endSound: soundPath("endSound"),
      requireEndConSave: game.settings.get("soul-burn", "requireEndConSave"),
      endConSaveDC: game.settings.get("soul-burn", "endConSaveDC"),
      defaultPowerUpSound: SB.defaultPowerUpSound,
      defaultAetherglowSound: SB.defaultAetherglowSound,
      defaultEndSound: SB.defaultEndSound
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("[data-browse-target]").on("click", event => {
      event.preventDefault();
      const target = event.currentTarget.dataset.browseTarget;
      const input = html.find(`[name="${target}"]`);
      new FilePicker({
        type: "audio",
        current: input.val(),
        callback: path => input.val(path).trigger("change")
      }).render(true);
    });
    html.find("[data-preview-target]").on("click", event => {
      event.preventDefault();
      const target = event.currentTarget.dataset.previewTarget;
      const src = String(html.find(`[name="${target}"]`).val() ?? "").trim();
      if (src) AudioHelper.play({ src, volume: 0.5, autoplay: true, loop: false }, false);
    });
    html.find("[data-default-target]").on("click", event => {
      event.preventDefault();
      const target = event.currentTarget.dataset.defaultTarget;
      const defaults = {
        powerUpSound: SB.defaultPowerUpSound,
        aetherglowSound: SB.defaultAetherglowSound,
        endSound: SB.defaultEndSound
      };
      const value = defaults[target] ?? "";
      html.find(`[name="${target}"]`).val(value).trigger("change");
    });
  }

  async _updateObject(_event, formData) {
    await game.settings.set("soul-burn", "powerUpSound", String(formData.powerUpSound ?? "").trim());
    await game.settings.set("soul-burn", "aetherglowSound", String(formData.aetherglowSound ?? "").trim());
    await game.settings.set("soul-burn", "endSound", String(formData.endSound ?? "").trim());
    await game.settings.set("soul-burn", "requireEndConSave", Boolean(formData.requireEndConSave));
    await game.settings.set(
      "soul-burn",
      "endConSaveDC",
      Math.min(30, Math.max(1, Number(formData.endConSaveDC) || 10))
    );
    ui.notifications.info("Soul Burn settings saved.");
  }
}

class SoulBurnPlayerManager extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "soul-burn-player-manager",
      title: "Soul Burn Player Management",
      template: "modules/soul-burn/templates/player-management.hbs",
      width: 820,
      height: "auto",
      closeOnSubmit: false
    });
  }

  getData() {
    const actors = game.actors
      .filter(actor => actor.type === "character" && actor.hasPlayerOwner)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(actor => {
        const current = state(actor);
        return {
          id: actor.id,
          name: actor.name,
          img: actor.img,
          burn: current.burn,
          max: maximumBurn(actor),
          uses: current.uses,
          tolerance: current.tolerance,
          active: current.active,
          burnout: current.burnout,
          usesSoulBurn: hasSoulBurnResource(actor),
          combatTracking: current.active && current.combatId && current.startedRound !== null
            ? `Rounds ${current.startedRound}–${Number(current.endsRound) - 1}`
            : ""
        };
      });
    return { actors };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("[data-reset-tolerance]").on("click", async event => {
      event.preventDefault();
      const actor = game.actors.get(event.currentTarget.dataset.resetTolerance);
      if (!actor) return;
      await saveManagedState(actor, { ...state(actor), tolerance: 0 });
      ui.notifications.info(`${actor.name}'s AG Tolerance was reset.`);
      this.render();
    });
    html.find("[data-reset-all-tolerance]").on("click", async event => {
      event.preventDefault();
      for (const actor of game.actors.filter(a => a.type === "character" && a.hasPlayerOwner)) {
        await saveManagedState(actor, { ...state(actor), tolerance: 0 });
      }
      ui.notifications.info("All player AG Tolerances were reset.");
      this.render();
    });
  }

  async _updateObject(_event, formData) {
    for (const actor of game.actors.filter(a => a.type === "character" && a.hasPlayerOwner)) {
      const current = state(actor);
      const prefix = `actors.${actor.id}.`;
      const next = {
        ...current,
        burn: Math.max(0, Number(formData[`${prefix}burn`] ?? current.burn)),
        uses: Math.max(0, Number(formData[`${prefix}uses`] ?? current.uses)),
        tolerance: Math.min(19, Math.max(0, Number(formData[`${prefix}tolerance`] ?? current.tolerance)))
      };
      await saveManagedState(actor, next);
    }
    ui.notifications.info("Soul Burn player data saved.");
    this.render();
  }
}

Hooks.once("init", () => {
  game.settings.register("soul-burn", "powerUpSound", {
    name: "Soul Burn Power-Up Sound",
    hint: "Audio played when a character enters Soul Burn.",
    scope: "world",
    config: false,
    type: String,
    default: SB.defaultPowerUpSound
  });
  game.settings.register("soul-burn", "aetherglowSound", {
    name: "Aetherglow Drinking Sound",
    hint: "Audio played when a character consumes Aetherglow.",
    scope: "world",
    config: false,
    type: String,
    default: SB.defaultAetherglowSound
  });
  game.settings.register("soul-burn", "endSound", {
    name: "Soul Burn End Sound",
    hint: "Audio played when Soul Burn ends and the token transforms back.",
    scope: "world",
    config: false,
    type: String,
    default: SB.defaultEndSound
  });
  game.settings.register("soul-burn", "requireEndConSave", {
    name: "Require Constitution Check When Soul Burn Ends",
    hint: "Roll a Constitution ability check and report the result when any Soul Burn period ends.",
    scope: "world",
    config: false,
    type: Boolean,
    default: false
  });
  game.settings.register("soul-burn", "endConSaveDC", {
    name: "Soul Burn End Constitution DC",
    hint: "The DC used for the optional Constitution ability check.",
    scope: "world",
    config: false,
    type: Number,
    default: 10
  });
  game.settings.registerMenu("soul-burn", "soundSettings", {
    name: "Soul Burn Settings",
    label: "Configure Soul Burn",
    hint: "Configure activation, Aetherglow, and ending sounds plus end-of-burn Constitution checks.",
    icon: "fas fa-fire-flame-curved",
    type: SoulBurnSoundSettings,
    restricted: true
  });
  game.settings.registerMenu("soul-burn", "playerManager", {
    name: "Soul Burn Players",
    label: "Manage Players",
    hint: "Review and edit player Soul Burn resources, lifetime uses, and AG Tolerance.",
    icon: "fas fa-users-gear",
    type: SoulBurnPlayerManager,
    restricted: true
  });
});

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const esc = value => {
  const text = String(value ?? "");
  if (foundry.utils.escapeHTML) return foundry.utils.escapeHTML(text);
  const element = document.createElement("div");
  element.textContent = text;
  return element.innerHTML;
};
const cleanName = name => String(name ?? "").replace(/\[.*?]/g, "").trim();
const notifyError = error => {
  console.error("Soul Burn |", error);
  ui.notifications.error(`Soul Burn: ${error.message ?? error}`);
};

async function choose(title, content, buttons, defaultButton) {
  return Dialog.wait({
    title,
    content,
    buttons: Object.fromEntries(
      Object.entries(buttons).map(([key, button]) => [
        key,
        {
          icon: button.icon,
          label: button.label,
          callback: html => button.value instanceof Function ? button.value(html) : button.value
        }
      ])
    ),
    default: defaultButton,
    close: () => null
  });
}

function actorTokens(actor) {
  return canvas.tokens.placeables.filter(t => t.actor?.id === actor.id);
}

async function resolveSubject(preferredActor = null, preferredToken = null) {
  if (preferredActor) {
    if (!game.user.isGM && !preferredActor.isOwner) {
      throw new Error("You do not own this character.");
    }
    const token = preferredToken ?? actorTokens(preferredActor)[0] ?? null;
    return { actor: preferredActor, token };
  }
  const controlled = canvas.tokens.controlled;
  if (controlled.length > 1) throw new Error("Select only one token.");

  if (controlled.length === 1) {
    const token = controlled[0];
    if (!game.user.isGM && !token.actor?.isOwner) {
      throw new Error("You do not own the selected token.");
    }
    return { actor: token.actor, token };
  }

  const actor = game.user.character;
  if (!actor) {
    throw new Error("Select a token, or assign a character to your user.");
  }

  const tokens = actorTokens(actor);
  if (tokens.length === 1) return { actor, token: tokens[0] };
  if (!tokens.length) return { actor, token: null };

  const options = tokens
    .map(t => `<option value="${t.id}">${esc(t.name)}</option>`)
    .join("");
  const tokenId = await choose(
    "Choose Soul Burn Token",
    `<div class="form-group"><label>Token</label><select name="tokenId">${options}</select></div>`,
    {
      use: {
        icon: '<i class="fas fa-check"></i>',
        label: "Use Token",
        value: html => html.find('[name="tokenId"]').val()
      },
      cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel", value: null }
    },
    "use"
  );
  if (!tokenId) return null;
  return { actor, token: canvas.tokens.get(tokenId) };
}

function classData(actor) {
  return actor.items
    .filter(i => i.type === "class" && Number(i.system.levels) > 0)
    .map(item => {
      const formula = String(item.system.hitDice ?? item.system.hitDie ?? "");
      const faces = Number(formula.match(/d(\d+)/i)?.[1] ?? 0);
      const levels = Number(item.system.levels ?? 0);
      const used = Number(item.system.hitDiceUsed ?? 0);
      return { item, formula: `d${faces}`, faces, levels, used, remaining: Math.max(0, levels - used) };
    })
    .filter(c => c.faces > 0);
}

function hasSoulBurnResource(actor) {
  return String(actor.system.resources?.tertiary?.label ?? "").trim().toLowerCase() === "soul burn";
}

function maximumBurn(actor) {
  const sheetMaximum = hasSoulBurnResource(actor)
    ? Number(actor.system.resources?.tertiary?.max ?? 0)
    : 0;
  return sheetMaximum > 0
    ? sheetMaximum
    : classData(actor).reduce((total, c) => total + c.levels * c.faces, 0);
}

function movementSpeeds(actor) {
  const movement = actor.system.attributes?.movement ?? {};
  return Object.fromEntries(
    ["walk", "fly", "swim", "climb", "burrow"]
      .map(type => [type, Number(movement[type] ?? 0)])
      .filter(([, value]) => value > 0)
  );
}

function movementSummary(speeds, multiplier = 1) {
  const entries = Object.entries(speeds);
  if (!entries.length) return "No numeric movement speeds";
  return entries
    .map(([type, value]) => `${type[0].toUpperCase()}${type.slice(1)} ${value * multiplier} ft.`)
    .join(", ");
}

async function initializeSoulBurnResource(actor) {
  if (!actor || actor.type !== "character") return;
  const resource = actor.system.resources?.tertiary ?? {};
  const calculatedMaximum = classData(actor).reduce((total, c) => total + c.levels * c.faces, 0);
  const updates = {};
  const changingResource = resource.label !== "Soul Burn";
  if (changingResource) {
    updates["system.resources.tertiary.label"] = "Soul Burn";
    updates["system.resources.tertiary.value"] = 0;
  }
  if ((changingResource || !Number(resource.max ?? 0)) && calculatedMaximum > 0) {
    updates["system.resources.tertiary.max"] = calculatedMaximum;
  }
  if (resource.value === null || resource.value === undefined || resource.value === "") {
    updates["system.resources.tertiary.value"] = 0;
  }
  if (Object.keys(updates).length) await actor.update(updates);
}

function state(actor) {
  const saved = foundry.utils.deepClone(actor.getFlag(SB.scope, SB.key) ?? {});
  return {
    // Soul Burn is the sheet's tertiary resource. Flags only hold metadata.
    burn: hasSoulBurnResource(actor)
      ? Number(actor.system.resources?.tertiary?.value ?? 0)
      : 0,
    uses: Number(saved.uses ?? 0),
    tolerance: Math.min(19, Number(saved.tolerance ?? 0)),
    active: Boolean(saved.active),
    burnout: Boolean(saved.burnout),
    combatId: saved.combatId ?? null,
    startedRound: saved.startedRound ?? null,
    endsRound: saved.endsRound ?? null,
    baseMovement: saved.baseMovement ?? {},
    originalImages: saved.originalImages ?? {}
  };
}

function isTemporarySoulBurnAction(item) {
  return Boolean(item?.getFlag(SB.scope, "temporaryAction"));
}

function normalizedSoulBurnAction(item) {
  const flagged = item?.getFlag?.(SB.scope, "action");
  if (flagged === "strike") return "surge";
  if (SB.temporaryActions.includes(flagged)) return flagged;

  const id = String(item?.id ?? item?._id ?? "");
  const name = String(item?.name ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (
    ["AetherStrikeFeat", "AetherSurgeFeat"].includes(id)
    || ["aetherstrike", "aethersurge"].includes(name)
  ) return "surge";
  if (id === "ChannelAetherFt1" || name === "channelaether") return "channel";
  if (id === "FateShiftFeature" || name === "fateshift") return "fate";
  return flagged ?? null;
}

function temporarySoulBurnActions(actor) {
  return actor?.items
    ?.filter(item => isTemporarySoulBurnAction(item)) ?? [];
}

function allOwnedSoulBurnActionItems(actor) {
  return actor?.items
    ?.filter(item => SB.temporaryActions.includes(normalizedSoulBurnAction(item))) ?? [];
}

function ownedSoulBurnActionItems(actor) {
  const byAction = new Map();
  const candidates = allOwnedSoulBurnActionItems(actor)
    .sort((a, b) =>
      Number(isTemporarySoulBurnAction(a)) - Number(isTemporarySoulBurnAction(b))
    );
  for (const item of candidates) {
    const action = normalizedSoulBurnAction(item);
    if (!byAction.has(action)) byAction.set(action, item);
  }
  return SB.temporaryActions.map(action => byAction.get(action)).filter(Boolean);
}

async function ensureTemporarySoulBurnActions(actor) {
  if (!actor || actor.type !== "character") return [];

  const legacySurges = actor.items
    .filter(item =>
      normalizedSoulBurnAction(item) === "surge"
      && (
        item.getFlag(SB.scope, "action") === "strike"
        || item.name === "AetherStrike"
      )
    )
    .map(item => ({
      _id: item.id,
      name: "AetherSurge",
      img: "modules/soul-burn/icons/aethersurge.png",
      "flags.soul-burn.action": "surge",
      "system.description.value": String(item.system.description?.value ?? "")
        .replaceAll("AetherStrike", "AetherSurge")
        .replaceAll('data-soul-burn-action="strike"', 'data-soul-burn-action="surge"')
    }));
  if (legacySurges.length) {
    await actor.updateEmbeddedDocuments("Item", legacySurges, { soulBurnInternal: true });
  }

  const managed = temporarySoulBurnActions(actor);
  const keep = new Map(
    actor.items
      .filter(item =>
        !isTemporarySoulBurnAction(item)
        && SB.temporaryActions.includes(normalizedSoulBurnAction(item))
      )
      .map(item => [normalizedSoulBurnAction(item), item])
  );
  const duplicates = [];
  for (const item of managed) {
    const action = normalizedSoulBurnAction(item);
    const legacySurge = action === "surge" && (
      item.getFlag(SB.scope, "action") !== "surge"
      || item.name !== "AetherSurge"
    );
    if (!SB.temporaryActions.includes(action) || legacySurge || keep.has(action)) {
      duplicates.push(item.id);
    }
    else keep.set(action, item);
  }
  if (duplicates.length) await actor.deleteEmbeddedDocuments("Item", duplicates);

  const missing = SB.temporaryActions.filter(action => !keep.has(action));
  if (missing.length) {
    const pack = game.packs.get(SB.pack);
    if (!pack) throw new Error("The Soul Burn Features compendium is unavailable.");
    const sourceItems = await pack.getDocuments();
    const sourceByAction = new Map(
      sourceItems.map(item => [normalizedSoulBurnAction(item), item])
    );
    const creates = missing.map(action => {
      const source = sourceByAction.get(action);
      if (!source) throw new Error(`The ${action} action is missing from the Soul Burn compendium.`);
      const data = source.toObject();
      delete data._id;
      data.flags ??= {};
      data.flags[SB.scope] = {
        ...(data.flags[SB.scope] ?? {}),
        action,
        temporaryAction: true
      };
      data.flags.core = {
        ...(data.flags.core ?? {}),
        sourceId: source.uuid
      };
      if (action === "surge") {
        data.name = "AetherSurge";
        data.img = "modules/soul-burn/icons/aethersurge.png";
        data.system.description.value = String(data.system.description?.value ?? "")
          .replaceAll("AetherStrike", "AetherSurge")
          .replaceAll('data-soul-burn-action="strike"', 'data-soul-burn-action="surge"');
      }
      return data;
    });
    const created = await actor.createEmbeddedDocuments("Item", creates);
    for (const item of created) keep.set(normalizedSoulBurnAction(item), item);
  }

  return ownedSoulBurnActionItems(actor);
}

async function removeTemporarySoulBurnActions(actor) {
  const ids = temporarySoulBurnActions(actor).map(item => item.id);
  if (ids.length) await actor.deleteEmbeddedDocuments("Item", ids);
}

async function cleanLegacyCompendiumIndex() {
  try {
    const pack = game.packs.get(SB.pack);
    if (!pack) return;
    const index = await pack.getIndex();
    const has = id => index.has?.(id) ?? index.some?.(entry => entry._id === id);
    if (!has("AetherStrikeFeat") || !has("AetherSurgeFeat")) return;

    // v1.0.8 briefly changed the document ID during the rename. Some Foundry
    // installations retained that old index entry when updating the module.
    // The packaged database is clean; removing the stale in-memory entry keeps
    // upgraded clients from displaying an unopenable duplicate.
    index.delete?.("AetherSurgeFeat");
    pack.index?.delete?.("AetherSurgeFeat");
  } catch (error) {
    console.warn("Soul Burn | Could not clean the legacy compendium index.", error);
  }
}

function renderActorSheetSoon(actor) {
  if (!actor?.sheet?.rendered) return;
  // A full render is intentional: Tidy rebuilds its tab navigation only on a
  // full sheet render, so this makes the conditional Soul Burn tab appear or
  // disappear immediately when the transformation state changes.
  setTimeout(() => actor.sheet.render(true), 25);
}

function soulBurnFeature(actor) {
  return actor?.items?.find(item => item.getFlag(SB.scope, "action") === "activate") ?? null;
}

async function syncSoulBurnFeature(actor, active = state(actor).active) {
  const item = soulBurnFeature(actor);
  if (!item) return;

  let description = String(item.system.description?.value ?? "");
  if (active) {
    description = description
      .replaceAll('data-soul-burn-action="open"', 'data-soul-burn-action="end"')
      .replaceAll('data-soul-burn-action="activate"', 'data-soul-burn-action="end"')
      .replaceAll("Enter Soul Burn", "Exit Soul Burn");
  } else {
    description = description
      .replaceAll('data-soul-burn-action="activate"', 'data-soul-burn-action="open"')
      .replaceAll('data-soul-burn-action="end"', 'data-soul-burn-action="open"')
      .replaceAll("Exit Soul Burn", "Enter Soul Burn");
  }

  const name = active ? "Exit Soul Burn" : "Soul Burn";
  if (item.name === name && description === item.system.description?.value) return;
  await actor.updateEmbeddedDocuments(
    "Item",
    [{
      _id: item.id,
      name,
      "system.description.value": description
    }],
    { soulBurnInternal: true }
  );
}

async function saveState(actor, next) {
  const { burn, ...metadata } = next;
  const updates = {};
  if (Number(actor.system.resources?.tertiary?.value ?? 0) !== Number(burn)) {
    updates["system.resources.tertiary.value"] = Math.max(0, Number(burn) || 0);
  }
  if (!actor.system.resources?.tertiary?.label) {
    updates["system.resources.tertiary.label"] = "Soul Burn";
  }
  if (!Number(actor.system.resources?.tertiary?.max ?? 0)) {
    updates["system.resources.tertiary.max"] =
      classData(actor).reduce((total, c) => total + c.levels * c.faces, 0);
  }
  if (Object.keys(updates).length) await actor.update(updates);
  await actor.setFlag(SB.scope, SB.key, metadata);
}

async function saveMetadataOnly(actor, next) {
  const { burn: _burn, ...metadata } = next;
  await actor.setFlag(SB.scope, SB.key, metadata);
}

async function saveManagedState(actor, next) {
  if (hasSoulBurnResource(actor)) return saveState(actor, next);
  return saveMetadataOnly(actor, next);
}

async function consumeHitDie(actor, promptText = "Choose a Hit Die") {
  const available = classData(actor).filter(c => c.remaining > 0);
  if (!available.length) throw new Error(`${actor.name} has no Hit Dice remaining.`);

  let selected = available[0];
  if (available.length > 1) {
    const options = available.map(c =>
      `<option value="${c.item.id}">${esc(c.item.name)} (${c.remaining}d${c.faces})</option>`
    ).join("");
    const itemId = await choose(
      promptText,
      `<div class="form-group"><label>Hit Die</label><select name="classId">${options}</select></div>`,
      {
        use: {
          icon: '<i class="fas fa-dice-d20"></i>',
          label: "Use Hit Die",
          value: html => html.find('[name="classId"]').val()
        },
        cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel", value: null }
      },
      "use"
    );
    if (!itemId) return null;
    selected = available.find(c => c.item.id === itemId);
  }

  await actor.updateEmbeddedDocuments("Item", [{
    _id: selected.item.id,
    "system.hitDiceUsed": selected.used + 1
  }]);
  return selected;
}

async function makeRoll(formula, data = {}) {
  const roll = await new Roll(formula, data).evaluate();
  return roll;
}

async function chat(actor, title, body, roll = null) {
  if (roll) {
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `<h3>${esc(title)}</h3>${body}`
    });
    return;
  }
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="dnd5e chat-card"><header class="card-header"><h3>${esc(title)}</h3></header><div class="card-content">${body}</div></div>`
  });
}

function burnoutChance(faces, remaining) {
  if (remaining < 1) return 100;
  if (remaining >= faces) return 0;
  return Math.round(((faces - remaining) / faces) * 1000) / 10;
}

function toleranceLine(value) {
  const lines = [
    "Soul Burn washes away beautifully.",
    "Soul Burn washes away beautifully.",
    "Aetherglow feels miraculous.",
    "The release feels effortless.",
    "The glow still answers strongly.",
    "The burn clears with ease.",
    "A little warmth lingers.",
    "The release comes softer.",
    "The glow takes longer.",
    "Some scorch remains behind.",
    "The clearing feels weaker.",
    "Soul Burn clings faintly.",
    "The glow pulls less.",
    "The release feels strained.",
    "Less burn is removed.",
    "The cleansing feels tired.",
    "The glow struggles through.",
    "Soul Burn holds deeper.",
    "The release barely works.",
    "Aetherglow gives almost nothing."
  ];
  return lines[Math.min(19, Math.max(0, Number(value) || 0))];
}

async function playAnimation(token, nextState) {
  if (!token) {
    ui.notifications.info("Soul Burn activated on the actor; no active token was available for animation.");
    return;
  }

  const powerUpSound = soundPath("powerUpSound");
  if (powerUpSound) {
    try {
      await AudioHelper.play({ src: powerUpSound, volume: 0.5, autoplay: true, loop: false }, true);
    } catch (error) {
      console.warn("Soul Burn | Power-up sound skipped.", error);
    }
  }

  if (globalThis.Sequence) {
    try {
      await wait(700);
      await new Sequence()
        .effect()
        .file(SB.sacredFlame)
        .atLocation(token)
        .scale(2)
        .duration(5400)
        .play();
      await wait(1000);
    } catch (error) {
      console.warn("Soul Burn | Sequencer/JB2A animation skipped.", error);
    }
  } else {
    ui.notifications.warn("Sequencer is unavailable; Soul Burn mechanics still activated.");
  }

  if (globalThis.TokenMagic) {
    const params = [{
      filterType: "fire",
      filterId: "soulBurnFire",
      intensity: 1,
      color: 0xFFFFFF,
      amplitude: 1,
      time: 0,
      blend: 2,
      fireBlend: 1,
      animated: {
        time: { active: true, speed: -0.0024, animType: "move" },
        intensity: { active: true, loopDuration: 15000, val1: 0.8, val2: 2, animType: "syncCosOscillation" },
        amplitude: { active: true, loopDuration: 4400, val1: 1, val2: 1.4, animType: "syncCosOscillation" }
      }
    }];
    try {
      if (TokenMagic.addUpdateFilters) await TokenMagic.addUpdateFilters(token, params);
      else if (TokenMagic.addUpdateFiltersOnSelected) {
        const wasControlled = token.controlled;
        if (!wasControlled) token.control({ releaseOthers: true });
        await TokenMagic.addUpdateFiltersOnSelected(params);
        if (!wasControlled) token.release();
      }
    } catch (error) {
      console.warn("Soul Burn | TokenMagic filter skipped.", error);
    }
  }

  const original = token.document.texture?.src ?? token.document.img;
  nextState.originalImages[token.document.uuid] ??= original;
  const imageName = cleanName(token.actor.name).replace(/\s+/g, "");
  try {
    await token.document.update({ "texture.src": `${SB.transformedTokenRoot}/${encodeURIComponent(imageName)}.webp` });
  } catch (error) {
    console.warn("Soul Burn | Transformed token image unavailable.", error);
  }
}

async function applyMovement(actor) {
  const existing = actor.effects.find(e => (e.name ?? e.label) === SB.effectName && e.getFlag(SB.scope, "managed"));
  if (existing) return;

  const movement = actor.system.attributes?.movement ?? {};
  const changes = ["walk", "fly", "swim", "climb", "burrow"]
    .filter(type => Number(movement[type]) > 0)
    .map(type => ({
      key: `system.attributes.movement.${type}`,
      mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
      value: "2",
      priority: 20
    }));

  await actor.createEmbeddedDocuments("ActiveEffect", [{
    label: SB.effectName,
    name: SB.effectName,
    icon: "modules/soul-burn/icons/soul-burn.png",
    changes,
    disabled: false,
    flags: { [SB.scope]: { managed: true } }
  }]);
}

async function removeVisuals(actor, savedState) {
  for (const token of actorTokens(actor)) {
    if (globalThis.TokenMagic) {
      try {
        if (TokenMagic.deleteFilters) await TokenMagic.deleteFilters(token, "soulBurnFire");
        else if (TokenMagic.deleteFiltersOnSelected) {
          const wasControlled = token.controlled;
          if (!wasControlled) token.control({ releaseOthers: true });
          await TokenMagic.deleteFiltersOnSelected("soulBurnFire");
          if (!wasControlled) token.release();
        }
      } catch (error) {
        console.warn("Soul Burn | Could not remove TokenMagic filter.", error);
      }
    }
    const original = savedState.originalImages[token.document.uuid];
    if (original) await token.document.update({ "texture.src": original });
  }

  const effects = actor.effects
    .filter(e => (e.name ?? e.label) === SB.effectName && e.getFlag(SB.scope, "managed"))
    .map(e => e.id);
  if (effects.length) await actor.deleteEmbeddedDocuments("ActiveEffect", effects);
}

async function activate(actor, token) {
  const current = state(actor);
  if (current.active) throw new Error(`${actor.name} is already Soul Burning.`);

  const dice = classData(actor).filter(c => c.remaining > 0);
  if (!dice.length) throw new Error(`${actor.name} has no Hit Dice remaining.`);
  const max = maximumBurn(actor);

  const chosen = dice.length === 1 ? dice[0] : await (async () => {
    const options = dice.map(c =>
      `<option value="${c.item.id}">${esc(c.item.name)} (${c.remaining}d${c.faces})</option>`
    ).join("");
    const id = await choose(
      "Enter Soul Burn",
      `<p>Choose and roll one available Hit Die to ignite Soul Burn. Entering Soul Burn does not expend it.</p><div class="form-group"><label>Hit Die</label><select name="classId">${options}</select></div>`,
      {
        burn: { icon: '<i class="fas fa-fire"></i>', label: "Soul Burn", value: html => html.find('[name="classId"]').val() },
        cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel", value: null }
      },
      "burn"
    );
    return dice.find(c => c.item.id === id);
  })();
  if (!chosen) return;

  const chance = burnoutChance(chosen.faces, max - current.burn);
  const confirmed = await choose(
    "Confirm Soul Burn",
    `<p><strong>${esc(actor.name)}</strong> has ${current.burn} / ${max} Soul Burn.</p>
     <p>Roll: 1d${chosen.faces}. Chance to exceed the maximum: <strong>${chance}%</strong>.</p>`,
    {
      burn: { icon: '<i class="fas fa-fire"></i>', label: `Roll 1d${chosen.faces}`, value: true },
      cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel", value: false }
    },
    "cancel"
  );
  if (!confirmed) return;

  // The character must have this die available, but entry only rolls it.
  // AetherSurge is the Soul Burn action that actually expends Hit Dice.
  const roll = await makeRoll(`1d${chosen.faces}`);
  const staleMovementEffects = actor.effects
    .filter(effect => (effect.name ?? effect.label) === SB.effectName && effect.getFlag(SB.scope, "managed"))
    .map(effect => effect.id);
  if (staleMovementEffects.length) {
    await actor.deleteEmbeddedDocuments("ActiveEffect", staleMovementEffects);
  }
  const baseMovement = movementSpeeds(actor);
  const combat = game.combat;
  const combatRound = Number(combat?.round ?? 0);
  const trackCombat = Boolean(combat && combatRound > 0);
  const next = {
    ...current,
    burn: current.burn + roll.total,
    uses: current.uses + 1,
    active: true,
    burnout: current.burn + roll.total > max,
    combatId: trackCombat ? combat.id : null,
    startedRound: trackCombat ? combatRound : null,
    endsRound: trackCombat ? combatRound + roll.total : null,
    baseMovement
  };

  // Resolve and copy all three compendium actions before changing the active
  // state. A missing/cached compendium entry can no longer leave the Actor
  // marked active without the temporary action set.
  await ensureTemporarySoulBurnActions(actor);
  await applyMovement(actor);
  await playAnimation(token, next);
  await saveState(actor, next);
  await syncSoulBurnFeature(actor, true);
  renderActorSheetSoon(actor);
  await chat(
    actor,
    "Soul Burn",
    `<p><strong>${esc(actor.name)}</strong> gains double movement and one Soul Burn action each turn for <strong>${roll.total}</strong> rounds.</p>
     <p>Soul Burn: <strong>${next.burn} / ${max}</strong>${next.burnout ? " — <strong>Burnout pending</strong>" : ""}</p>
     <p><strong>Movement:</strong> ${esc(movementSummary(baseMovement))} → <strong>${esc(movementSummary(baseMovement, 2))}</strong></p>
     ${trackCombat
       ? `<p><strong>Combat:</strong> Activated in round ${combatRound}. The transformation ends when round ${next.endsRound} begins.</p>`
       : "<p><strong>Combat:</strong> No active combat round was found; duration is tracked manually.</p>"}`,
    roll
  );
}

async function aetherSurge(actor) {
  const current = state(actor);
  if (!current.active) throw new Error("AetherSurge requires active Soul Burn.");
  const die = await consumeHitDie(actor, "AetherSurge");
  if (!die) return;
  const roll = await makeRoll(`1d${die.faces}`);
  const use = await choose(
    "AetherSurge",
    `<p>You rolled <strong>${roll.total}</strong>. Apply it to one roll only.</p>`,
    {
      attack: { icon: '<i class="fas fa-crosshairs"></i>', label: "Attack Roll", value: "attack roll" },
      damage: { icon: '<i class="fas fa-burst"></i>', label: "Damage Roll", value: "radiant damage" }
    },
    "damage"
  );
  await chat(actor, "AetherSurge", `<p>Add <strong>+${roll.total}</strong> to the ${esc(use)} of the triggering attack.</p>`, roll);
}

async function spendItemCharge(item, label) {
  if (!item) throw new Error(`${label} is not present on this character.`);
  const charges = Number(item.system.uses?.value ?? 0);
  if (charges <= 0) throw new Error(`${label} has no charges remaining.`);
  await item.update({ "system.uses.value": charges - 1 });
}

async function channelAether(actor, { item = null, chargeAlreadySpent = false } = {}) {
  const channelItem = item ?? actor.items.find(
    ownedItem => ownedItem.getFlag("soul-burn", "action") === "channel"
  );
  const hitDice = classData(actor);
  if (!hitDice.length) throw new Error("No class Hit Die was found.");
  const largest = Math.max(...hitDice.map(c => c.faces));
  const level = hitDice.reduce((sum, c) => sum + c.levels, 0);
  const abilities = actor.system.abilities ?? {};
  const options = Object.entries(abilities)
    .map(([key, ability]) => `<option value="${key}">${esc(CONFIG.DND5E.abilities?.[key]?.label ?? key.toUpperCase())} (${Number(ability.mod) >= 0 ? "+" : ""}${ability.mod})</option>`)
    .join("");
  const abilityKey = await choose(
    "Channel Aether",
    `<p>Choose the ability for the radiant attack. This does not spend a Hit Die.</p>
     <div class="form-group"><label>Ability</label><select name="ability">${options}</select></div>`,
    {
      roll: { icon: '<i class="fas fa-sun"></i>', label: "Attack", value: html => html.find('[name="ability"]').val() },
      cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel", value: null }
    },
    "roll"
  );
  if (!abilityKey) return;
  if (!chargeAlreadySpent) await spendItemCharge(channelItem, "Channel Aether");

  const mod = Number(abilities[abilityKey]?.mod ?? 0);
  const prof = Number(actor.system.attributes?.prof ?? 0);
  const attack = await makeRoll("1d20 + @mod + @prof", { mod, prof });
  const damage = await makeRoll(`1d${largest} + ${level}`);
  await chat(actor, "Channel Aether", `<p>Radiant attack: <strong>${attack.total}</strong> vs AC.</p><p>On a hit: <strong>${damage.total} radiant damage</strong> (1d${largest} + ${level}).</p>`);
  await attack.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: "Channel Aether — Attack" });
  await damage.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: "Channel Aether — Radiant Damage" });
  return true;
}

async function endBurn(actor, reason = "Soul Burn ends") {
  const current = state(actor);
  if (!current.active) return;

  const endSound = soundPath("endSound");
  if (endSound) {
    try {
      await AudioHelper.play({ src: endSound, volume: 0.5, autoplay: true, loop: false }, true);
    } catch (error) {
      console.warn("Soul Burn | Ending sound skipped.", error);
    }
  }

  await removeVisuals(actor, current);
  await removeTemporarySoulBurnActions(actor);
  await saveState(actor, {
    ...current,
    active: false,
    combatId: null,
    startedRound: null,
    endsRound: null,
    baseMovement: {},
    originalImages: {}
  });
  await syncSoulBurnFeature(actor, false);
  renderActorSheetSoon(actor);

  let constitutionRoll = null;
  let constitutionSummary = "";
  if (game.settings.get("soul-burn", "requireEndConSave")) {
    const dc = Math.min(30, Math.max(1, Number(game.settings.get("soul-burn", "endConSaveDC")) || 10));
    const modifier = Number(actor.system.abilities?.con?.mod ?? 0);
    constitutionRoll = await makeRoll("1d20 + @modifier", { modifier });
    const passed = constitutionRoll.total >= dc;
    constitutionSummary = `
      <p><strong>Constitution Check:</strong> ${constitutionRoll.total} vs DC ${dc}
      — <strong>${passed ? "Success" : "Failure"}</strong></p>
      <p><em>The GM resolves the consequences of this check.</em></p>`;
  }

  const durationSummary = current.combatId && current.startedRound !== null
    ? `<p><strong>Tracked Period:</strong> Round ${current.startedRound} through the end of round ${Number(current.endsRound) - 1}.</p>`
    : "";
  const restoredMovement = movementSpeeds(actor);
  const movementRestoredSummary = `
    <p><strong>Movement Restored:</strong> ${esc(movementSummary(restoredMovement))}</p>`;
  await chat(
    actor,
    reason,
    `${durationSummary}${movementRestoredSummary}${current.burnout
      ? `<p><strong>${esc(actor.name)} exceeded their maximum Soul Burn.</strong> Burnout resolves now: their soul is permanently destroyed. The macro records this but does not delete the Actor.</p>`
      : `<p>${esc(actor.name)} transforms back and is no longer Soul Burning.</p>`}
     ${constitutionSummary}`,
    constitutionRoll
  );
}

async function fateShift(actor) {
  const current = state(actor);
  if (!current.active) throw new Error("Fate Shift requires active Soul Burn.");
  const declaration = await choose(
    "Fate Shift",
    `<p>Describe the rule bend for the GM to approve.</p><div class="form-group stacked"><textarea name="declaration" rows="5"></textarea></div>`,
    {
      declare: { icon: '<i class="fas fa-wand-magic-sparkles"></i>', label: "Declare & End Burn", value: html => String(html.find('[name="declaration"]').val() ?? "").trim() },
      cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel", value: null }
    },
    "declare"
  );
  if (!declaration) return;
  const gmIds = game.users.filter(u => u.isGM && u.active).map(u => u.id);
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    whisper: gmIds,
    content: `<h3>Fate Shift Approval</h3><p><strong>${esc(actor.name)}</strong> declares:</p><blockquote>${esc(declaration)}</blockquote>`
  });
  await endBurn(actor, "Fate Shift");
}

async function cleanseAetherglowEffects(actor) {
  const removableStatuses = new Set(["charmed", "poisoned", "petrified"]);
  const effects = actor.effects.filter(effect => {
    const statuses = new Set(effect.statuses ?? []);
    const coreStatus = effect.getFlag("core", "statusId");
    if (coreStatus) statuses.add(coreStatus);
    if ([...statuses].some(status => removableStatuses.has(status))) return true;

    return effect.changes.some(change => {
      const value = Number(change.value);
      if (!Number.isFinite(value) || value >= 0) return false;
      if (/^system\.abilities\.[a-z]+\.value$/i.test(change.key)) return true;
      return change.key === "system.attributes.hp.max";
    });
  });
  if (!effects.length) return [];
  await actor.deleteEmbeddedDocuments("ActiveEffect", effects.map(effect => effect.id));
  return effects.map(effect => effect.name ?? effect.label);
}

async function applyAetherglow(targetActor, sourceActor = targetActor) {
  const current = state(targetActor);
  const drinkingSound = soundPath("aetherglowSound");
  if (drinkingSound) {
    try {
      await AudioHelper.play({ src: drinkingSound, volume: 0.5, autoplay: true, loop: false }, true);
    } catch (error) {
      console.warn("Soul Burn | Aetherglow sound skipped.", error);
    }
  }

  const roll = await makeRoll("1d20");
  const hp = targetActor.system.attributes?.hp ?? {};
  const oldHp = Number(hp.value ?? 0);
  const maxHp = Number(hp.max ?? oldHp);
  const healing = Math.max(0, Math.min(roll.total, maxHp - oldHp));
  if (healing > 0) {
    await targetActor.update({ "system.attributes.hp.value": oldHp + healing });
  }
  const cleansed = await cleanseAetherglowEffects(targetActor);
  const nextTolerance = Math.min(19, current.tolerance + 1);
  const healingSummary = `
    <p><strong>Healing Roll:</strong> ${roll.total}</p>
    <p><strong>Hit Points Restored:</strong> ${healing}</p>
    <p><strong>Hit Points:</strong> ${oldHp} → ${oldHp + healing} / ${maxHp}</p>
    <p><strong>Effects Removed:</strong> ${cleansed.length ? cleansed.map(esc).join(", ") : "None"}</p>`;

  if (!hasSoulBurnResource(targetActor)) {
    const next = { ...current, tolerance: nextTolerance };
    await saveMetadataOnly(targetActor, next);
    await chat(
      targetActor,
      "Aetherglow Consumed",
      `<p><strong>${esc(sourceActor.name)}</strong> gives Aetherglow to <strong>${esc(targetActor.name)}</strong>.</p>
       ${healingSummary}
       <p><strong>Soul Burn:</strong> No Soul Burn resource—no release required.</p>
       <p><strong>AG Tolerance:</strong> ${current.tolerance} → ${next.tolerance}</p>
       <p><em>AG Tolerance still rises because the soul remembers every exposure to Aetherglow.</em></p>`,
      roll
    );
    return true;
  }

  const removed = Math.max(1, roll.total - current.tolerance);
  const blocked = Math.max(0, roll.total - removed);
  const next = {
    ...current,
    burn: Math.max(0, current.burn - removed),
    tolerance: nextTolerance
  };
  await saveState(targetActor, next);
  await chat(
    targetActor,
    "Aetherglow Consumed",
    `<p><strong>${esc(sourceActor.name)}</strong> gives Aetherglow to <strong>${esc(targetActor.name)}</strong>.</p>
     ${healingSummary}
     <p><strong>${esc(targetActor.name)}</strong> rolled <strong>${roll.total}</strong> to release Soul Burn.</p>
     <p><strong>AG Tolerance:</strong> ${current.tolerance}</p>
     <p><strong>Aetherglow Blocked:</strong> ${blocked}</p>
     <p><strong>Soul Burn Removed:</strong> ${removed}</p>
     <p><strong>Soul Burn:</strong> ${current.burn} → ${next.burn}</p>
     <p><strong>AG Tolerance:</strong> ${current.tolerance} → ${next.tolerance}</p>
     <p><em>${toleranceLine(next.tolerance)}</em></p>`,
    roll
  );
  return true;
}

async function consumeAetherglow(sourceActor, { item = null, chargeAlreadySpent = false } = {}) {
  const amulet = item ?? sourceActor.items.find(
    ownedItem => ownedItem.getFlag("soul-burn", "action") === "glow"
  );
  if (!amulet) throw new Error(`${sourceActor.name} does not have the Holy Amulet of Lux Eterna.`);

  const candidates = game.actors
    .filter(actor => actor.type === "character" && (actor.hasPlayerOwner || actor.id === sourceActor.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (!candidates.length) throw new Error("No player characters are available to receive Aetherglow.");

  const options = candidates.map(actor => {
    const current = state(actor);
    const selected = actor.id === sourceActor.id ? "selected" : "";
    const status = hasSoulBurnResource(actor)
      ? `Soul Burn ${current.burn}/${maximumBurn(actor)}`
      : "Heals HP";
    return `<option value="${actor.id}" ${selected}>${esc(actor.name)} — ${status}, AG ${current.tolerance}</option>`;
  }).join("");
  const targetActorId = await choose(
    "Give Aetherglow",
    `<p>Who receives this Aetherglow charge?</p>
     <div class="form-group"><label>Recipient</label><select name="targetActor">${options}</select></div>
     <p class="notes">The recipient rolls 1d20. Soul Burn users apply AG Tolerance and release at least 1 Soul Burn; other recipients heal from the roll. Every exposure raises AG Tolerance by 1.</p>`,
    {
      give: {
        icon: '<i class="fas fa-flask"></i>',
        label: "Give & Roll",
        value: html => html.find('[name="targetActor"]').val()
      },
      cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel", value: null }
    },
    "give"
  );
  if (!targetActorId) return false;
  const targetActor = game.actors.get(targetActorId);
  if (!targetActor) throw new Error("The selected Aetherglow recipient no longer exists.");

  if (!chargeAlreadySpent) await spendItemCharge(amulet, "The Holy Amulet of Lux Eterna");

  if (game.user.isGM || targetActor.isOwner) {
    return applyAetherglow(targetActor, sourceActor);
  }

  const primaryGM = game.users
    .filter(user => user.isGM && user.active)
    .sort((a, b) => a.id.localeCompare(b.id))[0];
  if (!primaryGM) throw new Error("An active GM is required to give Aetherglow to another player's character.");
  game.socket.emit("module.soul-burn", {
    type: "consumeAetherglow",
    gmId: primaryGM.id,
    requesterId: game.user.id,
    sourceActorId: sourceActor.id,
    targetActorId: targetActor.id
  });
  ui.notifications.info(`Aetherglow was offered to ${targetActor.name}. The GM is resolving it.`);
  return true;
}

async function runSoulBurnAction(action, {
  actor = null,
  token = null,
  item = null,
  chargeAlreadySpent = false
} = {}) {
  try {
    const subject = await resolveSubject(actor, token);
    if (!subject) return;
    const actions = {
      open: () => dashboard(subject.actor, subject.token),
      activate: () => activate(subject.actor, subject.token),
      surge: () => aetherSurge(subject.actor),
      // Compatibility for chat cards created before AetherStrike was renamed.
      strike: () => aetherSurge(subject.actor),
      channel: () => channelAether(subject.actor, { item, chargeAlreadySpent }),
      fate: () => fateShift(subject.actor),
      glow: () => consumeAetherglow(subject.actor, { item, chargeAlreadySpent }),
      end: () => endBurn(subject.actor)
    };
    if (!actions[action]) throw new Error(`Unknown Soul Burn action: ${action}`);
    return await actions[action]();
  } catch (error) {
    notifyError(error);
  }
}

async function showRules() {
  new Dialog({
    title: "Soul Burn Rules",
    content: `<div class="soul-burn-rules">
      <h2>What is Soul Burn?</h2>
      <p>Soul Burn is a Bonus Action reservoir granted by interacting with Aether. To enter Soul Burn, you must have an available Hit Die and roll it without expending it; your soul begins to burn, pushing you beyond mortal limits.</p>
      <p>While Soul Burnin', you have double movement and one free Soul Burn action each turn.</p>
      <h2>Max Soul Burn</h2>
      <p>Your maximum Soul Burn is the total maximum of all your Hit Dice. If current Soul Burn exceeds that maximum, your soul becomes unstable and is permanently destroyed when the current burn period ends. This is Burnout.</p>
      <h2>AetherSurge: Utilizing Hit Dice (1 Action)</h2>
      <p>Once per attack after you hit, spend and roll a Hit Die. Add it to either the attack roll or the damage roll, but not both. Added damage is Radiant.</p>
      <h2>Channel Aether (1 Action or Reaction, 2 Charges)</h2>
      <p>Spend one of the feature's two charges and make an attack roll against one visible enemy. On a hit, deal Radiant damage equal to your Hit Die roll + your level. No Hit Die is consumed.</p>
      <h2>Fate Shift (1 Legendary Action)</h2>
      <p>Declare a rule bend, break, or modification for GM approval. It is not permission to create infinite resources or simply wish an enemy dead. When complete, Soul Burn ends.</p>
    </div>`,
    buttons: { close: { icon: '<i class="fas fa-times"></i>', label: "Close" } },
    default: "close",
    options: { width: 600 }
  }).render(true);
}

async function showPlayerUses(activeActor) {
  const entries = game.actors
    .filter(a => a.type === "character" && (a.hasPlayerOwner || a.id === activeActor.id))
    .map(a => {
      const s = state(a);
      return `<div style="margin-bottom:12px">
        <p style="margin:0"><strong>${esc(cleanName(a.name))}:</strong> Uses ${s.uses} | <strong>AG Tolerance:</strong> 1d20-${s.tolerance}</p>
        <p style="margin:2px 0 0"><em>${toleranceLine(s.tolerance)}</em></p>
      </div>`;
    }).join("");

  new Dialog({
    title: "Soul Burn Player Uses",
    content: `<p>Over time, repeated exposure to Aetherglow may dull your sensitivity to it, making it harder to release Soul Burn damage from your soul.</p>
      <p>AG Tolerance is subtracted from any roll made to remove Soul Burn from your body.</p><hr>${entries || "<p>No player characters found.</p>"}`,
    buttons: {
      close: { icon: '<i class="fas fa-times"></i>', label: "Close" }
    },
    default: "close",
    options: { width: 600 }
  }).render(true);
}

async function dashboard(actor, token) {
  const current = state(actor);
  const max = maximumBurn(actor);
  const dice = classData(actor);
  const primary = dice[0];
  const diceText = dice.length
    ? dice.map(c => `${esc(c.item.name)}: ${c.remaining}/${c.levels}d${c.faces}`).join("<br>")
    : "No class Hit Dice found";
  const combatWarning = current.active
    && game.combat
    && current.combatId === game.combat.id
    && current.endsRound !== null
    && game.combat.round >= current.endsRound
    ? `<p class="notification warning">The recorded burn period has ended. The GM client is restoring the transformation.</p>`
    : "";

  const activeButtons = current.active ? `
    <div style="display:flex;justify-content:center;margin-top:10px">
      <button type="button" data-sb-action="end" style="width:100%;min-height:38px">
        <i class="fas fa-stop"></i> END SOUL BURN
      </button>
    </div>` : "";

  const action = await new Promise(resolve => {
    let settled = false;
    const finish = (value, app) => {
      if (settled) return;
      settled = true;
      resolve(value);
      app?.close();
    };
    const dialog = new Dialog({
      title: "Soul Burn",
      content: `<div style="text-align:center">
        <h1 style="margin:0;border-bottom:1px solid var(--color-border-light-primary)">Soul Burnin'</h1>
        <p><strong>An ancient power drawn from the Luminara within grants the power to bend time and space, but at the cost of lifeforce.</strong></p>
        <p><strong>${esc(cleanName(actor.name))}</strong></p>
        <p>Hit Die: ${primary ? `1d${primary.faces}` : "—"}</p>
        <p>Soul Burn: <strong>${current.burn} / ${max}</strong> | Uses: ${current.uses} | Burnout Odds: <strong>${primary ? burnoutChance(primary.faces, max - current.burn) : 0}%</strong></p>
        ${current.active ? `<p>Status: <strong>ACTIVE</strong>${current.burnout ? " | <strong>Burnout pending</strong>" : ""}<br>${diceText}</p>` : ""}
        ${combatWarning}
        <div style="display:flex;justify-content:center;gap:8px;margin:10px 0">
          <button type="button" data-sb-action="uses" style="flex:0 0 28%">Player Uses</button>
          <button type="button" data-sb-action="info" style="flex:0 0 28%">More Info</button>
        </div>
        ${activeButtons}
      </div>`,
      buttons: current.active ? {
        cancel: { icon: '<i class="fas fa-times"></i>', label: "Close", callback: () => finish(null) }
      } : {
        cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel", callback: () => finish(null) },
        activate: { icon: '<i class="fas fa-fire"></i>', label: "SOUL BURN", callback: () => finish("activate") }
      },
      default: current.active ? "cancel" : "cancel",
      render: html => {
        html.find("[data-sb-action]").on("click", event => {
          const value = event.currentTarget.dataset.sbAction;
          if (value === "uses") return showPlayerUses(actor);
          if (value === "info") return showRules();
          finish(value, dialog);
        });
      },
      close: () => finish(null)
    });
    dialog.render(true);
  });

  if (action) await runSoulBurnAction(action, { actor, token });
}

async function openSoulBurn({ actor = null, token = null } = {}) {
  try {
    const subject = await resolveSubject(actor, token);
    if (subject) await dashboard(subject.actor, subject.token);
  } catch (error) {
    notifyError(error);
  }
}

Hooks.once("tidy5e-sheet.ready", api => {
  api.registerCharacterTab(
    new api.models.HandlebarsTab({
      title: "Soul Burn",
      tabId: "soul-burn-actions",
      path: "/modules/soul-burn/templates/soul-burn-tab.hbs",
      tabContentsClasses: ["soul-burn-tidy-tab"],
      enabled: context =>
        context.actor?.type === "character"
        && state(context.actor).active,
      getData: async data => {
        const actor = data.actor;
        const current = state(actor);
        const actions = ownedSoulBurnActionItems(actor)
          .sort((a, b) =>
            SB.temporaryActions.indexOf(normalizedSoulBurnAction(a))
            - SB.temporaryActions.indexOf(normalizedSoulBurnAction(b))
          )
          .map(item => {
            const uses = item.system.uses ?? {};
            return {
              id: item.id,
              action: normalizedSoulBurnAction(item),
              name: item.name,
              img: item.img,
              activation: item.system.activation?.type
                ? CONFIG.DND5E.activationTypes?.[item.system.activation.type]?.label
                  ?? item.system.activation.type
                : "",
              hasUses: Number(uses.max ?? 0) > 0,
              uses: Number(uses.value ?? 0),
              maxUses: Number(uses.max ?? 0)
            };
          });
        return {
          actorName: actor.name,
          actions,
          tracked: Boolean(current.combatId && current.startedRound !== null),
          startedRound: current.startedRound,
          lastRound: current.endsRound === null ? null : Number(current.endsRound) - 1
        };
      }
    }),
    { layout: "all" }
  );
});

Hooks.on("tidy5e-sheet.renderActorSheet", (app, element) => {
  const actor = app.actor;
  if (!actor || actor.type !== "character") return;
  const root = element instanceof HTMLElement ? element : element?.[0];
  if (!root) return;
  const itemsToIsolate = state(actor).active
    ? allOwnedSoulBurnActionItems(actor)
    : temporarySoulBurnActions(actor);
  for (const item of itemsToIsolate) {
    for (const node of root.querySelectorAll(`[data-item-id="${item.id}"]`)) {
      if (!node.closest(".soul-burn-tidy-tab")) {
        node.classList.add("soul-burn-managed-hidden");
      }
    }
  }

  const feature = soulBurnFeature(actor);
  if (!feature || game.user.isGM) return;
  for (const node of root.querySelectorAll(`[data-item-id="${feature.id}"]`)) {
    node.classList.add("soul-burn-feature-locked");
    node.setAttribute("title", "Soul Burn is managed by the module and locked for players.");
    for (const control of node.querySelectorAll(
      ".item-edit, .item-delete, [data-action='edit'], [data-action='delete']"
    )) {
      control.classList.add("soul-burn-managed-hidden");
    }
  }
});

Hooks.on("renderCompendium", (app, html) => {
  if (app.collection?.collection !== SB.pack) return;
  const canonicalExists = app.collection.index?.has?.("AetherStrikeFeat")
    ?? app.collection.index?.some?.(entry => entry._id === "AetherStrikeFeat");
  if (!canonicalExists) return;
  const root = html?.jquery ? html : $(html);
  root.find(
    '[data-document-id="AetherSurgeFeat"], '
    + '[data-entry-id="AetherSurgeFeat"], '
    + '[data-id="AetherSurgeFeat"]'
  ).remove();
});

Hooks.once("ready", async () => {
  game.soulBurn = Object.freeze({
    open: openSoulBurn,
    run: runSoulBurnAction,
    getState: actor => state(actor),
    version: "1.0.10"
  });

  await cleanLegacyCompendiumIndex();

  game.socket.on("module.soul-burn", async request => {
    if (!game.user.isGM || request?.gmId !== game.user.id) return;
    if (request.type !== "consumeAetherglow") return;
    const requester = game.users.get(request.requesterId);
    const sourceActor = game.actors.get(request.sourceActorId);
    const targetActor = game.actors.get(request.targetActorId);
    if (!requester || !sourceActor || !targetActor) return;
    if (!sourceActor.testUserPermission(requester, "OWNER")) {
      console.warn("Soul Burn | Rejected unauthorized Aetherglow request.", request);
      return;
    }
    try {
      await applyAetherglow(targetActor, sourceActor);
    } catch (error) {
      notifyError(error);
    }
  });

  if (!game.user.isGM) return;

  // Repairs characters that received the feature before this module version.
  for (const actor of game.actors.filter(a => a.type === "character")) {
    const hasSoulBurn = actor.items.some(item => item.getFlag("soul-burn", "action") === "activate");
    if (hasSoulBurn) await initializeSoulBurnResource(actor);
    if (state(actor).active) await ensureTemporarySoulBurnActions(actor);
    else await removeTemporarySoulBurnActions(actor);
    if (hasSoulBurn) await syncSoulBurnFeature(actor, state(actor).active);
  }
  if (game.combat) await expireDueSoulBurn(game.combat);

  const command = "game.soulBurn.open();";
  let macro = game.macros.getName("Soul Burn");
  if (!macro) {
    macro = await Macro.create({
      name: "Soul Burn",
      type: "script",
      img: "modules/soul-burn/icons/soul-burn.png",
      command,
      ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER },
      flags: { "soul-burn": { managed: true } }
    });
    ui.notifications.info("Soul Burn | Player macro created.");
  } else if (macro.getFlag("soul-burn", "managed")) {
    const updates = {};
    if (macro.command !== command) updates.command = command;
    if (macro.img !== "modules/soul-burn/icons/soul-burn.png") {
      updates.img = "modules/soul-burn/icons/soul-burn.png";
    }
    if (Object.keys(updates).length) await macro.update(updates);
  }
});

Hooks.on("renderChatMessage", (message, html) => {
  const resolved = [
    ["glow", "aetherglowResolved", "Aetherglow Used"],
    ["channel", "channelResolved", "Channel Aether Used"]
  ];
  for (const [action, flag, label] of resolved) {
    if (!message.getFlag("soul-burn", flag)) continue;
    html.find(`[data-soul-burn-action="${action}"]`)
      .prop("disabled", true)
      .html(`<i class="fas fa-check"></i> ${label}`);
  }
});

Hooks.on("createItem", async (item, _options, userId) => {
  if (userId !== game.user.id) return;
  if (item.getFlag("soul-burn", "action") !== "activate") return;
  await initializeSoulBurnResource(item.parent);
  await syncSoulBurnFeature(item.parent, state(item.parent).active);
  ui.notifications.info(`${item.parent.name}'s tertiary resource is configured as Soul Burn.`);
});

Hooks.on("preUpdateItem", (item, _changes, options, userId) => {
  if (options?.soulBurnInternal) return true;
  if (!item.parent || item.getFlag(SB.scope, "action") !== "activate") return true;
  const user = game.users.get(userId);
  if (user?.isGM) return true;
  if (userId === game.user.id) {
    ui.notifications.warn("Soul Burn is managed by the module and cannot be edited by players.");
  }
  return false;
});

Hooks.on("preDeleteItem", (item, options, userId) => {
  if (options?.soulBurnInternal) return true;
  if (!item.parent || item.getFlag(SB.scope, "action") !== "activate") return true;
  const user = game.users.get(userId);
  if (user?.isGM) return true;
  if (userId === game.user.id) {
    ui.notifications.warn("Soul Burn is managed by the module and cannot be deleted by players.");
  }
  return false;
});

Hooks.on("renderItemSheet", (app, html) => {
  const item = app.item;
  if (
    game.user.isGM
    || !item?.parent
    || item.getFlag(SB.scope, "action") !== "activate"
  ) return;

  const sheetHtml = html?.jquery ? html : $(html);
  sheetHtml.addClass("soul-burn-locked-item-sheet");
  sheetHtml.find("input, textarea, select").prop("disabled", true);
  sheetHtml.find("button").not("[data-soul-burn-action]").prop("disabled", true);
  if (!sheetHtml.find(".soul-burn-lock-notice").length) {
    sheetHtml.prepend(
      '<div class="soul-burn-lock-notice"><i class="fas fa-lock"></i> '
      + "Soul Burn is module-managed. Only a GM can edit or delete it.</div>"
    );
  }
});

const expiringSoulBurnActors = new Set();

async function expireDueSoulBurn(combat) {
  if (!game.user.isGM || !combat) return;
  const primaryGM = game.users
    .filter(user => user.isGM && user.active)
    .sort((a, b) => a.id.localeCompare(b.id))[0];
  if (primaryGM?.id !== game.user.id) return;

  const round = Number(combat.round ?? 0);
  for (const actor of game.actors.filter(actor => actor.type === "character")) {
    const current = state(actor);
    if (!current.active) continue;
    if (current.combatId !== combat.id || current.endsRound === null) continue;
    if (round < Number(current.endsRound)) continue;
    if (expiringSoulBurnActors.has(actor.id)) continue;

    expiringSoulBurnActors.add(actor.id);
    try {
      await endBurn(actor, "Soul Burn Duration Ends");
    } catch (error) {
      notifyError(error);
    } finally {
      expiringSoulBurnActors.delete(actor.id);
    }
  }
}

Hooks.on("updateCombat", async (combat, changes) => {
  if (changes.round === undefined) return;
  await expireDueSoulBurn(combat);
});

// V11/dnd5e 2.4.1 can replace chat-card HTML after render hooks fire.
// Delegation at document level keeps compendium feature buttons dependable.
$(document)
  .off("click.soulBurnGlobal", "[data-soul-burn-action]")
  .on("click.soulBurnGlobal", "[data-soul-burn-action]", async event => {
    event.preventDefault();
    event.stopPropagation();
    const button = $(event.currentTarget);
    const action = event.currentTarget.dataset.soulBurnAction;
    const limitedAction = ["glow", "channel"].includes(action);
    const resolvedFlag = action === "glow" ? "aetherglowResolved" : "channelResolved";
    const messageId = button.closest(".chat-message").data("message-id");
    const message = messageId ? game.messages.get(messageId) : null;
    if (limitedAction && message?.getFlag("soul-burn", resolvedFlag)) {
      return ui.notifications.warn(`This ${action === "glow" ? "Aetherglow" : "Channel Aether"} chat-card charge has already been used.`);
    }
    const messageActorId = message?.speaker?.actor;
    const appId = button.closest(".app").data("appid");
    const app = appId ? ui.windows[appId] : null;
    const actor = messageActorId
      ? game.actors.get(messageActorId)
      : app?.actor ?? app?.item?.parent ?? null;
    const rowItemId = button.closest("[data-item-id]").data("item-id");
    const item = app?.item
      ?? (rowItemId && actor ? actor.items.get(rowItemId) : null)
      ?? (limitedAction && actor
        ? actor.items.find(ownedItem => ownedItem.getFlag("soul-burn", "action") === action)
        : null);
    button.prop("disabled", true);
    try {
      const completed = await runSoulBurnAction(action, {
        actor,
        item,
        chargeAlreadySpent: limitedAction && Boolean(message)
      });
      if (limitedAction && completed === true && message) {
        try {
          await message.setFlag("soul-burn", resolvedFlag, true);
          button.html(`<i class="fas fa-check"></i> ${action === "glow" ? "Aetherglow Used" : "Channel Aether Used"}`);
        } catch (error) {
          console.warn("Soul Burn | Could not lock the used limited-use chat card.", error);
        }
      }
    } finally {
      if (!limitedAction || !message?.getFlag("soul-burn", resolvedFlag)) {
        button.prop("disabled", false);
      }
    }
  });
