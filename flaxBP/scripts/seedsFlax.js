import {world } from "@minecraft/server";
import {setMainHand } from './containerUtils.js';

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.itemComponentRegistry.registerCustomComponent('flax:composter_compat_seeds', {
        onUseOn(e) {
            const { source, usedOnBlockPermutation} = e;
            // if(usedOnBlockPermutation.type.id !== "minecraft:composter") return;
            // console.warn("please fill")
            console.warn(usedOnBlockPermutation.type.id)
        }
    });
});


//Wait for v1.21.10, will implement in v1.1