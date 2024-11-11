import {world, ItemStack} from '@minecraft/server';
import {setMainHand} from './containerUtils.js';

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('flax:grow_basic', {
        onRandomTick(e) {
            const { block } = e;
            const cropStage = block.permutation.getState('flax:growth_stage');
            if(Math.floor(Math.random() * 100) < 20){
                block.setPermutation(block.permutation.withState('flax:growth_stage', cropStage+1));
            }
        }
    });
});
/*Vanilla crops have a ~14% probability per tick to enter the next growth stage. This probability is increased by the number of surrounding
    *farmland blocks and whether they are hydrated. The max probability is ~33% with 8 farmland blocks surrounding a crop.
    *Taking this all into consideration, most vanilla crops take an average of 31 minutes to fully grow. 
    *Source: https://minecraft.fandom.com/wiki/Tutorials/Crop_farming#Growth_rate
    *With that being said, I've reduced the chance from 100% down to 24%. Mean average shit. I changed my mind, im moving it down to 20%
*/ 
world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('flax:fertilize', {
        onPlayerInteract(e) {
            const { block, player } = e;

            if(!player || !player.getComponent('equippable')) return;
            
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            const cropStage = block.permutation.getState('flax:growth_stage');
            const maxGrowth = block.permutation.getState('flax:max_stage');

            if (!selectedItem || selectedItem.typeId != "minecraft:bone_meal") return;
            
            if (player.getGameMode() === "creative"){
                block.setPermutation(block.permutation.withState('flax:growth_stage', maxGrowth)); 
            }
            else{
                //Since we are always rounding down, we can set the max value +1 above the max growth stage
                const newStage = Math.floor(Math.random() * ((maxGrowth+1) - cropStage) + cropStage)
                block.setPermutation(block.permutation.withState('flax:growth_stage', newStage));
            }
            setMainHand(player, equipment, selectedItem);

            world.playSound('item.bone_meal.use', block.location);

            block.dimension.spawnParticle("minecraft:crop_growth_emitter", block.center())
        }
    });
});
//Don't need as "minecraft:liquid_detection is now a thing". Keeping just in case i need something that utilises something similar(im a hoarder)
// world.beforeEvents.worldInitialize.subscribe(eventData => {
//     eventData.blockComponentRegistry.registerCustomComponent('flax:destroy_crop_water', {
//         onTick(e) {
//             try{
//                 const { block } = e;
//                 const surroundingBlocks = [block.above(), block.north(), block.south(), block.west(), block.east()]
//                 const findWater = surroundingBlocks.find(block => block.typeId === "minecraft:water");

//                 if(findWater === undefined) return;
//                 //console.warn(`data: §7${JSON.stringify(findWater.permutation.getAllStates(), null, 4)}`);
//                 const cropStage = block.permutation.getState('flax:growth_stage');
//                 const maxGrowth = block.permutation.getState('flax:max_stage');


//                 if(cropStage === maxGrowth){
//                     const flax = Math.floor(Math.random() * 2) + 1;
//                     const seed = Math.floor(Math.random() * 2);
//                     block.dimension.spawnItem(new ItemStack("flax:flax_fibre", flax), block.location)

//                     if(seed != 0){
//                         block.dimension.spawnItem(new ItemStack("flax:flax_seeds", seed), block.location)
//                     }
//                 }
//                 else{
//                     block.dimension.spawnItem(new ItemStack("flax:flax_seeds", 1), block.location)
//                 }
//                 block.setType("minecraft:air");
//                 world.playSound('dig.grass', block.location);
//             } catch (error) {
//                 console.error()
//             }
//         }
//     });
// });
//TODO: Current iteration cannot determine the flow direction of water, hence the delicate nature of
//crops being destroyed from the sheer staring power of flowing liquids.

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('flax:on_player_destroy_flax', {
        onPlayerDestroy(e) {
            const {player, block} = e;

            if(!player || player.getGameMode() === "creative" || !player.getComponent('equippable')) return;

            if(Math.floor(Math.random() * 100) < 10){
                block.dimension.spawnItem(new ItemStack("flax:flower_flax_item", 1), block.location);
            }
        }
    });
});