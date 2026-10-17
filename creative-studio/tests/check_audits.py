import json,re
from pathlib import Path
root=Path(__file__).resolve().parents[1]
expected=['obra/superpowers','bmad-code-org/BMAD-METHOD','openai/openai-agents-js','crewAIInc/crewAI','langchain-ai/deepagents','nextlevelbuilder/ui-ux-pro-max-skill','DavidHDev/react-bits','magicuidesign/magicui','ibelick/motion-primitives','greensock/GSAP','Vincentwei1021/video-shotcraft','Liamrjohnston/remotion-motion-graphics-skill','haidrrrry/claude-remotion-skill','remotion-dev/skills','remotion-dev/remotion','blender/blender','mrdoob/three.js','pmndrs/react-three-fiber','pmndrs/drei','pmndrs/react-three-rapier','pmndrs/react-postprocessing','theatre-js/theatre','full-stack-skills/threejs-skills','alton47/threejs-skills','ahujasid/blender-mcp','donmccurdy/glTF-Transform','KhronosGroup/glTF-Sample-Assets']
entries=[]
for path in sorted((root/'research').glob('*/manifest.json')):
    data=json.loads(path.read_text());data=data.get('repositories',[]) if isinstance(data,dict) else data
    entries.extend(data)
found={x['repository'].lower():x for x in entries};missing=[x for x in expected if x.lower() not in found]
result={'expected':len(expected),'documented':len(found),'missing':missing,'repositories':[]}
for name in expected:
    item=found.get(name.lower())
    if not item:continue
    required=['repository','url','sha','license','decision','filesRead','notes'];absent=[k for k in required if k not in item]
    verified=bool(re.fullmatch(r'[0-9a-f]{40}',item.get('sha') or '') and item.get('filesRead') and item.get('license') not in [None,'unverified','unknown'])
    result['repositories'].append({'repository':name,'fieldsMissing':absent,'sha':item.get('sha'),'decision':item.get('decision'),'sourceFilesRead':len(item.get('filesRead') or []),'provenancePresent':verified})
    assert not absent,(name,absent)
output=root/'artifacts/qa/audit-coverage.json';output.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'expected':len(expected),'documented':len(found),'missing':missing},ensure_ascii=False));assert not missing,'A auditoria ainda não cobriu todos os projetos.'
assert all(x['provenancePresent'] for x in result['repositories']),'Fontes sem SHA/licença/documentos não contam como auditoria concluída.'
