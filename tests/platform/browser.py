"""Fluxo real de navegador com e-mail local de desenvolvimento; nunca envia e-mails reais."""
import json,os,time
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
BASE=os.getenv('PLATFORM_URL','http://localhost:3000')
MAIL=Path(os.getenv('MAILBOX_PATH','data/mailbox.ndjson'))
uid=str(time.time_ns());nut_email='nut'+uid+'@example.com';pac_email='pac'+uid+'@example.com'
RESULTS=Path(os.getenv('RESULTS_DIR','.test-results'));RESULTS.mkdir(parents=True,exist_ok=True)
errors=[];checks=[]
def passed(name):checks.append(name);print('PASS',name,flush=True)
def inbox(email):
 for _ in range(50):
  if MAIL.exists():
   entries=[json.loads(x) for x in MAIL.read_text().splitlines() if x.strip()]
   messages=[x for x in entries if x['to']==email]
   if messages:return messages[-1]['url']
  time.sleep(.1)
 raise AssertionError('E-mail de teste não encontrado')
def submit(pg,name):pg.locator(f'[data-form="{name}"] [type=submit]').click()
def fill(pg,name,key,value):pg.locator(f'[data-form="{name}"] [name="{key}"]').fill(value)
def page(pg,name):
 pg.locator(f'.sidebar [data-go="{name}"]').click();expect(pg.locator(f'.sidebar [data-go="{name}"]')).to_have_attribute('aria-current','page');pg.locator('#panel .loading').wait_for(state='detached')
