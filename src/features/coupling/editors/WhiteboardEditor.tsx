import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { useLang } from '../../../contexts/LangContext';
import { useCouplingDraft } from '../CouplingDraftProvider';
import { PROFILE_CHARACTERS, PROFILE_CHARACTER_BY_ID } from '../data';
import CharacterAvatar from '../components/CharacterAvatar';
import CharacterBatchDialog from '../components/CharacterBatchDialog';
import { RELATIONS } from '../relations';
import copy from '../copy';
import type { RelationId, WhiteboardDraft } from '../types';
import { getEdgeGeometry, worldPoint, zoomAround, clampZoom } from '../whiteboard/geometry';
import { closestNode } from '../whiteboard/gestures';
import '../whiteboard/whiteboard.css';

type Node = WhiteboardDraft['nodes'][number];
type Edge = WhiteboardDraft['edges'][number];
type Snapshot = { nodes: Node[]; edges: Edge[]; view: WhiteboardDraft['view'] };
type Pointer = { x: number; y: number };
type Gesture = { kind: 'move'|'pan'|'connect'|'pinch'; id?: string; pointer: number; start: Pointer; origin?: Node; last?: Pointer; distance?: number; anchor?: Pointer; initialView?: WhiteboardDraft['view'] };
const starter = ['reimu', 'marisa', 'sakuya', 'remilia', 'youmu', 'yuyuko'];
const initialDraft: WhiteboardDraft = { nodes: starter.map((id, i) => ({ id, x: (i % 3) * 120, y: Math.floor(i / 3) * 120 })), edges: [], view: { x: 0, y: 0, zoom: 1 } };
const characterName = (id: string, lang: 'ko'|'ja'|'en') => PROFILE_CHARACTER_BY_ID.get(id)?.[lang] ?? id;
type BoardAction = 'undo'|'redo'|'delete'|'fit'|'tidy'|'layout'|'zoomIn'|'zoomOut';
function BoardActionIcon({action}: {action:BoardAction}) {
  if (action === 'undo') return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 7 4 12l5 5M4 12h10a6 6 0 1 1-5 9" /></svg>;
  if (action === 'redo') return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m15 7 5 5-5 5m5-5H10a6 6 0 1 0 5 9" /></svg>;
  if (action === 'delete') return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg>;
  if (action === 'fit') return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 4H4v5m11-5h5v5m0 6v5h-5M9 20H4v-5" /></svg>;
  if (action === 'tidy') return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></svg>;
  if (action === 'layout') return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="12" cy="18" r="2.5" /><path d="M8.5 6h7M7.5 8l3 7.5m6-7.5-3 7.5" /></svg>;
  return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5m-13.5-10.5h6" />{action === 'zoomIn' && <path d="M10.5 7.5v6" />}</svg>;
}

