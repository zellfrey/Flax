import {system, ItemStack} from '@minecraft/server';
import {setMainHand} from './containerUtils.js';


system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent(
        'flax:crop_growth',
        FlaxCropGrowthComponent
    );
});

const FlaxCropGrowthComponent = {
    onRandomTick({ block }, { params }) {
        // Growth parameters
        const growthState = params.growth_state;
        const maxGrowth = params.max_growth;
        const minLightLevel = params.min_light_level;

        if (block.getLightLevel() < minLightLevel) return;

        const { permutation } = block;

        const growth = permutation.getState(growthState) ?? maxGrowth;

        if (growth === maxGrowth) return;

        if (!randomShouldCropGrow(block, params)) return;

        block.setPermutation(permutation.withState(growthState, growth + 1));
    },
    onPlayerInteract({ block, dimension, player }, { params }) {

            if(!player || !player.getComponent('equippable')) return;
            
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');

            if (!selectedItem || selectedItem.typeId != "minecraft:bone_meal") return;
            
            const growthState = params.growth_state;
            const growthRange = params.growth_on_fertilize;
            const maxGrowth = params.max_growth;
            
            if (player.getGameMode() === "Creative"){
                block.setPermutation(block.permutation.withState(growthState, maxGrowth)); 
            }
            else{
                let growth = block.permutation.getState(growthState);

                growth += randomInt(...growthRange);
                growth = Math.min(growth, maxGrowth);

                block.setPermutation(block.permutation.withState(growthState, growth));
            }

            setMainHand(player, equipment, selectedItem);

            dimension.playSound('item.bone_meal.use', block.center());
            dimension.spawnParticle("minecraft:crop_growth_emitter", block.center())
    }
}

function getGrowthSpeed(crop, growthParams) {
    let speed = 1;

    // Increase growth speed based on nearby farmland blocks and their moisture
    for (const farmland of getFarmlandIterator(crop, growthParams.farmland_search_range)) {
        let speedModifier = growthParams.farmland_speed_modifier;

        const moisture = farmland.permutation.getState("moisturized_amount");
        if (moisture > 0) {
            speedModifier += growthParams.farmland_moisture_speed_modifier;
        }

        const isDirectlyBelowCrop = farmland.x === crop.x && farmland.z === crop.z;
        if (!isDirectlyBelowCrop) {
            speedModifier *= growthParams.neighboring_farmland_speed_multiplier;
        }

        speed += speedModifier;
    }

    // Halves the growth speed if there are surrounding crops of the same type in vanilla (where "crowding_speed_multiplier" is 0.5)
    if (isCrowded(crop)) {
        speed *= growthParams.crowding_speed_multiplier;
    }

    return speed;
}

function* getFarmlandIterator(crop, searchRange) {
    for (let x = -searchRange; x <= searchRange; x++) {
        for (let z = -searchRange; z <= searchRange; z++) {
            const block = crop.offset({ x, y: -1, z });

            // Yield the block if it is farmland
            const isFarmland = block?.typeId === "minecraft:farmland";
            if (isFarmland) yield block;
        }
    }
}

function isCrowded(crop) {
    const northBlock = crop.north();
    const southBlock = crop.south();
    const westBlock = crop.west();
    const eastBlock = crop.east();

    const isEnclosed =
        (westBlock?.typeId === crop.typeId || eastBlock?.typeId === crop.typeId) &&
        (northBlock?.typeId === crop.typeId || southBlock?.typeId === crop.typeId);

    if (isEnclosed) return true;

    const isCropDiagonallyAdjacent =
        northBlock?.west()?.typeId === crop.typeId ||
        northBlock?.east()?.typeId === crop.typeId ||
        southBlock?.west()?.typeId === crop.typeId ||
        southBlock?.east()?.typeId === crop.typeId;

    if (isCropDiagonallyAdjacent) return true;

    return false;
}

function randomInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

export function randomShouldCropGrow(crop, growthParams) {
    const growthSpeed = getGrowthSpeed(crop, growthParams);
    const growthChanceRange = Math.floor(25 / growthSpeed);

    return randomInt(0, growthChanceRange) === 0;
}

system.beforeEvents.startup.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('flax:on_player_destroy_flax', {
        onPlayerBreak(e) {
            const {player, block} = e;

            if(!player || player.getGameMode() === "Creative" || !player.getComponent('equippable')) return;

            if(Math.floor(Math.random() * 100) < 10){
                block.dimension.spawnItem(new ItemStack("flax:flower_flax_item", 1), block.location);
            }
        }
    });
});