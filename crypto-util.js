const CryptoUtil=(_=>{
  const A='AES-GCM',I=130000;
  async function dk(p,s){const r=await crypto.subtle.importKey('raw',new TextEncoder().encode(p),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt:s,iterations:I,hash:'SHA-256'},r,{name:A,length:256},false,['encrypt','decrypt']);}
  async function encrypt(pt,pw){const s=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),k=await dk(pw,s),e=await crypto.subtle.encrypt({name:A,iv},k,new TextEncoder().encode(pt)),o=new Uint8Array(28+e.byteLength);o.set(s);o.set(iv,16);o.set(new Uint8Array(e),28);return btoa(String.fromCharCode(...o));}
  async function decrypt(b64,pw){const b=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)),k=await dk(pw,b.slice(0,16)),d=await crypto.subtle.decrypt({name:A,iv:b.slice(16,28)},k,b.slice(28));return new TextDecoder().decode(d);}
  async function hashPassword(u,p){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(u+':'+p+':daftar_v8'));return btoa(String.fromCharCode(...new Uint8Array(b)));}
  async function hashPin(pin){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('pin:'+pin+':df7'));return btoa(String.fromCharCode(...new Uint8Array(b)));}
  return{encrypt,decrypt,hashPassword,hashPin};
})();
