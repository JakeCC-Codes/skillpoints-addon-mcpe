import { activeSkills } from "./main";
import { world } from "@minecraft/server";

world.afterEvents.itemCompleteUse.subscribe(({itemStack, source, useDuration}) => {
    // Change is so when you sneak with milk in your hand you get a special milk that doesn't clear the rest of your effects
    // Some kind of special enchanted milk or smth
    if (source.typeId !== "minecraft:player")
        return;
    if (activeSkills[source.name] && activeSkills[source.name][0]) {
        switch (itemStack.typeId) {
            case "minecraft:honey_bottle":
                const recentSKill = activeSkills[source.name][activeSkills[source.name]?.length -1];
                activeSkills[source.name].pop();
                if (recentSKill?.isPotionSkill) {
                    source.removeEffect(recentSKill.typeId);
                }
                source.dimension.playSound('beacon.deactivate', {x: source.location.x, y: source.location.y +1.75, z: source.location.z}, {pitch: 3, volume: 0.65});
                break;
            case "minecraft:milk_bucket":
                activeSkills[source.name] = [];
                break;
        }
    }
});