export function showRequestsError(msg){
  console.error('requests error:', msg);
  try { alert(msg); } catch(e){}
}
