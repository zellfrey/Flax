import {world, ItemStack, BlockPermutation, system} from "@minecraft/server"
import {getAdjacentBlock } from './main.js';
import {getItemAmount, removeItemAmount} from "./containerUtils.js"
import {setBlockChain, breakRopeChain} from './rope.js';


world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('flax:on_player_destroy_rope_arrow', {
        onPlayerDestroy(e) {
            const {player, block} = e;

            if(!player || !player.getComponent('equippable')) return;

            if(block.location.y != block.dimension.heightRange.min && block.below().typeId === "flax:rope"){
                breakRopeChain(block, player, block.location.y)
            }        
        }
    });
});
//rope arrow placement
world.afterEvents.projectileHitBlock.subscribe(e =>{
    if(!e.projectile.typeId.includes("flax:rope_arrow_entity")) return;
    const arrow = e.projectile;
    const player = e.source;
    const {block, face} = e.getBlockHit();

    if(face === "Up"){
        dropEntityItem(arrow, "flax:rope_arrow_item")
    }else{
        if(!player.typeId) return; 

        const adjacentBlock = getAdjacentBlock(block, face);

        //Make a check so that the arrow isnt deleting any non-full blocks
        if(adjacentBlock.typeId != "minecraft:air"){
            dropEntityItem(arrow, "flax:rope_arrow_item")
            return;
        }

        adjacentBlock.setType("flax:rope_arrow_block")
        adjacentBlock.setPermutation(adjacentBlock.permutation.withState("flax:rope_face", face));
        arrow.remove();
        const minRange = block.dimension.heightRange.min;

        if(adjacentBlock.location.y != minRange){

            let solidBlock = getNextSolidBlock(adjacentBlock.below(), minRange);
            let depth = adjacentBlock.below().location.y - solidBlock.y
            const blockPerm = BlockPermutation.resolve("flax:rope")

            if(player.getGameMode() === "creative"){

                system.runJob(setBlockChain(block, blockPerm, adjacentBlock, depth + 1))
                
                return;

            }
            else{
                
                const inventory = player.getComponent("inventory").container;
                const ropeAmount = getItemAmount(inventory, "flax:rope_item")

                if(ropeAmount == 0) return;
                let newDepth;

                if(ropeAmount >= depth){
                    newDepth = depth;
                    
                }else{
                    newDepth = ropeAmount;
                }
                removeItemAmount(inventory,"flax:rope_item", newDepth)
                //This should give the player an audio feedback that items are leaving their inventory whilst the rope is being placed
                world.playSound("random.pop", player.location);
                system.runJob(setBlockChain(block, blockPerm, adjacentBlock, newDepth + 1))
            }
        }
    }
})
function getNextSolidBlock(origin, minRange){
    let below = origin.y;
    let solidBlock;
    while (below > minRange){
        solidBlock = origin.dimension.getBlock({x:origin.x , y:below, z:origin.z})
        if(solidBlock.typeId != "minecraft:air") return solidBlock;
        below--;
    }  
    return solidBlock = origin.dimension.getBlock({x:origin.x , y:minRange, z:origin.z});
}
//Personally I dont think its worth trying to make another check to see if the block is air. The return is merely a fallback. If a rope is reaching
//into the void. Then i ask the player? WTF are you doing there in the first place, and why do you need that 1 extra block reachdown?

//Currently used as picking up entities that have a runtime identifier of "minecraft:arrow" drops only an arrow, 
function dropEntityItem(entity, item){
    entity.dimension.spawnItem(new ItemStack(item, 1), entity.location);
    entity.remove();
}