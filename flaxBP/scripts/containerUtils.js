import {ItemStack} from '@minecraft/server';

export function setMainHand(player, equipment, item){
    if (player.getGameMode() !== "creative") {
        if (item.amount > 1) {
            item.amount -= 1;
            equipment.setEquipment('Mainhand', item);
        } else if (item.amount === 1) {
            equipment.setEquipment('Mainhand', undefined);
        }
    }
}

//Searches the entirety of a given container, returns the number of X item
export function getItemAmount(container, item){
    let containerAmount = 0;
    for(let i = 0; i < container.size; i++){
         if(!container.getItem(i)) continue;
        
         if(container.getItem(i).typeId === item){
             containerAmount += container.getItem(i).amount;
         } 
     }
    return containerAmount;
}
//Even though I've added them without being aware of certain methods, im sure they will be useful in the future
//Will solve later, as for some reason i couldnt get round array.find() issue. I'm sure I will find some scenario
//where this will be necessary, e.g adding more than 1 item to a container that has slots with said item.
// export function getItemStackSlots(container, item){
//     let slotArray  = [];
//     for(let i = 0; i < container.size; i++){
//         if(!container.getItem(i)) continue;
       
//         if(container.getItem(i).typeId === item){
//             slotArray.push(i);
//         } 
//     }
//     return slotArray;
// }

//Honestly cant figure it out. Will work on it in the future, maybe. Its a small inconvenience
export function getFirstAvailableSlot(container, item){
    for(let i = 0; i < container.size; i++){
        if(!container.getItem(i)) continue;
        
        if(container.getItem(i).typeId === item && 
            container.getItem(i).amount > container.getItem(i).maxAmount){
            return i;
        } 
    }
    return undefined
}
//TODO
export function getFirstEmptySlot(container){
    for(let i = 0; i < container.size; i++){
        if(!container.getItem(i)) continue;
       
        if(container.getItem(i).typeId === item){
            containerAmount += container.getItem(i).amount;
        } 
    }
}
//Searches the entirety of a given container, will remove X amount of an item 
export function removeItemAmount(container, item, amount){
    let remainingAmount = amount;
    for(let i = 0; i < container.size; i++){
        if(remainingAmount == 0) break;

        let itemStack = container.getItem(i);

        if(!itemStack || itemStack.typeId !== item) continue;
        
        if(remainingAmount >=  itemStack.amount){
            
            remainingAmount -= itemStack.amount
            container.setItem(i, undefined)
        }else{
            container.setItem(i, new ItemStack(item, itemStack.amount - remainingAmount))
            remainingAmount = 0;
        }
    }
}