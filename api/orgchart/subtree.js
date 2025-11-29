// Simple serverless endpoint for orgchart subtree. Expects environment to provide SUPABASE_SERVICE_KEY.
// If no service key present, returns a small fixture for local testing.

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const url = new URL(req.url, 'http://localhost');
  const maxDepth = parseInt(url.searchParams.get('max_depth') || '2', 10);
  const maxNodes = 2000;

  // If SUPABASE_SERVICE_KEY is not present, return fixture data
  if(!process.env.SUPABASE_SERVICE_KEY){
    // small fixture
    const nodes = [
      { id: '1', first_name: 'Alice', last_name: 'Anderson', title: 'CEO', avatar_url: null },
      { id: '2', first_name: 'Bob', last_name: 'Brown', title: 'CTO', avatar_url: null, reports_to_id: '1' },
      { id: '3', first_name: 'Carol', last_name: 'Clark', title: 'CFO', avatar_url: null, reports_to_id: '1' },
    ];
    const edges = [ { from_id: '1', to_id: '2' }, { from_id: '1', to_id: '3' } ];
    res.statusCode = 200;
    res.end(JSON.stringify({ nodes, edges }));
    return;
  }

  // Real implementation using Supabase - minimal pattern
  try{
    const { createClient } = require('@supabase/supabase-js');
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

    // NOTE: For proper protection, validate the request session if needed.
    // Build a recursive SQL query to fetch up to maxDepth and node cap; for brevity we do a simple select here.

    // Fetch top-level roots (no manager) and their direct children up to maxDepth
    // This is a simplified approach: for a robust solution use WITH RECURSIVE and enforce caps.
    const rootsRes = await supabase.from('profiles').select('id, first_name, last_name, avatar_url, title').is('reports_to_id', null).limit(1000);
    if(rootsRes.error){ throw rootsRes.error; }
    const roots = rootsRes.data || [];
    // fetch children of roots
    const rootIds = roots.map(r=>r.id);
    const childrenRes = await supabase.from('profiles').select('id, first_name, last_name, avatar_url, title, reports_to_id').in('reports_to_id', rootIds).limit(2000);
    if(childrenRes.error){ throw childrenRes.error; }
    const children = childrenRes.data || [];

    const nodes = roots.concat(children);
    const edges = children.filter(c=>c.reports_to_id).map(c=>({ from_id: c.reports_to_id, to_id: c.id }));

    res.statusCode = 200;
    res.end(JSON.stringify({ nodes, edges }));
  }catch(err){
    console.error('orgchart api error', err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'internal' }));
  }
};
