import {spawn} from 'node:child_process';
import {setTimeout as sleep} from 'node:timers/promises';

const port=21000+Math.floor(Math.random()*1000);
const origin=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,['dist-server/index.js'],{
  env:{...process.env,PORT:String(port)},
  stdio:['ignore','pipe','pipe']
});

let stderr='';
child.stderr.on('data',chunk=>{stderr+=String(chunk)});

async function waitForHealth(){
  for(let attempt=0;attempt<40;attempt++){
    if(child.exitCode!==null)throw new Error(`server exited early (${child.exitCode})\n${stderr}`);
    try{
      const response=await fetch(`${origin}/api/health`);
      if(response.ok)return response;
    }catch{}
    await sleep(150);
  }
  throw new Error(`server did not become healthy\n${stderr}`);
}

try{
  const health=await waitForHealth();
  const healthPayload=await health.json();
  if(healthPayload.status!=='ok'||healthPayload.service!=='wanderline')throw new Error(`unexpected health payload: ${JSON.stringify(healthPayload)}`);
  if(!['local-first','auth-ready'].includes(healthPayload.mode))throw new Error(`unexpected runtime mode: ${JSON.stringify(healthPayload)}`);

  const config=await fetch(`${origin}/api/config`);
  if(!config.ok)throw new Error(`expected config endpoint 200, received ${config.status}`);
  const configPayload=await config.json();
  if(configPayload.weather!=='open-meteo')throw new Error(`unexpected weather config: ${JSON.stringify(configPayload)}`);
  if(configPayload.maps!=='google-maps-universal-links')throw new Error(`unexpected maps config: ${JSON.stringify(configPayload)}`);
  if(configPayload.currency!=='USD')throw new Error(`unexpected currency config: ${JSON.stringify(configPayload)}`);
  if(!['local-demo','auth-ready'].includes(configPayload.collaboration))throw new Error(`unexpected collaboration config: ${JSON.stringify(configPayload)}`);
  if(typeof configPayload.firebase!=='boolean')throw new Error(`unexpected Firebase config: ${JSON.stringify(configPayload)}`);

  const missing=await fetch(`${origin}/api/__smoke_missing__`);
  if(missing.status!==404)throw new Error(`expected API 404, received ${missing.status}`);
  const contentType=missing.headers.get('content-type')||'';
  if(!contentType.includes('application/json'))throw new Error(`expected JSON API 404, received ${contentType}`);

  console.log('✓ Wanderline production server smoke test passed');
}finally{
  if(child.exitCode===null)child.kill('SIGTERM');
  await Promise.race([
    new Promise(resolve=>child.once('exit',resolve)),
    sleep(2000)
  ]);
}
