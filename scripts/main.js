import { system, world, EffectTypes, EnchantmentTypes, ItemStack, EntityComponentTypes, ItemComponentTypes, ScriptEventSource } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { prevEXPLevel, Capitalize, Romanize, ColourfyText, CreateList, GetRandomIntRange, BlacklistArray, WhitelistLambda, GetDirectionBits, ParsePlayer } from "./addonUtil"
import { ConfigFile, CustomSkillsArray, OPSkillsArray } from "./config"

const gameEffects = BlacklistArray(EffectTypes.getAll(), ConfigFile.skillBlacklist, (x) => x.getName());
const gameEnchantments = EnchantmentTypes.getAll();
export const activeSkills = JSON.parse(world.getDynamicProperty("sKP_SkillData") ?? "{}") ?? new Object();
import "./bttomilk"
import "./skills"

function showSkillPointsGUI(player) {
    const dimension = player.dimension;
    const playerHeadLocation = {x: player.location.x, y: player.location.y +1.75, z: player.location.z};
    const actionForm = new ActionFormData().title({translate: "Choose a Skill"}); //Translate later
    gameEffects.forEach((effect) => {
        effect = effect.getName();
        const upSkill = activeSkills[player.name]?.find((element) => element.typeId == effect);
        actionForm.button({translate: Capitalize(effect) + (upSkill && ConfigFile.skillAmplifying ? ` ${Romanize(upSkill?.amplifier +2)}` : '')});
    });
    CustomSkillsArray.forEach((skill) => {
        const upSkill = activeSkills[player.name]?.find((element) => element.typeId == skill.typeId);
        actionForm.button({translate: skill.displayName + (upSkill && ConfigFile.skillAmplifying ? ` ${Romanize(upSkill?.amplifier +2)}` : '')});
    });
    actionForm
      .show(player)
      .then((formResult) => {
        if (formResult.canceled) {
            showSkillPointsGUI(player);
            return -1;
        }
        const isEffectSkill = formResult.selection < gameEffects.length; // Fix in future
        const choosenEffect = isEffectSkill ? {typeId: gameEffects[formResult.selection].getName()} : CustomSkillsArray[formResult.selection - gameEffects.length];
        activeSkills[player.name] = activeSkills[player.name] ?? [];
        const prevSkill = activeSkills[player.name]?.find((element) => element.typeId == choosenEffect.typeId);
        const prevSkillIndex = activeSkills[player.name]?.findIndex((x) => x.typeId == choosenEffect.typeId);
        const newEffect = isEffectSkill ? player.addEffect(choosenEffect.typeId, 20000000, {amplifier: ConfigFile.skillAmplifying ? ((prevSkill?.amplifier ?? -1) +1) : 0, showParticles: false}) : {displayName: choosenEffect.displayName, amplifier: ConfigFile.skillAmplifying ? ((prevSkill?.amplifier ?? -1) +1) : 0, showParticles: false}; // Make Effects Infinite
        activeSkills[player.name].splice(prevSkillIndex, prevSkillIndex != -1);
        activeSkills[player.name].push({typeId: choosenEffect.typeId, amplifier: newEffect?.amplifier , isPotionSkill: isEffectSkill});
        world.sendMessage(`${player.name} has just reached lvl ${player.level} and obtained ${newEffect?.displayName}${(!isEffectSkill && newEffect?.amplifier > 0 ? ` ${Romanize(newEffect?.amplifier +1)}` : '')}`); //DisplayName is Translated
        if (!isEffectSkill) player.sendMessage(`§7${choosenEffect.description}`);  // Skill Description
        dimension.playSound('random.potion.brewed', playerHeadLocation, {pitch: 1.2, volume: 1});
        dimension.playSound('random.levelup', playerHeadLocation, {pitch: 1.2, volume: 1});
        dimension.spawnParticle('minecraft:totem_particle', playerHeadLocation);

        world.setDynamicProperty("sKP_SkillData", JSON.stringify(activeSkills)); //Save Player Skill Data
    });
    dimension.playSound('beacon.power', playerHeadLocation, {pitch: 3, volume: 2});
}
function showOPSkillsGUI(player) {
    const dimension = player.dimension;
    const playerHeadLocation = {x: player.location.x, y: player.location.y +1.75, z: player.location.z};
    const tempArray = [];
    const actionForm = new ActionFormData().title({translate: `Choose an ${ColourfyText("OP Skill")}`}); //Translate later
    OPSkillsArray.forEach((OPskill) => {
        if (Math.random() < OPskill.chance) {
            actionForm.button({translate: OPskill.description});
            tempArray.push(OPskill);
        }
    });
    actionForm
      .show(player)
      .then((formResult) => {
        if (formResult.canceled) {
            showOPSkillsGUI(player);
            return -1;
        }
        const choosenOPskill = tempArray[formResult.selection].typeId;
        const OPitem = new ItemStack(choosenOPskill);
        OPitem.nameTag = ColourfyText(Capitalize(choosenOPskill));
        OPitem.setLore(['SkillPoints by JakeCCz']);
        const EntComp = OPitem.getComponent(ItemComponentTypes.Enchantable);
        const EntArray = CreateList(WhitelistLambda(gameEnchantments, (x) => EntComp?.canAddEnchantment({level: 0, type: x})));
        const EntRandom = GetRandomIntRange(EntArray.length);
        if (EntRandom != 0) {EntComp?.addEnchantments([{level: GetRandomIntRange(EntArray[EntRandom].maxLevel) +1, type: EntArray[EntRandom]}]);}
        player.getComponent(EntityComponentTypes.Inventory)?.container?.addItem(OPitem);
        world.sendMessage(`${player.name} achieved an OP Skill and obtained ${Capitalize(choosenOPskill)}`); //DisplayName is Translated
        dimension.playSound('random.potion.brewed', playerHeadLocation, {pitch: 1.2, volume: 1}); // Add skill Descriptions in the future
        dimension.playSound('random.levelup', playerHeadLocation, {pitch: 1.2, volume: 1});
        dimension.spawnParticle('minecraft:totem_particle', playerHeadLocation);

        if (tempArray[formResult.selection].description === "§5:)") { // Random Easter Egg (Idk wtf I was thinking xD)
            for (let i=0;i<200;i++) {
                dimension.playSound('random.potion.brewed', playerHeadLocation, {pitch: 1.2 + i*0.1, volume: 1});
                dimension.playSound('random.levelup', playerHeadLocation, {pitch: 1.2 + i*0.1, volume: 1});
                dimension.playSound('beacon.power', playerHeadLocation, {pitch: 3 + i*0.1, volume: 2});
                dimension.spawnEntity('minecraft:xp_orb', playerHeadLocation);
                dimension.spawnEntity('minecraft:xp_bottle', player.location);
            }
        }
    });
    dimension.playSound('beacon.power', playerHeadLocation, {pitch: 3, volume: 2});
}

