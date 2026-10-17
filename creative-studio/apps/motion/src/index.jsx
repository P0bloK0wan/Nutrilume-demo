import React from 'react';
import {AbsoluteFill,Audio,Composition,Easing,Img,interpolate,registerRoot,staticFile,useCurrentFrame} from 'remotion';
const C={coal:'#11120f',cream:'#f2eee5',amber:'#dfb36b',olive:'#727a5f'};
const ease=Easing.bezier(.22,1,.36,1);
const ramp=(f,a,b,x=0,y=1)=>interpolate(f,[a,b],[x,y],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:ease});
const small={fontFamily:'Arial, sans-serif',fontSize:14,letterSpacing:3,textTransform:'uppercase'};
function Aura(){
 const f=useCurrentFrame();
 const opening=1-ramp(f,65,86); const detail=ramp(f,76,96)*(1-ramp(f,163,184)); const end=ramp(f,172,198);
 return <AbsoluteFill style={{background:C.coal,color:C.cream,fontFamily:'Georgia, serif',overflow:'hidden'}}>
  <Audio src={staticFile('aura-score.wav')} volume={.68}/>
  <AbsoluteFill style={{opacity:ramp(f,0,32,.55,1)}}><Img src={staticFile('hero.png')} style={{width:'100%',height:'100%',objectFit:'cover',transform:`scale(${interpolate(f,[0,299],[1.08,1.01])}) translateX(${interpolate(f,[0,299],[50,110])}px)`}}/></AbsoluteFill>
  <AbsoluteFill style={{background:'linear-gradient(90deg, rgba(17,18,15,.99) 0%, rgba(17,18,15,.92) 27%, rgba(17,18,15,.2) 62%, transparent 100%)'}}/>
  <div style={{position:'absolute',inset:32,border:'1px solid rgba(242,238,229,.17)'}}/>
  <div style={{position:'absolute',top:58,left:64,...small,fontSize:12,letterSpacing:4}}>AURA <span style={{color:C.olive,marginLeft:20}}>OBJECT / 01</span></div>
  <div style={{position:'absolute',right:62,top:60,...small,fontSize:11,color:C.amber}}>LIGHT AS A RITUAL</div>
  <div style={{position:'absolute',left:64,top:200,opacity:opening,transform:`translateY(${ramp(f,0,35,34,0)}px)`}}>
   <div style={{...small,color:C.amber,marginBottom:28,fontSize:11}}>A quieter kind of presence.</div>
   <div style={{fontSize:92,lineHeight:.98,letterSpacing:-4}}>Give light<br/><i style={{fontWeight:400,color:C.amber}}>a little space.</i></div>
   <div style={{marginTop:34,height:1,width:130*ramp(f,15,54),background:C.amber}}/>
  </div>
  <div style={{position:'absolute',left:65,top:212,opacity:detail,transform:`translateY(${ramp(f,78,110,30,0)}px)`}}>
   <div style={{...small,color:C.amber,fontSize:11,marginBottom:30}}>01 / MATERIAL STUDY</div>
   <div style={{fontSize:73,letterSpacing:-3,lineHeight:1.03}}>Soft form.<br/><i>Warm intention.</i></div>
   <div style={{...small,fontSize:12,letterSpacing:1.4,marginTop:34,lineHeight:2.1,color:'#ccc9bd'}}>PORCELAIN · ALUMINUM<br/>AN AMBER GLOW, HELD IN BALANCE.</div>
  </div>
  <div style={{position:'absolute',left:64,top:197,opacity:end,transform:`translateY(${ramp(f,175,210,28,0)}px)`}}>
   <div style={{fontSize:124,letterSpacing:-5,lineHeight:1}}>AURA</div>
   <div style={{fontSize:36,fontStyle:'italic',marginTop:12}}>Make room for calm.</div>
   <div style={{...small,fontSize:12,marginTop:45,color:C.amber,letterSpacing:3}}>OBJECT 01 / A STUDY IN LIGHT</div>
  </div>
  <div style={{position:'absolute',bottom:63,left:65,...small,fontSize:10,color:'#bcbdb0'}}>SCULPTURAL LIGHTING <span style={{marginLeft:27,color:C.amber}}>EST. MMXXVI</span></div>
  <div style={{position:'absolute',bottom:63,right:65,...small,fontSize:10,color:C.cream}}>DESIGNED TO SLOW THE EVERYDAY</div>
  <div style={{position:'absolute',left:33,bottom:32,height:2,width:1214*(f/299),background:C.amber,opacity:.6}}/>
 </AbsoluteFill>
}
registerRoot(()=> <Composition id="Aura" component={Aura} durationInFrames={300} fps={30} width={1280} height={720}/>);
