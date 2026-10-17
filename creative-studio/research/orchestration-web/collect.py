"""Read-only, bounded GitHub evidence collector; never executes upstream code."""
import concurrent.futures, datetime, json, pathlib, urllib.request
ROOT = pathlib.Path(__file__).parent
REPOS = ['obra/superpowers','bmad-code-org/BMAD-METHOD','openai/openai-agents-js','crewAIInc/crewAI','langchain-ai/deepagents','nextlevelbuilder/ui-ux-pro-max-skill','DavidHDev/react-bits','magicuidesign/magicui','ibelick/motion-primitives','greensock/GSAP']
def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':'creative-studio-source-audit','Accept':'application/vnd.github+json'})
    with urllib.request.urlopen(req,timeout=20) as r: return r.read()
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
        hints={
          'obra/superpowers':['skills/using-superpowers/SKILL.md','hooks/hooks.json','hooks/session-start','README.md'],
          'bmad-code-org/BMAD-METHOD':['tools/cli/bmad-cli.js','src/core/module.yaml','docs/index.md'],
          'openai/openai-agents-js':['packages/agents/package.json','packages/agents-core/package.json','examples/basic/hello-world.ts','packages/agents/src/index.ts'],
          'crewAIInc/crewAI':['lib/crewai/pyproject.toml','lib/crewai/src/crewai/crew.py','lib/crewai/src/crewai/cli/cli.py'],
          'langchain-ai/deepagents':['libs/deepagents/pyproject.toml','libs/deepagents/deepagents/graph.py','libs/deepagents/deepagents/backends/filesystem.py','libs/cli/pyproject.toml'],
          'nextlevelbuilder/ui-ux-pro-max-skill':['.claude/skills/ui-ux-pro-max/SKILL.md','src/ui-ux-pro-max/SKILL.md','cli/package.json','src/ui-ux-pro-max/scripts/search.py'],
          'DavidHDev/react-bits':['src/content/TextAnimations/SplitText/SplitText.jsx','src/ts-default/TextAnimations/SplitText/SplitText.tsx','src/content/Backgrounds/Aurora/Aurora.jsx'],
          'magicuidesign/magicui':['apps/www/package.json','registry/magicui/blur-fade.tsx','apps/www/registry/magicui/blur-fade.tsx'],
          'ibelick/motion-primitives':['components/core/animated-group.tsx','components/core/text-effect.tsx','components/core/transition-panel.tsx'],
          'greensock/GSAP':['src/index.js','src/gsap-core.js','SECURITY.md']}
        selected += [p for p in hints.get(repo,[]) if p in paths and p not in selected]
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
