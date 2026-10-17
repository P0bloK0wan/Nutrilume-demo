"""Inventário reproduzível. Não lê variáveis de ambiente ou arquivos de segredos."""
import json,os,platform,shutil,subprocess
from pathlib import Path
from datetime import datetime,timezone
root=Path(__file__).resolve().parents[1]
def version(binary,args):
    path=shutil.which(binary)
    if not path:return {'available':False}
    result=subprocess.run([path,*args],capture_output=True,text=True,timeout=30)
    return {'available':result.returncode==0,'path':path,'version':(result.stdout or result.stderr).splitlines()[0]}
cpu_max=Path('/sys/fs/cgroup/cpu.max').read_text().split() if Path('/sys/fs/cgroup/cpu.max').exists() else ['max','1']
quota=None if cpu_max[0]=='max' else int(cpu_max[0])/int(cpu_max[1])
result={'cpuQuota':quota,'observedAt':datetime.now(timezone.utc).isoformat(),'system':platform.system(),'cpuCount':os.cpu_count(),'gpuDevicePresent':Path('/dev/dri').exists(),'tools':{key:version(key,args) for key,args in {'node':['--version'],'npm':['--version'],'python3':['--version'],'blender':['--version'],'ffmpeg':['-version'],'ffprobe':['-version'],'git':['--version']}.items()},'notes':['Presença de dispositivo não prova aceleração WebGL/WebGPU; testar o renderer.','Frameworks externos de LLM não são necessários para os agentes nativos desta sessão.']}
path=root/'artifacts/qa/inventory.json';path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n');print(json.dumps(result,indent=2,ensure_ascii=False))
