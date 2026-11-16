# Control Rig - inverse kinematics

Control Rig solves limb poses from an end effector instead of from joint angles. Roxumitod Game Engine ships an analytic two-bone solver: give it a root, a target, two segment lengths and a pole direction, and it returns the elbow position.

## Concepts

**Effector** - the point the limb must reach, usually where the hand or foot should be.

**Segments** - upper and lower bone lengths. The limb can only reach as far as their sum.

**Pole** - which side the joint bends toward. Flipping it is how a knee turns from forward to backward.

**Reach** - when the target is farther than `upper + lower`, the solver extends the limb fully along the direction to the target instead of failing.

## Walkthrough

1. Open **Window → Control Rig**.
2. Drag **Effector X** and **Effector Y**. The elbow follows in real time, drawn as two coloured segments.
3. Shorten **Upper length** and watch the solved distance and the elbow position readout change.
4. Switch **Pole direction** from forward to backward. The joint flips sides without changing the reach.
5. Drag the effector outside the reach radius: the limb straightens and the solved distance clamps.

## The maths

```
d = clamp(distance(root, effector), |l1 - l2|, l1 + l2)
a = (l1² - l2² + d²) / 2d
h = sqrt(l1² - a²)
elbow = root + unit * a ± perp * h
```

That is the law of cosines resolved in the plane of the limb, with `h` giving the height of the triangle and the pole sign choosing which side.

## Reference

| Call | Returns |
| --- | --- |
| `ik2(ax, ay, bx, by, l1, l2, bend)` | `[elbowx, elbowy, solveddistance]` |

Use it for foot planting on slopes, hand placement on ladders, and weapon aiming: solve the arm to a target point each frame and apply the resulting angles to the rig.
