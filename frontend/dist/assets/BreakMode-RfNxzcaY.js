import{m as s,G as u,B as h,t as i,q as t,s as y}from"./index-C672uGg0.js";import{u as f}from"./useTimer-VP93X2Yk.js";import{a as k,s as g}from"./helpers-B2t6l9dL.js";/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=s("Droplets",[["path",{d:"M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z",key:"1ptgy4"}],["path",{d:"M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97",key:"1sl1rz"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=s("SkipForward",[["polygon",{points:"5 4 15 12 5 20 5 4",key:"16p6eg"}],["line",{x1:"19",x2:"19",y1:"5",y2:"19",key:"futhcm"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=s("StretchHorizontal",[["rect",{width:"20",height:"6",x:"2",y:"4",rx:"2",key:"qdearl"}],["rect",{width:"20",height:"6",x:"2",y:"14",rx:"2",key:"1xrn6j"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const n=s("Wind",[["path",{d:"M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2",key:"1k4u03"}],["path",{d:"M9.6 4.6A2 2 0 1 1 11 8H2",key:"b7d0fd"}],["path",{d:"M12.6 19.4A2 2 0 1 0 14 16H2",key:"1p5cb3"}]]),c=[{icon:v,text:"Roll your shoulders back 5 times slowly."},{icon:b,text:"Drink a glass of water — hydration helps focus."},{icon:n,text:"Breathe in 4, hold 4, out 4. Repeat 3 times."},{text:"You are doing enough. Rest is productive too.",icon:n}];function B(){const a=u(),{activeSession:e}=h(),l=(e==null?void 0:e.pomodoroBreak)??5,[o,d]=i.useState(0),m=f({duration:l*60,autoStart:!0,onComplete:()=>{g("Break over",{body:"Ready to focus again?"}),a("/focus")}});i.useEffect(()=>{e||a("/setup");const x=setInterval(()=>d(p=>(p+1)%c.length),8e3);return()=>clearInterval(x)},[e,a]);const r=c[o];return t.jsxs("div",{className:"flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-50 via-[var(--color-bg)] to-[var(--color-bg)] p-6",children:[t.jsx("p",{className:"text-sm uppercase tracking-widest text-emerald-500",children:"Break time"}),t.jsx("p",{className:"mt-4 text-7xl font-bold tabular-nums text-text",children:k(m.timeRemaining)}),t.jsx("p",{className:"mt-4 text-xl text-text-secondary",children:"Rest your mind. You earned this."}),t.jsxs(y.div,{className:"card mt-12 flex max-w-md items-start gap-4",initial:{opacity:0,x:20},animate:{opacity:1,x:0},children:[t.jsx(r.icon,{className:"h-8 w-8 shrink-0 text-emerald-500"}),t.jsx("p",{className:"text-lg text-text-secondary",children:r.text})]},o),t.jsxs("button",{type:"button",className:"btn-primary mt-10",onClick:()=>a("/focus"),children:[t.jsx(j,{className:"h-5 w-5"})," End Break Early"]})]})}export{B as default};
