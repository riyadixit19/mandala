# Mandala

Yoga, one pose at a time. Mandala uses your camera to check your form, tells you what to fix, and times your hold. Pose tracking runs in the browser with MediaPipe, so video is never uploaded.

## How a practice works

1. **Pick a pose** from the library of 61 poses. An illustrated character shows the shape.
2. **Hold it for 5 seconds.** When your whole body is in frame, a countdown starts. Mandala then compares your joint angles with the pose.
3. **Get a verdict.** If something is off, it names the biggest fix ("Straighten your left knee") and checks again.
4. **Keep it for 15 seconds.** Once your form is right, a timer runs. If you slip out of the pose for more than a moment, it pauses until you are back.

Strictness (Relaxed, Standard, Strict) sets how closely your joints must match.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000. Camera access needs `localhost` or HTTPS.

## Project layout

```
src/app/
  page.tsx                  Home screen (logo, name, Start now)
  practice/page.tsx         The practice studio (loads YogaPoseDetector)
  YogaPoseDetector.tsx      Camera, detection loop and practice clock
  layout.tsx, metadata.ts   Fonts, SEO metadata, AdSense
  components/
    brand/Logo.tsx          Flower logo and wordmark
    CameraControls.tsx      Start/stop, switch camera, zoom, chime, strictness
    SessionOverlay.tsx      Countdown, verdict and timer shown over the camera
    PosePanel.tsx           Target pose card and progress
    PoseLibrary.tsx         Searchable pose library
    HelpModal.tsx           How it works
  figure/
    poseRig.ts              The character's skeleton and all 61 pose definitions
    PoseFigure.tsx          Draws and animates the character
  utils/
    poseMatcher.ts          Compares your joint angles with the target pose,
                            and finds the closest pose for "Camera sees"
    practiceSession.ts      Hold -> check -> 15 s timer state machine
    dataLoader.ts           Loads the MediaPipe model and pose list
    ...
public/
  models/, wasm/            MediaPipe model and runtime (self-hosted; wasm/ is refreshed
                            from node_modules on every npm install)
  posesData.json            Pose names and descriptions
```

## Tuning

- Hold and timer lengths: `CHECK_SECONDS` and `HOLD_SECONDS` in `src/app/constants/yoga.constants.ts`.
- Strictness thresholds: `CONFIDENCE_PRESETS` in the same file.
- A pose's reference shape: edit its angles in `src/app/figure/poseRig.ts`. The illustration and the form check both update.
- The live domain is https://mandala.help. If it changes, update `SITE_URL` in `src/app/metadata.ts`, `public/sitemap.xml` and `public/robots.txt`.

## Known limits

- Cat Pose and Cow Pose differ only in the curve of the spine, which the camera's joint points can't see, so they look the same to the form check. The same goes for Easy Pose and Lotus Pose.
- Poses are checked from a 2D camera image, so face the camera the same way as the illustration (side-on poses side-on).
