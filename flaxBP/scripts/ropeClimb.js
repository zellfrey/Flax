import { Block, ButtonState, EntityDamageCause, InputButton, Player, system, world } from "@minecraft/server";

const ROPE_ID = "flax:rope";
const SLIDE_SPEED = 0.275;
const CLIMB_KNOCKBACK = 0.275;
const HOLD_KNOCKBACK = 0.033;
const SLIDE_KNOCKBACK = -0.05;

// Get the ladder block the player currently overlaps, if any. The ladder's
// collision plate is thin, so a player pressed against the wall stands
// inside the ladder's block space
//(player: Player): Block | undefined 
function ropeAt(player) {
  const loc = player.location;
  // Feet first, then chest. Checking both keeps the climb continuous as
  // the player crosses from one ladder block into the next, which is
  // where a feet-only test drops the player for a tick
  for (const y of [loc.y, loc.y + 1]) {
    try {
      const block = player.dimension.getBlock({
        x: Math.floor(loc.x),
        y: Math.floor(y),
        z: Math.floor(loc.z),
      });
      if (block !== undefined && block.typeId === ROPE_ID) {
        return block;
      }
    } catch {
      // Chunk not loaded, treat it as no ladder
    }
  }
  return undefined;
}

// Vanilla climbs whenever the player is inside the ladder and pressing
// forward, it does not check which way the ladder faces. Testing the yaw
// against the ladder's face made the climb switch on and off as the player
// looked around, which is what the stutter was
//(player: Player): boolean
function pushesIntoRope(player) {
  // Read the raw stick/keyboard input: x is strafe, y is forward
  return player.inputInfo.getMovementVector().y > 0;
}

// Gravity and drag, the engine's own per-tick change to vertical speed. Only
// the slide needs them, to tell whether the next tick would pass the cap
const GRAVITY = 0.08;
const DRAG = 0.98;

// Write one vertical knockback. Vanilla sets the climb speed outright every
// tick rather than nudging towards it, and so does this: a fixed value each
// tick cannot oscillate, where correcting by the difference to a speed read a
// tick late did, because a player's velocity reaches the script one tick
// behind the client that owns it
//(player: Player, knockback: number): void
function push(player, knockback){
  player.applyKnockback({ x: 0, z: 0 }, knockback);
}

// Steer one player who is on a ladder this tick
//(player: Player): void
function steer(player){
  // Jumping or walking into the ladder climbs, like vanilla
  const jumpHeld =
    player.inputInfo.getButtonState(InputButton.Jump) === ButtonState.Pressed;
  if (jumpHeld || pushesIntoRope(player)) {
    push(player, CLIMB_KNOCKBACK);
    return;
  }

  // Sneaking parks the player on the ladder
  if (player.isSneaking) {
    push(player, HOLD_KNOCKBACK);
    return;
  }

  // Otherwise gravity takes them down and the ladder only caps the speed. The
  // velocity read here is a tick old, which is fine for a one-sided cap
  if ((player.getVelocity().y - GRAVITY) * DRAG < -SLIDE_SPEED) {
    push(player, SLIDE_KNOCKBACK);
  }
}

// The movement loop. Runs every tick because climbing is continuous
// motion; everything it does per player is a block read and some math
system.runInterval(() => {
  for (const player of world.getPlayers()) {
    // Flying creative players steer themselves
    if (player.isFlying) {
      continue;
    }
    const ladder = ropeAt(player);
    if (ladder === undefined) {
      continue;
    }
    steer(player);
  }
}, 1);

// Landing in a ladder must not hurt, the slow slide keeps speeds low,
// but a player can still grab a ladder mid-fall
world.beforeEvents.entityHurt.subscribe((event) => {
  if (event.damageSource.cause !== EntityDamageCause.fall) {
    return;
  }
  const entity = event.hurtEntity;
  if (entity.typeId !== "minecraft:player") {
    return;
  }
  const loc = entity.location;
  const block = entity.dimension.getBlock({
    x: Math.floor(loc.x),
    y: Math.floor(loc.y),
    z: Math.floor(loc.z),
  });
  if (block !== undefined && block.typeId === ROPE_ID) {
    event.cancel = true;
  }
});