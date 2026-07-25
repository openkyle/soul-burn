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
  transformedTokenRoot:
    "https://assets.forge-vtt.com/62bf9a2b7fa42ce7966f6738/STARPG/CharTokens/AstrumKnights",
  defaultPowerUpSound: "modules/soul-burn/sounds/AetherUp3.ogg",
  defaultAetherglowSound: "modules/soul-burn/sounds/AetherGlow.ogg",
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
      title: "Soul Burn Sound Settings",
      template: "modules/soul-burn/templates/sound-settings.hbs",
      width: 620,
      closeOnSubmit: true
    });
  }

  getData() {
    return {
      powerUpSound: soundPath("powerUpSound"),
      aetherglowSound: soundPath("aetherglowSound"),
      defaultPowerUpSound: SB.defaultPowerUpSound,
      defaultAetherglowSound: SB.defaultAetherglowSound
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
      const value = target === "powerUpSound" ? SB.defaultPowerUpSound : SB.defaultAetherglowSound;
      html.find(`[name="${target}"]`).val(value).trigger("change");
    });
  }

  async _updateObject(_event, formData) {
    await game.settings.set("soul-burn", "powerUpSound", String(formData.powerUpSound ?? "").trim());
    await game.settings.set("soul-burn", "aetherglowSound", String(formData.aetherglowSound ?? "").trim());
    ui.notifications.info("Soul Burn sound settings saved.");
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
  game.settings.registerMenu("soul-burn", "soundSettings", {
    name: "Soul Burn Sounds",
    label: "Configure Sounds",
    hint: "Browse for, preview, or restore the Soul Burn audio files.",
    icon: "fas fa-volume-high",
    type: SoulBurnSoundSettings,
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

function maximumBurn(actor) {
  const sheetMaximum = Number(actor.system.resources?.tertiary?.max ?? 0);
  return sheetMaximum > 0
    ? sheetMaximum
    : classData(actor).reduce((total, c) => total + c.levels * c.faces, 0);
}

function state(actor) {
  const saved = foundry.utils.deepClone(actor.getFlag(SB.scope, SB.key) ?? {});
  return {
    // Soul Burn is the sheet's tertiary resource. Flags only hold metadata.
    burn: Number(actor.system.resources?.tertiary?.value ?? 0),
    uses: Number(saved.uses ?? 0),
    tolerance: Math.min(19, Number(saved.tolerance ?? 0)),
    active: Boolean(saved.active),
    burnout: Boolean(saved.burnout),
    channelUsed: Boolean(saved.channelUsed),
    startedRound: saved.startedRound ?? null,
    endsRound: saved.endsRound ?? null,
    originalImages: saved.originalImages ?? {}
  };
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
    icon: "icons/magic/holy/meditation-chi-focus-blue.webp",
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
      `<p>Spend one Hit Die to ignite Soul Burn.</p><div class="form-group"><label>Hit Die</label><select name="classId">${options}</select></div>`,
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

  // Consume first, then roll. This prevents repeated activation from duplicating a die.
  await actor.updateEmbeddedDocuments("Item", [{
    _id: chosen.item.id,
    "system.hitDiceUsed": chosen.used + 1
  }]);
  const roll = await makeRoll(`1d${chosen.faces}`);
  const next = {
    ...current,
    burn: current.burn + roll.total,
    uses: current.uses + 1,
    active: true,
    burnout: current.burn + roll.total > max,
    startedRound: game.combat?.round ?? null,
    endsRound: game.combat ? game.combat.round + roll.total : null
  };

  await applyMovement(actor);
  await playAnimation(token, next);
  await saveState(actor, next);
  await chat(
    actor,
    "Soul Burn",
    `<p><strong>${esc(actor.name)}</strong> gains double movement and one Soul Burn action each turn for <strong>${roll.total}</strong> rounds.</p>
     <p>Soul Burn: <strong>${next.burn} / ${max}</strong>${next.burnout ? " — <strong>Burnout pending</strong>" : ""}</p>`,
    roll
  );
}

async function aetherStrike(actor) {
  const current = state(actor);
  if (!current.active) throw new Error("AetherStrike requires active Soul Burn.");
  const die = await consumeHitDie(actor, "AetherStrike");
  if (!die) return;
  const roll = await makeRoll(`1d${die.faces}`);
  const use = await choose(
    "AetherStrike",
    `<p>You rolled <strong>${roll.total}</strong>. Apply it to one roll only.</p>`,
    {
      attack: { icon: '<i class="fas fa-crosshairs"></i>', label: "Attack Roll", value: "attack roll" },
      damage: { icon: '<i class="fas fa-burst"></i>', label: "Damage Roll", value: "radiant damage" }
    },
    "damage"
  );
  await chat(actor, "AetherStrike", `<p>Add <strong>+${roll.total}</strong> to the ${esc(use)} of the triggering attack.</p>`, roll);
}

async function channelAether(actor) {
  const current = state(actor);
  if (current.channelUsed) throw new Error("Channel Aether has already been used since the last short rest/reset.");

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

  const mod = Number(abilities[abilityKey]?.mod ?? 0);
  const prof = Number(actor.system.attributes?.prof ?? 0);
  const attack = await makeRoll("1d20 + @mod + @prof", { mod, prof });
  const damage = await makeRoll(`1d${largest} + ${level}`);
  await saveState(actor, { ...current, channelUsed: true });
  await chat(actor, "Channel Aether", `<p>Radiant attack: <strong>${attack.total}</strong> vs AC.</p><p>On a hit: <strong>${damage.total} radiant damage</strong> (1d${largest} + ${level}).</p>`);
  await attack.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: "Channel Aether — Attack" });
  await damage.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: "Channel Aether — Radiant Damage" });
}

