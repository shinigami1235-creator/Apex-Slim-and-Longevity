# Libraries served from this site

The 3D and photo tools load these from here rather than from a CDN, since a file changed on a CDN would run on a page where a visitor has a photo open. Each folder is an exact copy of the files the tools use from the npm package and version below. To update one, download the new version with `npm pack`, copy the same files over and change the version here.

| Folder | npm package | Version | Licence | Used by |
| --- | --- | --- | --- | --- |
| three | three (build/three.module.js) | 0.160.0 | MIT | Body check |
| face_mesh | @mediapipe/face_mesh | 0.4.1633559619 | Apache-2.0 | Goal photo (face) |
| pose | @mediapipe/pose (without pose_landmark_heavy.tflite) | 0.5.1675469404 | Apache-2.0 | Goal photo (body) |
