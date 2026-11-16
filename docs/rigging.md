# Rigging

The rig solver drives bones with analytic two bone IK. It is used for arms and legs, for prop attachment and for look at targets.

## Bones

A skeletal mesh carries a bone hierarchy. Every bone has a name, a parent, a local position and a rotation limit:

| Field | Purpose |
| --- | --- |
| Rest rotation | The pose the bone returns to |
| Limits | Minimum and maximum rotation per axis |
| Length | Draw length in the viewport |

Open **Window → rig solver** with a skeletal mesh selected to see the hierarchy and the limits.

## Two bone IK

Pick a chain of two bones (thigh and shin, upper arm and forearm), then set a target. The solver keeps the bone lengths, clamps at full reach and uses a pole vector to decide which way the joint bends.

```js
iksolve(thigh, shin, target, pole)
```

| Parameter | Meaning |
| --- | --- |
| Target | The point the end effector reaches for |
| Pole | A direction that decides the bend plane |
| Stiffness | How much the pose resists the solution |
| Reach clamp | Stops the chain from stretching past its length |

## Ragdoll

Any skeletal mesh can be switched to ragdoll. Every bone becomes a particle with a mass and a distance constraint to its parent, so the body falls and settles without a full physics skeleton.

```js
ragdoll(mesh, true)
```

Toggle it back and the mesh returns to its clip. Ragdoll runs in play mode and while stopped, which makes it useful for posing.

## Retargeting

A clip authored on one skeleton can be retargeted to another by matching bone names. Unmatched bones keep their rest pose, matched bones receive the rotation delta scaled by the bone ratio.

## Poses

Save the current bone rotations as a named pose, then blend between poses with the pose slider. Poses are stored on the skeletal mesh, so they travel with the project.