export default function WhiteboardEditor() {
  const { lang } = useLang(); const t = copy[lang];
  const { draft, setDraft, hasDraft } = useCouplingDraft('whiteboard');
  const viewportRef = useRef<HTMLDivElement>(null); const rootRef = useRef<HTMLDivElement>(null); const openerRef = useRef<HTMLButtonElement>(null);
  const [document, setDocument] = useState<WhiteboardDraft>(() => draft ?? initialDraft); const documentRef = useRef(document); documentRef.current = document;
  const [tool, setTool] = useState<'move'|'connect'>('move'); const [relation, setRelation] = useState<RelationId>('love'); const [direction, setDirection] = useState<'both'|'forward'>('both');
  const [selected, setSelected] = useState<string|null>(null); const [selectedEdge, setSelectedEdge] = useState<string|null>(null); const [pending, setPending] = useState<string|null>(null);
  const [modal, setModal] = useState(false); const [globalSearch, setGlobalSearch] = useState(false); const [notice, setNotice] = useState(''); const [hover, setHover] = useState<string|null>(null);
  const [moreOpen, setMoreOpen] = useState(false), [lineSettingsOpen, setLineSettingsOpen] = useState(false), [viewOpen, setViewOpen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({left:8,top:8}); const [view, setView] = useState<WhiteboardDraft['view']>(draft?.view ?? initialDraft.view); const viewRef = useRef(view);
  useEffect(()=>{viewRef.current=view;},[view]);
  const undoStack = useRef<Snapshot[]>([]), redoStack = useRef<Snapshot[]>([]), pointers = useRef(new Map<number,Pointer>()), gesture = useRef<Gesture|null>(null);
  const serial = useRef(1), frame = useRef<number|null>(null), viewTimer = useRef<number|null>(null), spaceDown = useRef(false); const queued = useRef<{pointer:Pointer;alt:boolean}|null>(null); const [historyVersion,setHistoryVersion]=useState(0);
  const nodeElements = useRef(new Map<string,HTMLDivElement>()), edgePaths = useRef(new Map<string,{line:SVGPathElement|null;hit:SVGPathElement|null}>());
  const previewPath=useRef<SVGPathElement|null>(null);
  const nodes=document.nodes, edges=document.edges;
  const selectedEdgeData=edges.find(edge=>edge.id===selectedEdge);
  const nodeMap=useMemo(()=>new Map(nodes.map(node=>[node.id,node])),[nodes]);
  const incidentEdges=useMemo(()=>{const lookup=new Map<string,Edge[]>();for(const edge of edges){for(const id of [edge.from,edge.to]){const list=lookup.get(id)??[];list.push(edge);lookup.set(id,list);}}return lookup;},[edges]);
  const curvedEdges=useMemo(()=>new Set(edges.filter(edge=>edge.direction==='forward'&&edges.some(other=>other.id!==edge.id&&other.from===edge.to&&other.to===edge.from&&other.direction==='forward')).map(edge=>edge.id)),[edges]);
  const commit=useCallback((nextNodes:Node[],nextEdges=documentRef.current.edges,nextView=viewRef.current)=>{const next={nodes:nextNodes,edges:nextEdges,view:nextView};documentRef.current=next;setDocument(next);setDraft(next);},[setDraft]);
  const remember=useCallback((snapshot:Snapshot={nodes:documentRef.current.nodes,edges:documentRef.current.edges,view:viewRef.current})=>{undoStack.current.push({nodes:snapshot.nodes.map(n=>({...n})),edges:snapshot.edges.map(e=>({...e})),view:{...snapshot.view}});if(undoStack.current.length>100)undoStack.current.shift();redoStack.current=[];setHistoryVersion(v=>v+1);},[]);
  const nodePosition=useCallback((id:string,position:Node)=>{const el=nodeElements.current.get(id);if(el){el.style.left=`${position.x}px`;el.style.top=`${position.y}px`;}for(const edge of incidentEdges.get(id)??[]){const pair=edgePaths.current.get(edge.id);if(!pair)continue;const a=edge.from===id?position:nodeMap.get(edge.from),b=edge.to===id?position:nodeMap.get(edge.to);if(!a||!b)continue;const path=getEdgeGeometry(a,b,curvedEdges.has(edge.id)).path;pair.hit?.setAttribute('d',path);pair.line?.setAttribute('d',path);}},[curvedEdges,incidentEdges,nodeMap]);
  const saveView=useCallback((next:WhiteboardDraft['view'],immediate=false)=>{viewRef.current=next;const world=viewportRef.current?.querySelector<HTMLElement>('.coupling-board-world');if(world)world.style.transform=`translate(${next.x}px,${next.y}px) scale(${next.zoom})`;if(viewTimer.current!==null)window.clearTimeout(viewTimer.current);viewTimer.current=window.setTimeout(()=>{viewTimer.current=null;setView(viewRef.current);const d=documentRef.current;commit(d.nodes,d.edges,viewRef.current);},immediate?0:300);},[commit]);
  const fit=useCallback((items:Node[]=documentRef.current.nodes,persist=true)=>{const rect=viewportRef.current?.getBoundingClientRect();if(!rect)return null;const minX=items.length?Math.min(...items.map(n=>n.x))-38:-38,minY=items.length?Math.min(...items.map(n=>n.y))-38:-38,maxX=items.length?Math.max(...items.map(n=>n.x))+38:38,maxY=items.length?Math.max(...items.map(n=>n.y))+38:38;const zoom=Math.max(.04,Math.min(1,(rect.width-96)/(maxX-minX),(rect.height-96)/(maxY-minY)));const next={zoom,x:(rect.width-(maxX-minX)*zoom)/2-minX*zoom,y:(rect.height-(maxY-minY)*zoom)/2-minY*zoom};viewRef.current=next;setView(next);if(persist){const d=documentRef.current;commit(d.nodes,d.edges,next);}return next;},[commit]);
  useEffect(()=>{serial.current=Math.max(1,...draft.edges.map(e=>Number(e.id.match(/^edge-(\d+)$/)?.[1]??0)+1));if(!hasDraft){const id=requestAnimationFrame(()=>fit(documentRef.current.nodes,false));return()=>cancelAnimationFrame(id);}},[]);
  useEffect(()=>{const el=viewportRef.current;if(!el)return;let prior=el.getBoundingClientRect();const observer=new ResizeObserver(()=>{const rect=el.getBoundingClientRect();if(rect.width===prior.width&&rect.height===prior.height)return;const v=viewRef.current,cx=(prior.width/2-v.x)/v.zoom,cy=(prior.height/2-v.y)/v.zoom;prior=rect;saveView({...v,x:rect.width/2-cx*v.zoom,y:rect.height/2-cy*v.zoom});});observer.observe(el);return()=>observer.disconnect();},[saveView]);
  useEffect(()=>()=>{if(frame.current!==null)cancelAnimationFrame(frame.current);if(viewTimer.current!==null){window.clearTimeout(viewTimer.current);const d=documentRef.current;setDraft({...d,view:viewRef.current});}for(const id of pointers.current.keys())if(viewportRef.current?.hasPointerCapture(id))viewportRef.current.releasePointerCapture(id);},[setDraft]);
  const completeConnection=useCallback((from:string,to:string)=>{if(from===to){setNotice(t.distinctCharacters);setPending(null);return;}const d=documentRef.current,existing=d.edges.find(e=>(e.from===from&&e.to===to)||(direction==='both'&&e.direction==='both'&&e.from===to&&e.to===from));remember();const id=existing?.id??`edge-${serial.current++}`;const next=existing?d.edges.map(e=>e.id===id?{...e,type:relation,direction}:e):[...d.edges,{id,from,to,type:relation,direction}];commit(d.nodes,next);setSelectedEdge(id);setSelected(null);setPending(null);},[commit,direction,relation,remember,t.distinctCharacters]);
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (modal || event.button !== 0 || (event.target as HTMLElement).closest('.coupling-node-remove,.coupling-selection-info,.coupling-board-zoom,.coupling-board-fabs,.coupling-board-more-panel,.coupling-board-line-settings,.coupling-board-view-panel')) return;
    const el = viewportRef.current!;
    el.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const rect = el.getBoundingClientRect();
    if (pointers.current.size >= 2) {
      const prior = gesture.current;
      if (prior?.kind === 'move' && prior.id && prior.origin) nodePosition(prior.id, prior.origin);
      const [a, b] = [...pointers.current.values()];
      const mid = { x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top };
      gesture.current = { kind: 'pinch', pointer: event.pointerId, start: { x: 0, y: 0 }, distance: Math.hypot(b.x - a.x, b.y - a.y), anchor: worldPoint(rect.left + mid.x, rect.top + mid.y, rect, viewRef.current), initialView: viewRef.current };
      return;
    }
    if (spaceDown.current) {
      gesture.current = { kind: 'pan', pointer: event.pointerId, start: { x: event.clientX, y: event.clientY }, last: { x: viewRef.current.x, y: viewRef.current.y } };
      return;
    }
    const target = (event.target as HTMLElement).closest('[data-node]') as HTMLElement | null;
    const id = target?.dataset.node;
    if (event.target instanceof SVGPathElement && event.target.dataset.edge) {
      setSelectedEdge(event.target.dataset.edge); setSelected(null); return;
    }
    const point = worldPoint(event.clientX, event.clientY, rect, viewRef.current);
    if (id) {
      const node = nodeMap.get(id); if (!node) return;
      const radius = Math.hypot(point.x - node.x, point.y - node.y);
      if (pending && pending !== id) { completeConnection(pending, id); return; }
      if (tool === 'connect' || (radius > 28 && radius <= 38)) {
        setSelected(id); setSelectedEdge(null); setPending(id); gesture.current = { kind: 'connect', id, pointer: event.pointerId, start: { x: event.clientX, y: event.clientY }, origin: node };
      } else if (radius <= 28) {
        setSelected(id); setSelectedEdge(null); gesture.current = { kind: 'move', id, pointer: event.pointerId, start: { x: event.clientX, y: event.clientY }, origin: node };
      }
    } else if (!(event.target as HTMLElement).closest('.coupling-node-ring')) {
      setSelected(null); setSelectedEdge(null);
      gesture.current = { kind: 'pan', pointer: event.pointerId, start: { x: event.clientX, y: event.clientY }, last: { x: viewRef.current.x, y: viewRef.current.y } };
    }
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (gesture.current && !modal) queued.current = { pointer: { x: event.clientX, y: event.clientY }, alt: event.altKey };
    if (!gesture.current || modal || frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const queuedPointer = queued.current; queued.current = null;
      const active = gesture.current; if (!queuedPointer || !active) return;
      const rect = viewportRef.current!.getBoundingClientRect();
      if (active.kind === 'pinch' && pointers.current.size >= 2) {
        const [a,b] = [...pointers.current.values()], midpoint = { x: (a.x+b.x)/2-rect.left, y: (a.y+b.y)/2-rect.top };
        const base = active.initialView!, zoom = clampZoom(base.zoom * Math.hypot(b.x-a.x,b.y-a.y) / Math.max(1,active.distance!));
        saveView({ zoom, x: midpoint.x-active.anchor!.x*zoom, y: midpoint.y-active.anchor!.y*zoom });
      } else if (active.kind === 'pan') {
        saveView({ ...viewRef.current, x: active.last!.x+queuedPointer.pointer.x-active.start.x, y: active.last!.y+queuedPointer.pointer.y-active.start.y });
      } else if (active.kind === 'move' && active.origin && active.id) {
        const dx = (queuedPointer.pointer.x-active.start.x)/viewRef.current.zoom, dy = (queuedPointer.pointer.y-active.start.y)/viewRef.current.zoom;
        const x = active.origin.x+dx, y = active.origin.y+dy;
        nodePosition(active.id, { ...active.origin, x: queuedPointer.alt ? x : Math.round(x/8)*8, y: queuedPointer.alt ? y : Math.round(y/8)*8 });
      } else if (active.kind === 'connect' && active.origin) {
        const point = worldPoint(queuedPointer.pointer.x,queuedPointer.pointer.y,rect,viewRef.current);
        const path = getEdgeGeometry(active.origin,point,false).path;
        if (previewPath.current) { previewPath.current.setAttribute('d',path); previewPath.current.style.display=''; }
      }
    });
  };
  const finishPointer = (event: React.PointerEvent<HTMLDivElement>, cancelled = false) => {
    pointers.current.delete(event.pointerId);
    const active = gesture.current, viewport = viewportRef.current;
    if (viewport?.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    if (previewPath.current) previewPath.current.style.display = 'none';
    if (!active || active.pointer !== event.pointerId) {
      if (cancelled && active?.kind === 'pinch') { gesture.current = null; pointers.current.clear(); setPending(null); }
      return;
    }
    if (frame.current !== null) { cancelAnimationFrame(frame.current); frame.current = null; }
    if (previewPath.current) previewPath.current.style.display = 'none';
    queued.current = null;
    if (active.kind === 'move' && active.id && active.origin) {
      if (cancelled) nodePosition(active.id, active.origin);
      else {
        const dx = (event.clientX-active.start.x)/viewRef.current.zoom, dy = (event.clientY-active.start.y)/viewRef.current.zoom;
        const x = active.origin.x+dx, y = active.origin.y+dy;
        nodePosition(active.id, { ...active.origin, x: event.altKey ? x : Math.round(x/8)*8, y: event.altKey ? y : Math.round(y/8)*8 });
        const element = nodeElements.current.get(active.id);
        const position = element ? { ...active.origin, x: Number.parseFloat(element.style.left), y: Number.parseFloat(element.style.top) } : active.origin;
        if (position.x !== active.origin.x || position.y !== active.origin.y) { const current = documentRef.current; remember(); commit(current.nodes.map(node => node.id === active.id ? position : node)); }
      }
    } else if (active.kind === 'connect' && active.id) {
      if (cancelled) setPending(null);
      else { const point = worldPoint(event.clientX,event.clientY,viewport!.getBoundingClientRect(),viewRef.current), target = closestNode(point,documentRef.current.nodes); if (target === active.id) setPending(active.id); else if (target) completeConnection(active.id,target); }
    } else if ((active.kind === 'pan' || active.kind === 'pinch') && !cancelled) {
      if (active.kind === 'pan') saveView({ ...viewRef.current, x: active.last!.x+event.clientX-active.start.x, y: active.last!.y+event.clientY-active.start.y }, true);
      else saveView(viewRef.current,true);
    }
    if (cancelled) { pointers.current.clear(); setPending(null); }
    gesture.current = null;
  };
  const addBatch=(ids:string[])=>{const rect=viewportRef.current!.getBoundingClientRect(),center=worldPoint(rect.left+rect.width/2,rect.top+rect.height/2,rect,viewRef.current),d=documentRef.current,next=[...d.nodes],occupied=[...d.nodes];for(const id of ids){let found:Node|undefined;for(let k=0;k<10000&&!found;k++)for(let y=-k;y<=k&&!found;y++)for(let x=-k;x<=k;x++)if(Math.max(Math.abs(x),Math.abs(y))===k){const candidate={id,x:center.x+x*100,y:center.y+y*100};if(occupied.every(n=>Math.hypot(n.x-candidate.x,n.y-candidate.y)>=88)){found=candidate;break;}}if(found){next.push(found);occupied.push(found);}}if(next.length!==d.nodes.length){remember();commit(next,d.edges,d.view);setSelected(next[next.length-1].id);setModal(false);setNotice(t.addedNotice.replace('{names}',ids.map(id=>characterName(id,lang)).join(lang==='ja'?'・':', ')));}};
  const fullLayout=()=>{const d=documentRef.current;if(d.nodes.length&&!window.confirm(t.layoutConfirm))return;const works=[...new Set(PROFILE_CHARACTERS.map(c=>c.group.ko))],groups=works.map(w=>PROFILE_CHARACTERS.filter(c=>c.group.ko===w)),cellW=Math.max(...groups.map(g=>Math.ceil(Math.sqrt(g.length))))*96+96,cellH=Math.max(...groups.map(g=>Math.ceil(g.length/Math.ceil(Math.sqrt(g.length)))))*96+96,next=PROFILE_CHARACTERS.map(c=>{const wi=works.indexOf(c.group.ko),group=groups[wi],i=group.findIndex(x=>x.id===c.id),cols=Math.ceil(Math.sqrt(group.length));return{id:c.id,x:(wi%7)*cellW+(i%cols)*96,y:Math.floor(wi/7)*cellH+Math.floor(i/cols)*96};}),rect=viewportRef.current?.getBoundingClientRect();if(!rect)return;const minX=Math.min(...next.map(n=>n.x))-38,minY=Math.min(...next.map(n=>n.y))-38,maxX=Math.max(...next.map(n=>n.x))+38,maxY=Math.max(...next.map(n=>n.y))+38,zoom=Math.max(.04,Math.min(1,(rect.width-96)/(maxX-minX),(rect.height-96)/(maxY-minY))),nextView={zoom,x:(rect.width-(maxX-minX)*zoom)/2-minX*zoom,y:(rect.height-(maxY-minY)*zoom)/2-minY*zoom};remember({nodes:d.nodes,edges:d.edges,view:viewRef.current});viewRef.current=nextView;setView(nextView);commit(next,d.edges,nextView);};
  const tidy=()=>{const d=documentRef.current;if(!d.nodes.length)return;const cols=Math.ceil(Math.sqrt(d.nodes.length*1.4));remember();commit(d.nodes.map((n,i)=>({...n,x:80+i%cols*100,y:80+Math.floor(i/cols)*100})));};
  const remove=(id=selected)=>{const d=documentRef.current;if(id){remember();commit(d.nodes.filter(n=>n.id!==id),d.edges.filter(e=>e.from!==id&&e.to!==id));setSelected(null);setSelectedEdge(null);}else if(selectedEdge){remember();commit(d.nodes,d.edges.filter(e=>e.id!==selectedEdge));setSelectedEdge(null);}};
  const undo=(redo=false)=>{const src=redo?redoStack.current:undoStack.current,dst=redo?undoStack.current:redoStack.current,prior=src.pop();if(!prior)return;const d=documentRef.current;dst.push({nodes:d.nodes.map(n=>({...n})),edges:d.edges.map(e=>({...e})),view:{...viewRef.current}});setHistoryVersion(v=>v+1);viewRef.current=prior.view;setView(prior.view);commit(prior.nodes,prior.edges,prior.view);};
  const keyMove=useCallback((id:string,dx:number,dy:number)=>{const d=documentRef.current,n=d.nodes.find(node=>node.id===id);if(!n)return;const x=n.x+dx,y=n.y+dy;remember();commit(d.nodes.map(node=>node.id===id?{...node,x,y}:node));const rect=viewportRef.current?.getBoundingClientRect();if(rect){let v=viewRef.current;if(v.zoom<.75)v=zoomAround(v,.75,rect.width/2,rect.height/2);const sx=v.x+x*v.zoom,sy=v.y+y*v.zoom;if(sx<0||sy<0||sx>rect.width||sy>rect.height)v={...v,x:rect.width/2-x*v.zoom,y:rect.height/2-y*v.zoom};saveView(v,true);}},[commit,remember,saveView]);
  useEffect(()=>{const handler=(e:KeyboardEvent)=>{if(e.code==='Space'&&!e.repeat)spaceDown.current=true;if(modal)return;const target=e.target as HTMLElement;if(target.matches('input,textarea,select,[contenteditable="true"]')||e.isComposing||e.keyCode===229)return;const key=e.key.toLowerCase();if((e.ctrlKey||e.metaKey)&&key==='z'){e.preventDefault();undo(e.shiftKey);return;}if(e.ctrlKey||e.metaKey||e.altKey)return;if(key==='v'||key==='c'){setTool(key==='v'?'move':'connect');setMoreOpen(false);setLineSettingsOpen(false);setViewOpen(false);}else if(key==='n'||key==='/'){e.preventDefault();setMoreOpen(false);setLineSettingsOpen(false);setViewOpen(false);setGlobalSearch(true);setModal(true);}else if(key==='f')fit();else if(key==='escape'){setMoreOpen(false);setLineSettingsOpen(false);setViewOpen(false);setPending(null);setSelected(null);setSelectedEdge(null);gesture.current=null;}else if(key==='+'||key==='='){const r=viewportRef.current!.getBoundingClientRect();saveView(zoomAround(viewRef.current,viewRef.current.zoom*1.2,r.width/2,r.height/2));}else if(key==='-'){const r=viewportRef.current!.getBoundingClientRect();saveView(zoomAround(viewRef.current,viewRef.current.zoom/1.2,r.width/2,r.height/2));}else if(key==='delete'||key==='backspace')remove();else if(selected&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const amount=e.shiftKey?32:8;keyMove(selected,e.key==='ArrowLeft'?-amount:e.key==='ArrowRight'?amount:0,e.key==='ArrowUp'?-amount:e.key==='ArrowDown'?amount:0);}else if(/^[1-5]$/.test(key)){setRelation(RELATIONS[Number(key)-1].id);setMoreOpen(false);setLineSettingsOpen(false);setViewOpen(false);}};const el=rootRef.current;el?.addEventListener('keydown',handler);const up=()=>{spaceDown.current=false;};window.addEventListener('keyup',up);return()=>{el?.removeEventListener('keydown',handler);window.removeEventListener('keyup',up);};},[modal,selected,historyVersion,fit,keyMove,saveView]);
  const onWheel=(e:React.WheelEvent)=>{if((e.target as HTMLElement).closest('.coupling-board-fabs,.coupling-board-more-panel,.coupling-board-line-settings,.coupling-board-view-panel,.coupling-selection-info,.coupling-board-zoom'))return;e.preventDefault();const rect=viewportRef.current!.getBoundingClientRect();saveView(zoomAround(viewRef.current,viewRef.current.zoom*Math.exp(-e.deltaY*.001),e.clientX-rect.left,e.clientY-rect.top));};
  const closeToolMenus=()=>{setMoreOpen(false);setLineSettingsOpen(false);setViewOpen(false);};
  const chooseTool=(next:'move'|'connect')=>{setTool(next);closeToolMenus();};
  const toggleMore=()=>{setLineSettingsOpen(false);setViewOpen(false);setMoreOpen(open=>!open);};
  const toggleLineSettings=()=>{setMoreOpen(false);setViewOpen(false);setLineSettingsOpen(open=>!open);};
  const toggleView=()=>{setMoreOpen(false);setLineSettingsOpen(false);setViewOpen(open=>!open);};
  const toggleDirection=()=>setDirection(value=>value==='both'?'forward':'both');
  const zoomBy=(factor:number)=>{const rect=viewportRef.current!.getBoundingClientRect();saveView(zoomAround(viewRef.current,viewRef.current.zoom*factor,rect.width/2,rect.height/2));};
  const activeRelation=RELATIONS.find(item=>item.id===relation)!;
  const openBatch=(global=false)=>{closeToolMenus();setGlobalSearch(global);setModal(true);};
  const connectedNames=(edge:Edge)=>`${characterName(edge.from,lang)} ${edge.direction==='both'?'↔':'→'} ${characterName(edge.to,lang)} · ${RELATIONS.find(r=>r.id===edge.type)?.label[lang]}`;
  const revealNode=(id:string)=>{const node=nodeMap.get(id),rect=viewportRef.current?.getBoundingClientRect();if(!node||!rect)return;let next=viewRef.current;if(next.zoom<.75)next=zoomAround(next,.75,rect.width/2,rect.height/2);const x=next.x+node.x*next.zoom,y=next.y+node.y*next.zoom;if(x<38||y<38||x>rect.width-38||y>rect.height-38)next={...next,x:rect.width/2-node.x*next.zoom,y:rect.height/2-node.y*next.zoom};if(next!==viewRef.current)saveView(next,true);setHover(id);positionTooltip(id);};
  const positionTooltip=(id:string)=>{const n=nodeMap.get(id);if(!n)return;const rect=viewportRef.current!.getBoundingClientRect(),x=rect.left+viewRef.current.x+n.x*viewRef.current.zoom,y=rect.top+viewRef.current.y+n.y*viewRef.current.zoom,c=PROFILE_CHARACTER_BY_ID.get(id),text=c?`${c[lang]} · ${c.group[lang]}`:'',width=Math.min(240,Math.max(100,text.length*8+20)),below=y+56<=innerHeight-8;setTooltipPosition({left:Math.max(8,Math.min(innerWidth-width-8,x-width/2)),top:below?Math.max(8,y+48):Math.max(8,y-64)});};
  return <section ref={rootRef} className="coupling-whiteboard" tabIndex={-1} aria-label={t.whiteboard}>
    <div ref={viewportRef} className="coupling-board-viewport" tabIndex={0} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={e=>finishPointer(e)} onPointerCancel={e=>finishPointer(e,true)} onWheel={onWheel} onPointerLeave={()=>{if(!rootRef.current?.contains(globalThis.document.activeElement))setHover(null);}}>
      <div className="coupling-board-fabs" role="toolbar" aria-label={t.whiteboard}>
        <button ref={openerRef} type="button" className="coupling-btn coupling-board-fab coupling-board-fab-primary" aria-label={t.addCharacter} title={t.addCharacter} onClick={()=>openBatch()}>
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
        </button>
        <button type="button" className="coupling-btn coupling-board-fab" aria-label={t.whiteboardMove} title={`${t.whiteboardMove} (V)`} aria-keyshortcuts="V" aria-pressed={tool==='move'} onClick={()=>chooseTool('move')}>
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 3v18l5-5 4 6 2-1-4-6 7-1z" /></svg>
        </button>
        <button type="button" className="coupling-btn coupling-board-fab" aria-label={t.whiteboardConnect} title={`${t.whiteboardConnect} (C)`} aria-keyshortcuts="C" aria-pressed={tool==='connect'} onClick={()=>chooseTool('connect')}>
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M10.6 13.4a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.7 1.7M13.4 10.6a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.7-1.7" /></svg>
        </button>
        <button type="button" className="coupling-btn coupling-board-fab coupling-board-line-toggle" style={{'--relation-color':activeRelation.color} as React.CSSProperties} aria-label={`${t.lineSettings}: ${activeRelation.label[lang]} · ${t.direction}: ${direction==='both'?t.mutualDirection:t.forwardDirection}`} title={`${t.lineSettings}: ${activeRelation.label[lang]} · ${t.direction}: ${direction==='both'?t.mutualDirection:t.forwardDirection}`} aria-expanded={lineSettingsOpen} onClick={toggleLineSettings}>
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 12h16" />{direction==='both'&&<path d="M7 9 4 12l3 3" />}<path d="M17 9l3 3-3 3" /></svg>
        </button>
        <button type="button" className="coupling-btn coupling-board-fab coupling-board-view-toggle" aria-label={t.viewTools} title={t.viewTools} aria-expanded={viewOpen} onClick={toggleView}>
          <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
        </button>
        <button type="button" className="coupling-btn coupling-board-fab coupling-board-more-toggle" aria-label={moreOpen?t.close:t.moreTools} title={moreOpen?t.close:t.moreTools} aria-expanded={moreOpen} onClick={toggleMore}>
          <span aria-hidden="true">{moreOpen?'×':'⋯'}</span>
        </button>
      </div>
      {lineSettingsOpen&&<div className="coupling-board-line-settings" role="group" aria-label={t.lineSettings}>
        <strong>{t.lineSettings}</strong>
        <div className="coupling-board-relation-options" role="group" aria-label={t.relation}>{RELATIONS.map(item=><button type="button" key={item.id} className="coupling-btn coupling-board-relation-choice" style={{'--relation-color':item.color} as React.CSSProperties} aria-label={`${t.relation}: ${item.label[lang]}`} title={item.label[lang]} aria-pressed={relation===item.id} onClick={()=>setRelation(item.id)}><span aria-hidden="true">{item.symbol}</span><small>{item.label[lang]}</small></button>)}</div>
        <button type="button" className="coupling-btn coupling-board-settings-direction" aria-label={`${t.direction}: ${direction==='both'?t.mutualDirection:t.forwardDirection}`} title={`${t.direction}: ${direction==='both'?t.mutualDirection:t.forwardDirection}`} aria-pressed={direction==='forward'} onClick={toggleDirection}><span aria-hidden="true">{direction==='both'?'↔':'→'}</span><span>{t.direction}: {direction==='both'?t.mutualDirection:t.forwardDirection}</span></button>
      </div>}
      {viewOpen&&<div className="coupling-board-view-panel" role="group" aria-label={t.viewTools}>
        <strong>{t.viewTools}</strong>
        <button type="button" className="coupling-btn coupling-board-mini-fab" aria-label={t.fitAll} title={t.fitAll} onClick={()=>{fit();setViewOpen(false);}}><BoardActionIcon action="fit" /><span>{t.fitAll}</span></button>
        <button type="button" className="coupling-btn coupling-board-mini-fab" aria-label={t.tidyBoard} title={t.tidyBoard} onClick={()=>{tidy();setViewOpen(false);}}><BoardActionIcon action="tidy" /><span>{t.tidyBoard}</span></button>
        <button type="button" className="coupling-btn coupling-board-mini-fab" aria-label={t.zoomOut} title={t.zoomOut} onClick={()=>{zoomBy(1/1.2);setViewOpen(false);}}><BoardActionIcon action="zoomOut" /><span>{t.zoomOut}</span></button>
        <button type="button" className="coupling-btn coupling-board-mini-fab" aria-label={t.zoomIn} title={t.zoomIn} onClick={()=>{zoomBy(1.2);setViewOpen(false);}}><BoardActionIcon action="zoomIn" /><span>{t.zoomIn}</span></button>
      </div>}
      {moreOpen&&<div className="coupling-board-more-panel" role="group" aria-label={t.moreTools}>
        <button type="button" className="coupling-btn coupling-board-mini-fab" aria-label={t.undo} title={t.undo} disabled={!undoStack.current.length} onClick={()=>{undo();setMoreOpen(false);}}><BoardActionIcon action="undo" /><span>{t.undo}</span></button>
        <button type="button" className="coupling-btn coupling-board-mini-fab" aria-label={t.redo} title={t.redo} disabled={!redoStack.current.length} onClick={()=>{undo(true);setMoreOpen(false);}}><BoardActionIcon action="redo" /><span>{t.redo}</span></button>
        <button type="button" className="coupling-btn coupling-board-mini-fab" aria-label={t.layoutAll} title={t.layoutAll} onClick={()=>{setMoreOpen(false);fullLayout();}}><BoardActionIcon action="layout" /><span>{t.layoutAll}</span></button>
      </div>}
      <div className="coupling-board-world" style={{transform:`translate(${view.x}px,${view.y}px) scale(${view.zoom})`}}>
        <svg className="coupling-board-edges" aria-label={t.edgeList} width="1" height="1" overflow="visible"><defs>{RELATIONS.map(r=><marker key={r.id} id={`coupling-arrow-${r.id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill={r.color}/></marker>)}</defs>{edges.map(edge=>{const a=nodeMap.get(edge.from),b=nodeMap.get(edge.to);if(!a||!b)return null;const curved=edge.direction==='forward'&&edges.some(other=>other.id!==edge.id&&other.from===edge.to&&other.to===edge.from&&other.direction==='forward'),geometry=getEdgeGeometry(a,b,curved),color=RELATIONS.find(r=>r.id===edge.type)?.color;return <g key={edge.id} style={{'--edge-color':color} as React.CSSProperties} className={selectedEdge===edge.id?'is-selected':''} tabIndex={0} role="button" aria-label={connectedNames(edge)} onClick={()=>{setSelectedEdge(edge.id);setSelected(null);}}><path ref={el=>{const pair=edgePaths.current.get(edge.id)??{line:null,hit:null};pair.hit=el;edgePaths.current.set(edge.id,pair);}} className="coupling-edge-hit" d={geometry.path} data-edge={edge.id}/><path ref={el=>{const pair=edgePaths.current.get(edge.id)??{line:null,hit:null};pair.line=el;edgePaths.current.set(edge.id,pair);}} className="coupling-edge-line" d={geometry.path} markerEnd={`url(#coupling-arrow-${edge.type})`} markerStart={edge.direction==='both'?`url(#coupling-arrow-${edge.type})`:undefined}/><title>{connectedNames(edge)}</title></g>;})}</svg>
        <svg className="coupling-board-edges" aria-hidden="true" width="1" height="1" overflow="visible"><path ref={previewPath} className="coupling-edge-line coupling-edge-preview" style={{display:'none','--edge-color':RELATIONS.find(r=>r.id===relation)?.color} as React.CSSProperties}/></svg>
        {nodes.map(node=>{const character=PROFILE_CHARACTER_BY_ID.get(node.id);if(!character)return null;const active=selected===node.id||hover===node.id,tooltip=`coupling-tip-${node.id}`;return <div key={node.id} ref={el=>{if(el)nodeElements.current.set(node.id,el);else nodeElements.current.delete(node.id);}} className={`coupling-board-node${active?' is-active':''}${pending===node.id?' is-pending':''}`} data-node={node.id} style={{left:node.x,top:node.y}} onPointerEnter={()=>{setHover(node.id);positionTooltip(node.id);}} onFocusCapture={()=>revealNode(node.id)} onPointerLeave={e=>{if(!e.currentTarget.contains(globalThis.document.activeElement))setHover(null);}}><button type="button" className="coupling-node-ring" aria-label={character[lang]} aria-describedby={hover===node.id?tooltip:undefined} onClick={()=>{setSelected(node.id);if(pending&&pending!==node.id)completeConnection(pending,node.id);else if(tool==='connect')setPending(node.id);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(node.id);if(pending&&pending!==node.id)completeConnection(pending,node.id);else if(tool==='connect')setPending(node.id);}}}><CharacterAvatar character={character} size={56}/></button>{active&&<button type="button" className="coupling-node-remove" aria-label={`${character[lang]} ${t.delete}`} onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();remove(node.id);}}>−</button>}</div>;})}
      </div><div className="coupling-board-caption">{t.boardCaption.replace('{nodes}',String(nodes.length)).replace('{edges}',String(edges.length)).replace('{total}',String(PROFILE_CHARACTERS.length))}</div><div className="coupling-board-zoom"><output aria-label={t.zoomLevel}>{Math.round(view.zoom*100)}%</output></div>
      {(selected&&PROFILE_CHARACTER_BY_ID.has(selected)||selectedEdgeData)&&<div className="coupling-selection-info"><span>{selected&&PROFILE_CHARACTER_BY_ID.has(selected)?<><strong>{characterName(selected,lang)}</strong> · {PROFILE_CHARACTER_BY_ID.get(selected)?.group[lang]}</>:selectedEdgeData&&connectedNames(selectedEdgeData)}</span><button type="button" className="coupling-btn coupling-selection-delete" aria-label={t.delete} title={t.delete} onClick={()=>remove()}><BoardActionIcon action="delete"/><span>{t.delete}</span></button></div>}
    </div>{hover&&PROFILE_CHARACTER_BY_ID.has(hover)&&createPortal(<span className="coupling-node-tooltip" style={tooltipPosition} role="tooltip" id={`coupling-tip-${hover}`}>{characterName(hover,lang)} · {PROFILE_CHARACTER_BY_ID.get(hover)?.group[lang]}</span>,globalThis.document.body)}<div className="coupling-edge-list" aria-label={t.edgeList}>{edges.map(edge=><button key={edge.id} className="coupling-btn" onClick={()=>{setSelectedEdge(edge.id);setSelected(null);}}>{connectedNames(edge)}</button>)}</div><p className="coupling-status" role="status">{notice||`${t.whiteboardDesc} · ${t.shortcutHint}`}</p>
    <CharacterBatchDialog open={modal} placedIds={nodes.map(n=>n.id)} initialWork="공통" globalSearch={globalSearch} onCancel={()=>{setModal(false);openerRef.current?.focus();}} onConfirm={addBatch}/>
  </section>;
}
