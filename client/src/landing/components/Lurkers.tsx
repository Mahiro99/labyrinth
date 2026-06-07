// Lurkers.tsx — gaunt things hanging on the far side of the side walls, only their
// cold-glinting eyes and gripping fingers cresting the top edge.
// Each sits at a point t (0=screen edge/near, 1=far wall) along a wall's top
// edge: left edge runs (0%,3%)->(40%,38%); right mirrors it.
import { LURKERS } from '../data';

type LurkerSpec = {
  side: 'left' | 'right';
  t: number;
  scale: number;
  lean: number;
  blink: number;
  lurk: number;
  cling: number;
};

function Hand({ flip }: { flip?: boolean }) {
  // a gaunt grip: four bony fingers fanned, curling down over the wall lip
  const fingers = [
    { h: 17, rot: -15, x: -10.5 },
    { h: 21, rot: -5,  x: -4 },
    { h: 20, rot: 5,   x: 2.5 },
    { h: 15, rot: 15,  x: 8.5 },
  ];
  return (
    <div style={{ position: 'absolute', bottom: -3, [flip ? 'right' : 'left']: 1,
      transform: flip ? 'scaleX(-1)' : 'none', transformOrigin: 'center top' } as React.CSSProperties}>
      {/* knuckle ridge seating the fingers */}
      <div style={{ position: 'absolute', top: -2, left: -12, width: 24, height: 8,
        borderRadius: '8px 8px 4px 4px', background: '#aab4a6', opacity: 0.5 }}></div>
      {fingers.map((f, i) => (
        <div key={i} style={{ position: 'absolute', top: 0, left: f.x, width: 5.4, height: f.h,
          transformOrigin: 'top center', transform: `rotate(${f.rot}deg)`,
          borderRadius: '3px 3px 4px 4px',
          background: 'linear-gradient(180deg, #bcc6b8 0%, #97a292 62%, #5d6659 100%)',
          opacity: 0.82, boxShadow: '0 1px 2px rgba(0,0,0,0.4)' }}></div>
      ))}
    </div>
  );
}

function Lurker({ side, t, scale, lean, blink, lurk, cling }: LurkerSpec) {
  const edgeX = side === 'left' ? t * 40 : 100 - t * 40;
  const edgeY = 3 + t * 35;
  const eye = (dx: number, rot: number) => (
    <div style={{ position: 'absolute', top: 18, left: 21 + dx, width: 11, height: 6.4,
      borderRadius: '52% 52% 46% 46%', transform: `rotate(${rot}deg)`, transformOrigin: 'center',
      background: 'radial-gradient(circle at 40% 34%, #eef5ea 0%, #b9c6bb 46%, #67726a 100%)',
      boxShadow: '0 0 8px 1px rgba(176,200,186,0.8), 0 0 3px rgba(225,240,230,0.95)',
      animation: `lab-eyeblink ${blink}s ease-in-out infinite`, animationDelay: `${dx * 0.04}s` }}>
      <div style={{ position: 'absolute', top: 1.6, left: 3.6, width: 3, height: 3,
        borderRadius: '50%', background: '#101813' }}></div>
    </div>
  );
  return (
    <div style={{ position: 'absolute', left: `${edgeX}%`, top: `${edgeY}%`, width: 64, height: 78,
      marginLeft: -32, marginTop: -74, pointerEvents: 'none',
      transform: `scale(${scale}) rotate(${lean}deg)`, transformOrigin: '50% 100%' }}>
      <div style={{ position: 'absolute', inset: 0,
        animation: `lab-lurk ${17 + t * 6}s ease-in-out infinite`, animationDelay: `${lurk}s` }}>
        <div style={{ position: 'absolute', inset: 0,
          animation: `lab-cling ${5.5 + t}s ease-in-out infinite`, animationDelay: `${cling}s`,
          transformOrigin: '50% 100%' }}>
          {/* gaunt head/shoulders cresting the wall */}
          <div style={{ position: 'absolute', top: 2, left: 13, width: 38, height: 60,
            borderRadius: '44% 44% 40% 40% / 58% 58% 38% 38%',
            background: 'radial-gradient(58% 46% at 50% 26%, #1b211a 0%, #0b0e08 56%, #040602 100%)',
            boxShadow: 'inset 0 2px 3px rgba(150,165,150,0.10), 0 2px 7px rgba(0,0,0,0.55)' }}></div>
          {/* hollow brow shadow */}
          <div style={{ position: 'absolute', top: 13, left: 17, width: 30, height: 10,
            borderRadius: '50%', background: 'rgba(0,0,0,0.6)', filter: 'blur(1.4px)' }}></div>
          {/* scowling brow ridges */}
          <div style={{ position: 'absolute', top: 14.5, left: 18, width: 12, height: 2.4, borderRadius: 2,
            background: 'rgba(150,162,148,0.3)', transform: 'rotate(12deg)' }}></div>
          <div style={{ position: 'absolute', top: 14.5, left: 32, width: 12, height: 2.4, borderRadius: 2,
            background: 'rgba(150,162,148,0.3)', transform: 'rotate(-12deg)' }}></div>
          {eye(-1, 10)}
          {eye(13, -10)}
          {/* the open dark maw */}
          <div style={{ position: 'absolute', top: 32, left: 27, width: 10, height: 14,
            borderRadius: '40% 40% 52% 52%',
            background: 'radial-gradient(circle at 50% 28%, #0a0d08 0%, #000 82%)',
            boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.85)' }}></div>
          {/* the grip */}
          <Hand />
          <Hand flip />
        </div>
      </div>
    </div>
  );
}

export function Lurkers() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
      {LURKERS.map((c, i) => <Lurker key={i} {...c} />)}
    </div>
  );
}
