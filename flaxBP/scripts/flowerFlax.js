import {world, ItemStack} from '@minecraft/server';

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockTypeRegistry.registerCustomComponent('flax:destroy_water_flower_flax', {
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
    eventData.blockTypeRegistry.registerCustomComponent('flax:on_player_interact_flower_flax', {
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