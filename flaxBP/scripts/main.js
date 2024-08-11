import {world, system, Direction} from "@minecraft/server"
import "./containerUtils"
import "./rope.js";
import "./ropeArrow.js"
import "./cropFlax.js"
import "./flowerFlax.js"
import "./slabThatch.js"
// import "./seedsFlax.js"
//General methods that don't fit a theme 


//Down,Up,North,South,West,East
const adjacentVectors = [{x: 0, y:-1, z:0},{x: 0, y:1, z:0},{x: 0, y:0, z:-1},{x: 0, y:0, z:1},{x: -1, y:0, z:0},{x: 1, y:0, z:0}]
const getRelativeBlockLocation = (l, aL) => ({x:l.x + aL.x, y:l.y + aL.y, z:l.z + aL.z });

export function getAdjacentBlock(source, face){
    const faceNum = Object.keys(Direction).indexOf(face);
    const adjacentBlock = source.dimension.getBlock(getRelativeBlockLocation(source.location, adjacentVectors[faceNum]));
    return adjacentBlock;
}
system.runInterval(
	() => {
		const players = world.getAllPlayers();
		for (let i = 0; i < players.length; i++) {
			const player = players[i];
			try {
				const { block, face } = player.getBlockFromViewDirection();
				if (!block) {
					player.onScreenDisplay.setActionBar( "Not looking at a Block." );
					return;
				};
				
				player.onScreenDisplay.setActionBar(
					`§rblock: §7${block.typeId}§r, face: §7${face}§r, xyz: §6${block.location.x} §r/ §6${block.location.y} §r/ §6${block.location.z}§r,\n`
					+ `data: §7${JSON.stringify(block.permutation.getAllStates(), null, 4)}`
				);
			} catch {
				player.onScreenDisplay.setActionBar( "Not looking at a Block." );
			};
		};
	},
);