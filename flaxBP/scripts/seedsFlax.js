import {world, system } from "@minecraft/server";
import {setMainHand } from './containerUtils.js';

//Method only works when a player is sneaking
world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.itemComponentRegistry.registerCustomComponent('flax:composter_compat_seeds', {
        onUseOn(e) {
            const { source, block} = e;
            
            if(block.typeId !== "minecraft:composter") return;

            composterFill(block, 30)

            const equipment = source.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');
            
            setMainHand(source, equipment, selectedItem);
        }
    });
});

// player does not need to sneak for this event to be triggered
// world.beforeEvents.itemUseOn.subscribe(e => {
    
//     if(e.block.typeId !== "minecraft:composter") return;
//     const { source, block, itemStack} = e;

//     if(itemStack.typeId === "flax:flower_flax_item" || itemStack.typeId === "flax:flax_seeds"){
//         e.cancel = true;
//       if (source.lastTick == undefined) {source.lastTick = 0 }
//         if (system.currentTick - source.lastTick > 5) {
//           system.run(() => {
//             const equipment = source.getComponent('equippable');
//             const selectedItem = equipment.getEquipment('Mainhand');
//             const fillChance = itemStack.typeId === "flax:flower_flax_item" ? 65 : 30;
//             composterFill(block, fillChance)
//             setMainHand(source, equipment, selectedItem);
//           });
//           source.lastTick = system.currentTick;
//     }
//     }
    
// });

//vanilla compat function, was tempted to make a separate file, but allow that bruv
export function composterFill(block, fillChance){

    const fillLevel = block.permutation.getState("composter_fill_level");

    //level 7 is a transitional period, level 8 is finished composting.
    if(fillLevel === 7 || fillLevel === 8) return;

    const shouldFill = Math.floor(Math.random() * 100) <= fillChance ? true : false;
    const fillSound  = shouldFill ? "block.composter.fill_success" : "block.composter.fill"

    if(!shouldFill){
        world.playSound(fillSound, block.location);
    }
    else{
        world.playSound(fillSound, block.location);
        block.setPermutation(block.permutation.withState("composter_fill_level", fillLevel+1));
    }
    block.dimension.spawnParticle("minecraft:crop_growth_emitter", block.center())
    //As of 10/09/2024, when a composter is "forced" into a fill level state of 7, it will remain at that state.
    //Mimicyy the transition phase and change the composter to fill level 8
    if(block.permutation.getState("composter_fill_level") === 7){

        system.runTimeout(() => {
            block.setPermutation(block.permutation.withState("composter_fill_level", 8));
            world.playSound("block.composter.ready", block.location);
        }, 20);
        //The tick delay is guess work. It may or may not be accurate
    }
}