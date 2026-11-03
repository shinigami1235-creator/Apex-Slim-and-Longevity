# Body check mesh

`build_slim.py` writes `assets/lab/slimbody.bin` for the Wellness Lab body check. It reuses the Apex Surgery body map build (same MakeHuman CC0 base mesh, morphs and decimation, files copied here unchanged) and adds thin, average and heavy shapes for each sex plus a belly shape.

```
MH_DATA=<makehuman checkout>/makehuman/data python3 build_slim.py <out dir>
```

Layout (little endian): Uint32 N, Uint32 E; Float32 cx, cy, cz, s, sb; Int16 x3N for female thin, average, heavy and male thin, average, heavy (value = q / 32767 x s + c); Int16 x3N female belly offset and male belly offset (value = q / 32767 x sb); Uint16 x2E edges; Uint8 xN region id (as in the Surgery body map).
