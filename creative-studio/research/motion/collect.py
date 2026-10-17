"""Read-only, bounded GitHub evidence collector; never executes upstream code."""
import concurrent.futures, datetime, json, pathlib, urllib.request
ROOT = pathlib.Path(__file__).parent
REPOS = ['Vincentwei1021/video-shotcraft','Liamrjohnston/remotion-motion-graphics-skill','haidrrrry/claude-remotion-skill','remotion-dev/skills','remotion-dev/remotion']
def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':'creative-studio-source-audit','Accept':'application/vnd.github+json'})
    with urllib.request.urlopen(req,timeout=18) as r: return r.read()
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
        if repo!='remotion-dev/remotion':
            selected += [p for p in paths if p.endswith(('SKILL.md','package.json'))][:12]
            selected += [p for p in paths if any(x in p.lower() for x in ['animation','timing','audio','camera','render','transition','keyframe']) and p.endswith(('.md','.tsx','.ts','.py'))][:14]
        else:
            selected += [p for p in paths if p in ['packages/renderer/package.json','packages/core/package.json','packages/cli/package.json','packages/example/src/HelloWorld.tsx','packages/docs/docs/licensing.mdx','packages/docs/docs/gpu.mdx','packages/docs/docs/requirements.mdx','packages/docs/docs/renderer/render-media.mdx']]
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
