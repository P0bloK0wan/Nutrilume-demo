import argparse,json,struct
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('path',type=Path);p.add_argument('--output',type=Path);args=p.parse_args();raw=args.path.read_bytes()
assert raw[:4]==b'glTF','Magic GLB inválido';version,length=struct.unpack_from('<II',raw,4);assert version==2 and length==len(raw),'Cabeçalho inconsistente';offset=12;chunks=[]
while offset<len(raw):
 size,kind=struct.unpack_from('<II',raw,offset);offset+=8;chunk=raw[offset:offset+size];assert len(chunk)==size;chunks.append((kind,chunk));offset+=size
assert offset==len(raw);doc=json.loads(next(x for kind,x in chunks if kind==0x4e4f534a));assert doc['asset']['version']=='2.0';accessors=doc.get('accessors',[]);triangles=0
for mesh in doc.get('meshes',[]):
 for primitive in mesh['primitives']:
  idx=primitive.get('indices');count=accessors[idx]['count'] if idx is not None else accessors[primitive['attributes']['POSITION']]['count']
  if primitive.get('mode',4)==4:triangles+=count//3
result={'path':str(args.path),'bytes':len(raw),'meshes':len(doc.get('meshes',[])),'materials':len(doc.get('materials',[])),'animations':len(doc.get('animations',[])),'triangles':triangles,'extensions':doc.get('extensionsUsed',[]),'structuralChecks':'pass','notes':['Validação estrutural básica própria; não substitui Khronos glTF Validator nem inspeção visual.']}
if args.output:args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
