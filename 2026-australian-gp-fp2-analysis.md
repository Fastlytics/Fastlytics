# 2026 Australian GP FP2 Analysis: Ferrari vs Mercedes vs Red Bull

## Sources used

- Cached session data from [backend-api/cache/2026/2026-03-08_Australian_Grand_Prix/2026-03-06_Practice_2](/Users/subhashh/Developer/Fastlytics/backend-api/cache/2026/2026-03-08_Australian_Grand_Prix/2026-03-06_Practice_2)
- Cached charts/results from [backend-api/cache/2026/charts](/Users/subhashh/Developer/Fastlytics/backend-api/cache/2026/charts) and [backend-api/cache/2026/races](/Users/subhashh/Developer/Fastlytics/backend-api/cache/2026/races)
- On-demand telemetry fetched from the local backend API for the fastest FP2 laps of `HAM`, `LEC`, `RUS`, `ANT`, `VER`, and `HAD`

## Telemetry note

The raw FP2 telemetry exports were not already present on disk in [backend-api/cache/2026/telemetry](/Users/subhashh/Developer/Fastlytics/backend-api/cache/2026/telemetry), but the running local backend was able to generate the fastest-lap telemetry on demand.

That gave me real FP2 traces for:

- speed
- throttle
- brake
- gear
- RPM

One limitation remains: the API returned `DRS: 0` throughout these FP2 fastest laps, so DRS-specific conclusions are not reliable from this snapshot.

## Executive summary

Mercedes looked like the most complete package in FP2.

- Best Mercedes lap: `79.943` by Antonelli
- Best Ferrari lap: `80.050` by Hamilton
- Best Red Bull lap: `80.366` by Verstappen

Relative to the FP2 benchmark from Piastri (`79.729`):

- Mercedes: `+0.214`
- Ferrari: `+0.321`
- Red Bull: `+0.637`

The broad picture:

- Mercedes was not the fastest in the speed traps, but it converted the lap best.
- Ferrari had the best mid-corner signatures and was especially strong on used softs.
- Red Bull looked the most straightline-biased: high-speed, high-gear, low-brake, but not as efficient through the lap.

## One-lap comparison

| Team     | Driver | Best lap | Compound | Tyre life |     S1 |     S2 |     S3 | SpeedI2 | SpeedFL | SpeedST |
| -------- | -----: | -------: | -------- | --------: | -----: | -----: | -----: | ------: | ------: | ------: |
| Ferrari  |    HAM |   80.050 | Soft     |         7 | 27.902 | 17.593 | 34.555 |     292 |     303 |     291 |
| Ferrari  |    LEC |   80.291 | Soft     |         7 | 28.182 | 17.462 | 34.647 |     298 |     308 |     294 |
| Mercedes |    ANT |   79.943 | Soft     |         5 | 28.067 | 17.531 | 34.345 |     279 |     293 |     290 |
| Mercedes |    RUS |   80.049 | Soft     |         2 | 28.037 | 17.555 | 34.457 |     279 |     300 |     294 |
| Red Bull |    VER |   80.366 | Soft     |         2 | 28.149 | 17.570 | 34.647 |     287 |     291 |     303 |
| Red Bull |    HAD |   80.941 | Soft     |         2 | 28.260 | 18.020 | 34.661 |     271 |     297 |     298 |

Key read:

- Mercedes had the best combined driver-best average: `79.996`
- Ferrari was next: `80.171`
- Red Bull was clearly third on pure one-lap average: `80.654`

## Telemetry fingerprint of each car

Representative fastest laps:

- Ferrari: Hamilton
- Mercedes: Antonelli
- Red Bull: Verstappen

| Driver | Lap time | Top speed | Full throttle % | Partial throttle % | Coast % | Brake % | Mean gear | Low-gear % | Mean RPM |
| ------ | -------: | --------: | --------------: | -----------------: | ------: | ------: | --------: | ---------: | -------: |
| HAM    |   80.050 |     322.0 |           65.13 |              23.03 |    2.96 |   11.18 |      5.78 |      22.70 |    10897 |
| ANT    |   79.943 |     325.0 |           64.88 |              23.75 |    0.33 |   14.38 |      5.57 |      26.76 |    10967 |
| VER    |   80.366 |     326.0 |           63.88 |              19.40 |    6.69 |   10.37 |      5.88 |      22.74 |    10895 |

These three rows explain most of the session.

### Ferrari telemetry shape

Ferrari’s car looks like the best pure corner-speed platform of the three.

- Hamilton carried the highest apex speed at the first medium-speed braking zone: `174 km/h`
- Ferrari also had the highest apex speed in the technical late-lap corner around `4.10 km`: `121.2 km/h`
- Ferrari was still fast in a straight line, but not as trap-speed obsessed as Red Bull

Ferrari’s fastest laps also came on used softs:

- Hamilton best on `7-lap-old` soft
- Leclerc best on `7-lap-old` soft
- Leclerc repeated `80.346` on a `9-lap-old` soft

That is a real signal. Ferrari was not just peaking on a fresh-tyre hit. It was carrying performance deeper into the stint.

### Mercedes telemetry shape

Mercedes looks like the most rotation-focused and lap-efficient car.

- Highest brake share of the three representative cars: `14.38%`
- Highest low-gear share: `26.76%`
- Lowest mean gear: `5.57`

That combination usually means the driver is spending more of the lap properly working the braking and rotation phase, not just flattening the straights.

And despite giving away headline split speed:

- `SpeedI2` lower than Ferrari
- `SpeedFL` lower than Ferrari
- `SpeedST` lower than Red Bull

Mercedes still produced the fastest lap and the best S3.

