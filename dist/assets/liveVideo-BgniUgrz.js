import{x as r,ad as n}from"./index-CZg0yt6X.js";/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=[["path",{d:"M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z",key:"kmsa83"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]],g=r("circle-play",c);function e(i){return typeof i=="string"?i.trim():""}function s(i){return{description:e(i==null?void 0:i.description),title:e(i==null?void 0:i.title),videoUrl:e(i==null?void 0:i.video_url)}}const f={async getConfig(i){const t=await n.get("/api/liveVideo/config",{signal:i});return s(t)}};export{g as C,f as l};
