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

//Down,Up,North,South,West,East
const blockFaceLocations = [{x: 0, y:1, z:0},{x: 0, y:-1, z:0},{x: 0, y:0, z:1},{x: 0, y:0, z:-1},{x: 1, y:0, z:0},{x: -1, y:0, z:0}]

export function getAdjacentBlock(source, face){
    const faceNum = Object.keys(Direction).indexOf(face);
    const adjacentBlock = source.dimension.getBlock(getRelativeBlockLocation(source.location, adjacentVectors[faceNum]));
    return adjacentBlock;
}

export function getBlockFromFace(source, face){
    const faceNum = Object.keys(Direction).indexOf(face);
    const affectedBlock = source.dimension.getBlock(getRelativeBlockLocation(source.location, blockFaceLocations[faceNum]));
    return affectedBlock;
}