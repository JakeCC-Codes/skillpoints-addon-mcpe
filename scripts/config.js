// ---= SkillPoints Addon Config =--- //
// Addon by JakeCCz
// MCPEDL PAGE: https://mcpedl.com/user/JakeCCz/
// PATREON PAGE: https://www.patreon.com/c/JakeCCz/

// Modification of this file is now depricated, DO NOT TOUCH
// Instead use the command; /function skillpoints_config

const defaultskillBlacklist = [
    "empty",
    "instant_damage",
    "weakness",
    "absorption",
    "slowness",
    "trial_omen",
    "mining_fatigue",
    "instant_health",
    "nausea", "blindness",
    "hunger",
    "poison",
    "wither",
    "levitation",
    "fatal_poison",
    "conduit_power",
    "bad_omen",
    "darkness",
    "wind_charged",
    "raid_omen",
    "infested",
    "invisibility"
];
// TODO: Some skills are inflicted on damage and some active on sneak

export const OPSkillsArray = [
    {typeId: 'minecraft:diamond_sword', description: "§pDiamond Sword", chance: 0.65},
    {typeId: 'minecraft:diamond_pickaxe', description: "§pDiamond Pickaxe", chance: 0.65},
    {typeId: 'minecraft:diamond_helmet', description: "§3Diamond Helmet", chance: 0.3},
    {typeId: 'minecraft:diamond_chestplate', description: "§3Diamond Chestplate", chance: 0.3},
    {typeId: 'minecraft:diamond_leggings', description: "§3Diamond Leggings", chance: 0.3},
    {typeId: 'minecraft:diamond_boots', description: "§3Diamond Boots", chance: 0.3},
    {typeId: 'minecraft:netherite_chestplate', description: "§5Netherite Chestplate", chance: 0.15},
    {typeId: 'minecraft:mace', description: "§5Mace", chance: 0.2},
    {typeId: 'minecraft:shield', description: "Shield", chance: 0.75},
    {typeId: 'minecraft:crossbow', description: "Crossbow", chance: 0.75},
    {typeId: 'minecraft:totem_of_undying', description: "§5Totem of Undying", chance: 0.15},
    {typeId: 'minecraft:turtle_helmet', description: "§pTurtle Helmet", chance: 0.35},
    {typeId: 'minecraft:enchanted_golden_apple', description: "§pNotch Apple", chance: 0.4},
    {typeId: 'minecraft:book', description: "Enchanted Book", chance: 0.4},
    {typeId: 'minecraft:recovery_compass', description: "§5Recovery Compass", chance: 0.05},
    {typeId: 'minecraft:air', description: "§5:)", chance: 0.0001},
    {typeId: 'minecraft:stick', description: "Random Stick", chance: 1}
];
export const CustomSkillsArray = [
    {typeId: 'sKPCustom:d_jump', displayName: "Double Jump", description: "Jump while falling through the air to perform a double jump"},
    {typeId: 'sKPCustom:ledge_grab', displayName: "Ledge Grab", description: "Sneaking next to a wall allows for ledge grabbing"},
    {typeId: 'sKPCustom:stealth', displayName: "Stealth", description: "Sneaking activates a temporary stealth mode"},
    {typeId: 'sKPCustom:s_speed', displayName: "Sneak Haste", description: "Sneaking grants a speed boost"},
    {typeId: 'sKPCustom:poison', displayName: "Venomous Touch", description: "Inflicts poison on attacked entities"},
    {typeId: 'sKPCustom:slowness', displayName: "Cripple Touch", description: "Inflicts slowness on attacked entities"},
    {typeId: 'sKPCustom:healing', displayName: "Healing Touch", description: "Inflicts regeneration on attacked entities, while sneaking"}
    //{typeId: 'sKPCustom:shield', displayName: "Tool Smith", description: "Decrease item durability break chance", amplifier: 0}
    // Elytra Boost (isGliding, using Firework)
];

export const ConfigFile = {    
    upgradeEveryXLevel: 10, // The amount of levels required to activate the skill menu [default: 10]
    maxUpgradeLevel: 0, // The level cap for interval levels that show the skill menu [default: 0]
    skillBlacklist: [...defaultskillBlacklist], // A list of skills that will not show up in the skill menu [default: {}]
    playerBlacklist: [], // A list of players who will not be allowed access to the skill menu [default: {...}]
    OPskillChance: 0.12, // The percentage chance that a player is granted an OP Skill rather than a regular one [default: 10%]
    skillAmplifying: true, // Determines whether skills can be amplified once choosen from the skill menu [default: true]
    loseDeathSkills: true,

    setAll: (valuesArray, playerList, gameEffects) => {
        if (valuesArray[0] == undefined) {return;}
        ConfigFile.upgradeEveryXLevel = parseInt(valuesArray[0]) ? Math.abs(parseInt(valuesArray[0])) : ConfigFile.upgradeEveryXLevel;
        ConfigFile.maxUpgradeLevel = valuesArray[1];
        ConfigFile.playerBlacklist[0] = playerList[valuesArray[3]];
        ConfigFile.OPskillChance = valuesArray[4]/100;
        ConfigFile.skillAmplifying = valuesArray[5];
        ConfigFile.loseDeathSkills = valuesArray[6];
        
        const index = valuesArray[2] -1;
        if (index != -1) {
            ConfigFile.skillBlacklist.push(gameEffects[index].getName());
            gameEffects.splice(index, 1);
        }
    }
}