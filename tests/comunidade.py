import os,sys
# Testes: perfil, avatar (logo), comunidade e injeção. Rodar com: python3 -m http.server 8765  (na pasta do projeto)
import struct,zlib
from playwright.sync_api import sync_playwright
R=[];errs=[]
def ok(n,c,d=''): R.append(('PASS' if c else 'FAIL',n,d))
P='<img src=x onerror="window.__x=(window.__x||0)+1">'
def png(path):
    def ch(t,d): return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    open(path,'wb').write(b'\x89PNG\r\n\x1a\n'+ch(b'IHDR',struct.pack('>IIBBBBB',1,1,8,6,0,0,0))+ch(b'IDAT',zlib.compress(b'\x00\xff\x00\x00\xff'))+ch(b'IEND',b''))
png('/tmp/foto.png'); open('/tmp/mal.html','w').write('<script>1</script>')
with sync_playwright() as p:
  b=p.chromium.launch(); pg=b.new_context(viewport={'width':400,'height':860}).new_page()
  pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.add_init_script("document.addEventListener('securitypolicyviolation',e=>{(window.__viol=window.__viol||[]).push(e.violatedDirective)})")
  pg.goto(os.getenv('BASE_URL','http://127.0.0.1:8765/demo.html')); pg.wait_for_timeout(400)
  # avatar padrão = logo
  ok('P1 avatar padrão é a logo',pg.evaluate("[...document.querySelectorAll('[data-av=pac] img')].every(i=>i.getAttribute('src')==='avatar-logo.png')"))
  ok('P2 ícone do app e manifest apontam para PNG',pg.evaluate("!!document.querySelector('link[rel=apple-touch-icon][href$=\".png\"]')"))
  # perfil do paciente
  pg.click('#btnPerfil'); pg.wait_for_timeout(300)
  f=pg.locator('#pf-pac')
  f.locator('[name=bio]').fill(P); f.locator('[name=nome]').fill('Marina '+P)
  f.locator('button[type=submit]').click(); pg.wait_for_timeout(200)
  ok('P3 bio/nome salvos viram texto (sem XSS)',pg.evaluate("window.__x===undefined && !document.querySelector('#perfilPac img[src=x]')"))
  ok('P4 bio limitada a 200',pg.evaluate("document.querySelector('#pf-pac [name=bio]').maxLength===200"))
  pg.set_input_files('#pfFoto-pac','/tmp/mal.html'); pg.wait_for_timeout(200)
  ok('P5 arquivo html como foto recusado',pg.evaluate("prof.pac.foto===null"))
  pg.set_input_files('#pfFoto-pac','/tmp/foto.png'); pg.wait_for_timeout(500)
  ok('P6 foto png aceita e reencodada (jpeg)',pg.evaluate("(prof.pac.foto||'').startsWith('data:image/jpeg')"))
  ok('P7 foto aparece no botão do topo',pg.evaluate("document.querySelector('#btnPerfil img').src.startsWith('data:image/jpeg')"))
  pg.click('#pfRem-pac'); pg.wait_for_timeout(200)
  ok('P8 "Usar a logo" restaura',pg.evaluate("prof.pac.foto===null && document.querySelector('#btnPerfil img').getAttribute('src')==='avatar-logo.png'"))
  # comunidade: bloqueio sem aceite
  pg.click('nav.tabs button[data-go=com]'); pg.wait_for_timeout(300)
  ok('M1 botão de entrar começa desabilitado',pg.is_disabled('#comGo'))
  for k in ['c1','c2','c3']: pg.check(f'#comEnt [name={k}]')
  ok('M2 com 3 de 4 itens continua bloqueado',pg.is_disabled('#comGo'))
  pg.check('#comEnt [name=c4]')
  ok('M3 4 itens liberam',not pg.is_disabled('#comGo'))
  # apelidos inválidos
  bad=pg.evaluate("['Marina','ab','com espaço','11999990000','<b>x</b>','laxante','Marina-Silva'].map(apelidoErro)")
  ok('M4 apelido real/curto/espaço/telefone/html recusado',all(bad),str(bad))
  pg.fill('#comEnt [name=ap]','Folha-do-Sul'); pg.click('#comGo'); pg.wait_for_timeout(300)
  ok('M5 entra e mostra salas',pg.locator('#comView [data-sala]').count()==5)
  ok('M6 só apelido aparece (sem nome/foto/bio)',pg.evaluate("!document.querySelector('#comView').innerText.includes('Marina') && !document.querySelector('#comView img[src^=data]')"))
  ok('M7 todas as salas têm anfitrião CRN',pg.evaluate("[...document.querySelectorAll('#comView .salaBtn')].every(e=>e.innerText.includes('CRN'))"))
  pg.click('[data-sala=rec]'); pg.wait_for_timeout(200)
  ok('M8 aviso fixo na sala','Dúvida do seu caso' in pg.inner_text('#comView'))
  def enviar(t):
      pg.evaluate("com.lastPost=0"); pg.fill('#salaIn',t); pg.press('#salaIn','Enter'); pg.wait_for_timeout(150)
  n0=pg.evaluate("sala('rec').posts.length")
  for t,nome in [('perdi 12 kg','peso'),('veja www.loja.com','link'),('tome 500 mg de x','dose'),('https://golpe.io','link2')]:
      enviar(t); ok('M9 bloqueia: '+nome,pg.evaluate("sala('rec').posts.length")==n0)
  enviar('laxante todo dia')
  ok('M10 palavra de alerta: acolhimento com CVV 188',pg.locator('.overlay').count()==1 and '188' in pg.inner_text('.overlay'))
  ok('M11 alerta não grava o texto',pg.evaluate("!JSON.stringify(com).includes('laxante')"))
  pg.click('#alOk'); 
  enviar(P)
  ok('M12 XSS na mensagem vira texto',pg.evaluate("window.__x===undefined && !document.querySelector('#comView img[src=x]')"))
  pg.evaluate("com.lastPost=Date.now()"); pg.fill('#salaIn','oi de novo'); pg.press('#salaIn','Enter'); pg.wait_for_timeout(100)
  ok('M13 limite de 3 s entre mensagens',not pg.evaluate("sala('rec').posts.some(p=>p.t==='oi de novo')"))
  # denunciar / bloquear / apagar
  pg.click('[data-rep="1"]'); pg.wait_for_timeout(100)
  ok('M14 denúncia registrada',pg.evaluate("sala('rec').posts[0].rep===1"))
  pg.click('[data-blk="Raiz-Calma"]'); pg.wait_for_timeout(100)
  ok('M15 bloquear some com as mensagens da pessoa',pg.evaluate("!document.querySelector('#comView').innerText.includes('Raiz-Calma')"))
  pg.click('[data-del]'); pg.wait_for_timeout(100)
  ok('M16 apagar a própria mensagem',pg.evaluate("!sala('rec').posts.some(p=>p.mine)"))
  ok('M17 sem mensagem privada entre pacientes',pg.evaluate("!/Enviar mensagem privada|DM/i.test(document.querySelector('#comView').innerText)"))
  # nutricionista (anfitriã)
  pg.evaluate("sala('ana').posts.push({id:900,by:'Folha-Verde',t:'oi',likes:0,hidden:false,rep:1})")
  pg.click('#v-nut'); pg.click('[data-n=com]'); pg.wait_for_timeout(300)
  t=pg.inner_text('#comNut')
  ok('N1 nutri vê a sala dela com denúncia','denunciada' in t)
  ok('N2 nutri vê apelidos, não nomes de paciente','Marina' not in t)
  ok('N3 nutri não vê as mensagens de outras salas','Raiz-Calma' not in t)
  pg.click('#comNut [data-hide="900"]'); pg.wait_for_timeout(100)
  ok('N4 anfitriã oculta mensagem',pg.evaluate("sala('ana').posts.find(p=>p.id===900).hidden"))
  # perfil nutri
  pg.click('[data-n=perfil]'); pg.wait_for_timeout(300)
  pg.fill('#pf-nut [name=bio]',P); pg.click('#pf-nut button[type=submit]'); pg.wait_for_timeout(200)
  ok('N5 bio da nutri escapada',pg.evaluate("window.__x===undefined && !document.querySelector('#perfilNut img[src=x]')"))
  pg.set_input_files('#pfFoto-nut','/tmp/foto.png'); pg.wait_for_timeout(500)
  ok('N6 foto da nutri no menu lateral',pg.evaluate("document.querySelector('.sideProfile img').src.startsWith('data:image/jpeg')"))
  # paciente vê a foto da nutri? (perfil dela é só local; checa CSP)
  ok('Z1 nenhuma violação de CSP',pg.evaluate("(window.__viol||[]).length===0"),str(pg.evaluate("window.__viol")))
  ok('Z2 sem erros de JS',not errs,str(errs))
  b.close()
f=[r for r in R if r[0]=='FAIL']
for r in R: print(*r)
print({'PASS':len(R)-len(f),'FAIL':len(f)})

sys.exit(1 if f else 0)
