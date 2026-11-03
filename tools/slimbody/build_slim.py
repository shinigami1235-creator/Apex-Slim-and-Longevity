"""Usage: MH_DATA=<makehuman>/makehuman/data python3 build_bodies.py <out dir>

Build the Body Map body mesh from the MakeHuman hm08 base mesh (CC0).

One topology serves both bodies: the decimator keeps a subset of the base mesh's own
vertices, so vertex i is the same point of the body in the female and the male shape
and the switch morphs vertex to vertex.

Steps:
  1. Morph the base mesh with morphs.py (female and male).
  2. Keep the 'body' group, split into triangles, label each triangle with a region.
  3. Drop head triangles that no direction can see (the inside of the mouth).
  4. Decimate by half-edge collapse to an even net: face front densest, hands and feet
     sparsest. Then flip edges toward Delaunay triangles.

Output bodies.bin (little endian):
  Uint32   N vertices, Uint32 E edges
  Float32  x 18  cx, cy, cz, s                       position = q / 32767 * s + c
                 female: eyeX, eyeY, eyeZ, chinY, crownY, faceFrontZ, faceHalfW
                 male:   the same seven
  Int16    x 3N  female position
  Int16    x 3N  male position
  Uint16   x 2E  edges (vertex index pairs)
  Uint8    x 2N  female normal, octahedral (u, v)
  Uint8    x 2N  male normal, octahedral
  Uint8    x N   region id (see SOURCE.md)
"""
import sys, os, json, struct, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mhload import load_obj, apply, D
from meshlib import visibility, surface_samples, compact, decimate, delaunay_flips, edges_of, vertex_normals, octa, quant, unit

OUT = sys.argv[1]
rng = np.random.default_rng(7)
TARGET = int(os.environ.get('BODY_V', 3300))
R = dict(other=0, head=1, neck=2, breast=3, abdomen=4, arms=5, waistback=6, hips=7, thighs=8, calves=9)

V0, F, G = load_obj()
W = json.load(open(D + '/rigs/default_weights.mhw'))['weights']
nv = len(V0)
# dominant bone per vertex
best = np.zeros(nv); bone = np.array([''] * nv, dtype=object)
breastw = np.zeros(nv)
for b, lst in W.items():
    for i, w in lst:
        if w > best[i]: best[i] = w; bone[i] = b
        if b.startswith('breast'): breastw[i] = max(breastw[i], w)

def coarse(b):
    if not b: return 'other'
    if b.startswith(('head', 'jaw', 'eye', 'oculi', 'orbicularis', 'oris', 'risorius', 'levator', 'special', 'tongue')): return 'head'
    if b.startswith('neck'): return 'neck'
    if b.startswith('breast'): return 'breast'
    if b.startswith(('upperarm', 'shoulder')): return 'upperarm' if b.startswith('upperarm') else 'shoulder'
    if b.startswith('lowerarm'): return 'forearm'
    if b.startswith(('wrist', 'metacarpal', 'finger')): return 'hand'
    if b.startswith(('foot', 'toe')): return 'foot'
    if b.startswith('upperleg'): return 'thigh'
    if b.startswith('lowerleg'): return 'calf'
    if b.startswith('pelvis'): return 'pelvis'
    if b.startswith(('spine', 'clavicle', 'root')): return 'torso'
    return 'other'
CO = np.array([coarse(b) for b in bone], dtype=object)

body_faces = [f for f, g in zip(F, G) if g == 'body']
tris = []
for f in body_faces:
    tris.append([f[0], f[1], f[2]])
    if len(f) == 4: tris.append([f[0], f[2], f[3]])
tris = np.array(tris)

def joints(V):
    J = {}
    for f, g in zip(F, G):
        if g and g.startswith('joint-'): J.setdefault(g[6:], set()).update(f)
    return {k: V[list(v)].mean(0) for k, v in J.items()}

def morph(morphs):
    V = V0.copy()
    for t, w in morphs: apply(V, t, w)
    return V

def normals(V):
    N = np.zeros_like(V)
    a, b, c = V[tris[:, 0]], V[tris[:, 1]], V[tris[:, 2]]
    fn = np.cross(b - a, c - a)
    for k in range(3): np.add.at(N, tris[:, k], fn)
    N /= np.linalg.norm(N, axis=1, keepdims=True) + 1e-9
    return N, np.linalg.norm(fn, axis=1) * .5

