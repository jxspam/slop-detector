# Launch Assets

## Product Demo Verification

The product demo video (`demo.mp4`) records real feed scrolling with active live evaluations on the X search feed.
Verified metrics from the 20-second recorded clip (300 frames at 15 fps):

### Frame Brightness Analysis (Locked Dark Theme)
- Total frames measured: 300
- Dark mode frames (< 100 YAVG): 300 (100%)
- Light mode frames (> 100 YAVG): 0 (0%)
- Theme flips: 0 (PASSED)
- Min brightness (YAVG): 28.3284
- Max brightness (YAVG): 46.6736 (smooth curve during close-up on the badge)
- Mean brightness (YAVG): 36.8188
- Frame 1 brightness (YAVG): 28.3423
- Frame 300 brightness (YAVG): 28.3423
- Loop boundary delta (Frame 1 vs Frame 300): 0.000000 (Exact Match)

### Frame Sequence
- Frame 1: Wide establishing view of the search feed showing Samuel's post with the attached `LIKELY AI SLOP` badge.
- Frame 120: Smooth camera push-in (1.7x zoom) onto the `LIKELY AI SLOP` red pill badge with the score `100%` clearly readable.
- Frame 225: Smooth camera zoom-out returning to the wide feed view.
- Frame 300: Exact match to Frame 1 (delta 0.000000) for a seamless loop with zero flash or restart jump.

Total clip duration: 20.0 seconds (300 frames at 15 fps).

## Launch Clips

- 16:9 Landscape Demo: `launch/demo_16_9.mp4`
- 9:16 Vertical Demo: `launch/demo_9_16.mp4`
- 16:9 MiniMax H3 Launch Video: `launch/launch_16_9.mp4`
- 9:16 MiniMax H3 Launch Video: `launch/launch_9_16.mp4`

## Launch Post

Every day your timeline gets flooded with synthetic engagement bait, generic motivational threads, and AI platitudes.

Instead of hiding or deleting tweets with clunky keyword blocks, we built Slop Detector.

It is an open source Chrome MV3 extension powered by TypeSafe Jev System One decisions. As you scroll, each visible post is evaluated against calibrated criteria in real time.

How it marks your feed:
- Score 80 and above: A compact red pill badge marked LIKELY AI SLOP with the exact confidence percentage.
- Score 40 to 79: A subtle amber outline prompting you to check phrasing without issuing an accusation.
- Score under 40: Untouched. Zero visual noise.

Nothing is removed, hidden, collapsed, or blurred. Your feed stays complete, and failed evaluations leave posts untouched. Your API key stays server-side in a local relay.

Demo video, architecture details, and setup guide below.
