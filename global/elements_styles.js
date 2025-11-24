/* Runtime helper: apply shared UI classes (like `app-scrollbar`) to existing
   scrollable containers so they inherit global visuals without editing many
   templates. This file is safe to run multiple times (idempotent).
*/
(function(){
  function applyAppScrollbar(){
    try{
      // Known main containers to opt-in
      const known = ['#login-container','#home-container','#onboarding-container','#main-container'];
      known.forEach(sel=>{
        const el = document.querySelector(sel);
        if (el && !el.classList.contains('app-scrollbar')) el.classList.add('app-scrollbar');
      });

      // Heuristic: find elements that currently scroll (computed overflow)
      // and add the class so they pick up the shared visuals.
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null, false);
      const toAdd = [];
      while(walker.nextNode()){
        const el = walker.currentNode;
        try{
          const cs = window.getComputedStyle(el);
          if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && !el.classList.contains('app-scrollbar')){
            toAdd.push(el);
          }
        } catch(e) { /* ignore cross-origin or inaccessible styles */ }
      }
      toAdd.forEach(el=>el.classList.add('app-scrollbar'));

    } catch(e){ console.warn('elements_styles: failed to apply app-scrollbar', e); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyAppScrollbar);
  else applyAppScrollbar();
})();
