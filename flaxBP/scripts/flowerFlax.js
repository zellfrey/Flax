import {world, ItemStack} from '@minecraft/server';
import {setMainHand, getFirstAvailableSlot} from './containerUtils.js';

//flax flower item components
world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.itemComponentRegistry.registerCustomComponent('flax:on_use_on_flower_pot', {
        onUseOn(e) {
            const { source, block} = e;
            if(block.typeId !== "minecraft:flower_pot") return;
            
            block.setType("flax:potted_flower_flax");

            const equipment = source.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            
            setMainHand(source, equipment, selectedItem);
            
        }
    });
});
//flax flower block components
world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('flax:destroy_water_flower_flax', {
        onTick(e) {
            try{
                const { block } = e;
                const surroundingBlocks = [block.above(), block.north(), block.south(), block.west(), block.east()]
                const findWater = surroundingBlocks.find(block => block.typeId === "minecraft:water");

                if(findWater === undefined) return;
                //console.warn(`data: §7${JSON.stringify(findWater.permutation.getAllStates(), null, 4)}`);
                destroyFlower(block);
            } 
            catch (error) {
                console.error()
            }
        }
    });
});

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('flax:on_player_interact_flower_flax', {
        onPlayerInteract(e) {
            const {player, block} = e;

            if(!player || !player.getComponent('equippable')) return;

            const selectedItem = player.getComponent('equippable').getEquipment('Mainhand');

            if (!selectedItem || selectedItem.typeId !== "minecraft:shears") return;

            block.setType("minecraft:air");
            world.playSound('dig.grass', block.location);
            player.playSound("mob.sheep.shear")
            block.dimension.spawnItem(new ItemStack("flax:flower_flax_item", 1), block.location)
        }
    });
});


function destroyFlower(block){
    const flax = Math.floor(Math.random() * 2) + 1;
    const seed = Math.floor(Math.random() * 2);
    block.dimension.spawnItem(new ItemStack("flax:flax_fibre", flax), block.location)

    if(seed != 0){
        block.dimension.spawnItem(new ItemStack("flax:flax_seeds", seed), block.location)
    }
    block.setType("minecraft:air");
    world.playSound('dig.grass', block.location);
}

//potted flower components(shoving here since its 1 function, and sort of related to the rest here)
world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('flax:on_player_interact_potted_flax', {
        onPlayerInteract(e) {
            const {player, block} = e;

            const selectedItem = player.getComponent('equippable').getEquipment('Mainhand');

            if (!selectedItem || selectedItem.typeId !== "flax:flower_flax_item"){

                const inventory = player.getComponent("inventory").container;
                
                inventory.addItem(new ItemStack("flax:flower_flax_item", 1)) 
                block.setType("minecraft:flower_pot");
            }
        }
    });
});

//In vanilla minecraft, when a player interacts with a flower pot. The flower that is obtained will be added to the first slot
//that is not at the item max amount. I.e, it will iterate over all valid slots until it finds the stack that isnt maxxed.
//If all stacks are maxxed, then it will add the item to the first available slot. 
//Currently this method will find the first empty/available slot to add an item to a players inventory.
//inventory.addItem(new ItemStack("flax:flower_flax_item", 1)) 
//So why the paragraph of needless explaining of a trivial matter. Well quite simply put, mod & vanilla parity.
//To expand, if the addon has minor behaviours that deviate from the base game, then the illusion of it being part of the game is broken.
//E.g custom slabs don't have adjacent placement. Yes im still banging on about that shit. Fite me
//Basically im breaking up the interact method to better align with minecraft