import re,sys,json
D,out_css,out_ts=sys.argv[1],sys.argv[2],sys.argv[3]
s=open(f'{D}/InicioWeb.dc.html').read()
rules=re.findall(r'(\.fondo-[a-z-]+(?:\.tema-oscuro)?)\{([^}]*)\}',s)
kfs=dict(re.findall(r'@keyframes (llama-[a-z-]+)\{((?:[0-9.]+%\{[^}]*\})+)\}',s))
def split_top(v):
    parts,depth,cur,q=[],0,'',None
    for ch in v:
        if q:
            cur+=ch
            if ch==q: q=None
            continue
        if ch in "'\"": q=ch; cur+=ch; continue
        if ch=='(': depth+=1
        if ch==')': depth-=1
        if ch==',' and depth==0: parts.append(cur.strip()); cur=''
        else: cur+=ch
    if cur.strip(): parts.append(cur.strip())
    return parts
def props(body):
    d={}
    for m in re.finditer(r'([a-z-]+):((?:[^;\'"(]|\'[^\']*\'|"[^"]*"|\([^()]*(?:\([^()]*\)[^()]*)*\))*)',body):
        d[m.group(1)]=m.group(2)
    return d
def pct(v): return float(v.strip().rstrip('%'))/100
def parse_stops(body):
    stops=[]
    for st in split_top(body):
        c,p=st.rsplit(' ',1)
        stops.append([c.strip(),pct(p)])
    return stops
def parse_rad(g):
    ml=re.match(r'linear-gradient\(([-0-9.]+)deg,(.*)\)$',g)
    if ml:
        return {'lin':float(ml.group(1)),'stops':parse_stops(ml.group(2))}
    m=re.match(r'radial-gradient\(ellipse ([-0-9.]+)% ([-0-9.]+)% at ([-0-9.]+)% ([-0-9.]+)%,(.*)\)$',g)
    assert m,g
    stops=[]
    for st in split_top(m.group(5)):
        c,p=st.rsplit(' ',1)
        stops.append([c.strip(),pct(p)])
    return {'rx':pct(m.group(1)),'ry':pct(m.group(2)),'cx':pct(m.group(3)),'cy':pct(m.group(4)),'stops':stops}
css=['/* Fondos "Zarza" por sección — generado desde el canvas (InicioWeb.dc.html).',
 '   Las llamas se animan en <canvas> (components/zarza/FondoSeccion.tsx, datos en',
 '   lib/fondos-llamas.ts). Acá queda la base, el grano y un primer cuadro estático',
 '   de las llamas como respaldo mientras carga el JS. No editar a mano. */',
 '.fondo{position:fixed;inset:0;z-index:-10;overflow:hidden;pointer-events:none;contain:strict}',
 '.fondo>.fondo-llamas,.fondo>.fondo-lienzo{position:absolute;inset:0;width:100%;height:100%}',
 '.fondo>.fondo-llamas{background-repeat:no-repeat}',
 '.fondo.con-lienzo>.fondo-llamas{visibility:hidden}',
 '.fondo>.fondo-grano{position:absolute;inset:0;background-repeat:repeat;transform:translateZ(0)}']
data={}
for sel,body in rules:
    if sel=='.fondo-login-b': continue
    dark=sel.endswith('.tema-oscuro')
    name=sel.replace('.tema-oscuro','')
    pre='.dark ' if dark else ''
    p=props(body)
    imgs=split_top(p['background-image']); sizes=split_top(p['background-size'])
    anim=p['animation'].split(); kname,dur=anim[0],float(anim[1].rstrip('s'))
    frames=re.findall(r'([0-9.]+)%\{background-position:([^}]*)\}',kfs[kname])
    idx_fl=[i for i,z in enumerate(sizes) if z.strip()=='150% 150%']
    idx_gr=[i for i,z in enumerate(sizes) if 'px' in z]
    idx_base=[i for i,z in enumerate(sizes) if z.strip()=='100% 100%']
    assert len(idx_base)==1 and idx_base[0]==len(imgs)-1, (sel,sizes)
    capas=[parse_rad(imgs[i]) for i in idx_fl]
    tiempos=[];pos=[]
    for t,bp in frames:
        ps=split_top(bp)
        tiempos.append(float(t)/100)
        pos.append([[pct(ps[i].split()[0]),pct(ps[i].split()[1])] for i in idx_fl])
    seccion=name.replace('.fondo-','')
    data.setdefault(seccion,{})['oscuro' if dark else 'claro']={'dur':dur,'capas':capas,'tiempos':tiempos,'pos':pos}
    first=split_top(frames[0][1])
    css.append(f'{pre}{name}{{background-color:{p["background-color"]};background-image:{imgs[idx_base[0]]}}}')
    css.append(f'{pre}{name}>.fondo-llamas{{background-image:{",".join(imgs[i] for i in idx_fl)};background-size:{",".join("150% 150%" for _ in idx_fl)};background-position:{",".join(first[i] for i in idx_fl)}}}')
    css.append(f'{pre}{name}>.fondo-grano{{background-image:{",".join(imgs[i] for i in idx_gr)};background-size:{",".join(sizes[i] for i in idx_gr)}}}')
open(out_css,'w').write('\n'.join(css)+'\n')
ts='''// Generado desde el canvas (InicioWeb.dc.html) — no editar a mano.
// Llamas de cada sección: elipses radiales (medidas relativas a una caja de
// 150% del viewport) y su recorrido (background-position) a lo largo del ciclo.

export type CapaLlama =\n  | { rx: number; ry: number; cx: number; cy: number; stops: [string, number][]; lin?: undefined }\n  | { lin: number; stops: [string, number][] };
export interface FondoLlamas { dur: number; capas: CapaLlama[]; tiempos: number[]; pos: [number, number][][] }

export const FONDOS_LLAMAS: Record<string, { claro: FondoLlamas; oscuro: FondoLlamas }> = '''+json.dumps(data,separators=(',',':'))+';\n'
open(out_ts,'w').write(ts)
print({k:{t:len(v[t]['capas']) for t in v} for k,v in data.items()})
