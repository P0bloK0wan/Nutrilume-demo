import json,struct,zlib,os,re
from playwright.sync_api import sync_playwright
R=[]  # (status,name,detail)
def ok(n,c,d=''): R.append(('PASS' if c else 'FAIL',n,d))
viol=[];errs=[];reqs=[]
XSS=['<img src=x onerror="window.__x=(window.__x||0)+1">','"><svg onload="window.__x=(window.__x||0)+1">','<script>window.__x=1</script>','\'"><b id=injected>x</b>']
def png(path,n=1):
    def ch(t,d): return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    raw=b'\x00\xff\x00\x00'*1
    open(path,'wb').write(b'\x89PNG\r\n\x1a\n'+ch(b'IHDR',struct.pack('>IIBBBBB',1,1,8,6,0,0,0))+ch(b'IDAT',zlib.compress(b'\x00\xff\x00\x00\xff'))+ch(b'IEND',b''))
png('ok.png')
open('evil.html','w').write('<script>alert(1)</script>')
open('evil.svg','w').write('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>')
with open('big.png','wb') as f: f.write(open('ok.png','rb').read()+b'\0'*(9*1024*1024))
import traceback
try:
  with sync_playwright() as p:
      b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1200,'height':900},permissions=[])
      pg=ctx.new_page()
      pg.on('pageerror',lambda e:errs.append(str(e)))
      pg.on('console',lambda m: errs.append(m.text) if m.type=='error' and 'ERR_' not in m.text and 'fonts' not in m.text and 'Failed to load resource' not in m.text else None)
      pg.on('request',lambda r:reqs.append(r.url))
      pg.add_init_script("document.addEventListener('securitypolicyviolation',e=>{(window.__viol=window.__viol||[]).push(e.violatedDirective+' '+e.blockedURI)})")
      pg.goto('http://127.0.0.1:8765/index.html'); pg.wait_for_timeout(500)
      ok('A1 carrega sem erro de JS',not errs,str(errs))
      ok('A2 CSP presente',pg.evaluate("!!document.querySelector('meta[http-equiv=Content-Security-Policy]')"))
      ok('A3 nenhum script inline',pg.evaluate("[...document.scripts].every(s=>s.src)"))
      ok('A4 sem handlers inline (on*=)',pg.evaluate("![...document.querySelectorAll('*')].some(e=>[...e.attributes].some(a=>/^on/i.test(a.name)))"))

      # ---------- WhatsApp ----------
      pg.set_viewport_size({'width':400,'height':860})
      pg.click('#btnMsg'); pg.click('#waGo'); pg.wait_for_timeout(200)
      a=pg.locator('.overlay a')
      href=a.get_attribute('href'); rel=a.get_attribute('rel'); tgt=a.get_attribute('target')
      ok('B1 link do WhatsApp só wa.me',href.startswith('https://wa.me/5581900000000?text='),href)
      ok('B2 rel noopener noreferrer + _blank',rel=='noopener noreferrer' and tgt=='_blank',f'{rel} {tgt}')
      ok('B3 aviso de privacidade antes de abrir','não envie exames' in pg.inner_text('.overlay'))
      pg.keyboard.press('Escape'); ok('B4 Esc fecha o aviso',pg.locator('.overlay').count()==0)
      bad=pg.evaluate("""[ 'javascript:alert(1)','123','5511999999999999999','abc','','+55 (81) 99999-0000','(81) 3333-4444','81 9 9999-0000','5581999990000"><x>' ].map(v=>waLink(v,'oi'))""")
      ok('B5 números inválidos recusados',bad[0] is None and bad[1] is None and bad[2] is None and bad[3] is None and bad[4] is None,str(bad))
      ok('B6 números válidos aceitos e só dígitos',bad[5] and bad[5].startswith('https://wa.me/5581999990000') and bad[6] and bad[7],str(bad[5:8]))
      ok('B7 texto do link codificado',pg.evaluate("waLink('81999990000','a b&c=<x>')").endswith('a%20b%26c%3D%3Cx%3E'))
      ok('B8 injeção no número vira dígitos ou é recusada',bad[8] is None or re.fullmatch(r'https://wa\.me/\d+\?text=oi',bad[8]) is not None,str(bad[8]))
      pg.set_viewport_size({'width':1200,'height':900}); pg.click('#v-nut'); pg.click('.side button[data-n="msg"]')
      pg.fill('#waNum','abc'); pg.click('#waSave'); ok('B9 número inválido mostra erro','inválido' in pg.inner_text('.toast'))
      pg.fill('#waNum','(81) 98888-7777'); pg.click('#waSave'); ok('B10 número salvo normalizado',pg.evaluate("wa.num")=='5581988887777')
      pg.uncheck('#waOn'); pg.click('#v-pac'); pg.click('#btnMsg')
      ok('B11 botão some quando o nutricionista desativa',pg.locator('#waGo').count()==0)
      pg.click('#v-nut'); pg.click('.side button[data-n="msg"]'); pg.check('#waOn'); pg.click('#waMarina'); 
      ok('B12 nutri abre WhatsApp da paciente via wa.me',pg.locator('.overlay a').get_attribute('href').startswith('https://wa.me/5581911112222'))
      pg.keyboard.press('Escape')

      # ---------- Grupo / moderação ----------
      pg.click('#v-pac'); pg.click('#btnMsg'); pg.click('#msgMode .chip >> nth=1'); pg.wait_for_timeout(200)
      pg.click('#grpView .opt >> nth=0'); v1=pg.evaluate("grp.poll.opts[0].v")
      ok('C1 enquete conta 1 voto',v1==5)
      pg.evaluate("document.querySelectorAll('#grpView .opt').forEach(b=>b.disabled=false)"); pg.click('#grpView .opt >> nth=1')
      ok('C2 não permite votar duas vezes',pg.evaluate("grp.poll.opts[1].v")==2)
      def post(t):
          pg.evaluate("grp.lastPost=0"); pg.fill('#grpIn',t); pg.press('#grpIn','Enter'); pg.wait_for_timeout(120)
      n0=pg.evaluate("grp.posts.length")
      post('Perdi 12 kg esse mês'); ok('C3 bloqueia peso',pg.evaluate("grp.posts.length")==n0)
      post('olha https://loja.com/x'); ok('C4 bloqueia link',pg.evaluate("grp.posts.length")==n0)
      post('tomo 500 mg de vitamina'); ok('C5 bloqueia dose',pg.evaluate("grp.posts.length")==n0)
      post('hoje fiz jejum prolongado e tomei laxante'); ok('C6 alerta bloqueia e abre acolhimento','CVV' in pg.inner_text('.overlay') and pg.evaluate("grp.posts.length")==n0)
      ok('C7 alerta não guarda o texto',pg.evaluate("JSON.stringify(grp.alerts)")!=None and 'laxante' not in pg.evaluate("JSON.stringify(grp)"))
      pg.click('#okA'); post('Adorei a receita de hoje!'); ok('C8 mensagem normal publica',pg.evaluate("grp.posts.length")==n0+1)
      pg.fill('#grpIn','rápido demais'); pg.press('#grpIn','Enter'); ok('C9 limite de frequência (3 s)',pg.evaluate("grp.posts.length")==n0+1)
      pg.click('#grpView [data-rep] >> nth=0'); ok('C10 denúncia chega ao nutricionista',pg.evaluate("grp.posts.some(p=>p.rep>0)"))
      pg.click('#v-nut'); pg.click('.side button[data-n="grp"]'); ok('C11 nutri vê alerta de cuidado',pg.locator('.alertbox').count()==1)
      pg.click('#grpNut [data-hide] >> nth=1'); pg.click('#v-pac'); pg.click('#btnMsg'); pg.click('#msgMode .chip >> nth=1')
      ok('C12 post oculto some para o paciente',pg.evaluate("grp.posts[1].hidden")==True and 'Fiz o omelete' not in pg.inner_text('#grpView'))

      # ---------- compras / receitas / ficha / meta ----------
      pg.click('nav.tabs button[data-go="plano"]'); pg.click('#planMode .chip >> nth=1')
      ok('D1 lista de compras vem do plano','Arroz branco' in pg.inner_text('#shopView'))
      pg.fill('#shopIn','Limão'); pg.press('#shopIn','Enter'); ok('D2 item extra entra na lista','Limão' in pg.inner_text('#shopView'))
      pg.click('#planMode .chip >> nth=2'); pg.click('.rec .h >> nth=0'); ok('D3 receita expande',pg.get_attribute('.rec .h','aria-expanded')=='true')
      pg.click('nav.tabs button[data-go="hoje"]'); pg.click('#fichaBtn'); pg.fill('#fAl','nenhuma'); pg.fill('#fObj','mais energia'); pg.fill('#fFora','99'); pg.click('#fForm button.primary'); blocked=pg.locator('#fForm').count()==1; ok('D4a validação do navegador barra 99 refeições',blocked); pg.evaluate("document.querySelector('#fFora').removeAttribute('max')"); pg.click('#fForm button.primary')
      ok('D4 ficha salva com limite numérico',pg.evaluate("pacientes[0].ficha.fora")==21)
      pg.click('#v-nut'); pg.click('.side button[data-n="pac"]'); pg.click('#lista button >> nth=0')
      ok('D5 nutri vê a ficha','mais energia' in pg.inner_text('#fichaNut'))
      pg.click('.side button[data-n="plano"]'); pg.fill('#metaIn','Perder 5 kg'); pg.click('#metaForm button'); ok('D6 meta de peso é recusada',pg.evaluate("meta.t")!='Perder 5 kg')
      pg.fill('#metaIn','Beber água nas refeições'); pg.click('#metaForm button'); pg.click('#v-pac'); ok('D7 meta nova aparece para o paciente','Beber água' in pg.inner_text('#metaTxt'))
      pg.click('#metaBtn'); ok('D8 marcar hoje avança a meta',pg.inner_text('#metaNote').startswith('1 de'))
      pg.click('#lemBtn'); pg.wait_for_timeout(200); ok('D9 lembretes sem permissão não quebram',not errs,str(errs))

      # ---------- XSS em todos os campos ----------
      pg.set_viewport_size({'width':1200,'height':900})
      for pay in XSS:
          pg.click('#v-pac')
          pg.click('nav.tabs button[data-go="diario"]'); pg.fill('#diaTxt',pay); pg.click('#diaSave')
          pg.click('#btnMsg'); pg.click('#msgMode .chip >> nth=0'); pg.fill('#inPac',pay); pg.press('#inPac','Enter')
          pg.click('#msgMode .chip >> nth=1'); pg.evaluate("grp.lastPost=0"); pg.fill('#grpIn',pay); pg.press('#grpIn','Enter')
          pg.click('nav.tabs button[data-go="plano"]'); pg.click('#planMode .chip >> nth=1'); pg.fill('#shopIn',pay); pg.press('#shopIn','Enter')
          pg.click('nav.tabs button[data-go="hoje"]'); pg.click('#fichaBtn'); 
          for i in ['#fAl','#fMed','#fObj','#fObs']: pg.fill(i,pay)
          pg.click('#fForm button.primary')
          pg.click('#v-nut'); pg.click('.side button[data-n="pac"]')
          pg.fill('#invN',pay); pg.fill('#invC',pay); pg.click('#invForm button'); pg.fill('#busca',pay); pg.fill('#busca','')
          pg.click('#lista button >> nth=0')
          pg.click('.side button[data-n="plano"]')
          pg.fill('.ed input[data-f="0"] >> nth=0',pay); pg.fill('.ed input[data-f="1"] >> nth=0',pay); pg.fill('.ed input[data-f="s"] >> nth=0',pay+' ('+pay+')')
          pg.fill('#metaIn',pay); pg.click('#metaForm button'); pg.click('#edPub')
          pg.click('.side button[data-n="msg"]'); pg.fill('#inNut',pay); pg.press('#inNut','Enter'); pg.fill('#waNum',pay); pg.click('#waSave')
          pg.click('.side button[data-n="grp"]'); pg.fill('#avIn',pay); pg.press('#avIn','Enter')
          pg.click('#v-pac'); pg.click('nav.tabs button[data-go="plano"]'); pg.click('#planMode .chip >> nth=0'); pg.click('#planChips .chip >> nth=0')
          pg.click('nav.tabs button[data-go="plano"]'); pg.click('#planMode .chip >> nth=0')
          pg.click('nav.tabs button[data-go="hoje"]'); pg.click('#btnMsg')
          pg.click('#msgMode .chip >> nth=1'); pg.click('#msgMode .chip >> nth=0')
          pg.wait_for_timeout(100)
      ok('E1 nenhum script executou (window.__x)',pg.evaluate("window.__x")==None,str(pg.evaluate("window.__x")))
      ok('E2 nenhum elemento injetado (#injected / img src=x)',pg.evaluate("!document.querySelector('#injected, img[src=x], svg[onload]')"))
      ok('E3 nenhuma violação de CSP',not pg.evaluate("window.__viol||[]"),str(pg.evaluate("window.__viol||[]")))
      ok('E4 payload aparece como texto (escapado)', '<img src=x' in pg.evaluate("document.body.innerText"))

      # ---------- upload ----------
      pg.click('#v-pac'); pg.click('nav.tabs button[data-go="evolucao"]')
      inp=pg.locator('#fotoPac input[data-w=before]')
      for f,exp in [('evil.html',False),('evil.svg',False),('big.png',False),('ok.png',True)]:
          inp.set_input_files(f); pg.wait_for_timeout(150)
          has=pg.evaluate("!!document.querySelector('#fotoPac .before').style.backgroundImage")
          ok(f'F upload {f} {"aceito" if exp else "recusado"}',has==exp)
          if exp is False and has: break
      # ---------- armazenamento e rede ----------
      ok('G1 nada em localStorage/sessionStorage/cookies',pg.evaluate("localStorage.length+sessionStorage.length+document.cookie.length")==0)
      hosts=sorted({re.sub(r'^https?://([^/]+).*',r'\1',u) for u in reqs if u.startswith('http')})
      ok('G2 só fala com o próprio site e Google Fonts',all(h in ('127.0.0.1:8765','fonts.googleapis.com','fonts.gstatic.com') for h in hosts),str(hosts))
      ok('G3 todo link com target=_blank tem noopener',pg.evaluate("[...document.querySelectorAll('a[target=_blank]')].every(a=>/noopener/.test(a.rel))"))
      ok('G4 nenhum href javascript:',pg.evaluate("![...document.querySelectorAll('a[href]')].some(a=>/^javascript:/i.test(a.getAttribute('href')))"))
      # ---------- termo de consentimento ----------
      pg.click('#v-nut'); pg.click('.side button[data-n="pac"]'); pg.fill('#invN','Teste Termo'); pg.fill('#invC','x'); pg.click('#invForm button'); pg.click('#invSim')
      ok('H1 aceitar começa desabilitado',pg.evaluate("document.querySelector('#cOk').disabled")==True)
      pg.check('#c1'); pg.uncheck('#c1'); ok('H2 desmarcar volta a bloquear',pg.evaluate("document.querySelector('#cOk').disabled")==True)
      b.close()
except Exception as e:
  R.append(('FAIL','EXCEÇÃO no teste',traceback.format_exc()[-600:]))
res={'PASS':0,'FAIL':0}
for s,n,d in R:
    res[s]+=1; print(s,n,('| '+d) if (s=='FAIL' and d) else '')
print(res); print('ERRS',errs[:5]); print('REQ HOSTS',sorted({re.sub(r'^https?://([^/]+).*',r'\1',u) for u in reqs if u.startswith('http')}))
