(function(){
  // Minimal OrgChart init scaffold
  window.orgchart_init = window.orgchart_init || {};

  const API_ENDPOINT = '/api/orgchart/subtree';
  let worker = null;
  let renderer = null;
  let mounted = false;

  function $(sel){ return document.querySelector(sel); }

  function attachToolbarBinding(){
    // bind to first toolbar button as requested
    const tryBind = ()=>{
      const btn = document.querySelector('#toolbar-links button:first-child');
      if(btn){
        btn.addEventListener('click', () => { open(); });
        return true;
      }
      return false;
    };

    if(tryBind()) return;

    // If toolbar isn't present yet (toolbar is mounted dynamically), observe and bind when it appears
    const observer = new MutationObserver((mutations, obs) => {
      if(tryBind()){
        obs.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  async function open(){
    if(mounted) return;
    // mount HTML fragment into #main-container
    const main = document.getElementById('main-container');
    const container = document.getElementById('orgchart-container');
    if(!container){
      // if not present, fetch local file and insert
      try{
        const resp = await fetch('containers/orgchart/orgchart.html');
        const html = await resp.text();
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        // append to main-container
        main.appendChild(wrapper);
      }catch(e){
        console.error('Failed to load orgchart html', e);
        return;
      }
    }

    // show container
    const c = document.getElementById('orgchart-container');
    if(!c) { console.error('orgchart container missing'); return; }
    c.classList.remove('hidden');
    mounted = true;

    // wire close
    const closeBtn = document.getElementById('orgchart-close');
    closeBtn.addEventListener('click', close);

    // create renderer
    const canvas = document.getElementById('orgchart-canvas');
    renderer = new window.OrgChartRenderer(canvas);

    // spawn worker
    worker = new Worker('containers/orgchart/worker-layout.js');
    worker.addEventListener('message', (evt) => {
      const msg = evt.data;
      if(msg.type === 'layout:result'){
        renderer.setLayout(msg.nodes, msg.edges);
      }
    });

    // fetch initial data
    loadRoots();
  }

  function close(){
    const c = document.getElementById('orgchart-container');
    if(c) c.classList.add('hidden');
    if(worker){ worker.terminate(); worker = null; }
    if(renderer){ renderer.destroy(); renderer = null; }
    mounted = false;
  }

  async function loadRoots(){
    const loading = document.getElementById('orgchart-loading');
    loading.classList.remove('hidden');
    try{
      const resp = await fetch(API_ENDPOINT + '?max_depth=2');
      if(!resp.ok){
        console.error('orgchart API error', resp.status);
        loading.classList.add('hidden');
        return;
      }
      const payload = await resp.json();
      // send to worker for layout
      worker.postMessage({ type: 'layout:init', nodes: payload.nodes, edges: payload.edges, options: { verticalSpacing: 120, horizontalSpacing: 30 }});
    }catch(err){
      console.error('Failed loading roots', err);
    }finally{
      loading.classList.add('hidden');
    }
  }

  // expose
  window.orgchart_init.open = open;
  window.orgchart_init.close = close;

  // attach toolbar binding on DOM ready
  document.addEventListener('DOMContentLoaded', attachToolbarBinding);
})();