with sync_playwright() as p:
 b=p.chromium.launch();nc=b.new_context(viewport={'width':1360,'height':1000});pc=b.new_context(viewport={'width':390,'height':850});np=nc.new_page();pp=pc.new_page()
 for pg in [np,pp]:pg.on('pageerror',lambda e:errors.append(str(e)))
 config=np.request.get(BASE+'/api/config').json();assert config['mode']=='development' and config['emailDelivery']=='local','Use servidor de testes com caixa local, sem envio real.'
 np.goto(BASE+'/#register-nut');fill(np,'register','name','Ana Teste');fill(np,'register','email',nut_email);fill(np,'register','password','SenhaProfissional123!');fill(np,'register','crn','CRN-6 exemplo');submit(np,'register');expect(np.locator('.success')).to_contain_text('Confira');passed('cadastro profissional')
 np.goto(inbox(nut_email));expect(np.locator('[data-form=login]')).to_be_visible();fill(np,'login','email',nut_email);fill(np,'login','password','SenhaProfissional123!');submit(np,'login');expect(np.locator('.sidebar')).to_be_visible();passed('confirmação e login')
 page(np,'profile');fill(np,'profile','city','Recife');fill(np,'profile','address','Rua de teste 10');fill(np,'profile','lat','-8.05');fill(np,'profile','lng','-34.9');np.locator('[name=listed]').check();submit(np,'profile');expect(np.locator('.toast').last).to_contain_text('atualizado');passed('perfil opta por diretório')
 page(np,'patients');fill(np,'patient','name','Paciente Teste');fill(np,'patient','email',pac_email);fill(np,'patient','password','TemporariaPaciente123!');submit(np,'patient');expect(np.locator('#panel')).to_contain_text(pac_email);passed('nutricionista prepara paciente')
 pp.goto(inbox(pac_email));expect(pp.locator('h1')).to_contain_text('Uma senha');fill(pp,'password','currentPassword','TemporariaPaciente123!');fill(pp,'password','password','SenhaPacienteNova123!');submit(pp,'password');expect(pp.locator('.sidebar')).to_be_visible();passed('paciente troca senha temporária')
 page(pp,'consents');pp.locator('[name=health]').check();pp.locator('[name=body3d]').check();pp.locator('[name=photos]').check();pp.locator('[name=group]').check();submit(pp,'consents');expect(pp.locator('.toast').last).to_contain_text('atualizadas');passed('consentimento pelo paciente')
 page(np,'plan');np.locator('#foodSearch').fill('frango');np.locator('[data-food]').first.click();fill(np,'add-food','grams','150');submit(np,'add-food');expect(np.locator('#planTotals')).to_contain_text('239');fill(np,'publish','note','Plano <img src=x onerror=alert(1)> seguro');submit(np,'publish');expect(np.locator('.toast').last).to_contain_text('publicada');passed('cálculo e publicação do plano')
 page(pp,'plan');expect(pp.locator('#panel')).to_contain_text('150 g');assert pp.locator('img[src=x]').count()==0;passed('paciente vê publicação sem XSS')
 page(np,'assessments');fill(np,'assessment','weight','75');fill(np,'assessment','waist','85');fill(np,'assessment','hip','104');submit(np,'assessment');expect(np.locator('#bodyCanvas')).to_be_visible();np.locator('#bodyRotate').fill('75');np.wait_for_timeout(300);np.screenshot(path=str(RESULTS/'plataforma-3d.png'),full_page=True);passed('avaliação alimenta corpo tridimensional')
 page(pp,'assessments');expect(pp.locator('#bodyCanvas')).to_be_visible();assert pp.evaluate('document.documentElement.scrollWidth<=innerWidth');passed('3D privado no celular sem transbordamento')
 page(pp,'messages');fill(pp,'message','text','Mensagem privada de teste');submit(pp,'message');expect(pp.locator('.thread')).to_contain_text('Mensagem privada');page(np,'messages');expect(np.locator('.thread')).to_contain_text('Mensagem privada');passed('mensagem entre contas distintas')
 page(np,'agenda');fill(np,'appointment','start','2030-11-15T10:00');submit(np,'appointment');expect(np.locator('#panel')).to_contain_text('Agendada');page(pp,'agenda');expect(pp.locator('#panel')).to_contain_text('Agendada');passed('consulta compartilhada')
 page(np,'finance');fill(np,'finance','description','Consulta');fill(np,'finance','amount','250');submit(np,'finance');expect(np.locator('#panel')).to_contain_text('250,00');passed('lançamento financeiro')
 page(np,'assessments');expect(np.locator('#bodyCanvas')).to_be_visible();page(pp,'consents');pp.locator('[name=body3d]').uncheck();submit(pp,'consents');expect(pp.locator('.toast').last).to_contain_text('atualizadas');expect(np.locator('#bodyCanvas')).to_have_count(0,timeout=8000);passed('revogação remove visualizador do profissional em outra sessão')
 # Regressões de troca de paciente durante operações assíncronas.
 other_email='outro'+uid+'@example.com'
 r=np.request.post(BASE+'/api/patients',data={'name':'Outro paciente','email':other_email,'password':'TemporariaOutro123!'},headers={'Origin':BASE});assert r.status==201;other_id=r.json()['id']
 oc=b.new_context();op=oc.new_page();op.goto(inbox(other_email));expect(op.locator('[data-form=password]')).to_be_visible();fill(op,'password','currentPassword','TemporariaOutro123!');fill(op,'password','password','OutraSenhaPaciente123!');submit(op,'password');expect(op.locator('.sidebar')).to_be_visible();page(op,'consents')
 for key in ['health','photos','body3d']:op.locator('[name='+key+']').check()
 submit(op,'consents');expect(op.locator('.toast').last).to_contain_text('atualizadas')
 page(np,'assessments');own_id=np.locator('#patientPicker').input_value()
 uploads=[];np.on('request',lambda r:uploads.append(r.url) if r.method=='POST' and r.url.endswith('/files') else None)
 np.evaluate("()=>{const original=createImageBitmap;window.createImageBitmap=(...args)=>new Promise(resolve=>setTimeout(()=>resolve(original(...args)),700))}")
 import struct,zlib
 def chunk(t,d):return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
 png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',1,1,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(b'\x00\xff\x00\x00\xff'))+chunk(b'IEND',b'')
 np.locator('[data-form=photo] input[type=file]').set_input_files({'name':'contexto.png','mimeType':'image/png','buffer':png});submit(np,'photo');np.locator('#patientPicker').select_option(other_id);np.wait_for_timeout(1500)
 for _ in range(20):
  if uploads:break
  np.wait_for_timeout(250)
 if not uploads:print('UPLOAD DIAGNÓSTICO',np.locator('.toast').all_text_contents(),errors,flush=True)
 assert uploads and '/patients/'+own_id+'/files' in uploads[-1],uploads;passed('upload mantém paciente original durante troca de seleção')
 page(np,'plan');np.locator('#patientPicker').select_option(other_id);np.locator('[data-go=manual-food]').click();np.locator('[data-edit=name]').last.fill('Rascunho B')
 np.locator('#patientPicker').select_option(own_id);expect(np.locator('[data-form=publish]')).to_be_visible();held=[]
 def intercept(route):
  if route.request.method=='PUT':held.append(route)
  else:route.continue_()
 np.route('**/api/patients/'+own_id+'/plan',intercept);submit(np,'publish');np.locator('#patientPicker').select_option(other_id);expect(np.locator('[data-edit=name]').last).to_have_value('Rascunho B');assert held;held[0].continue_();np.wait_for_timeout(500);expect(np.locator('[data-edit=name]').last).to_have_value('Rascunho B');np.unroute('**/api/patients/'+own_id+'/plan',intercept);passed('publicação não apaga rascunho do outro paciente')
 oc.close()
 pp.locator('#topNav [data-go=logout]').click();expect(pp.locator('.hero-copy')).to_be_visible();pp.locator('#topNav [data-go=directory]').click();fill(pp,'directory','city','Recife');submit(pp,'directory');expect(pp.locator('#directoryResults')).to_contain_text('Ana Teste');passed('busca real no diretório por cidade')
 pp.evaluate("()=>{navigator.geolocation.getCurrentPosition=(_,error)=>error({code:1})}");pp.locator('[data-go=locate]').click();expect(pp.locator('.toast').last).to_contain_text('cidade');passed('localização negada mantém busca manual')
 pp.emulate_media(reduced_motion='reduce');assert pp.locator('.card').first.evaluate("e=>getComputedStyle(e).animationName")=='none';passed('redução de movimento')
 assert not errors,errors;passed('nenhum erro JavaScript')
 b.close()
print(f'{len(checks)} verificações de fluxo PASS')
