import {world, ItemStack, Direction, system, BlockPermutation} from "@minecraft/server"
import {setMainHand} from './containerUtils.js';

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockTypeRegistry.registerCustomComponent('flax:on_interact_rotatable_slab', {
        onPlayerInteract(e) {
            const { block, player, face } = e;

            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            if (selectedItem?.typeId === block.typeId && !block.permutation.getState('flax:double')){

                const permFace = block.permutation.getState("minecraft:block_face")
                const verticalHalf = block.permutation.getState('minecraft:vertical_half');

                const axisNum = Math.floor(Object.keys(Direction).indexOf(permFace.charAt(0).toUpperCase() + permFace.slice(1)) / 2)

                const isBottomUp = verticalHalf === 'bottom' && face === 'Up';
                const isTopDown = verticalHalf === 'top' && face === 'Down';

                if (isBottomUp || isTopDown) {

                    block.setPermutation(block.permutation.withState('flax:double', true)); 
                    block.setPermutation(block.permutation.withState('flax:axis', axisNum));
                    setMainHand(player, equipment, selectedItem);
                    world.playSound('use.grass', block.location);

                }
                
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockTypeRegistry.registerCustomComponent('flax:on_player_destroy_slab', {
        onPlayerDestroy(e) {
            const {player, destroyedBlockPermutation: perm } = e;

            if (!player || !player.getComponent('equippable'))  return;

            // const selectedItem = player.getComponent('equippable').getEquipment('Mainhand');
            // if (!selectedItem || !selectedItem.hasTag('minecraft:is_pickaxe')) {
            //     return;
            // }
            if (player.getGameMode() === "creative") return;

            const slabItem = perm.getItemStack(1);
            if (slabItem) e.dimension.spawnItem(slabItem, e.block.location);
        }
    });
});