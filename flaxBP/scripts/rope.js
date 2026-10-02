import {world, ItemStack, system, BlockPermutation} from "@minecraft/server"
import {setMainHand} from './containerUtils.js';

//rope item
system.beforeEvents.startup.subscribe(eventData => {
    eventData.itemComponentRegistry.registerCustomComponent("flax:on_use_on_rope", {
        onUseOn(e) {
            const { source, block, blockFace} = e;

            if(blockFace === "Down" || block.typeId !== "flax:rope") return;

            const equipment = source.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');

            const isRopeEnd = block.permutation.getState("flax:rope_end");
            const minRange = block.dimension.heightRange.min;

            //changes the rope to allow for decoration
            if(source.isSneaking && isRopeEnd){
                block.setPermutation(block.permutation.withState("flax:rope_end", false));
                block.dimension.playSound("use.cloth", block.location);
                return;
            }
            //adds 1 rope block to the bottom of a rope column
            if(block.location.y != minRange){

                let belowBlock = getAvailableBlockBelow(block, isRopeEnd, minRange); 
                  
                if(belowBlock.typeId !== "minecraft:lava" && (belowBlock.isAir || belowBlock.isLiquid)){
                    belowBlock.setType("flax:rope")
                    
                    if(belowBlock.isLiquid) belowBlock.setWaterLogged(true);
                    
                    block.dimension.playSound("use.cloth", block.location);

                    setMainHand(source, equipment, selectedItem);
                }
            }
        }
    });
});
function getAvailableBlockBelow(block, isRopeEnd, minRange){
    if(isRopeEnd){
        return block.below();
    }
    else{
        const ropeEndPoint = findRopeEnd(block, minRange);

        if(ropeEndPoint.location.y == minRange) return;

       return ropeEndPoint.dimension.getBlock({x:ropeEndPoint.x , y:ropeEndPoint.y - 1, z:ropeEndPoint.z})
    }
}

//rope block
system.beforeEvents.startup.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('flax:on_place_rope', {
        onPlace(e) {
            const { block } = e;
            if(block.above().typeId === "flax:rope"){
                block.above().setPermutation(block.above().permutation.withState("flax:rope_end", false));
            }    
        }
    });
});
function findRopeEnd(origin,minRange){
    let below = origin.y;
    let ropeEnd;
    while(below > minRange){
        ropeEnd = origin.dimension.getBlock({x:origin.x , y:below, z:origin.z})
        if(ropeEnd.permutation.getState("flax:rope_end") == true) return ropeEnd;
        below--;
    }
    return ropeEnd = origin.dimension.getBlock({x:origin.x , y:minRange, z:origin.z});
}

//Currently all ropes below the origin break immediately. I would prefer a visual similar to breaking vines.
//UPDATE: Used a generator method to hope make the block deletion/creation more organic
export function breakRopeChain(block, player, y){
    const ropeEndPoint = findRopeEnd(block, block.dimension.heightRange.min);
    const amount  = y - ropeEndPoint.y;
    const blockPerm = BlockPermutation.resolve("minecraft:air")

    system.runJob(
        // system.runInterval(() => {setBlockChain(block, blockPerm, block.location, depth);}, 10)
        setBlockChain(block, blockPerm, block.location, amount+1)
        )
    if(player.getGameMode() !== "Creative"){
        block.dimension.spawnItem(new ItemStack("flax:rope_item", amount), player.location)
    }
}

export function* setBlockChain(origin, newBlock, originLocation, depth){
    for(let i = 1; i < depth; i++){
		const block = origin.dimension.getBlock({ x: originLocation.x, y: originLocation.y-i, z: originLocation.z })
		block.setPermutation(newBlock);
        block.dimension.playSound("dig.cloth", block.location);
		yield
	}
}


//TODO, when origin block is broken, the item spawns in the block, which kind of ruins the method of getting all your items back, so for the time being
//players will get -1 item, or atleast the original rope will be placed around the rope. Players could mitigate this by breaking the block above
system.beforeEvents.startup.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('flax:on_player_destroy_rope', {
        onPlayerBreak(e) {
            const {player, block} = e;

            if(!player || !player.getComponent('equippable')) return;

            if(block.above().typeId === "flax:rope"){
                block.above().setPermutation(block.above().permutation.withState("flax:rope_end", true));
            }

            if(block.location.y != block.dimension.heightRange.min && block.below().typeId === "flax:rope"){
                breakRopeChain(block, player, block.location.y)
            }
        }
    });
});

//Break rope if the block above is destroyed
//Currently commented out as it overlaps the rope onDestroy event
// world.afterEvents.playerBreakBlock.subscribe(e =>{
//     const {player, block} = e;
//     if(block.location.y != block.dimension.heightRange.min && block.below().typeId === "flax:rope"){
//         breakRopeChain(block, player, block.location.y)
//     }
// })