function showConfigGUI(player) {
    const playerList = CreateList(world.getPlayers(), (x) => x.name);
    const modalForm = new ModalFormData().title("SkillPoints Config"); //Translate later
    
    modalForm.textField("Skill Upgrade Level Interval", `eg. ${ConfigFile.upgradeEveryXLevel}L`);
    modalForm.slider("Skill Upgrade Max Level", 0, 255, ConfigFile.upgradeEveryXLevel, ConfigFile.maxUpgradeLevel);

    modalForm.dropdown("Blacklist Skills", CreateList(gameEffects, (x) => x.getName()), 0);
    modalForm.dropdown("Blacklist Players", playerList, (playerList.indexOf(ConfigFile.playerBlacklist[0]) != -1 ? playerList.indexOf(ConfigFile.playerBlacklist[0]) : 0));
    
    modalForm.slider("OP Skill Upgrade Chance", 0, 100, 1, ConfigFile.OPskillChance * 100);

    modalForm.toggle("Amplify Skills Every Upgrade", ConfigFile.skillAmplifying);
    modalForm.toggle("Lose Skills After Death", ConfigFile.loseDeathSkills);
    // Toggle Losing Skills After Death

    modalForm
      .show(player)
      .then((formData) => {
        if (formData.canceled) {
            return -1;
        }
        const formResult = formData.formValues;
        ConfigFile.setAll(formResult, playerList, gameEffects);
        world.setDynamicProperty("sKP_ConfigData", JSON.stringify(formResult)); //Save Config Data
    });
}
ConfigFile.setAll(JSON.parse(world.getDynamicProperty("sKP_ConfigData") ?? "{}"), CreateList(world.getPlayers(), (x) => x.name), gameEffects); //Load Config Data


