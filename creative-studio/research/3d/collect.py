"""Read-only, bounded GitHub evidence collector; never executes upstream code."""
import concurrent.futures, datetime, json, pathlib, urllib.request
ROOT = pathlib.Path(__file__).parent
REPOS = ['blender/blender','mrdoob/three.js','pmndrs/react-three-fiber','pmndrs/drei','pmndrs/react-three-rapier','pmndrs/react-postprocessing','theatre-js/theatre','full-stack-skills/threejs-skills','alton47/threejs-skills','ahujasid/blender-mcp','donmccurdy/glTF-Transform','KhronosGroup/glTF-Sample-Assets']
def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':'creative-studio-source-audit','Accept':'application/vnd.github+json'})
    with urllib.request.urlopen(req,timeout=50) as r: return r.read()
def collect(repo):
    d=ROOT/repo.replace('/','__'); d.mkdir(exist_ok=True)
    try:
        meta=json.loads(get('https://api.github.com/repos/'+repo)); ref=meta['default_branch']
        commit=json.loads(get(f'https://api.github.com/repos/{repo}/commits/{ref}')); sha=commit['sha']
        tree=json.loads(get(f'https://api.github.com/repos/{repo}/git/trees/{sha}?recursive=1'))
        (d/'metadata.json').write_text(json.dumps({'collected_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'repo':repo,'ref':ref,'sha':sha,'commit_date':commit['commit']['committer']['date'],'github_license':meta.get('license'),'tree_truncated':tree.get('truncated')},indent=2))
        (d/'tree.json').write_text(json.dumps(tree,indent=2))
        paths=[e['path'] for e in tree['tree'] if e['type']=='blob']
        selected=[p for p in paths if '/' not in p and (p.lower().startswith(('readme','license','copying')) or p in ['package.json','pyproject.toml','requirements.txt'])]
        if repo=='ahujasid/blender-mcp': selected += [p for p in paths if p in ['addon.py','src/blender_mcp/server.py','src/blender_mcp/__init__.py']]
        if repo=='theatre-js/theatre': selected += [p for p in paths if p in ['theatre/core/package.json','theatre/studio/package.json','packages/core/package.json','packages/studio/package.json']]
        if repo=='KhronosGroup/glTF-Sample-Assets': selected += [p for p in paths if p in ['Models/DamagedHelmet/README.md','Models/FlightHelmet/README.md','Models/Box/README.md','Models/AnimatedMorphCube/README.md','Models/Fox/README.md']]
        for p in selected:
            try:
                b=get(f'https://raw.githubusercontent.com/{repo}/{sha}/{p}')
                out=d/p; out.parent.mkdir(exist_ok=True,parents=True); out.write_bytes(b)
            except Exception as e: (d/'errors.txt').open('a').write(p+': '+str(e)+'\n')
        return repo,sha,len(selected)
    except Exception as e:
        (d/'errors.txt').write_text(str(e)); return repo,str(e)
if __name__=='__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
        for result in ex.map(collect,REPOS): print(*result,flush=True)
