import {world, ItemStack, system, BlockPermutation} from "@minecraft/server"
import {setMainHand} from './containerUtils.js';

world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockTypeRegistry.registerCustomComponent('flax:on_place_rope', {
        onPlace(e) {
            const { block } = e;
            if(block.above().typeId === "flax:rope"){
                block.above().setPermutation(block.above().permutation.withState("flax:rope_end", false));
            }    
        }
    });
});
world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockTypeRegistry.registerCustomComponent('flax:on_interact_rope', {
        onPlayerInteract(e) {
            const { block, player, face } = e;

            if(face === "Down") return;
            const equipment = player.getComponent('equippable');
            const selectedItem = equipment.getEquipment('Mainhand');

            if(!selectedItem) return;

            const isRopeEnd = block.permutation.getState("flax:rope_end");
            
            //TODO reduce the durability of shears
            if(selectedItem.typeId === "minecraft:shears" && isRopeEnd){
                block.setPermutation(block.permutation.withState("flax:rope_end", false));
                world.playSound("use.cloth", block.location);
                return;
            }

            const minRange = block.dimension.heightRange.min;

            if(selectedItem.typeId === "flax:rope_item" && block.location.y != minRange){
                let below; 
                if(isRopeEnd){
                    below = block.below();
                }
                else{
                    const ropeEndPoint = findRopeEnd(block, minRange);

                    if(ropeEndPoint.location.y == minRange) return;

                    below = ropeEndPoint.dimension.getBlock({x:ropeEndPoint.x , y:ropeEndPoint.y - 1, z:ropeEndPoint.z})
                }
                
                if(below.typeId === "minecraft:air"){
                    below.setType("flax:rope")
                    setMainHand(player, equipment, selectedItem);
                    world.playSound("use.cloth", block.location);
                }
                
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
    if(player.getGameMode() !== "creative"){
        block.dimension.spawnItem(new ItemStack("flax:rope_item", amount), player.location)
    }
}

export function* setBlockChain(origin, newBlock, originLocation, depth){
    for(let i = 1; i < depth; i++){
		const block = origin.dimension.getBlock({ x: originLocation.x, y: originLocation.y-i, z: originLocation.z })
		block.setPermutation(newBlock);
        world.playSound("dig.cloth", block.location);
		yield
	}
}


//TODO, when origin block is broken, the item spawns in the block, which kind of ruins the method of getting all your items back, so for the time being
//players will get -1 item, or atleast the original rope will be placed around the rope. Players could mitigate this by breaking the block above
world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockTypeRegistry.registerCustomComponent('flax:on_player_destroy_rope', {
        onPlayerDestroy(e) {
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

const ClimbableBlocks = {
    "flax:rope": {
        ClimbSpeed: 0.25,
        FallSpeed: 0.1
    }
}

system.runInterval(()=>{
    for (let player of world.getAllPlayers()) {

        if(player.isFlying) continue;

        let BlockTop = player.dimension.getBlock({x: player.location.x, y: player.location.y + 0.5, z: player.location.z})
        let BlockBottom = player.dimension.getBlock(player.location)
        let ClimbableBlock = ClimbableBlocks[BlockTop.typeId] ?? ClimbableBlocks[BlockBottom.typeId]
        let hasLevitiation = player.getEffects().find((effect) => effect.typeId === "levitation")
        if (!ClimbableBlock) continue; 

        if (player.isJumping){
            player.applyKnockback(0, 0, 0, ClimbableBlock.ClimbSpeed)
        }
        else if(hasLevitiation === undefined){
            if(player.isSneaking){
                player.applyKnockback(0, 1, 0, 0.0135)
            }else{
                player.applyKnockback(0, 0, 0, -Math.abs(ClimbableBlock.FallSpeed))
                player.addEffect("slow_falling", 40, { amplifier: 1, showParticles: false });
            }  
        }
    }
})