world.afterEvents.playerSpawn.subscribe(({initialSpawn, player}) => {
    if (initialSpawn)
        return;
    if (ConfigFile.loseDeathSkills) {
        activeSkills[player.name] = [];
        world.setDynamicProperty("sKP_SkillData", JSON.stringify(activeSkills)); //Save Player Skill Data
    } else {
        activeSkills[player.name].forEach((skill) => {
            if (skill.isPotionSkill) player.addEffect(skill.typeId, 20000000, {amplifier: (skill.amplifier ?? 0), showParticles: false});
        });
    }
});

system.afterEvents.scriptEventReceive.subscribe((event) => {
    const dimension = event.sourceType == ScriptEventSource.Block ? event.sourceBlock.dimension : event.sourceEntity.dimension;
    const eventSource = ParsePlayer(dimension, "@p")[0];
    let eventTargets = [];
    let eventSkillAmp = 0;
    let eventSkillID = "";
    switch (event.id) {
        case "sKP:config":
            eventTargets = event.message.length == 0 ? [eventSource] : ParsePlayer(dimension, event.message);
            if (eventTargets.length <= 0) {
                ParsePlayer(dimension, "@a").forEach((player) => {
                    player.sendMessage({text: `Command Error: Invalid Syntax, >><<"${event.message}"`});
                });
                break;
            }
            eventTargets.forEach((player) => {
                showConfigGUI(player);
            });
            break;
        case "sKP:forced_skills":
            eventTargets = event.message.length == 0 ? [eventSource] : ParsePlayer(dimension, event.message);
            if (eventTargets.length <= 0) {
                ParsePlayer(dimension, "@a").forEach((player) => {
                    player.sendMessage({text: `Command Error: Invalid Syntax, >><<"${event.message}"`});
                });
                break;
            }
            eventTargets.forEach((player) => {
                showSkillPointsGUI(player);
            });
            break;
        case "sKP:forced_OPskills":
            eventTargets = event.message.length == 0 ? [eventSource] : ParsePlayer(dimension, event.message);
            if (eventTargets.length <= 0) {
                ParsePlayer(dimension, "@a").forEach((player) => {
                    player.sendMessage({text: `Command Error: Invalid Syntax, >><<"${event.message}"`});
                });
                break;
            }
            eventTargets.forEach((player) => {
                showOPSkillsGUI(player);
            });
            break;
        case "sKP:add":
            const eventArgs1 = event.message.split(' ');
            eventTargets = eventArgs1.at(2) == undefined || eventArgs1.at(2).length == 0 ? [eventSource] : ParsePlayer(dimension, eventArgs1.at(2));
            eventSkillAmp = eventArgs1.at(1) == undefined || eventArgs1.at(1).length == 0 ? 0 : parseInt(eventArgs1.at(1));
            eventSkillID = eventArgs1.at(0) == undefined || eventArgs1.at(0).length == 0 ? gameEffects?.at(Math.floor(Math.random() * gameEffects?.length)).getName() : eventArgs1.at(0);
            eventTargets.forEach((player) => {
                let skIndex = activeSkills[player.name]?.findIndex((x) => x.typeId == eventSkillID);
                activeSkills[player.name]?.splice(skIndex, skIndex != -1);
                activeSkills[player.name] = activeSkills[player.name] ?? [];
                const effectSkillIndex = gameEffects?.findIndex((x) => x.getName() == eventSkillID);
                const customSkillIndex = CustomSkillsArray?.findIndex((x) => x.typeId == eventSkillID);
                if (effectSkillIndex != -1 || customSkillIndex != -1) {
                    const isEffectSkill = effectSkillIndex != -1;
                    activeSkills[player.name]?.push({typeId: eventSkillID, amplifier: eventSkillAmp, isPotionSkill: isEffectSkill});
                    if (isEffectSkill) {
                        player.addEffect(eventSkillID, 20000000, {amplifier: eventSkillAmp, showParticles: false});
                    }
                    console.log(`Sucessfully Added ${eventSkillID} skill from ${player.name}`);
                } else {
                    console.log(`Failed to add ${eventSkillID} skill to ${player.name}`);
                }
            });
            break;
        case "sKP:remove":
            const eventArgs2 = event.message.split(' ');
            eventTargets = eventArgs2.at(1) == undefined || eventArgs2.at(1).length == 0 ? [eventSource] : ParsePlayer(dimension, eventArgs2.at(1));
            eventSkillID = eventArgs2.at(0) == undefined || eventArgs2.at(0).length == 0 ? activeSkills[eventTargets.at(0).name]?.at(Math.floor(Math.random() * activeSkills[eventTargets.at(0).name]?.length)).typeId : eventArgs2.at(0);
            eventTargets.forEach((player) => {
                const skIndex = activeSkills[player.name]?.findIndex((x) => x.typeId == eventSkillID);
                if (skIndex != -1) {
                    const removedSkill = activeSkills[player.name][skIndex];
                    activeSkills[player.name]?.splice(skIndex, 1);
                    if (removedSkill?.isPotionSkill) {
                        player.removeEffect(removedSkill.typeId);
                    }
                    console.log(`Sucessfully Removed ${eventSkillID} skill from ${player.name}`);
                } else {
                    console.log(`Failed to remove ${eventSkillID} skill from ${player.name}`);
                }
            });
            break;
        case "sKP:list":
            eventTargets = event.message.length == 0 ? [event.sourceEntity] : ParsePlayer(dimension, event.message);
            eventTargets.forEach((player) => {
                eventSource.sendMessage({text: `${player.name}: [${activeSkills[player.name]?.map((x) => x.typeId + " " + x.amplifier).toString()}]`});
                console.log(`${player.name}: [${activeSkills[player.name]?.map((x) => x.typeId + " " + x.amplifier).toString()}]`);
            });
            break;
    }

}, {namespaces: ["sKP"]});

