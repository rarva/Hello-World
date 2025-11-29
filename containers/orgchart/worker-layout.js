// Simple Web Worker layout: BFS levels -> even spacing per level
self.addEventListener('message', (evt) => {
  const msg = evt.data;
  if(msg.type === 'layout:init'){
    const nodes = msg.nodes || [];
    const edges = msg.edges || [];
    const options = msg.options || {};
    try{
      const result = computeLayout(nodes, edges, options);
      self.postMessage({ type: 'layout:result', nodes: result.nodes, edges: edges, meta: { durationMs: 0 } });
    }catch(err){
      self.postMessage({ type: 'layout:error', message: ''+err });
    }
  }
});

function computeLayout(nodes, edges, options){
  // build maps
  const nodeMap = new Map(); nodes.forEach(n=>nodeMap.set(n.id, Object.assign({}, n)));
  const children = new Map(); nodes.forEach(n=>children.set(n.id, []));
  edges.forEach(e=>{ if(children.has(e.from_id)) children.get(e.from_id).push(e.to_id); else children.set(e.from_id,[e.to_id]); });

  // find roots (no manager)
  const toIds = new Set(edges.map(e=>e.to_id));
  const roots = nodes.filter(n=>!toIds.has(n.id));

  // BFS assign levels
  const levelMap = new Map();
  const queue = [];
  roots.forEach(r => { levelMap.set(r.id,0); queue.push(r.id); });
  while(queue.length){
    const id = queue.shift();
    const lvl = levelMap.get(id);
    const childs = children.get(id) || [];
    for(const c of childs){ if(!levelMap.has(c)){ levelMap.set(c, lvl+1); queue.push(c); } }
  }

  // group by level
  const levels = new Map(); for(const [id,lv] of levelMap){ if(!levels.has(lv)) levels.set(lv,[]); levels.get(lv).push(id); }

  // compute positions: y = level * verticalSpacing; x = even spacing per level
  const verticalSpacing = options.verticalSpacing || 120;
  const horizontalSpacing = options.horizontalSpacing || 120;
  const outNodes = [];
  for(const [lvl,ids] of levels){
    const count = ids.length;
    for(let i=0;i<count;i++){
      const id = ids[i];
      const x = i * horizontalSpacing;
      const y = lvl * verticalSpacing;
      const baseWidth = 100, baseHeight = 40;
      const nn = nodeMap.get(id) || { id };
      nn.x = x; nn.y = y; nn.width = baseWidth; nn.height = baseHeight;
      outNodes.push(nn);
    }
  }
  return { nodes: outNodes };
}