async function endBurn(actor, reason = "Soul Burn ends") {
  const current = state(actor);
  await removeVisuals(actor, current);
  await saveState(actor, {
    ...current,
    active: false,
    startedRound: null,
    endsRound: null,
    originalImages: {}
  });
  await chat(
    actor,
    reason,
    current.burnout
      ? `<p><strong>${esc(actor.name)} exceeded their maximum Soul Burn.</strong> Burnout resolves now: their soul is permanently destroyed. The macro records this but does not delete the Actor.</p>`
      : `<p>${esc(actor.name)} is no longer Soul Burning.</p>`
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

async function consumeAetherglow(actor) {
  const current = state(actor);
  const drinkingSound = soundPath("aetherglowSound");
  if (drinkingSound) {
    try {
      await AudioHelper.play({ src: drinkingSound, volume: 0.5, autoplay: true, loop: false }, true);
    } catch (error) {
      console.warn("Soul Burn | Aetherglow sound skipped.", error);
    }
  }
  const roll = await makeRoll("1d20");
  const removed = Math.max(1, roll.total - current.tolerance);
  const next = {
    ...current,
    burn: Math.max(0, current.burn - removed),
    tolerance: Math.min(19, current.tolerance + 1)
  };
  await saveState(actor, next);
  await chat(
    actor,
    "Aetherglow Consumed",
    `<p><strong>${esc(actor.name)}</strong> rolled <strong>${roll.total}</strong> to release Soul Burn.</p>
     <p><strong>AG Tolerance:</strong> ${current.tolerance}</p>
     <p><strong>Aetherglow Blocked:</strong> ${Math.max(0, roll.total - removed)}</p>
     <p><strong>Soul Burn Removed:</strong> ${removed}</p>
     <p><strong>Soul Burn:</strong> ${current.burn} → ${next.burn}</p>
     <p><strong>AG Tolerance:</strong> ${current.tolerance} → ${next.tolerance}</p>
     <p><em>${toleranceLine(next.tolerance)}</em></p>`,
    roll
  );
}

async function resetChannel(actor) {
  if (!game.user.isGM) throw new Error("Only a GM can manually reset Channel Aether.");
  const current = state(actor);
  await saveState(actor, { ...current, channelUsed: false });
  ui.notifications.info(`Channel Aether reset for ${actor.name}.`);
}

async function showRules() {
  new Dialog({
    title: "Soul Burn Rules",
    content: `<div class="soul-burn-rules">
      <h2>What is Soul Burn?</h2>
      <p>Soul Burn is a Bonus Action reservoir granted by interacting with Aether. To enter Soul Burn, spend a Hit Die; your soul begins to burn, pushing you beyond mortal limits.</p>
      <p>While Soul Burnin', you have double movement and one free Soul Burn action each turn.</p>
      <h2>Max Soul Burn</h2>
      <p>Your maximum Soul Burn is the total maximum of all your Hit Dice. If current Soul Burn exceeds that maximum, your soul becomes unstable and is permanently destroyed when the current burn period ends. This is Burnout.</p>
      <h2>AetherStrike: Utilizing Hit Dice (1 Action)</h2>
      <p>Once per attack after you hit, spend and roll a Hit Die. Add it to either the attack roll or the damage roll, but not both. Added damage is Radiant.</p>
      <h2>Channel Aether (1 Action or Reaction / Short Rest)</h2>
      <p>Make an attack roll against one visible enemy. On a hit, deal Radiant damage equal to your Hit Die roll + your level. No Hit Die is consumed.</p>
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
    .filter(a => a.hasPlayerOwner || a.id === activeActor.id)
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
      glow: {
        icon: '<i class="fas fa-flask"></i>',
        label: "Consume Aetherglow",
        callback: () => consumeAetherglow(activeActor).catch(notifyError)
      },
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
  const combatWarning = current.active && game.combat && current.endsRound !== null && game.combat.round >= current.endsRound
    ? `<p class="notification warning">The recorded burn period has ended. Use “End Burn” after resolving Burnout.</p>`
    : "";

  const activeButtons = current.active ? `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px">
      <button type="button" data-sb-action="strike"><i class="fas fa-burst"></i> AetherStrike</button>
      <button type="button" data-sb-action="channel"><i class="fas fa-sun"></i> Channel Aether</button>
      <button type="button" data-sb-action="fate"><i class="fas fa-wand-magic-sparkles"></i> Fate Shift</button>
      <button type="button" data-sb-action="glow"><i class="fas fa-flask"></i> Aetherglow</button>
      <button type="button" data-sb-action="end"><i class="fas fa-stop"></i> End Burn</button>
      ${game.user.isGM ? '<button type="button" data-sb-action="reset"><i class="fas fa-rotate"></i> Reset Channel</button>' : ""}
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

  if (!action) return;
  if (action === "activate") await activate(actor, token);
  if (action === "strike") await aetherStrike(actor);
  if (action === "channel") await channelAether(actor);
  if (action === "fate") await fateShift(actor);
  if (action === "glow") await consumeAetherglow(actor);
  if (action === "end") await endBurn(actor);
  if (action === "reset") await resetChannel(actor);
}

async function openSoulBurn({ actor = null, token = null } = {}) {
  try {
    const subject = await resolveSubject(actor, token);
    if (subject) await dashboard(subject.actor, subject.token);
  } catch (error) {
    notifyError(error);
  }
}

Hooks.once("ready", async () => {
  game.soulBurn = Object.freeze({
    open: openSoulBurn,
    getState: actor => state(actor),
    version: "1.0.1"
  });

  if (!game.user.isGM) return;
  const command = "game.soulBurn.open();";
  let macro = game.macros.getName("Soul Burn");
  if (!macro) {
    macro = await Macro.create({
      name: "Soul Burn",
      type: "script",
      img: "icons/magic/holy/meditation-chi-focus-blue.webp",
      command,
      ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER },
      flags: { "soul-burn": { managed: true } }
    });
    ui.notifications.info("Soul Burn | Player macro created.");
  } else if (macro.getFlag("soul-burn", "managed") && macro.command !== command) {
    await macro.update({ command });
  }
});

// Adds a sheet-header control on dnd5e sheets that support this standard hook.
Hooks.on("getActorSheetHeaderButtons", (sheet, buttons) => {
  const actor = sheet.actor;
  if (!actor || actor.type !== "character") return;
  if (!game.user.isGM && !actor.isOwner) return;
  if (buttons.some(button => button.class === "soul-burn-open")) return;
  buttons.unshift({
    label: "Soul Burn",
    class: "soul-burn-open",
    icon: "fas fa-fire",
    onclick: () => openSoulBurn({ actor })
  });
});
