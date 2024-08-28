import {world } from "@minecraft/server";
import {setMainHand } from './containerUtils.js';

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.itemComponentRegistry.registerCustomComponent('flax:composter_compat_seeds', {
        onUseOn(e) {
            const { source, usedOnBlockPermutation} = e;
            // if(usedOnBlockPermutation.type.id !== "minecraft:composter") return;
            // console.warn("please fill")
            console.warn(block.typeId)
        }
    });
});


//Wait for v1.21.10, will implement in v1.1
//imagine it being that easy. Unfortunately i think the best way to implement this feature as of now is to "hack" the event pipeline
//basically instead of using itemcomponents, i would have to detect the interaction through built in events that track the entirety of
//the game. 