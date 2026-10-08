# Verification

- Node v24.16.0; required internet check returned three 0.185.1.
- Exact pinned packages installed; npm reported zero vulnerabilities.
- TypeScript (`npx.cmd tsc --noEmit`) passed.
- Production build (`npx.cmd vite build`) passed.
- Desktop Google Chrome: artwork ready, Recorded Newsreader loaded, WebCodecs available.
- Original portrait and installed portrait have identical SHA-256 fingerprints.
- Brand files downloaded locally. Newsreader MD5: 606d3683d4055915d04360dd53469c94.
- Two real 4:5 exports produced H.264 High, 1080 x 1350, 30 fps, 300 frames, 10 seconds.
- ffmpeg comparison: SSIM All 1.000000; PSNR infinity in every channel.
- Entire files are identical after ignoring only the MP4 creation/modification timestamps. mp4-muxer 5.2.2 adds current saved-time stamps; the reference code remains unchanged.
- Finished clip saved in C:\Users\Lenovo\Downloads\build-sprint-passport-recording.mp4.
- Checked desktop and narrow-window panel placement.

Visual check: the passport occupies the middle three columns of the desktop view on pure black. The rightmost column contains the dark export panel with a format selector and gold export button. The plate has two cut borders, Newsreader BUILDER, the provided colour portrait in the shield, BUILD SPRINT, and By GrowthX. Clear glass extends beyond the satin gold. At the turned angle, highlights shift across cut rims while the brown lettering floors remain dark. The reference narrow layout docks the export panel at the bottom; on a 390px viewport the slab's sides are cropped, as specified by the unchanged reference camera and full-screen canvas.
