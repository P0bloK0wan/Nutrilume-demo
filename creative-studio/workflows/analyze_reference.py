"""Extrai metadados e contact sheet de arquivo local; não baixa nem envia conteúdo."""
import argparse,json,subprocess
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('video',type=Path);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
if not args.video.is_file():raise SystemExit('Arquivo local não encontrado.')
args.output.mkdir(parents=True,exist_ok=True)
probe=subprocess.run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(args.video.resolve())],check=True,capture_output=True,text=True)
data=json.loads(probe.stdout);duration=float(data['format']['duration'])
if not 0<duration<86400:raise SystemExit('Duração inválida para análise.')
(args.output/'metadata.json').write_text(json.dumps(data,indent=2)+'\n')
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(args.video.resolve()),'-vf',f'fps=12/{duration},scale=320:-2,tile=4x3','-frames:v','1',str(args.output/'contact-sheet.jpg')],check=True)
print('Metadados e 12 quadros extraídos. A interpretação visual/sonora ainda precisa de revisão.')