def label(V):
    """Region per triangle, from dominant rig bone plus geometric rules on the neutral mesh."""
    J = joints(V)
    N, _ = normals(V)
    a, b, c = V[tris[:, 0]], V[tris[:, 1]], V[tris[:, 2]]
    cen = (a + b + c) / 3
    co = CO[tris[:, 0]]
    yPel = J['pelvis'][1]; ySp3 = J['spine-3'][1]; ySp2 = J['spine-2'][1]; ySp1 = J['spine-1'][1]
    yLeg = J['l-upper-leg'][1]
    nz = (N[tris[:, 0]] + N[tris[:, 1]] + N[tris[:, 2]])[:, 2] / 3
    reg = np.zeros(len(tris), np.uint8)
    x, y, z = cen[:, 0], cen[:, 1], cen[:, 2]
    spineZ = np.interp(y, [yPel, ySp3, ySp2, ySp1], [J['pelvis'][2], J['spine-3'][2], J['spine-2'][2], J['spine-1'][2]])
    front = z > spineZ + .05
    reg[co == 'head'] = R['head']
    reg[co == 'neck'] = R['neck']
    reg[co == 'upperarm'] = R['arms']
    reg[co == 'thigh'] = R['thighs']
    reg[co == 'calf'] = R['calves']
    bw = breastw[tris].max(1)
    torso = np.isin(co, ['torso', 'breast', 'pelvis'])
    reg[(bw > .1) & front & (y > ySp2)] = R['breast']
    absel = torso & front & (y < ySp2 + .15) & (y > yLeg + .35) & (np.abs(x) < 1.45) & (reg == 0)
    reg[absel] = R['abdomen']
    wb = torso & (reg == 0) & (y > yPel + .1) & (y < ySp1 - .2) & (~front | (np.abs(x) >= 1.45))
    reg[wb] = R['waistback']
    hb = (np.isin(co, ['pelvis', 'torso', 'thigh'])) & (y <= yPel + .1) & (y > yLeg - 1.3) & ((z < J['l-upper-leg'][2] + .05) | (np.abs(x) > 1.55))
    reg[hb & (reg != R['abdomen'])] = R['hips']
    dens = np.ones(len(tris))
    dens[co == 'hand'] = .32
    dens[co == 'foot'] = .45
    dens[co == 'forearm'] = .85
    head = reg == R['head']
    dens[head] = 2.2
    dens[head & (nz > .25)] = 3.6
    dens[reg == R['neck']] = 1.4
    return reg, dens

def landmarks(V, P, regv):
    J = joints(V)
    eyes = (J['l-eye'] + J['r-eye']) / 2
    hv = P[regv == R['head']]
    crown = hv[:, 1].max()
    front = hv[:, 2].max()
    chin = hv[(np.abs(hv[:, 0]) < .3) & (hv[:, 2] > eyes[2] - .9)][:, 1].min()
    halfW = np.percentile(np.abs(hv[(np.abs(hv[:, 1] - eyes[1]) < .3)][:, 0]), 96)
    return [*eyes, chin, crown, front, halfW]


def build_slim():
    from morphs import MIX, FEMALE_FACE, MALE_FACE
    Mp = 'macrodetails/'
    def base(sex, face):
        return [(Mp + f'{r}-{sex}-young.target', w) for r, w in MIX] + [
            (Mp + f'proportions/{sex}-young-averagemuscle-averageweight-idealproportions.target', .6)] + face
    shapes = {}
    for sex, face in (('female', FEMALE_FACE), ('male', MALE_FACE)):
        for wname in ('minweight', 'averageweight', 'maxweight'):
            shapes[(sex, wname)] = morph(base(sex, face) + [(Mp + f'universal-{sex}-young-averagemuscle-{wname}.target', 1.0)])
        avg = shapes[(sex, 'averageweight')]
        shapes[(sex, 'belly')] = morph(base(sex, face) + [(Mp + f'universal-{sex}-young-averagemuscle-averageweight.target', 1.0), ('stomach/stomach-pregnant-incr.target', 1.0)]) - avg
    VF, VM = shapes[('female', 'averageweight')], shapes[('male', 'averageweight')]
    reg_t, dens_t = label(V0)
    head_t = np.where(np.isin(reg_t, [R['head'], R['neck']]))[0]
    Th = tris[head_t]
    Pz = surface_samples(V0, Th, 300000, rng)
    tc = V0[Th].mean(1)
    tn = unit(np.cross(V0[Th[:, 1]] - V0[Th[:, 0]], V0[Th[:, 2]] - V0[Th[:, 0]]))
    vis, _ = visibility(tc, tn, Pz)
    keep_t = np.ones(len(tris), bool); keep_t[head_t[~vis]] = False
    T, RT, DT = tris[keep_t], reg_t[keep_t], dens_t[keep_t]
    nv = len(V0)
    cnt = np.zeros((nv, 10)); np.add.at(cnt, (T.ravel(), np.repeat(RT, 3)), 1)
    regv = cnt.argmax(1).astype(np.uint8)
    dv = np.zeros(nv); np.maximum.at(dv, T.ravel(), np.repeat(DT, 3)); dv[dv == 0] = 1
    allshapes = [V0] + [shapes[(s, w)] for s in ('female', 'male') for w in ('minweight', 'averageweight', 'maxweight')]
    T = decimate(allshapes, T, TARGET, 1 / np.sqrt(dv))
    T = delaunay_flips(allshapes, T)
    T, keep, regv = compact(T, regv)
    order = [(s, w) for s in ('female', 'male') for w in ('minweight', 'averageweight', 'maxweight')]
    P = [shapes[k][keep] for k in order]
    B = [shapes[(s, 'belly')][keep] for s in ('female', 'male')]
    E = edges_of(T)
    allP = np.concatenate(P)
    c = (allP.max(0) + allP.min(0)) / 2
    s = float(np.abs(allP - c).max() * 1.0001)
    sb = float(max(np.abs(b).max() for b in B) * 1.0001)
    N = len(P[0]); assert N < 65536
    hdr = struct.pack('<II5f', N, len(E), *c, s, sb)
    blob = hdr + b''.join(quant(p, c, s).tobytes() for p in P) + b''.join(quant(b, np.zeros(3), sb).tobytes() for b in B) + E.astype('<u2').tobytes() + regv.tobytes()
    open(f'{OUT}/slimbody.bin', 'wb').write(blob)
    print('slimbody.bin', len(blob), 'bytes', N, 'verts', len(E), 'edges', 'c', np.round(c, 2), 's', round(s, 2), 'sb', round(sb, 3))
    print('height dm', round(float(P[1][:, 1].max() - P[1][:, 1].min()), 2), round(float(P[4][:, 1].max() - P[4][:, 1].min()), 2))

build_slim()
