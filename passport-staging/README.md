# Builder passport

Your passport runs locally on this laptop. Nothing is uploaded.

To start it again in PowerShell:

```powershell
cd C:\Users\Lenovo\builder-passport
npm.cmd run dev -- --port 5173
```

Open http://127.0.0.1:5173/ in Chrome.

The page uses the exact reference source and pinned package versions from your build prompt.

## Replace the portrait later

Copy your painted portrait over `public/build-sprint/portrait.png`, keeping that exact name. Refresh the page in Chrome. Change nothing else. The source image is used without editing; the page applies the reference shield crop and lighting.

## Export

Choose a format and click **Export 10s clip**. Chrome downloads `build-sprint-passport-recording.mp4`. The video is rendered and encoded on your laptop.

## Check the code

```powershell
npx.cmd tsc --noEmit
npx.cmd vite build
```
