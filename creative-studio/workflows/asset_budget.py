"""Mede entrega GLB e gera gzip de transferência, sem modificar a malha."""
import argparse,gzip,json,hashlib,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1];p=argparse.ArgumentParser();p.add_argument('asset',type=Path);p.add_argument('--output',type=Path,required=True);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
raw=a.asset.read_bytes();compressed=gzip.compress(raw,compresslevel=9,mtime=0);(a.output/(a.asset.name+'.gz')).write_bytes(compressed)
r=subprocess.run(['python3',str(root/'tests/check_glb.py'),str(a.asset)],capture_output=True,text=True,check=True);metrics=json.loads(r.stdout)
metrics.update({'sha256':hashlib.sha256(raw).hexdigest(),'gzipBytes':len(compressed),'transferReductionPercent':round((1-len(compressed)/len(raw))*100,1),'withinExampleMobileBudget':len(raw)<500000 and metrics['triangles']<20000,'note':'Gzip é compressão de transferência: usar Content-Encoding gzip quando servido. Não reduz polígonos, draw calls ou memória GPU. Não é Draco/Meshopt/KTX2.'})
(a.output/'budget.json').write_text(json.dumps(metrics,indent=2,ensure_ascii=False)+'\n');print(json.dumps(metrics,indent=2,ensure_ascii=False))
