/* 連線層：所有玩家動作寫入 rooms/<id>/acts，雙方按同一順序重播 → 狀態一致 */
const Net={me:0,id:null,
init(){if(!window.FIREBASE_CONFIG){alert('未設定 Firebase：請先填寫 firebase-config.js（見 README）');return 0}
 if(!firebase.apps.length)firebase.initializeApp(FIREBASE_CONFIG);this.db=firebase.database();return 1},
listen(on){this.db.ref('rooms/'+this.id+'/acts').on('child_added',s=>on(s.val()))},
send(a){this.db.ref('rooms/'+this.id+'/acts').push(a)},
async make(on,ready){const id=Math.random().toString(36).slice(2,8),seed=Math.floor(Math.random()*1e9);
 this.id=id;this.me=0;await this.db.ref('rooms/'+id+'/meta').set({seed});this.listen(on);
 this.db.ref('rooms/'+id+'/guest').on('value',s=>s.val()&&ready());return{id,seed}},
async join(id,on){this.id=id;this.me=1;const m=await this.db.ref('rooms/'+id+'/meta').get();
 if(!m.exists()){alert('房間不存在');return null}
 const r=await this.db.ref('rooms/'+id+'/guest').transaction(c=>c?undefined:true);
 if(!r.committed){alert('房間已滿');return null}this.listen(on);return m.val().seed},
async quick(on,ready){const r=await this.make(on,ready),q=this.db.ref('queue');let w=null;
 await q.transaction(c=>{w=c;return c&&c!==r.id?null:r.id});
 if(w&&w!==r.id){this.db.ref('rooms/'+r.id+'/acts').off();this.db.ref('rooms/'+r.id+'/guest').off();this.db.ref('rooms/'+r.id).remove();
  return{guest:true,seed:await this.join(w,on)}}
 q.onDisconnect().remove();return{host:true,seed:r.seed,cancel:()=>q.onDisconnect().cancel()}}
};
