(function(){
  class OrgChartRenderer{
    constructor(canvas){
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.nodes = [];
      this.edges = [];
      this.zoom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--orgchart-zoom-default')) || 1.1;
      this.offsetX = 0; this.offsetY = 0;
      this._raf = null;
      this._setupEvents();
      this._renderLoop();
    }

    setLayout(nodes, edges){
      // nodes: array of {id,x,y,width,height}
      this.nodes = nodes;
      this.edges = edges;
      this._redraw();
    }

    _setupEvents(){
      // simple pan/zoom handlers
      let dragging=false, lastX=0, lastY=0;
      this.canvas.addEventListener('mousedown', (e)=>{ dragging=true; lastX=e.clientX; lastY=e.clientY; });
      window.addEventListener('mouseup', ()=> { dragging=false; });
      window.addEventListener('mousemove', (e)=>{ if(dragging){ this.offsetX += e.clientX - lastX; this.offsetY += e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; } });
      this.canvas.addEventListener('wheel', (e)=>{ e.preventDefault(); const delta = e.deltaY>0?0.9:1.1; this.zoom *= delta; this.zoom = Math.max(0.1, Math.min(4, this.zoom)); });
      this.canvas.addEventListener('click', (e)=>{ const rect = this.canvas.getBoundingClientRect(); const cx = (e.clientX - rect.left - this.offsetX)/this.zoom; const cy = (e.clientY - rect.top - this.offsetY)/this.zoom; // hit test
        for(const n of this.nodes){ if(cx>=n.x && cx<=n.x+n.width && cy>=n.y && cy<=n.y+n.height){ // open profile
            if(window.openUserProfile) window.openUserProfile(n.id); break; } }
      });
    }

    _renderLoop(){
      this._raf = requestAnimationFrame(()=>this._renderLoop());
      this._redraw();
    }

    _clear(){
      this.ctx.save();
      this.ctx.setTransform(1,0,0,1,0,0);
      this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
      this.ctx.restore();
    }

    _redraw(){
      if(!this.ctx) return;
      this._clear();
      this.ctx.save();
      this.ctx.translate(this.offsetX, this.offsetY);
      this.ctx.scale(this.zoom, this.zoom);

      // simple LOD decision
      const z = this.zoom;
      for(const e of this.edges){ this._drawEdge(e); }
      for(const n of this.nodes){
        if(z < parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--orgchart-lod-dot'))){
          this._drawDot(n);
        } else if(z < parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--orgchart-lod-avatar32'))){
          this._drawInitials(n);
        } else if(z < parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--orgchart-lod-avatar64'))){
          this._drawAvatar32(n);
        } else {
          this._drawAvatar64(n);
        }
      }

      this.ctx.restore();
    }

    _drawEdge(e){
      const from = this.nodes.find(n=>n.id===e.from_id);
      const to = this.nodes.find(n=>n.id===e.to_id);
      if(!from||!to) return;
      const x1 = from.x + from.width/2, y1 = from.y + from.height;
      const x2 = to.x + to.width/2, y2 = to.y;
      this.ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(x1,y1);
      this.ctx.lineTo(x2,y2);
      this.ctx.stroke();
    }

    _drawDot(n){
      this.ctx.fillStyle = n.color || '#888';
      const cx = n.x + (n.width||8)/2, cy = n.y + (n.height||8)/2;
      this.ctx.beginPath(); this.ctx.arc(cx, cy, 4, 0, Math.PI*2); this.ctx.fill();
    }

    _drawInitials(n){
      const size = 18;
      const cx = n.x; const cy = n.y;
      this.ctx.fillStyle = n.color || '#666';
      this.ctx.fillRect(cx, cy, size, size);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '11px sans-serif';
      const initials = ((n.first_name||'')[0]||'') + ((n.last_name||'')[0]||'');
      this.ctx.fillText(initials.toUpperCase(), cx+4, cy+12);
    }

    _drawAvatar32(n){
      const size = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--orgchart-avatar-size-small'))||32;
      // placeholder: draw rectangle and name
      this.ctx.fillStyle = '#ddd';
      this.ctx.fillRect(n.x, n.y, size, size);
      this.ctx.fillStyle = '#111';
      this.ctx.font = '12px sans-serif';
      this.ctx.fillText((n.first_name||'') + ' ' + (n.last_name||''), n.x + size + 6, n.y + size/2 + 4);
    }

    _drawAvatar64(n){
      const size = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--orgchart-avatar-size-large'))||64;
      this.ctx.fillStyle = '#ddd';
      this.ctx.fillRect(n.x, n.y, size, size);
      this.ctx.fillStyle = '#111';
      this.ctx.font = '14px sans-serif';
      this.ctx.fillText((n.first_name||'') + ' ' + (n.last_name||''), n.x + size + 8, n.y + 20);
      this.ctx.font = '12px sans-serif';
      if(n.title) this.ctx.fillText(n.title, n.x + size + 8, n.y + 40);
    }

    destroy(){
      cancelAnimationFrame(this._raf);
      // detach listeners? left minimal for now
    }
  }

  window.OrgChartRenderer = OrgChartRenderer;
})();
