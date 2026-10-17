"""Executor local com argumentos explícitos, sem shell e sem publicação."""
import argparse,json,subprocess,sys,time
from pathlib import Path
root=Path(__file__).resolve().parents[1]
tasks={
 'inventory':(['python3','tests/inventory.py'],root),
 'check-audits':(['python3','tests/check_audits.py'],root),
 'build-web':(['npm','run','build'],root/'apps/web'),
 'test-web':(['npm','test'],root/'apps/web'),
 'render-motion':(['npm','run','render'],root/'apps/motion'),
 'check-delivery':(['python3','tests/check_delivery.py'],root),
}
p=argparse.ArgumentParser();p.add_argument('task',choices=tasks,nargs='?');p.add_argument('--list',action='store_true');a=p.parse_args()
if a.list or not a.task:
 for key,(cmd,cwd) in tasks.items():print(key,':',json.dumps(cmd),'cwd=',cwd.relative_to(root))
 sys.exit(0)
cmd,cwd=tasks[a.task];start=time.time();result=subprocess.run(cmd,cwd=cwd);evidence={'task':a.task,'command':cmd,'cwd':str(cwd.relative_to(root)),'exitCode':result.returncode,'seconds':round(time.time()-start,3)}
out=root/'artifacts/qa';out.mkdir(parents=True,exist_ok=True);(out/('workflow-'+a.task+'.json')).write_text(json.dumps(evidence,indent=2)+'\n');sys.exit(result.returncode)