That strongly suggests the Mercedes was the most complete car through the corner sequence rather than the fastest on any single straight.

### Red Bull telemetry shape

Red Bull looked the most straightline-biased.

- Highest top speed of the representative three: `326 km/h`
- Lowest brake share: `10.37%`
- Highest coast share: `6.69%`
- Highest mean gear: `5.88`

That points to a car spending more of the lap in high gear, with less total braking time and more straightline emphasis.

The problem is that the lap-time conversion was weaker than the raw speed suggests.

Verstappen’s speed-trap number (`303`) was comfortably the best of the three-team group, but he was still:

- `0.423s` slower than Antonelli
- `0.316s` slower than Hamilton

So Red Bull’s FP2 shape was:

- efficient on the straights
- less convincing in the braking-plus-rotation phase
- less able to hold the same minimum corner speed as Ferrari

## Corner-by-corner behavior

Below are the key comparison points from the representative fastest laps.

| Approx distance      |   HAM |   ANT |   VER | Main takeaway                                                         |
| -------------------- | ----: | ----: | ----: | --------------------------------------------------------------------- |
| `0.37 km` apex speed | 174.0 | 162.0 | 163.0 | Ferrari carries much more speed through the first medium-speed corner |
| `1.09 km` apex speed | 104.0 | 102.0 | 102.0 | Similar minimum speed, but Red Bull gets back to throttle much later  |
| `4.10 km` apex speed | 121.2 | 115.1 | 113.1 | Ferrari again has the best corner minimum in the technical section    |
| `4.61 km` apex speed |  94.0 |  95.0 |  94.1 | Similar minimum speed at the final slow corner                        |

Throttle pickup after the final slow corner:

- Hamilton: `4803 m`
- Antonelli: `4796 m`
- Verstappen: `4673 m`

That is one of the clearest Red Bull signatures. Verstappen is back on throttle around `120-130 m` earlier than Ferrari or Mercedes there, which explains why Red Bull’s straightline number is so strong.

But that comes with a trade:

- Red Bull wins the drag race after the corner
- Ferrari and Mercedes are better through more of the cornering phase before that

Another important point is the heavy stop around `1.09 km`.

Throttle pickup there:

- Hamilton: `1151 m`
- Antonelli: `1141 m`
- Verstappen: `1267 m`

That is a major loss for Red Bull. Verstappen reaches roughly the same apex minimum speed as the other two, but gets back to power much later. That usually points to one of two things:

- more understeer/rotation delay at apex, or
- a traction limitation forcing a later throttle application

Either way, it is exactly the kind of behavior that makes a car look quick on the straights but not quick enough on the stopwatch.

## Where each team gained or lost

Using the normalized distance-based time comparison on the representative fastest laps:

### Ferrari vs Mercedes

Ferrari’s strongest windows versus Mercedes were:

- `0.26-0.52 km`
- `4.59-5.12 km`

Mercedes’ strongest windows versus Ferrari were:

- `3.80-4.07 km`
- `4.33-4.72 km`

Interpretation:

- Ferrari was better in the first medium-speed phase and the final run
- Mercedes made the bigger difference in the late technical section, which is exactly why Antonelli had the best S3

### Mercedes vs Red Bull

Mercedes’ strongest windows versus Red Bull were:

- `1.05-1.31 km`
- `3.80-4.59 km`

Red Bull’s strongest windows versus Mercedes were:

- `0.26-0.52 km`
- `4.72-5.12 km`

Interpretation:

- Red Bull gains in acceleration and end-of-lap straightline phases
- Mercedes gains in the braking-heavy first big stop and in the long technical run late in the lap

### Ferrari vs Red Bull

Ferrari’s biggest gains over Red Bull came:

- around `1.05-1.31 km`
- from `4.59 km` to the end of the lap

Red Bull’s better windows came:

- at the very start of the lap
- in parts of the run toward the final sector entry

Interpretation:

- Ferrari wins the mid-corner and technical-speed argument
- Red Bull wins the low-drag / exit-speed argument

## Long-run read

The cleanest race-pace comparison from the cache is still the hard-tyre work from Ferrari and Mercedes.

| Team     | Driver | Compound | Laps | Tyre life | Filtered median |   Best | Degradation |
| -------- | -----: | -------- | ---: | --------: | --------------: | -----: | ----------: |
| Mercedes |    RUS | Hard     |   11 |      7-17 |          83.507 | 83.138 |      -0.020 |
| Mercedes |    ANT | Hard     |   12 |      9-21 |          84.071 | 83.689 |      +0.018 |
| Ferrari  |    HAM | Hard     |    5 |     15-21 |          84.432 | 83.961 |      -0.084 |
| Red Bull |    HAD | Medium   |    7 |     11-20 |          84.617 | 84.046 |      +0.128 |

What this says:

- Mercedes had the best hard-tyre long-run evidence
- Ferrari was credible, but a little behind on the same tyre
- Red Bull’s representative run was on medium, so its race pace is harder to compare directly

## Final conclusion

If you reduce FP2 to one sentence per team:

- Mercedes: the best-balanced car, strongest in the technical sections, and the best on genuine hard-tyre race pace.
- Ferrari: the best mid-corner-speed car of the three, very competitive on one lap, and impressively strong on used softs.
- Red Bull: the most straightline-biased package, quickest onto and down the straights, but giving away too much in the braking/rotation/traction phases to match Mercedes or Ferrari over a full lap.

The cleanest telemetry-driven difference is this:

- Ferrari carries more corner speed
- Mercedes converts the lap more efficiently
- Red Bull prioritizes exit and straightline performance
