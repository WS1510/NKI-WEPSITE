// 간단한 임베드용 견적 전송 스크립트
(function(){
  async function sendQuote(payload){
    // primary: try to POST to local server endpoint /api/quote
    try{
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if(res.ok){
        const data = await res.json();
        return { ok: true, via: 'server', data };
      }
      // non-2xx fallthrough to fallback mechanisms
    }catch(e){
      // network error or no server - fallthrough to other mechanisms
    }

    // BroadcastChannel으로 전송
    if(typeof BroadcastChannel !== 'undefined'){
      try{ const bc = new BroadcastChannel('nki-quote-channel'); bc.postMessage({ type:'quote', payload }); return Promise.resolve({ ok:true, via:'BroadcastChannel' }); }catch(e){}
    }
    // localStorage append as fallback (다른 탭에서 수신 가능)
    try{ const KEY = 'nki_reception_local_v1'; const arr = JSON.parse(localStorage.getItem(KEY)||'[]'); const id = (arr.length? (arr[arr.length-1].id||0):0)+1; const entry = Object.assign({ id, timestamp:new Date().toISOString(), handled:false }, payload); arr.push(entry); localStorage.setItem(KEY, JSON.stringify(arr)); window.dispatchEvent(new Event('storage')); return Promise.resolve({ ok:true, via:'localStorage' }); }catch(e){ return Promise.resolve({ ok:false, error:String(e) }); }
  }
  // 글로벌 함수로 노출
  window.sendNkiQuote = sendQuote;
})();