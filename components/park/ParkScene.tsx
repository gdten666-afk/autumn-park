'use client';

import { useEffect, useRef, useMemo, MutableRefObject } from 'react';
import type { SeasonState, Weather } from '@/lib/types';

interface ParkSceneProps {
  seasonState: SeasonState;
  weather: Weather;
  scrollRef: MutableRefObject<number>;
}

// Organic bezier-curve tree silhouettes
function Oak({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const t=s, fw=t*0.65;
  return <g>
    <path d={`M${cx-t*.05} ${cy} Q${cx-t*.02} ${cy-t*.5} ${cx} ${cy-t} L${cx+t*.03} ${cy-t*.92} Q${cx+t*.02} ${cy-t*.4} ${cx+t*.04} ${cy}`} fill="rgba(60,40,25,0.4)"/>
    <path d={`M${cx-fw*.5} ${cy-t*.28} C${cx-fw*.65} ${cy-t*.58} ${cx-fw*.5} ${cy-t*.92} ${cx-fw*.12} ${cy-t*1.02} C${cx-fw*.08} ${cy-t*1.18} ${cx+fw*.04} ${cy-t*1.22} ${cx+fw*.18} ${cy-t*1.02} C${cx+fw*.38} ${cy-t*1.08} ${cx+fw*.52} ${cy-t*.82} ${cx+fw*.42} ${cy-t*.58} C${cx+fw*.6} ${cy-t*.52} ${cx+fw*.45} ${cy-t*.22} ${cx+fw*.18} ${cy-t*.18} C${cx+fw*.08} ${cy-t*.04} ${cx-fw*.08} ${cy-t*.12} ${cx-fw*.5} ${cy-t*.28}Z`} fill="currentColor"/>
  </g>;
}
function Pine({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const t=s*.22, h=s, w=h*.32;
  return <g>
    <path d={`M${cx-t*.2} ${cy} Q${cx} ${cy-t*.25} ${cx} ${cy-t} L${cx+t*.18} ${cy-t*.9} Q${cx+t*.07} ${cy-t*.25} ${cx+t*.22} ${cy}`} fill="rgba(60,40,25,0.35)"/>
    <path d={`M${cx} ${cy-h*.82} L${cx-w*.55} ${cy-h*.38} L${cx-w*.22} ${cy-h*.33} L${cx-w*.7} ${cy-h*.03} L${cx-w*.18} ${cy+h*.02} L${cx-w*.5} ${cy+h*.18} L${cx} ${cy+h*.07} L${cx+w*.5} ${cy+h*.18} L${cx+w*.18} ${cy+h*.02} L${cx+w*.7} ${cy-h*.03} L${cx+w*.22} ${cy-h*.33} L${cx+w*.55} ${cy-h*.38}Z`} fill="currentColor" opacity="0.85"/>
  </g>;
}
function Bush({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const w=s*.55, h=s*.45;
  return <path d={`M${cx-w*.45} ${cy} C${cx-w*.55} ${cy-h*.38} ${cx-w*.5} ${cy-h*.72} ${cx-w*.18} ${cy-h*.78} C${cx-w*.12} ${cy-h*1.02} ${cx+w*.08} ${cy-h*1.08} ${cx+w*.22} ${cy-h*.72} C${cx+w*.28} ${cy-h*.78} ${cx+w*.48} ${cy-h*.48} ${cx+w*.42} ${cy-h*.18} C${cx+w*.48} ${cy-h*.03} ${cx+w*.28} ${cy+h*.05} ${cx+w*.08} ${cy} C${cx+w*.18} ${cy-h*.08} ${cx-w*.05} ${cy+h*.05} ${cx-w*.45} ${cy}Z`} fill="currentColor" opacity="0.7"/>;
}

interface TreeDef { x: number; y: number; s: number; type: 'oak'|'pine'|'bush'; }
function makeTrees(n: number, yR:[number,number], sR:[number,number]): TreeDef[] {
  const types: TreeDef['type'][] = ['oak','pine','bush','oak','pine','oak','bush'];
  return Array.from({length:n}, ()=>({x:Math.random()*100, y:yR[0]+Math.random()*(yR[1]-yR[0]), s:sR[0]+Math.random()*(sR[1]-sR[0]), type:types[Math.floor(Math.random()*types.length)]}));
}

const FAR=0.06, MID=0.2, NEAR=0.55;

function seasonOverlay(season: string): string {
  switch(season){
    case 'spring': return 'rgba(46,125,50,0.08)';
    case 'summer': return 'rgba(20,60,25,0.1)';
    case 'autumn': return 'rgba(120,60,20,0.1)';
    case 'winter': return 'rgba(100,120,140,0.08)';
    default: return 'rgba(46,125,50,0.08)';
  }
}

export default function ParkScene({ seasonState, weather, scrollRef }: ParkSceneProps) {
  const farRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const nearRef = useRef<HTMLDivElement>(null);
  const season = seasonState.season;
  const overlay = seasonOverlay(season);

  const farTrees = useMemo(()=>makeTrees(15,[48,58],[12,20]),[]);
  const nearTrees = useMemo(()=>makeTrees(20,[52,62],[18,32]),[]);

  // rAF parallax
  useEffect(()=>{
    let raf=0;
    const loop=()=>{
      const sx=scrollRef.current;
      const layers=[{ref:farRef,factor:FAR},{ref:midRef,factor:MID},{ref:nearRef,factor:NEAR}];
      for(const{ref,factor}of layers){
        if(ref.current) ref.current.style.transform=`translate3d(${-sx*factor}px,0,0)`;
      }
      raf=requestAnimationFrame(loop);
    };
    raf=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(raf);
  },[scrollRef]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{width:'400vw'}}>
      {/* Sky — dark gradient base */}
      <div className="fixed inset-0" style={{background:'linear-gradient(180deg, #1a1a2e 0%, #16213e 30%, #1a1a2e 60%, #0f0f1a 100%)',zIndex:0}}/>

      {/* Far layer — misty forest photo blended */}
      <div ref={farRef} className="fixed" style={{width:'420vw',left:'-10vw',height:'100vh',zIndex:1,willChange:'transform'}}>
        <div style={{position:'absolute',inset:0,background:`url(/assets/scene/misty-trees.jpg) center/cover no-repeat`,opacity:0.25,filter:'brightness(0.6) blur(2px)'}}/>
        {/* Distant silhouette trees */}
        <svg viewBox="0 0 4200 1000" preserveAspectRatio="none" style={{width:'100%',height:'100%',position:'absolute',inset:0}}>
          <g color="rgba(15,25,20,0.5)">
            {farTrees.map((t,i)=>{const C={oak:Oak,pine:Pine,bush:Bush}[t.type];return C?<C key={i} cx={t.x*42} cy={t.y*10} s={t.s*4}/>:null;})}
          </g>
        </svg>
      </div>

      {/* Mid layer — dark forest photo */}
      <div ref={midRef} className="fixed" style={{width:'460vw',left:'-30vw',height:'100vh',zIndex:2,willChange:'transform'}}>
        <div style={{position:'absolute',inset:0,background:`url(/assets/scene/dark-forest.jpg) center/cover no-repeat`,opacity:0.2,filter:'brightness(0.5)'}}/>
        {/* Forest line silhouette */}
        <svg viewBox="0 0 4600 1000" preserveAspectRatio="none" style={{width:'100%',height:'100%',position:'absolute',inset:0}}>
          <g color="rgba(10,15,12,0.55)">
            {makeTrees(25,[50,62],[14,26]).map((t,i)=>{const C={oak:Oak,pine:Pine,bush:Bush}[t.type];return C?<C key={i} cx={t.x*46} cy={t.y*10} s={t.s*5}/>:null;})}
          </g>
        </svg>
      </div>

      {/* Ground layer */}
      <div ref={nearRef} className="fixed" style={{width:'520vw',left:'-60vw',height:'100vh',zIndex:3,willChange:'transform'}}>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:'45vh',background:'linear-gradient(0deg, rgba(10,15,12,0.95) 0%, rgba(15,22,18,0.7) 30%, rgba(20,30,25,0.3) 60%, transparent 100%)'}}/>
        <svg viewBox="0 0 5200 1000" preserveAspectRatio="none" style={{width:'100%',height:'100%',position:'absolute',inset:0,marginTop:'40vh'}}>
          <g color="rgba(20,30,24,0.6)">
            {nearTrees.map((t,i)=>{const C={oak:Oak,pine:Pine,bush:Bush}[t.type];return C?<C key={i} cx={t.x*52} cy={(t.y-52)*10} s={t.s*6}/>:null;})}
          </g>
        </svg>
      </div>

      {/* God rays / light shafts */}
      <div className="fixed inset-0" style={{zIndex:4,background:'radial-gradient(ellipse 70% 50% at 40% 10%, rgba(255,245,220,0.06) 0%, transparent 60%)',animation:'godRays 14s ease-in-out infinite'}}/>

      {/* Ground mist */}
      <div className="fixed bottom-0 left-0 right-0" style={{height:'25vh',zIndex:5,background:'linear-gradient(0deg, rgba(180,190,200,0.04) 0%, transparent 100%)'}}/>

      {/* Season color overlay */}
      <div className="fixed inset-0" style={{zIndex:6,background:overlay,transition:'background 3s ease'}}/>

      {/* Vignette */}
      <div className="fixed inset-0" style={{zIndex:7,background:'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)'}}/>

      {/* Film grain */}
      <div className="fixed inset-0" style={{zIndex:8,opacity:0.03,backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`}}/>

      {/* Weather */}
      {weather==='fog'&&<div className="fixed inset-0 bg-white/6 backdrop-blur-[3px] z-9"/>}
      {weather==='light-rain'&&<div className="fixed inset-0 bg-black/8 z-9"/>}
      {weather==='heavy-rain'&&<div className="fixed inset-0 bg-black/18 z-9"/>}

      {/* Bench */}
      <div className="fixed pointer-events-auto" style={{left:'2.5vw',bottom:'30vh',zIndex:5}}>
        <svg width="80" height="50" viewBox="0 0 80 50" className="opacity-25 hover:opacity-45 transition-opacity cursor-pointer">
          <path d="M12,28 L68,28" stroke="rgba(150,120,80,0.5)" strokeWidth="4" strokeLinecap="round"/>
          <rect x="18" y="18" width="5" height="14" rx="2" fill="rgba(150,120,80,0.4)"/>
          <rect x="57" y="18" width="5" height="14" rx="2" fill="rgba(150,120,80,0.4)"/>
        </svg>
        <span className="block text-[9px] text-white/10 text-center mt-1 select-none">歇一歇</span>
      </div>
    </div>
  );
}
