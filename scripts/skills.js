import { system, world, BlockPermutation } from "@minecraft/server";
import { activeSkills } from "./main"
import { GetDirectionBits } from "./addonUtil"
import { ConfigFile, CustomSkillsArray, OPSkillsArray } from "./config"

const vineBlock = new Object();
const jumpDebounce = new Object();
const jumpCount = new Object();
const defaultJumpHeight = 0.42;

// On Ready()
world.afterEvents.playerSpawn.subscribe(({initialSpawn, player}) => {
    vineBlock[player.name]?.setType('minecraft:air');
    vineBlock[player.name] = undefined;

    jumpDebounce[player.name] = false;
    jumpCount[player.name] = -1;
});

function sneakSkillTick(player) {
    activeSkills[player.name]?.forEach((skill) => {
        const duration = 81 + 5 * skill.amplifier;
        switch (skill.typeId) {
            case "sKPCustom:stealth":
                if (!player.isSneaking) {break;}
                player.onScreenDisplay.setActionBar({text: `Stealth Mode Activated (${(duration -1) *0.05}s)`});
                player.addEffect("minecraft:invisibility", duration);
            case "sKPCustom:s_speed":
                if (!player.isSneaking) {break;}
                player.addEffect("minecraft:speed", duration, {amplifier: skill.amplifier -1 < 0 ? 0 : skill.amplifier -1, showParticles: false});
                break;
            case "sKPCustom:ledge_grab":
                if (player.isSneaking) {
                    const climbBlacklist = ["minecraft:air", "minecraft:ladder", "minecraft:vine"];
                    const pDimension = player.dimension;
                    const pLocation = player.location;
                    if (vineBlock[player.name]?.location === pDimension.getBlock(pLocation).location || !climbBlacklist.includes(pDimension.getBlock({x:pLocation.x,y:pLocation.y-1,z:pLocation.z}).typeId)) {break;}
                    let wallOffset = [{x:0,y:0,z:1},{x:1,y:0,z:0},{x:0,y:0,z:-1},{x:-1,y:0,z:0}];
                    for (const offset of wallOffset) {
                        if (!climbBlacklist.includes(pDimension.getBlock({x:pLocation.x+offset.x,y:pLocation.y+offset.y,z:pLocation.z+offset.z}).typeId)) {
                            wallOffset = offset; // Use this side to run checks up the wall
                            break;
                        }
                    }
                    if (wallOffset[1]) {break;}
                    for (let i=1;i<(skill.amplifier+2);i++) { // Amplifier allows you to climb higher ledges
                        if (climbBlacklist.includes(pDimension.getBlock({x:pLocation.x+wallOffset.x,y:pLocation.y+wallOffset.y+i,z:pLocation.z+wallOffset.z}).typeId)) {
                            wallOffset = true;
                            break;
                        }
                    }
                    if (wallOffset !== true) {break;}
                    vineBlock[player.name]?.setType('minecraft:air');
                    vineBlock[player.name] = pDimension.getBlock(pLocation);
                    vineBlock[player.name].setPermutation(BlockPermutation.resolve('minecraft:vine', { vine_direction_bits: 0 }));
                } else if (vineBlock[player.name]) {
                    vineBlock[player.name]?.setType('minecraft:air');
                    vineBlock[player.name] = undefined;
                }
                break;
            case "sKPCustom:d_jump":
                const customAmpVal = skill.amplifier/2
                if (player.isJumping && !jumpDebounce[player.name] && jumpCount[player.name] > 0) { // Second Jump
                    jumpCount[player.name]--;
                    player.spawnParticle('minecraft:large_explosion', player.location);
                    player.playSound('armor.equip_leather', {volume: 1.0, pitch: 1.85});
                    player.playSound('cauldron.explode', {volume: 0.2, pitch: 0.45});
                    const jumpAmplifier = customAmpVal - Math.floor(customAmpVal);
                    player.applyKnockback(0, 0, 0, defaultJumpHeight*(1.4 + jumpAmplifier) + Math.abs(player.getVelocity().y)*0.3);
                }
                jumpDebounce[player.name] = player.isJumping || (player.isOnGround || player.isInWater || player.isClimbing || player.isFlying || player.isGliding);
                if (player.isOnGround) {
                    jumpCount[player.name] = Math.floor(customAmpVal) +1;
                }
                break;
        }
    });
}
function attackSkillTick(player, attackedEntity) {
    activeSkills[player.name]?.forEach((skill) => {
        const duration = 40 + 10 * skill.amplifier;
        let effectId = "minecraft:none";
        switch (skill.typeId) {
            case "sKPCustom:poison":
                if (activeSkills[player.name].find((x) => x.typeId === "sKPCustom:healing") && player.isSneaking) {break;}
                switch (skill.amplifier) {
                    case 0:
                        effectId = "minecraft:poison";
                        break;
                    case 1:
                        effectId = "minecraft:fatal_poison";
                        break;
                    default:
                        effectId = "minecraft:wither";
                        break;
                }
                attackedEntity.addEffect(effectId, duration, {amplifier: skill.amplifier -2 < 0 ? 0 : skill.amplifier -2, showParticles: true});
                break;
            case "sKPCustom:slowness":
                switch (skill.amplifier) {
                    case 0:
                        effectId = "minecraft:weakness";
                        break;
                    default:
                        effectId = "minecraft:slowness";
                        break;
                }
                attackedEntity.addEffect(effectId, duration, {amplifier: skill.amplifier, showParticles: true});
                break;
            case "sKPCustom:healing":
                if (!player.isSneaking) { break; }
                switch (skill.amplifier) {
                    default:
                        attackedEntity.addEffect("minecraft:saturation", duration/2, {amplifier: skill.amplifier, showParticles: false});
                    case 0:
                    case 1:
                    case 2:
                        effectId = "minecraft:regeneration";
                        break;
                }
                attackedEntity.addEffect(effectId, duration, {amplifier: skill.amplifier, showParticles: true});
                break;
        }
    });
}

world.afterEvents.entityHitEntity.subscribe(({damagingEntity, hitEntity}) => {
    if (damagingEntity.typeId !== "minecraft:player")
        return;
    attackSkillTick(damagingEntity, hitEntity);
});

system.runInterval(() => {
    world.getPlayers().forEach((player) => {
        if (activeSkills[player.name] && activeSkills[player.name][0])
            sneakSkillTick(player);
    });
}, 1);