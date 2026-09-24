import {system, ItemStack} from '@minecraft/server';
import {setMainHand} from './containerUtils.js';


system.beforeEvents.startup.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('flax:on_player_interact_flower_flax', {
        onPlayerInteract(e) {
            const {player, block, dimension} = e;

            if(!player || !player.getComponent('equippable')) return;

            const selectedItem = player.getComponent('equippable').getEquipment('Mainhand');

            if (!selectedItem || selectedItem.typeId !== "minecraft:shears") return;

            block.setType("minecraft:air");
            dimension.playSound('dig.grass', block.location);
            player.playSound("mob.sheep.shear")
            block.dimension.spawnItem(new ItemStack("flax:flower_flax_item", 1), block.location)
        }
    });
});