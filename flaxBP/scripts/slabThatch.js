import {world, ItemStack, Direction, system, BlockPermutation} from "@minecraft/server"
import {setMainHand} from './containerUtils.js';
import {getBlockFromFace} from './main.js'

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('flax:before_on_place_rotatable_slab', {
        beforeOnPlayerPlace(e) {
            const {block, player, face } = e;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');

            let blockToCheck = getBlockFromFace(block, face)

            if (selectedItem?.typeId === blockToCheck.typeId && !blockToCheck.permutation.getState('flax:double')){
                const permFace = blockToCheck.permutation.getState("minecraft:block_face")
                const verticalHalf = blockToCheck.permutation.getState('minecraft:vertical_half');

                const axisNum = Math.floor(Object.keys(Direction).indexOf(permFace.charAt(0).toUpperCase() + permFace.slice(1)) / 2)

                const isBottomUp = verticalHalf === 'bottom' && face === 'Up';
                const isTopDown = verticalHalf === 'top' && face === 'Down';
                
                if (isBottomUp || isTopDown) {

                    blockToCheck.setPermutation(blockToCheck.permutation.withState('flax:double', true)); 
                    blockToCheck.setPermutation(blockToCheck.permutation.withState('flax:axis', axisNum));
                    world.playSound('use.grass', blockToCheck.location);
                    e.cancel = true;
                    setMainHand(player, equipment, selectedItem);
                }
                
            }
        },
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('flax:on_player_destroy_slab', {
        onPlayerDestroy(e) {
            const {player, destroyedBlockPermutation: perm } = e;

            if (!player || !player.getComponent('equippable'))  return;

            // const selectedItem = player.getComponent('equippable').getEquipment('Mainhand');
            // if (!selectedItem || !selectedItem.hasTag('minecraft:is_pickaxe')) {
            //     return;
            // }
            //TODO
            //Small testing, a sword seems to destroy hay bales faster than other tools. Will also implement more functionality for every tool to loose durability(or maybe it willbe added shortly)
            if (player.getGameMode() === "creative") return;

            const slabItem = perm.getItemStack(1);
            if (slabItem) e.dimension.spawnItem(slabItem, e.block.location);
        }
    });
});