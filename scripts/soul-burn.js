/**
 * SOUL BURN — Foundry VTT / dnd5e world macro
 *
 * Mechanical state is stored on the Actor, not in a journal. The macro works
 * from a controlled token or from the executing user's assigned character.
 * Sequencer and TokenMagic FX are optional; the original animation is retained.
 */

const SB = {
  moduleId: "soul-burn",
  stateScope: "world",
  key: "soulBurn",
  effectName: "Soul Burn",
  pack: "soul-burn.soul-burn-features",
  temporaryActions: ["surge", "channel", "fate", "exit"],
  transformedTokenRoot:
    "https://assets.forge-vtt.com/62bf9a2b7fa42ce7966f6738/STARPG/CharTokens/AstrumKnights",
  defaultPowerUpSound: "modules/soul-burn/sounds/AetherUp3.ogg",
  defaultAetherglowSound: "modules/soul-burn/sounds/AetherGlow.ogg",
  defaultEndSound: "modules/soul-burn/sounds/RagePowerDown.ogg",
  defaultFateShiftSeconds: 30,
  defaultFateShiftMessage:
    "You have {seconds} seconds to describe how you are bending reality to your will. The GM will adjudicate.",
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
      closeOnSubmit: true,
      tabs: [{
        navSelector: ".soul-burn-settings-tabs",
        contentSelector: ".soul-burn-settings-body",
        initial: "sounds"
      }]
    });
  }

  getData() {
    return {
      powerUpSound: soundPath("powerUpSound"),
      aetherglowSound: soundPath("aetherglowSound"),
      endSound: soundPath("endSound"),
      rippleContrast: game.settings.get("soul-burn", "rippleContrast"),
      rippleDesaturation: game.settings.get("soul-burn", "rippleDesaturation"),
      rippleRecoverySeconds: game.settings.get("soul-burn", "rippleRecoverySeconds"),
      highStakesMode: game.settings.get("soul-burn", "highStakesMode"),
      requireEndConSave: game.settings.get("soul-burn", "requireEndConSave"),
      applyExhaustionOnFailedConCheck: game.settings.get(
        "soul-burn",
        "applyExhaustionOnFailedConCheck"
      ),
      endConSaveDC: game.settings.get("soul-burn", "endConSaveDC"),
      fateShiftTimerSeconds: game.settings.get("soul-burn", "fateShiftTimerSeconds"),
      fateShiftTimerMessage: game.settings.get("soul-burn", "fateShiftTimerMessage"),
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

    const requireCheck = html.find('[name="requireEndConSave"]');
    const applyExhaustion = html.find('[name="applyExhaustionOnFailedConCheck"]');
    const checkDC = html.find('[name="endConSaveDC"]');
    const syncConstitutionSettings = () => {
      const enabled = requireCheck.prop("checked");
      checkDC.prop("disabled", !enabled);
      checkDC.closest(".form-group").toggleClass("soul-burn-setting-disabled", !enabled);
    };
    applyExhaustion.on("change", () => {
      if (applyExhaustion.prop("checked")) requireCheck.prop("checked", true);
      syncConstitutionSettings();
    });
    requireCheck.on("change", () => {
      if (!requireCheck.prop("checked")) applyExhaustion.prop("checked", false);
      syncConstitutionSettings();
    });
    syncConstitutionSettings();
  }

  async _updateObject(_event, formData) {
    await game.settings.set("soul-burn", "powerUpSound", String(formData.powerUpSound ?? "").trim());
    await game.settings.set("soul-burn", "aetherglowSound", String(formData.aetherglowSound ?? "").trim());
    await game.settings.set("soul-burn", "endSound", String(formData.endSound ?? "").trim());
    await game.settings.set(
      "soul-burn",
      "rippleContrast",
      Math.min(200, Math.max(0, Number(formData.rippleContrast) || 0))
    );
    await game.settings.set(
      "soul-burn",
      "rippleDesaturation",
      Math.min(100, Math.max(0, Number(formData.rippleDesaturation) || 0))
    );
    await game.settings.set(
      "soul-burn",
      "rippleRecoverySeconds",
      Math.min(600, Math.max(1, Number(formData.rippleRecoverySeconds) || 60))
    );
    const applyExhaustion = Boolean(formData.applyExhaustionOnFailedConCheck);
    const requireEndConSave = Boolean(formData.requireEndConSave) || applyExhaustion;
    await game.settings.set("soul-burn", "highStakesMode", Boolean(formData.highStakesMode));
    await game.settings.set("soul-burn", "requireEndConSave", requireEndConSave);
    await game.settings.set(
      "soul-burn",
      "applyExhaustionOnFailedConCheck",
      applyExhaustion
    );
    await game.settings.set(
      "soul-burn",
      "endConSaveDC",
      Math.min(30, Math.max(1, Number(formData.endConSaveDC) || 10))
    );
    await game.settings.set(
      "soul-burn",
      "fateShiftTimerSeconds",
      Math.min(
        600,
        Math.max(1, Number(formData.fateShiftTimerSeconds) || SB.defaultFateShiftSeconds)
      )
    );
    await game.settings.set(
      "soul-burn",
      "fateShiftTimerMessage",
      String(formData.fateShiftTimerMessage ?? "").trim()
        || SB.defaultFateShiftMessage
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
      closeOnSubmit: true
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
          transformedImage: current.transformedImage,
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
    html.find("[data-clear-player]").on("click", async event => {
      event.preventDefault();
      const actor = game.actors.get(event.currentTarget.dataset.clearPlayer);
      if (!actor) return;
      const current = state(actor);
      const confirmed = await Dialog.confirm({
        title: `Clear ${actor.name}'s Soul Burn Data`,
        content: `<p>This resets <strong>${esc(actor.name)}</strong>'s AGT and removes Soul Burn from the tertiary resource slot.</p>
          ${current.active
            ? `<p><strong>${esc(actor.name)} is actively Soul Burning.</strong> The burn will end normally first, including Burnout resolution and configured end checks.</p>`
            : ""}
          <p>Lifetime Uses and the configured transformation image are preserved.</p>`
      });
      if (!confirmed) return;
      await clearSoulBurnFromSheet(actor, {
        tolerance: 0,
        uses: current.uses,
        reason: "Soul Burn reset from Player Management"
      });
      ui.notifications.info(`${actor.name}'s AGT and Soul Burn resource were cleared.`);
      this.render();
    });
    html.find("[data-transform-image]").on("click", async event => {
      event.preventDefault();
      const actor = game.actors.get(event.currentTarget.dataset.transformImage);
      if (!actor) return;
      await configureActorTransformImage(actor);
      this.render();
    });
    html.find("[data-reset-all-tolerance]").on("click", async event => {
      event.preventDefault();
      for (const actor of game.actors.filter(a => a.type === "character" && a.hasPlayerOwner)) {
        await saveManagedState(actor, { ...state(actor), tolerance: 0 });
      }
      ui.notifications.info("All player AGT values were reset.");
      this.render();
    });
  }

  async _updateObject(_event, formData) {
    for (const actor of game.actors.filter(a => a.type === "character" && a.hasPlayerOwner)) {
      const current = state(actor);
      const prefix = `actors.${actor.id}.`;
      const burnKey = `${prefix}burn`;
      const hasBurnInput = Object.prototype.hasOwnProperty.call(formData, burnKey);
      const submittedBurn = hasBurnInput
        ? Math.max(0, Number(formData[burnKey]) || 0)
        : current.burn;
      const next = {
        ...current,
        burn: submittedBurn,
        uses: Math.max(0, Number(formData[`${prefix}uses`] ?? current.uses)),
        tolerance: Math.min(19, Math.max(0, Number(formData[`${prefix}tolerance`] ?? current.tolerance)))
      };

      if (hasBurnInput && submittedBurn === 0) {
        await clearSoulBurnFromSheet(actor, {
          tolerance: next.tolerance,
          uses: next.uses,
          reason: "Soul Burn reset from Player Management"
        });
        continue;
      }

      if (hasBurnInput) {
        await saveState(actor, { ...next, resourceCleared: false });
      } else {
        await saveMetadataOnly(actor, next);
      }
    }
    ui.notifications.info("Soul Burn player data saved.");
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
    name: "AetherGlow Drinking Sound",
    hint: "Audio played when a character consumes AetherGlow.",
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
  game.settings.register("soul-burn", "rippleContrast", {
    name: "Battlefield Ripple Contrast Increase",
    hint: "Percentage of additional battlefield contrast after Soul Burn activates.",
    scope: "world",
    config: false,
    type: Number,
    default: 10
  });
  game.settings.register("soul-burn", "rippleDesaturation", {
    name: "Battlefield Ripple Desaturation",
    hint: "Percentage of color removed from the battlefield after Soul Burn activates.",
    scope: "world",
    config: false,
    type: Number,
    default: 100
  });
  game.settings.register("soul-burn", "rippleRecoverySeconds", {
    name: "Battlefield Ripple Recovery Time",
    hint: "Real-time seconds for the battlefield to return to normal.",
    scope: "world",
    config: false,
    type: Number,
    default: 60
  });
  game.settings.register("soul-burn", "requireEndConSave", {
    name: "Require Constitution Check When Soul Burn Ends",
    hint: "Roll a Constitution ability check and report the result when any Soul Burn period ends.",
    scope: "world",
    config: false,
    type: Boolean,
    default: false
  });
  game.settings.register("soul-burn", "applyExhaustionOnFailedConCheck", {
    name: "Apply Exhaustion on Failed Constitution Check",
    hint: "Add one exhaustion level when the configured end-of-burn Constitution check fails.",
    scope: "world",
    config: false,
    type: Boolean,
    default: false
  });
  game.settings.register("soul-burn", "highStakesMode", {
    name: "High Stakes Mode",
    hint: "Each lifetime Soul Burn use adds another Hit Die to the next activation roll.",
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
  game.settings.register("soul-burn", "fateShiftTimerSeconds", {
    name: "Fate Shift Countdown",
    hint: "Real-time seconds available to describe a Fate Shift.",
    scope: "world",
    config: false,
    type: Number,
    default: SB.defaultFateShiftSeconds
  });
  game.settings.register("soul-burn", "fateShiftTimerMessage", {
    name: "Fate Shift Countdown Message",
    hint: "Message shown during the countdown. Use {seconds} for the remaining seconds.",
    scope: "world",
    config: false,
    type: String,
    default: SB.defaultFateShiftMessage
  });
  game.settings.registerMenu("soul-burn", "soundSettings", {
    name: "Soul Burn Settings",
    label: "Configure Soul Burn",
    hint: "Configure the battlefield ripple, High Stakes Mode, sounds, and end-of-burn Constitution checks.",
    icon: "fas fa-fire-flame-curved",
    type: SoulBurnSoundSettings,
    restricted: true
  });
  game.settings.registerMenu("soul-burn", "playerManager", {
    name: "Soul Burn Players",
    label: "Manage Players",
    hint: "Review and edit player Soul Burn resources, lifetime uses, and AGT.",
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
  const saved = foundry.utils.deepClone(actor.getFlag(SB.stateScope, SB.key) ?? {});
  return {
    // Soul Burn is the sheet's tertiary resource. Flags only hold metadata.
    burn: hasSoulBurnResource(actor)
      ? Number(actor.system.resources?.tertiary?.value ?? 0)
      : 0,
    uses: Number(saved.uses ?? 0),
    tolerance: Math.min(19, Number(saved.tolerance ?? 0)),
    active: Boolean(saved.active),
    burnout: Boolean(saved.burnout),
    resourceCleared: Boolean(saved.resourceCleared),
    transformedImage: String(saved.transformedImage ?? ""),
    combatId: saved.combatId ?? null,
    startedRound: saved.startedRound ?? null,
    endsRound: saved.endsRound ?? null,
    durationRounds: Number(saved.durationRounds ?? 0),
    baseMovement: saved.baseMovement ?? {},
    originalImages: saved.originalImages ?? {}
  };
}

function defaultTokenImage(actor) {
  const current = state(actor);
  const savedOriginal = Object.values(current.originalImages ?? {}).find(Boolean);
  const activeToken = actorTokens(actor)[0];
  return String(
    savedOriginal
    ?? activeToken?.document?.texture?.src
    ?? actor.prototypeToken?.texture?.src
    ?? actor.img
    ?? ""
  );
}

async function configureActorTransformImage(actor) {
  const current = state(actor);
  const original = defaultTokenImage(actor);
  const selected = await Dialog.wait({
    title: `${actor.name} — Soul Burn Transformation`,
    content: `<div class="soul-burn-transform-editor">
      <div class="form-group stacked">
        <label>Current Default Token Image</label>
        <div class="form-fields">
          <input type="text" name="defaultImage" value="${esc(original)}" readonly>
        </div>
        <p class="hint">Automatically detected from the active token, prototype token, or Actor portrait.</p>
      </div>
      <div class="form-group stacked">
        <label>Soul Burn Transformed Image</label>
        <div class="form-fields">
          <input type="text" name="transformedImage" value="${esc(current.transformedImage)}" placeholder="Choose an image or video">
          <button type="button" data-browse-transform title="Browse">
            <i class="fas fa-folder-open"></i>
          </button>
        </div>
        <p class="hint">This character-specific image replaces the token while Soul Burn is active.</p>
      </div>
    </div>`,
    buttons: {
      save: {
        icon: '<i class="fas fa-save"></i>',
        label: "Save",
        callback: html => String(html.find('[name="transformedImage"]').val() ?? "").trim()
      },
      clear: {
        icon: '<i class="fas fa-eraser"></i>',
        label: "Use Legacy Default",
        callback: () => ""
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
        callback: () => null
      }
    },
    default: "save",
    render: html => {
      html.find("[data-browse-transform]").on("click", event => {
        event.preventDefault();
        const input = html.find('[name="transformedImage"]');
        new FilePicker({
          type: "imagevideo",
          current: input.val(),
          callback: path => input.val(path).trigger("change")
        }).render(true);
      });
    },
    close: () => null
  });
  if (selected === null) return;
  await saveMetadataOnly(actor, {
    ...current,
    transformedImage: selected
  });
  ui.notifications.info(
    selected
      ? `${actor.name}'s Soul Burn transformation image was saved.`
      : `${actor.name} will use the legacy Soul Burn transformation path.`
  );
}

function soulBurnItemFlag(item, key) {
  return item?.getFlag?.(SB.moduleId, key)
    ?? item?.getFlag?.(SB.stateScope, key);
}

function isTemporarySoulBurnAction(item) {
  return Boolean(soulBurnItemFlag(item, "temporaryAction"));
}

function normalizedSoulBurnAction(item) {
  const flagged = soulBurnItemFlag(item, "action");
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
      Number(isTemporarySoulBurnAction(b)) - Number(isTemporarySoulBurnAction(a))
    );
  for (const item of candidates) {
    const action = normalizedSoulBurnAction(item);
    if (!byAction.has(action)) byAction.set(action, item);
  }
  return SB.temporaryActions.map(action => byAction.get(action)).filter(Boolean);
}

function stripSoulBurnActionButtons(description) {
  return String(description ?? "").replace(
    /<p>\s*<button[^>]*data-soul-burn-action="(?:surge|strike|channel|fate)"[\s\S]*?<\/button>\s*<\/p>/gi,
    ""
  );
}

function configureRegularSoulBurnItem(data, action, actor) {
  const hitDice = classData(actor);
  const availableHitDice = hitDice.filter(entry => entry.remaining > 0);
  const largest = Math.max(
    1,
    ...(availableHitDice.length ? availableHitDice : hitDice).map(entry => entry.faces)
  );
  const level = hitDice.reduce((sum, entry) => sum + entry.levels, 0);
  data.system.description ??= {};
  data.system.description.value = stripSoulBurnActionButtons(
    data.system.description?.value
  );

  if (action === "surge") {
    data.name = "AetherSurge";
    data.img = "modules/soul-burn/icons/aethersurge.png";
    data.system.actionType = "other";
    data.system.formula = `1d${largest}`;
    // dnd5e 2.4.1 does not expose Hit Dice as a standard Item consumption
    // target. The post-use hook below expends the die without replacing the
    // Item's normal roll/chat workflow.
    data.system.consume = { type: "", target: null, amount: null };
  } else if (action === "channel") {
    data.system.ability = "";
    data.system.actionType = "rsak";
    data.system.damage = {
      ...(data.system.damage ?? {}),
      parts: [[`1d${largest} + ${level}`, "radiant"]]
    };
  } else if (action === "fate") {
    data.system.actionType = "other";
    data.system.formula = "";
    data.system.uses = {
      ...(data.system.uses ?? {}),
      prompt: true
    };
  } else if (action === "exit") {
    data.name = "Exit Soul Burn";
    data.img = "modules/soul-burn/icons/soul-burn.png";
    data.system.description ??= {};
    data.system.description.value =
      "<p>End your active Soul Burn. The normal ending workflow resolves immediately, including Burnout and configured end checks.</p>";
    data.system.activation = { type: "bonus", cost: 1, condition: "" };
    data.system.target = { value: null, width: null, units: "", type: "self" };
    data.system.range = { value: null, long: null, units: "self" };
    data.system.uses = { value: null, max: "", per: null, recovery: "" };
    data.system.consume = { type: "", target: null, amount: null };
    data.system.actionType = "other";
    data.system.formula = "";
  }
  return data;
}

async function ensureTemporarySoulBurnActions(actor) {
  if (!actor || actor.type !== "character") return [];

  const legacySurges = actor.items
    .filter(item =>
      normalizedSoulBurnAction(item) === "surge"
      && (
        soulBurnItemFlag(item, "action") === "strike"
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
  const keep = new Map();
  const duplicates = [];
  for (const item of managed) {
    const action = normalizedSoulBurnAction(item);
    const legacySurge = action === "surge" && (
      soulBurnItemFlag(item, "action") !== "surge"
      || item.name !== "AetherSurge"
    );
    if (!SB.temporaryActions.includes(action) || legacySurge || keep.has(action)) {
      duplicates.push(item.id);
    }
    else keep.set(action, item);
  }
  if (duplicates.length) {
    await actor.deleteEmbeddedDocuments(
      "Item",
      duplicates,
      { soulBurnInternal: true }
    );
  }

  const missing = SB.temporaryActions.filter(action => !keep.has(action));
  if (missing.length) {
    const pack = game.packs.get(SB.pack);
    if (!pack) throw new Error("The Soul Burn Features compendium is unavailable.");
    const sourceItems = await pack.getDocuments();
    const sourceByAction = new Map(
      sourceItems.map(item => [normalizedSoulBurnAction(item), item])
    );
    const creates = missing.map(action => {
      const source = action === "exit"
        ? sourceByAction.get("activate") ?? soulBurnFeature(actor)
        : sourceByAction.get(action);
      if (!source) throw new Error(`The ${action} action is missing from the Soul Burn compendium.`);
      const data = source.toObject();
      delete data._id;
      data.flags ??= {};
      data.flags[SB.moduleId] = {
        ...(data.flags[SB.moduleId] ?? {}),
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
      return configureRegularSoulBurnItem(data, action, actor);
    });
    const created = await actor.createEmbeddedDocuments("Item", creates);
    for (const item of created) keep.set(normalizedSoulBurnAction(item), item);
  }

  const updates = [...keep.entries()].map(([action, item]) => {
    const data = configureRegularSoulBurnItem(item.toObject(), action, actor);
    data.flags ??= {};
    data.flags[SB.moduleId] = {
      ...(data.flags[SB.moduleId] ?? {}),
      action,
      temporaryAction: true
    };
    data._id = item.id;
    return data;
  });
  if (updates.length) {
    await actor.updateEmbeddedDocuments("Item", updates, { soulBurnInternal: true });
  }
  return temporarySoulBurnActions(actor);
}

async function removeTemporarySoulBurnActions(actor) {
  const ids = temporarySoulBurnActions(actor).map(item => item.id);
  if (ids.length) {
    await actor.deleteEmbeddedDocuments(
      "Item",
      ids,
      { soulBurnInternal: true }
    );
  }
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
  if (!actor) return;
  const applications = new Set([
    actor.sheet,
    ...Object.values(actor.apps ?? {}),
    ...Object.values(ui.windows ?? {}).filter(app =>
      app?.actor?.id === actor.id || app?.object?.id === actor.id
    )
  ]);

  // PopOut! moves an application's DOM into another browser window while
  // retaining the Foundry Application object. Refresh every rendered Actor
  // application so Tidy rebuilds its conditional Inventory content in either
  // place.
  setTimeout(() => {
    for (const app of applications) {
      if (!app?.rendered) continue;
      try {
        app.render(true);
      } catch (error) {
        console.warn("Soul Burn | Could not refresh an open character sheet.", error);
      }
    }
  }, 25);
}

function soulBurnFeature(actor) {
  return actor?.items?.find(item => soulBurnItemFlag(item, "action") === "activate") ?? null;
}

async function syncSoulBurnFeature(actor, active = state(actor).active) {
  const item = soulBurnFeature(actor);
  if (!item) return;

  let description = String(item.system.description?.value ?? "")
    .replace(
      /<p>\s*<strong>\s*This feature requires an available Hit Die\.\s*<\/strong>\s*<\/p>/gi,
      ""
    );
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
  await actor.setFlag(SB.stateScope, SB.key, metadata);
}

async function saveMetadataOnly(actor, next) {
  const { burn: _burn, ...metadata } = next;
  await actor.setFlag(SB.stateScope, SB.key, metadata);
}

async function saveManagedState(actor, next) {
  if (hasSoulBurnResource(actor)) return saveState(actor, next);
  return saveMetadataOnly(actor, next);
}

async function clearSoulBurnFromSheet(
  actor,
  {
    tolerance = state(actor).tolerance,
    uses = state(actor).uses,
    reason = "Soul Burn reset"
  } = {}
) {
  if (state(actor).active) await endBurn(actor, reason);
  const ended = state(actor);
  await actor.update({
    "system.resources.tertiary.label": "",
    "system.resources.tertiary.value": null,
    "system.resources.tertiary.max": null
  });
  await saveMetadataOnly(actor, {
    ...ended,
    burn: 0,
    uses: Math.max(0, Number(uses) || 0),
    tolerance: Math.min(19, Math.max(0, Number(tolerance) || 0)),
    active: false,
    burnout: false,
    resourceCleared: true,
    combatId: null,
    startedRound: null,
    endsRound: null,
    durationRounds: 0,
    baseMovement: {},
    originalImages: {}
  });
  renderActorSheetSoon(actor);
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

function highStakesDiceCount(current) {
  return game.settings.get("soul-burn", "highStakesMode")
    ? Math.max(1, Math.floor(Number(current.uses ?? 0)) + 1)
    : 1;
}

function burnoutFinale(actor) {
  const name = esc(actor.name);
  const finales = [
    {
      style: "Absolute",
      text: `Burnout is now absolute. ${name}'s soul is permanently destroyed, beyond resurrection or recovery. ${name} may speak a final farewell as ${name}'s body begins to smolder before collapsing into ash.`
    },
    {
      style: "Cold and Clinical",
      text: `The Burnout condition is resolved. ${name}'s soul is permanently annihilated. ${name}'s body rapidly destabilizes, heating from within before disintegrating into fine ash. ${name} may utter a final sentence before being gone forever.`
    },
    {
      style: "Haunting",
      text: `The last ember fades. ${name}'s soul is extinguished forever, leaving behind only an empty shell. ${name} has but a moment to say goodbye before ${name}'s body quietly burns away on an unseen flame.`
    },
    {
      style: "Cosmic Horror",
      text: `Burnout reaches its inevitable conclusion. ${name}'s soul is consumed entirely, leaving no spirit to pass on, no echo to remember. ${name}'s body begins to simmer, unraveling into drifting cinders as reality forgets ${name} ever existed.`
    },
    {
      style: "Fantasy Epic",
      text: `The flames claim their final due. ${name}'s soul is forever lost, unable to return to the cycle of life or death. ${name} may offer final words before ${name}'s body is reduced to glowing embers carried away by the wind.`
    },
    {
      style: "Bleak",
      text: `There is nothing left to save. Burnout permanently destroys ${name}'s soul. ${name}'s body grows unnaturally hot, fractures apart, and scatters into ash. This is the end of ${name}.`
    },
    {
      style: "Poetic",
      text: `The fire within ${name} burns one final time. Soul and self dissolve together, leaving neither memory nor afterlife. As warmth escapes ${name}'s fading form, ${name} may whisper one last goodbye before becoming dust.`
    },
    {
      style: "Violent",
      text: `Burnout detonates from within ${name}. ${name}'s soul is obliterated in an instant, while ${name}'s body seethes with unbearable heat before erupting into a cloud of blackened ash. ${name} has only seconds to speak final words.`
    },
    {
      style: "Quiet and Tragic",
      text: `The end comes gently. ${name}'s soul slips into oblivion, erased forever. ${name} may share a final farewell as ${name}'s body slowly steams, softens, and drifts apart like cooling embers in the breeze.`
    },
    {
      style: "Rulebook Style",
      text: `When Burnout resolves, ${name} immediately dies. ${name}'s soul is permanently destroyed and cannot be restored by any ability, spell, or divine intervention. Before ${name}'s body smolders into ash and disperses, ${name} may deliver one final statement.`
    }
  ];
  return finales[Math.floor(Math.random() * finales.length)];
}

function burnoutChance(faces, remaining, count = 1) {
  faces = Math.max(1, Number(faces) || 1);
  count = Math.max(1, Number(count) || 1);
  remaining = Math.floor(Number(remaining) || 0);
  if (remaining < count) return 100;
  if (remaining >= count * faces) return 0;

  // Probability distribution truncated to totals that do not cause Burnout.
  // This remains fast even with many lifetime uses because remaining Soul Burn,
  // rather than the maximum possible roll, bounds the array.
  let safeTotals = [1];
  for (let die = 0; die < count; die += 1) {
    const next = Array(remaining + 1).fill(0);
    for (let total = 0; total < safeTotals.length; total += 1) {
      if (!safeTotals[total]) continue;
      for (let face = 1; face <= faces && total + face <= remaining; face += 1) {
        next[total + face] += safeTotals[total] / faces;
      }
    }
    safeTotals = next;
  }
  const safeChance = safeTotals.reduce((sum, probability) => sum + probability, 0);
  return Math.min(100, Math.max(0, Math.round((1 - safeChance) * 1000) / 10));
}

function toleranceLine(value) {
  const lines = [
    "Soul Burn washes away beautifully.",
    "Soul Burn washes away beautifully.",
    "AetherGlow feels miraculous.",
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
    "AetherGlow gives almost nothing."
  ];
  return lines[Math.min(19, Math.max(0, Number(value) || 0))];
}

const RIPPLE_EXPANSION_MS = 2400;
let activeBattlefieldRipple = null;

function battlefieldRippleSettings() {
  return {
    contrast: Math.min(
      200,
      Math.max(0, Number(game.settings.get("soul-burn", "rippleContrast")) || 0)
    ),
    desaturation: Math.min(
      100,
      Math.max(0, Number(game.settings.get("soul-burn", "rippleDesaturation")) || 0)
    ),
    recoverySeconds: Math.min(
      600,
      Math.max(1, Number(game.settings.get("soul-burn", "rippleRecoverySeconds")) || 60)
    )
  };
}

function stopBattlefieldRipple() {
  const active = activeBattlefieldRipple;
  if (!active) return;
  activeBattlefieldRipple = null;
  active.animation?.cancel();
  if (active.timer) clearTimeout(active.timer);
  active.overlay?.remove();
  if (active.view) {
    active.view.style.filter = active.baseFilter;
    active.view.style.transition = active.baseTransition;
  }
}

function battlefieldScreenPoint(worldPoint, view) {
  try {
    const screen = canvas.stage.worldTransform.apply(
      new PIXI.Point(worldPoint.x, worldPoint.y)
    );
    const rendererScreen = canvas.app.renderer.screen;
    const rect = view.getBoundingClientRect();
    return {
      x: screen.x * (rect.width / rendererScreen.width),
      y: screen.y * (rect.height / rendererScreen.height)
    };
  } catch (error) {
    console.warn("Soul Burn | Could not calculate the battlefield ripple origin.", error);
    return null;
  }
}

function battlefieldRippleOrigin({ tokenId, actorId, x, y }, view) {
  const liveToken = tokenId
    ? canvas.tokens?.get(tokenId)
    : canvas.tokens?.placeables?.find(placeable => placeable.actor?.id === actorId);
  const liveCenter = liveToken?.center;
  if (
    liveCenter
    && Number.isFinite(Number(liveCenter.x))
    && Number.isFinite(Number(liveCenter.y))
  ) {
    return battlefieldScreenPoint(liveCenter, view);
  }
  return battlefieldScreenPoint({ x: Number(x), y: Number(y) }, view);
}

async function playBattlefieldRipple({ sceneId, actorId, tokenId, x, y } = {}) {
  if (!canvas?.ready || !canvas.scene || canvas.scene.id !== sceneId) return;
  const view = canvas.app?.view ?? canvas.app?.canvas;
  if (!view?.getBoundingClientRect) return;

  const settings = battlefieldRippleSettings();
  const rect = view.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  // Each connected client resolves the live token center through its own
  // camera transform. The transmitted scene position is only a fallback.
  const point = battlefieldRippleOrigin({ tokenId, actorId, x, y }, view);
  if (!point) return;

  stopBattlefieldRipple();

  const overlay = document.createElement("div");
  overlay.className = "soul-burn-battlefield-overlay";
  Object.assign(overlay.style, {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`
  });

  const distance = Math.max(
    Math.hypot(point.x, point.y),
    Math.hypot(rect.width - point.x, point.y),
    Math.hypot(point.x, rect.height - point.y),
    Math.hypot(rect.width - point.x, rect.height - point.y)
  );
  const diameter = Math.max(1, distance * 2.08);
  const contrast = 100 + settings.contrast;
  const circle = document.createElement("div");
  circle.className = "soul-burn-battlefield-wave";
  Object.assign(circle.style, {
    width: `${diameter}px`,
    height: `${diameter}px`,
    left: `${point.x - diameter / 2}px`,
    top: `${point.y - diameter / 2}px`,
    backdropFilter: `contrast(${contrast}%) grayscale(${settings.desaturation}%)`,
    webkitBackdropFilter: `contrast(${contrast}%) grayscale(${settings.desaturation}%)`
  });
  overlay.append(circle);
  document.body.append(overlay);

  const baseFilter = view.style.filter;
  const baseTransition = view.style.transition;
  const colorGrade = [
    baseFilter,
    `contrast(${contrast}%)`,
    `grayscale(${settings.desaturation}%)`
  ].filter(Boolean).join(" ");
  const animation = circle.animate(
    [
      { transform: "scale(0.001)", opacity: 0 },
      { transform: "scale(1)", opacity: 1 }
    ],
    {
      duration: RIPPLE_EXPANSION_MS,
      easing: "cubic-bezier(0.12, 0.72, 0.22, 1)",
      fill: "forwards"
    }
  );

  const effect = {
    animation,
    overlay,
    view,
    baseFilter,
    baseTransition,
    timer: null
  };
  activeBattlefieldRipple = effect;

  try {
    await animation.finished;
  } catch (_error) {
    if (activeBattlefieldRipple === effect) {
      activeBattlefieldRipple = null;
      overlay.remove();
      view.style.filter = baseFilter;
      view.style.transition = baseTransition;
    }
    return;
  }
  if (activeBattlefieldRipple !== effect) return;

  // Transfer the color grade from the expanding backdrop-filter to the canvas
  // itself, then animate only that grade back to the user's original filter.
  view.style.transition = "none";
  view.style.filter = colorGrade;
  overlay.remove();
  void view.offsetWidth;
  view.style.transition = [
    baseTransition,
    `filter ${settings.recoverySeconds}s linear`
  ].filter(Boolean).join(", ");
  requestAnimationFrame(() => {
    if (activeBattlefieldRipple === effect) {
      view.style.filter = baseFilter || "none";
    }
  });

  effect.timer = setTimeout(() => {
    if (activeBattlefieldRipple !== effect) return;
    activeBattlefieldRipple = null;
    view.style.filter = baseFilter;
    view.style.transition = baseTransition;
  }, settings.recoverySeconds * 1000 + 150);
}

function broadcastBattlefieldRipple(token) {
  if (!token || !canvas.scene) return;
  const center = token.center ?? {
    x: Number(token.document.x ?? 0) + Number(token.w ?? 0) / 2,
    y: Number(token.document.y ?? 0) + Number(token.h ?? 0) / 2
  };
  const request = {
    type: "battlefieldRipple",
    requesterId: game.user.id,
    actorId: token.actor?.id,
    tokenId: token.document?.id,
    sceneId: canvas.scene.id,
    x: Number(center.x),
    y: Number(center.y)
  };
  void playBattlefieldRipple(request);
  game.socket.emit("module.soul-burn", request);
}

Hooks.on("canvasTearDown", () => {
  stopBattlefieldRipple();
});

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
      const animationDuration = 5400;
      const sequence = new Sequence()
        .effect()
        .file(SB.sacredFlame)
        .atLocation(token)
        .scale(2)
        .duration(animationDuration);
      // Sequencer versions differ on whether play() resolves at launch or at
      // completion. Waiting on both guarantees that the grayscale ripple never
      // starts before the configured full-color animation has finished.
      await Promise.all([sequence.play(), wait(animationDuration)]);
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
  const transformedImage = String(nextState.transformedImage ?? "").trim()
    || `${SB.transformedTokenRoot}/${encodeURIComponent(imageName)}.webp`;
  try {
    await token.document.update({ "texture.src": transformedImage });
  } catch (error) {
    console.warn("Soul Burn | Transformed token image unavailable.", error);
  }

  // Keep the completed transformation visible in full color for one full
  // second. The original live backdrop-filter ripple then begins from the
  // activating token; no canvas snapshot or duplicate color aura is created.
  await wait(1000);
  broadcastBattlefieldRipple(token);
}

function isManagedSoulBurnEffect(effect) {
  return Boolean(
    effect?.getFlag(SB.moduleId, "managed")
    ?? effect?.getFlag(SB.stateScope, "managed")
  );
}

async function applyMovement(actor) {
  const existing = actor.effects.find(e =>
    (e.name ?? e.label) === SB.effectName
    && isManagedSoulBurnEffect(e)
  );
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
    flags: { [SB.moduleId]: { managed: true } }
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
    .filter(e => (e.name ?? e.label) === SB.effectName && isManagedSoulBurnEffect(e))
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
      `<p>Choose an available Hit Die type for the Soul Burn roll. Entering Soul Burn does not expend it. High Stakes Mode may roll multiple dice of the selected type.</p><div class="form-group"><label>Hit Die</label><select name="classId">${options}</select></div>`,
      {
        burn: { icon: '<i class="fas fa-fire"></i>', label: "Soul Burn", value: html => html.find('[name="classId"]').val() },
        cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel", value: null }
      },
      "burn"
    );
    return dice.find(c => c.item.id === id);
  })();
  if (!chosen) return;

  const diceCount = highStakesDiceCount(current);
  const activationFormula = `${diceCount}d${chosen.faces}`;
  const chance = burnoutChance(chosen.faces, max - current.burn, diceCount);
  const confirmed = await choose(
    "Confirm Soul Burn",
    `<p><strong>${esc(actor.name)}</strong> has ${current.burn} / ${max} Soul Burn.</p>
     <p>Roll: <strong>${activationFormula}</strong>${diceCount > 1 ? " (High Stakes Mode)" : ""}. Chance to exceed the maximum: <strong>${chance}%</strong>.</p>`,
    {
      burn: { icon: '<i class="fas fa-fire"></i>', label: `Roll ${activationFormula}`, value: true },
      cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel", value: false }
    },
    "cancel"
  );
  if (!confirmed) return;

  // The character must have this die available, but entry only rolls it.
  // AetherSurge is the Soul Burn action that actually expends Hit Dice.
  const roll = await makeRoll(activationFormula);
  const durationRounds = Math.max(
    1,
    Number(
      diceCount > 1
        ? roll.dice?.[0]?.results?.[0]?.result
        : roll.total
    ) || 1
  );
  const staleMovementEffects = actor.effects
    .filter(effect =>
      (effect.name ?? effect.label) === SB.effectName
      && isManagedSoulBurnEffect(effect)
    )
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
    resourceCleared: false,
    active: true,
    burnout: current.burn + roll.total > max,
    combatId: trackCombat ? combat.id : null,
    startedRound: trackCombat ? combatRound : null,
    endsRound: trackCombat ? combatRound + durationRounds : null,
    durationRounds,
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
    `<p><strong>${esc(actor.name)}</strong> gains double movement and one Soul Burn action each turn for <strong>${durationRounds}</strong> rounds.</p>
     <p><strong>Soul Burn Roll:</strong> ${activationFormula} = ${roll.total}${diceCount > 1 ? " — High Stakes Mode" : ""}</p>
     ${diceCount > 1 ? `<p><strong>Duration Die:</strong> The first d${chosen.faces} rolled ${durationRounds}; only that die determines the duration.</p>` : ""}
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

  const activeCombat = game.combat;
  const currentRound = Number(activeCombat?.round ?? 0);
  const unusedRounds = current.combatId
    && activeCombat?.id === current.combatId
    && current.endsRound !== null
    && currentRound < Number(current.endsRound)
    ? Math.max(0, Number(current.endsRound) - currentRound - 1)
    : 0;
  const burnRefund = Math.min(current.burn, unusedRounds);

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
    burn: current.burn - burnRefund,
    active: false,
    combatId: null,
    startedRound: null,
    endsRound: null,
    durationRounds: 0,
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
    let exhaustionSummary = "";
    if (
      !passed
      && game.settings.get("soul-burn", "applyExhaustionOnFailedConCheck")
    ) {
      const previousExhaustion = Math.min(
        6,
        Math.max(0, Number(actor.system.attributes?.exhaustion) || 0)
      );
      const nextExhaustion = Math.min(6, previousExhaustion + 1);
      if (nextExhaustion !== previousExhaustion) {
        await actor.update({ "system.attributes.exhaustion": nextExhaustion });
      }
      exhaustionSummary = `
        <p><strong>Exhaustion Applied:</strong> Level ${previousExhaustion} → ${nextExhaustion}${nextExhaustion >= 6 ? " (maximum)" : ""}</p>`;
    }
    constitutionSummary = `
      <p><strong>Constitution Check:</strong> ${constitutionRoll.total} vs DC ${dc}
      — <strong>${passed ? "Success" : "Failure"}</strong></p>
      ${exhaustionSummary}
      ${exhaustionSummary
        ? ""
        : "<p><em>The GM resolves the consequences of this check.</em></p>"}`;
  }

  const durationSummary = current.combatId && current.startedRound !== null
    ? `<p><strong>Tracked Period:</strong> Round ${current.startedRound} through the end of round ${Number(current.endsRound) - 1}.</p>`
    : "";
  const refundSummary = burnRefund > 0
    ? `<p><strong>Early Exit:</strong> ${unusedRounds} unused round${unusedRounds === 1 ? "" : "s"} removed <strong>${burnRefund} Soul Burn</strong> (${current.burn} → ${current.burn - burnRefund}).</p>`
    : "";
  const restoredMovement = movementSpeeds(actor);
  const movementRestoredSummary = `
    <p><strong>Movement Restored:</strong> ${esc(movementSummary(restoredMovement))}</p>`;
  const finale = current.burnout ? burnoutFinale(actor) : null;
  await chat(
    actor,
    finale ? `${actor.name} — Burnout` : reason,
    `${durationSummary}${refundSummary}${movementRestoredSummary}${finale
      ? `<p><strong>${esc(finale.style)}</strong></p><p>${finale.text}</p>`
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
      console.warn("Soul Burn | AetherGlow sound skipped.", error);
    }
  }

  const roll = await makeRoll(
    "max(1, 1d20 - @tolerance)",
    { tolerance: current.tolerance }
  );
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
    <p><strong>AetherGlow Roll:</strong> max(1, 1d20 − AGT ${current.tolerance}) = ${roll.total}</p>
    <p><strong>Hit Points Restored:</strong> ${healing}</p>
    <p><strong>Hit Points:</strong> ${oldHp} → ${oldHp + healing} / ${maxHp}</p>
    <p><strong>Effects Removed:</strong> ${cleansed.length ? cleansed.map(esc).join(", ") : "None"}</p>`;

  if (!hasSoulBurnResource(targetActor)) {
    const next = { ...current, tolerance: nextTolerance };
    await saveMetadataOnly(targetActor, next);
    await chat(
      sourceActor,
      "AetherGlow Consumed",
      `<p><strong>${esc(sourceActor.name)}</strong> gives AetherGlow to <strong>${esc(targetActor.name)}</strong>.</p>
       ${healingSummary}
       <p><strong>Soul Burn:</strong> No Soul Burn resource—no release required.</p>
       <p><strong>AGT:</strong> ${current.tolerance} → ${next.tolerance}</p>
       <p><em>AGT still rises because the soul remembers every exposure to AetherGlow.</em></p>`,
      roll
    );
    return true;
  }

  const recovery = roll.total;
  const removed = Math.min(current.burn, recovery);
  const next = {
    ...current,
    burn: Math.max(0, current.burn - removed),
    tolerance: nextTolerance
  };
  await saveState(targetActor, next);
  await chat(
    sourceActor,
    "AetherGlow Consumed",
     `<p><strong>${esc(sourceActor.name)}</strong> gives AetherGlow to <strong>${esc(targetActor.name)}</strong>.</p>
     ${healingSummary}
     <p><strong>Soul Burn Recovery:</strong> ${recovery}</p>
     <p><strong>Soul Burn Cleared:</strong> ${removed}</p>
     <p><strong>Soul Burn:</strong> ${current.burn} → ${next.burn}</p>
     <p><strong>AGT:</strong> ${current.tolerance} → ${next.tolerance}</p>
     <p><em>${removed > 0
       ? toleranceLine(next.tolerance)
       : current.burn > 0
         ? "The AetherGlow produces no Soul Burn recovery."
         : "There is no Soul Burn left to clear."}</em></p>`,
    roll
  );
  return true;
}

async function consumeAetherglow(sourceActor, { item = null, chargeAlreadySpent = false } = {}) {
  const amulet = item ?? sourceActor.items.find(
    ownedItem => ownedItem.getFlag("soul-burn", "action") === "glow"
  );
  if (!amulet) throw new Error(`${sourceActor.name} does not have the Holy Amulet of Lux Eterna.`);

  const playerCandidates = game.actors
    .filter(actor => actor.type === "character" && (actor.hasPlayerOwner || actor.id === sourceActor.id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(actor => ({ actor, uuid: actor.uuid, label: actor.name }));
  const sceneNpcs = new Map();
  for (const token of canvas.scene?.tokens ?? []) {
    const actor = token.actor;
    if (!actor || actor.type !== "npc") continue;
    const key = token.actorLink ? actor.uuid : token.uuid;
    if (!key || sceneNpcs.has(key)) continue;
    sceneNpcs.set(key, {
      actor,
      uuid: token.uuid,
      label: token.name || actor.name
    });
  }
  const npcCandidates = [...sceneNpcs.values()]
    .sort((a, b) => a.label.localeCompare(b.label));
  if (!playerCandidates.length && !npcCandidates.length) {
    throw new Error("No player characters or scene NPCs are available to receive AetherGlow.");
  }

  const optionFor = ({ actor, uuid, label }) => {
    const current = state(actor);
    const selected = actor.uuid === sourceActor.uuid ? "selected" : "";
    const status = hasSoulBurnResource(actor)
      ? `Soul Burn ${current.burn}/${maximumBurn(actor)}`
      : "Heals HP";
    return `<option value="${esc(uuid)}" ${selected}>${esc(label)} — ${status}, AGT ${current.tolerance}</option>`;
  };
  const groups = [
    playerCandidates.length
      ? `<optgroup label="Player Characters">${playerCandidates.map(optionFor).join("")}</optgroup>`
      : "",
    npcCandidates.length
      ? `<optgroup label="Scene NPCs">${npcCandidates.map(optionFor).join("")}</optgroup>`
      : ""
  ].join("");
  const targetActorUuid = await choose(
    "Give AetherGlow",
    `<p>Who receives this AetherGlow charge?</p>
     <div class="form-group"><label>Recipient</label><select name="targetActor">${groups}</select></div>
     <p class="notes">AetherGlow always restores HP. If the recipient has Soul Burn, it also reduces Soul Burn. Both effects are reduced by AG Tolerance, and each exposure increases tolerance by 1 up to a maximum of 19.</p>`,
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
  if (!targetActorUuid) return false;
  const targetDocument = await fromUuid(targetActorUuid);
  const targetActor = targetDocument?.documentName === "Actor"
    ? targetDocument
    : targetDocument?.actor ?? null;
  if (!targetActor) throw new Error("The selected AetherGlow recipient no longer exists.");

  if (!chargeAlreadySpent) await spendItemCharge(amulet, "The Holy Amulet of Lux Eterna");

  if (game.user.isGM || targetActor.isOwner) {
    return applyAetherglow(targetActor, sourceActor);
  }

  const primaryGM = game.users
    .filter(user => user.isGM && user.active)
    .sort((a, b) => a.id.localeCompare(b.id))[0];
  if (!primaryGM) throw new Error("An active GM is required to give AetherGlow to another player's character.");
  game.socket.emit("module.soul-burn", {
    type: "consumeAetherglow",
    gmId: primaryGM.id,
    requesterId: game.user.id,
    sourceActorId: sourceActor.id,
    targetActorUuid
  });
  ui.notifications.info(`AetherGlow was offered to ${targetActor.name}. The GM is resolving it.`);
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
      <p>If the GM enables High Stakes Mode, the first lifetime use rolls one die, the second rolls two, the third rolls three, and so on. The total increases Soul Burn, while the first die alone determines the duration in rounds.</p>
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
        <p style="margin:0"><strong>${esc(cleanName(a.name))}:</strong> Uses ${s.uses} | <strong>AGT:</strong> 1d20-${s.tolerance}</p>
        <p style="margin:2px 0 0"><em>${toleranceLine(s.tolerance)}</em></p>
      </div>`;
    }).join("");

  new Dialog({
    title: "Soul Burn Player Uses",
    content: `<p>Over time, repeated exposure to AetherGlow may dull your sensitivity to it, making it harder to release Soul Burn damage from your soul.</p>
      <p>AGT is subtracted from any roll made to remove Soul Burn from your body.</p><hr>${entries || "<p>No player characters found.</p>"}`,
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
  const burnProgress = max > 0
    ? Math.min(100, Math.max(0, (current.burn / max) * 100))
    : 0;
  const dice = classData(actor);
  const primary = dice[0];
  const nextDiceCount = highStakesDiceCount(current);
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
        <p>Next Soul Burn Roll: ${primary ? `${nextDiceCount}d${primary.faces}` : "—"}${nextDiceCount > 1 ? " <strong>(High Stakes)</strong>" : ""}</p>
        <p>Soul Burn: <strong>${current.burn} / ${max}</strong> | Uses: ${current.uses} | Burnout Odds: <strong>${primary ? burnoutChance(primary.faces, max - current.burn, nextDiceCount) : 0}%</strong></p>
        <div class="soul-burn-progress" role="progressbar" aria-label="Soul Burn accumulation" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${current.burn}" title="${current.burn} / ${max} Soul Burn">
          <span style="width:${burnProgress}%"></span>
        </div>
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

function soulBurnInventoryData(actor) {
  const current = state(actor);
  const actions = temporarySoulBurnActions(actor)
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
        activation: item.labels?.activation
          ?? CONFIG.DND5E.abilityActivationTypes?.[item.system.activation?.type]
          ?? item.system.activation?.type
          ?? "Special",
        hasUses: Number(uses.max ?? 0) > 0,
        uses: Number(uses.value ?? 0),
        maxUses: Number(uses.max ?? 0)
      };
    });
  return {
    actorId: actor.id,
    actorName: actor.name,
    isGM: game.user.isGM,
    actions,
    roundsLabel: current.combatId && current.endsRound !== null && game.combat?.id === current.combatId
      ? `${Math.max(0, Number(current.endsRound) - Number(game.combat.round ?? 0))} rounds remain`
      : current.durationRounds > 0
        ? `${current.durationRounds} rounds (manual)`
        : "Manual duration"
  };
}

async function removeLegacyTidySoulBurnTabSelection(actor) {
  if (!game.modules.get("tidy5e-sheet")?.active || actor?.type !== "character") return;
  const selected = actor.getFlag("tidy5e-sheet", "selected-tabs");
  if (!Array.isArray(selected) || !selected.includes("soul-burn-actions")) return;
  await actor.setFlag(
    "tidy5e-sheet",
    "selected-tabs",
    selected.filter(id => id !== "soul-burn-actions")
  );
}

let tidySoulBurnApi = null;
const tidySoulBurnRenderGeneration = new WeakMap();

Hooks.once("tidy5e-sheet.ready", api => {
  tidySoulBurnApi = api;
});

function bindTidySoulBurnInventory(section, actor) {
  for (const control of section.querySelectorAll("[data-sb-item-use]")) {
    control.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      const item = actor.items.get(event.currentTarget.dataset.sbItemUse);
      if (item) await item.use();
    });
  }
  for (const control of section.querySelectorAll("[data-sb-item-view]")) {
    control.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      actor.items.get(event.currentTarget.dataset.sbItemView)?.sheet.render(true);
    });
  }
}

async function injectTidySoulBurnInventory(app, element) {
  const actor = app?.actor;
  const root = element?.nodeType === 1 ? element : element?.[0];
  if (!actor || actor.type !== "character" || !root) return;

  const generation = (tidySoulBurnRenderGeneration.get(root) ?? 0) + 1;
  tidySoulBurnRenderGeneration.set(root, generation);
  for (const previous of root.querySelectorAll(".soul-burn-inventory-section")) {
    const wrapper = previous.closest("[data-tidy-render-scheme]");
    (wrapper ?? previous).remove();
  }
  if (!state(actor).active) return;

  if (temporarySoulBurnActions(actor).length < SB.temporaryActions.length) {
    await ensureTemporarySoulBurnActions(actor);
  }
  if (
    tidySoulBurnRenderGeneration.get(root) !== generation
    || !state(actor).active
  ) return;

  const api = tidySoulBurnApi ?? game.modules.get("tidy5e-sheet")?.api;
  const inventoryTabId = api?.constants?.TAB_ID_CHARACTER_INVENTORY
    ?? api?.constants?.TAB_CHARACTER_INVENTORY
    ?? "inventory";
  const itemsSelector = api?.getSheetPartSelector && api?.constants?.SHEET_PARTS?.ITEMS_CONTAINER
    ? api.getSheetPartSelector(api.constants.SHEET_PARTS.ITEMS_CONTAINER)
    : '[data-tidy-sheet-part="items-container"]';
  const inventoryTab = root.querySelector(`[data-tab-contents-for="${inventoryTabId}"]`);
  let itemsContainer = inventoryTab?.querySelector(itemsSelector);
  if (!itemsContainer) {
    await wait(0);
    itemsContainer = root
      .querySelector(`[data-tab-contents-for="${inventoryTabId}"]`)
      ?.querySelector(itemsSelector);
  }
  if (!itemsContainer || tidySoulBurnRenderGeneration.get(root) !== generation) {
    console.warn("Soul Burn | Tidy Inventory items container was not available for injection.");
    return;
  }

  const renderHandlebarsTemplate = globalThis.renderTemplate
    ?? globalThis.foundry?.applications?.handlebars?.renderTemplate;
  if (!renderHandlebarsTemplate) {
    console.warn("Soul Burn | Foundry's Handlebars renderer is unavailable.");
    return;
  }
  const rendered = await renderHandlebarsTemplate(
    "modules/soul-burn/templates/soul-burn-inventory.hbs",
    soulBurnInventoryData(actor)
  );
  if (
    tidySoulBurnRenderGeneration.get(root) !== generation
    || !state(actor).active
  ) return;
  const wrapped = api?.useHandlebarsRendering
    ? api.useHandlebarsRendering(rendered)
    : rendered;
  itemsContainer.insertAdjacentHTML("afterbegin", wrapped);
  const section = itemsContainer.querySelector(
    `.soul-burn-inventory-section[data-actor-id="${actor.id}"]`
  );
  if (section) bindTidySoulBurnInventory(section, actor);
}

Hooks.on("tidy5e-sheet.renderActorSheet", (app, element) => {
  const actor = app.actor;
  if (!actor || actor.type !== "character") return;
  const root = element?.nodeType === 1 ? element : element?.[0];
  if (!root) return;
  void injectTidySoulBurnInventory(app, root);
  const itemsToIsolate = state(actor).active
    ? allOwnedSoulBurnActionItems(actor)
    : temporarySoulBurnActions(actor);
  for (const item of itemsToIsolate) {
    for (const node of root.querySelectorAll(`[data-item-id="${item.id}"]`)) {
      if (!node.closest(".soul-burn-inventory-section")) {
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

// Tidy and dnd5e expose several different Item launch paths. Intercept the
// actual sheet click during capture, before any sheet listener can create the
// deprecated Item card. Attaching to the sheet root also survives PopOut!
// moving that application into a separate browser window.
const soulBurnInterceptedSheets = new WeakSet();

function installSoulBurnSheetInterception(app, element) {
  const root = element?.nodeType === 1 ? element : element?.[0];
  const actor = app?.actor;
  if (!root || !actor || soulBurnInterceptedSheets.has(root)) return;
  soulBurnInterceptedSheets.add(root);

  root.addEventListener("click", event => {
    const row = event.target?.closest?.("[data-item-id]");
    if (!row || !root.contains(row)) return;
    const item = actor.items.get(row.dataset.itemId);
    if (soulBurnItemFlag(item, "action") !== "activate") return;

    // Preserve explicit GM maintenance controls while routing every ordinary
    // player-facing launch control to the Soul Burn dashboard.
    if (
      game.user.isGM
      && event.target.closest(
        ".item-edit, .item-delete, [data-action*='edit'], [data-action*='delete']"
      )
    ) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    scheduleSoulBurnDashboard(item);
  }, true);
}

Hooks.on("renderActorSheet", (app, element) => {
  installSoulBurnSheetInterception(app, element);
});

Hooks.on("tidy5e-sheet.renderActorSheet", (app, element) => {
  installSoulBurnSheetInterception(app, element);
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
    version: "1.0.27"
  });

  await cleanLegacyCompendiumIndex();

  game.socket.on("module.soul-burn", async request => {
    if (request?.type === "battlefieldRipple") {
      if (request.requesterId === game.user.id) return;
      const requester = game.users.get(request.requesterId);
      const actor = game.actors.get(request.actorId);
      const authorized = requester
        && actor
        && actor.testUserPermission(requester, "OWNER");
      if (
        authorized
        && request.sceneId === canvas.scene?.id
        && Number.isFinite(Number(request.x))
        && Number.isFinite(Number(request.y))
      ) {
        void playBattlefieldRipple(request);
      }
      return;
    }

    if (!game.user.isGM || request?.gmId !== game.user.id) return;
    if (request.type !== "consumeAetherglow") return;
    const requester = game.users.get(request.requesterId);
    const sourceActor = game.actors.get(request.sourceActorId);
    const targetDocument = request.targetActorUuid
      ? await fromUuid(request.targetActorUuid)
      : game.actors.get(request.targetActorId);
    const targetActor = targetDocument?.documentName === "Actor"
      ? targetDocument
      : targetDocument?.actor ?? null;
    if (!requester || !sourceActor || !targetActor) return;
    const sceneNpcAllowed = targetActor.type === "npc"
      && (canvas.scene?.tokens ?? []).some(token =>
        token.uuid === request.targetActorUuid
        || token.actor?.uuid === targetActor.uuid
      );
    if (targetActor.type !== "character" && !sceneNpcAllowed) {
      console.warn("Soul Burn | Rejected invalid AetherGlow recipient.", request);
      return;
    }
    if (!sourceActor.testUserPermission(requester, "OWNER")) {
      console.warn("Soul Burn | Rejected unauthorized AetherGlow request.", request);
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
    await removeLegacyTidySoulBurnTabSelection(actor);
    if (hasSoulBurn && !state(actor).resourceCleared) {
      await initializeSoulBurnResource(actor);
    }
    if (state(actor).active) {
      await ensureTemporarySoulBurnActions(actor);
    }
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

function soulBurnChatItem(message, html) {
  const chatHtml = html?.jquery ? html : $(html);
  const card = chatHtml.find(".dnd5e.chat-card.item-card").first();
  const itemId = message.getFlag("soul-burn", "itemId")
    ?? message.getFlag("dnd5e", "use.itemId")
    ?? card.data("item-id");
  const actorId = message.speaker?.actor ?? card.data("actor-id");
  const actor = actorId ? game.actors.get(actorId) : null;
  const item = actor?.items.get(itemId) ?? null;
  return {
    actor,
    item,
    card,
    action: message.getFlag("soul-burn", "itemAction")
      ?? soulBurnItemFlag(item, "action")
  };
}

function injectSoulBurnChatControl(message, html) {
  const { card, action } = soulBurnChatItem(message, html);
  const controls = {
    glow: {
      icon: "fas fa-flask",
      label: "Pour AetherGlow"
    },
    channel: {
      icon: "fas fa-sun",
      label: "Channel Aether"
    }
  };
  const control = controls[action];
  if (!card.length || !control) return;

  // Description HTML is editable and may be sanitized by Foundry's rich-text
  // editor. Remove any legacy embedded control and always build the operational
  // button from the Item's module flag instead.
  card.find(`[data-soul-burn-action="${action}"]`).remove();
  let buttons = card.find(".card-buttons").first();
  if (!buttons.length) {
    buttons = $('<div class="card-buttons"></div>');
    card.find(".card-content").after(buttons);
  }
  buttons.append(
    `<button type="button" class="soul-burn-chat-action" data-soul-burn-action="${action}">
      <i class="${control.icon}"></i> ${control.label}
    </button>`
  );
}

Hooks.on("renderChatMessage", (message, html) => {
  const chatHtml = html?.jquery ? html : $(html);
  injectSoulBurnChatControl(message, chatHtml);
  const resolved = [
    ["glow", "aetherglowResolved", "AetherGlow Used"],
    ["channel", "channelResolved", "Channel Aether Used"]
  ];
  for (const [action, flag, label] of resolved) {
    if (!message.getFlag("soul-burn", flag)) continue;
    chatHtml.find(`[data-soul-burn-action="${action}"]`)
      .prop("disabled", true)
      .html(`<i class="fas fa-check"></i> ${label}`);
  }
});

// Using the Soul Burn feature opens the dashboard directly and suppresses
// dnd5e's ordinary Item chat card. The Item hook supports dnd5e 2.4.1 and the
// Activity hook supports newer releases.
const soulBurnUseDebounce = new Map();

function scheduleSoulBurnDashboard(document) {
  const item = document?.documentName === "Item" ? document : document?.item;
  const actor = item?.actor
    ?? (item?.parent?.documentName === "Actor" ? item.parent : null);
  if (soulBurnItemFlag(item, "action") !== "activate" || !actor) return false;

  const key = item.uuid;
  const now = Date.now();
  if ((soulBurnUseDebounce.get(key) ?? 0) + 250 < now) {
    soulBurnUseDebounce.set(key, now);
    setTimeout(() => openSoulBurn({ actor }), 0);
  }
  return true;
}

function interceptSoulBurnUse(document) {
  const item = document?.documentName === "Item" ? document : document?.item;
  const actor = item?.actor
    ?? (item?.parent?.documentName === "Actor" ? item.parent : null);
  if (
    normalizedSoulBurnAction(item) === "surge"
    && isTemporarySoulBurnAction(item)
    && actor
    && !classData(actor).some(entry => entry.remaining > 0)
  ) {
    ui.notifications.warn(`${actor.name} has no Hit Dice remaining.`);
    return false;
  }
  if (!scheduleSoulBurnDashboard(document)) return true;
  return false;
}

Hooks.on("dnd5e.preUseItem", (item, _config, options = {}) => {
  const action = normalizedSoulBurnAction(item);
  if (["glow", "channel"].includes(action)) {
    options.flags ??= {};
    options.flags["soul-burn"] = {
      ...(options.flags["soul-burn"] ?? {}),
      chargeSpent: true
    };
  }
  return interceptSoulBurnUse(item);
});
Hooks.on("dnd5e.preUseActivity", activity => interceptSoulBurnUse(activity));

// This is the earliest supported launch hook in the supplied Tidy5e build.
// Returning false here prevents Tidy from calling Item#use at all, making the
// dashboard—not a chat card—the authoritative entry point.
Hooks.on("tidy5e-sheet.actorPreUseItem", item => interceptSoulBurnUse(item));

// Tidy's item-name click in dnd5e 2.4.1 calls Item#displayCard directly,
// bypassing Item#use and therefore preUseItem. In that system version the
// preDisplayCard hook is called with callAll, so returning false is ignored;
// mutating createMessage is the supported way to prevent the ordinary card.
Hooks.on("dnd5e.preDisplayCard", (item, chatData, options) => {
  const itemAction = normalizedSoulBurnAction(item);
  if (itemAction) {
    chatData.flags ??= {};
    chatData.flags["soul-burn"] = {
      ...(chatData.flags["soul-burn"] ?? {}),
      itemAction,
      itemId: item.id
    };
  }
  if (!scheduleSoulBurnDashboard(item)) return;
  options.createMessage = false;
});

// dnd5e 4+ replaced the legacy hook with a cancellable V2 hook.
Hooks.on("dnd5e.preDisplayCardV2", item => {
  if (!scheduleSoulBurnDashboard(item)) return true;
  return false;
});

// Final guard for sheet integrations that call ChatMessage.create directly
// instead of respecting dnd5e's cancellable Item hooks.
Hooks.on("preCreateChatMessage", (_message, data) => {
  const content = String(data.content ?? "");
  const flaggedItemId = data.flags?.dnd5e?.use?.itemId
    ?? data.flags?.["dnd5e.use"]?.itemId;
  const cardItemId = content.match(
    /class="[^"]*\bitem-card\b[^"]*"[^>]*data-item-id="([^"]+)"/i
  )?.[1] ?? content.match(/data-item-id="([^"]+)"[^>]*class="[^"]*\bitem-card\b/i)?.[1];
  const itemId = flaggedItemId ?? cardItemId;
  const actor = (data.speaker?.actor ? game.actors.get(data.speaker.actor) : null)
    ?? (data.speaker?.token ? canvas.tokens?.get(data.speaker.token)?.actor : null);
  const item = actor?.items.get(itemId);
  if (soulBurnItemFlag(item, "action") !== "activate") return true;

  scheduleSoulBurnDashboard(item);
  return false;
});

const resolvingNativeSoulBurnItems = new Set();
const activeFateShiftCountdowns = new Map();

function fateShiftCountdownMessage(seconds) {
  const configured = String(
    game.settings.get("soul-burn", "fateShiftTimerMessage")
      || SB.defaultFateShiftMessage
  );
  if (configured.includes("{seconds}")) {
    return configured.replaceAll("{seconds}", String(seconds));
  }
  return `${configured} ${seconds} seconds remain.`;
}

async function showFateShiftCountdown(actor) {
  if (activeFateShiftCountdowns.has(actor.id)) {
    return activeFateShiftCountdowns.get(actor.id);
  }

  const countdown = new Promise(resolve => {
    const totalSeconds = Math.min(
      600,
      Math.max(
        1,
        Number(game.settings.get("soul-burn", "fateShiftTimerSeconds"))
          || SB.defaultFateShiftSeconds
      )
    );
    const endsAt = Date.now() + totalSeconds * 1000;
    let interval = null;
    let finished = false;
    let dialog = null;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (interval) clearInterval(interval);
      resolve();
    };
    const update = html => {
      const millisecondsLeft = Math.max(0, endsAt - Date.now());
      const secondsLeft = Math.ceil(millisecondsLeft / 1000);
      const percent = totalSeconds > 0
        ? Math.max(0, Math.min(100, millisecondsLeft / (totalSeconds * 10)))
        : 0;
      html.find("[data-fate-shift-message]")
        .text(fateShiftCountdownMessage(secondsLeft));
      html.find("[data-fate-shift-countdown]").text(`${secondsLeft}s`);
      html.find("[data-fate-shift-progress]").css("width", `${percent}%`);
      if (millisecondsLeft <= 0) dialog?.close();
    };

    dialog = new Dialog({
      title: `Fate Shift — ${actor.name}`,
      content: `<div class="soul-burn-fate-countdown">
        <p data-fate-shift-message></p>
        <div class="soul-burn-fate-progress-track" role="progressbar"
             aria-label="Fate Shift time remaining">
          <div class="soul-burn-fate-progress-fill" data-fate-shift-progress></div>
        </div>
        <p class="soul-burn-fate-time" data-fate-shift-countdown></p>
      </div>`,
      buttons: {},
      render: html => {
        update(html);
        interval = setInterval(() => update(html), 100);
      },
      close: finish
    }, {
      width: 480,
      resizable: false
    });
    dialog.render(true);
  }).finally(() => activeFateShiftCountdowns.delete(actor.id));

  activeFateShiftCountdowns.set(actor.id, countdown);
  return countdown;
}

async function resolveNativeSoulBurnItemUse(document) {
  const item = document?.documentName === "Item" ? document : document?.item;
  const actor = item?.actor
    ?? (item?.parent?.documentName === "Actor" ? item.parent : null);
  const action = normalizedSoulBurnAction(item);
  const resolutionKey = `${actor?.id ?? "none"}.${item?.id ?? action}`;
  if (
    !["surge", "fate", "exit"].includes(action)
    || !isTemporarySoulBurnAction(item)
    || !actor
    || !state(actor).active
    || resolvingNativeSoulBurnItems.has(resolutionKey)
  ) return;

  resolvingNativeSoulBurnItems.add(resolutionKey);
  try {
    if (action === "exit") {
      await endBurn(actor, "Soul Burn Ended Early");
      return;
    }
    if (action === "fate") {
      await showFateShiftCountdown(actor);
      await endBurn(actor, "Fate Shift");
      return;
    }

    const available = classData(actor)
      .filter(entry => entry.remaining > 0)
      .sort((a, b) => b.faces - a.faces);
    const spent = available[0];
    if (!spent) {
      ui.notifications.warn(`${actor.name} has no Hit Dice remaining.`);
      return;
    }
    await actor.updateEmbeddedDocuments("Item", [{
      _id: spent.item.id,
      "system.hitDiceUsed": spent.used + 1
    }]);

    // Keep the next ordinary Item roll synchronized with the largest Hit Die
    // the character still has available.
    const refreshed = configureRegularSoulBurnItem(
      item.toObject(),
      "surge",
      actor
    );
    refreshed._id = item.id;
    await actor.updateEmbeddedDocuments(
      "Item",
      [refreshed],
      { soulBurnInternal: true }
    );
  } finally {
    resolvingNativeSoulBurnItems.delete(resolutionKey);
  }
}

Hooks.on("dnd5e.useItem", item => resolveNativeSoulBurnItemUse(item));
Hooks.on("dnd5e.postUseActivity", activity => resolveNativeSoulBurnItemUse(activity));

Hooks.on("createItem", async (item, _options, userId) => {
  if (userId !== game.user.id) return;
  if (item.getFlag("soul-burn", "action") !== "activate") return;
  await saveMetadataOnly(item.parent, {
    ...state(item.parent),
    resourceCleared: false
  });
  await initializeSoulBurnResource(item.parent);
  await syncSoulBurnFeature(item.parent, state(item.parent).active);
  ui.notifications.info(`${item.parent.name}'s tertiary resource is configured as Soul Burn.`);
});

Hooks.on("preUpdateItem", (item, _changes, options, userId) => {
  if (options?.soulBurnInternal) return true;
  if (!item.parent || soulBurnItemFlag(item, "action") !== "activate") return true;
  const user = game.users.get(userId);
  if (user?.isGM) return true;
  if (userId === game.user.id) {
    ui.notifications.warn(`${item.name} is managed by Soul Burn and cannot be edited by players.`);
  }
  return false;
});

Hooks.on("preDeleteItem", (item, options, userId) => {
  if (options?.soulBurnInternal) return true;
  if (!item.parent) return true;
  const managedBySoulBurn = soulBurnItemFlag(item, "action") === "activate"
    || isTemporarySoulBurnAction(item);
  if (!managedBySoulBurn) return true;
  const user = game.users.get(userId);
  if (user?.isGM) return true;
  if (userId === game.user.id) {
    ui.notifications.warn(`${item.name} is managed by Soul Burn and cannot be deleted by players.`);
  }
  return false;
});

Hooks.on("renderItemSheet", (app, html) => {
  const item = app.item;
  if (
    game.user.isGM
    || !item?.parent
    || (
      soulBurnItemFlag(item, "action") !== "activate"
      && !isTemporarySoulBurnAction(item)
    )
  ) return;

  const sheetHtml = html?.jquery ? html : $(html);
  sheetHtml.addClass("soul-burn-locked-item-sheet");
  sheetHtml.find("input, textarea, select").prop("disabled", true);
  sheetHtml.find("button").not("[data-soul-burn-action]").prop("disabled", true);
  if (!sheetHtml.find(".soul-burn-lock-notice").length) {
    sheetHtml.prepend(
      '<div class="soul-burn-lock-notice"><i class="fas fa-lock"></i> '
      + `${esc(item.name)} is module-managed. Only a GM can edit or delete it.</div>`
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
      return ui.notifications.warn(`This ${action === "glow" ? "AetherGlow" : "Channel Aether"} chat-card charge has already been used.`);
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
        chargeAlreadySpent: limitedAction
          && Boolean(message?.getFlag("soul-burn", "chargeSpent"))
      });
      if (limitedAction && completed === true && message) {
        try {
          await message.setFlag("soul-burn", resolvedFlag, true);
          button.html(`<i class="fas fa-check"></i> ${action === "glow" ? "AetherGlow Used" : "Channel Aether Used"}`);
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