system.runInterval(() => {
    world.getPlayers().forEach((player) => {
        if (activeSkills[player.name] /*&& ConfigFile.constantlyUpdateSkills*/) {activeSkills[player.name].forEach((skill) => { if (skill.isPotionSkill && !player.getEffect(skill.typeId)) {player.addEffect(skill.typeId, 20000000, {amplifier: (skill.amplifier ?? 0), showParticles: false});}});}

        const currentEXPLevel = player.level;
        const notCurrentEXPLevel = currentEXPLevel + 1; // Last level check
        if (currentEXPLevel === prevEXPLevel[player.name] || currentEXPLevel >= (ConfigFile.maxUpgradeLevel == 0 ? notCurrentEXPLevel : ConfigFile.maxUpgradeLevel) || ConfigFile.playerBlacklist.includes(player.name))
            return;
        const EXPLevelChange = currentEXPLevel - (prevEXPLevel[player.name] ?? notCurrentEXPLevel);
        const nearestLevel = Math.round(currentEXPLevel / ConfigFile.upgradeEveryXLevel) * ConfigFile.upgradeEveryXLevel;
        if (currentEXPLevel === nearestLevel && EXPLevelChange === Math.abs(EXPLevelChange)) {
            if (Math.random() < ConfigFile.OPskillChance)
                showOPSkillsGUI(player);
            else
                showSkillPointsGUI(player);

        }
        prevEXPLevel[player.name] = player.level;
    });
}, 80);

// SkillPoints Addon by JakeCCz
// =--=(https://mcpedl.com/user/JakeCCz/)=--= //
// =--=(https://www.patreon.com/c/JakeCCz/)=--= //