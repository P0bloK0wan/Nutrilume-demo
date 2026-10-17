"""Check the actual Pages artifact under a repository subpath, without an API."""
import functools,http.server,json,os,threading
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
root=Path(__file__).resolve().parents[1];out=root/'.test-results';out.mkdir(exist_ok=True)
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH','/workspace/.playwright' if Path('/workspace/.playwright').exists() else str(Path.home()/'.cache/ms-playwright'))
class Handler(http.server.SimpleHTTPRequestHandler):
 def translate_path(self,path):
  if path.startswith('/Nutrilume-demo/'):
   self.path=path[len('/Nutrilume-demo'):]
   result=super().translate_path(self.path)
   return result
  return super().translate_path(path)
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root/'public-site')))
threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}/Nutrilume-demo/'
checks=[];errors=[]
with sync_playwright() as p:
 b=p.chromium.launch();page=b.new_page(viewport={'width':390,'height':844},reduced_motion='reduce')
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base);expect(page.locator('h1')).to_contain_text('Pequenos hábitos');expect(page.locator('.public-note')).to_contain_text('dados fictícios');assert page.locator('input[type=password]').count()==0;checks.append('landing clara sem formulário real de login')
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path=str(out/'pages-mobile.png'),full_page=True);checks.append('landing390px sem overflow')
 page.get_by_role('link',name='Experimentar demonstração').click();page.locator('#v-nut').click();expect(page.locator('[data-n=plano]')).to_be_visible();checks.append('demonstração abre sob subdiretório do GitHub')
 page.goto(base+'studio/gallery.html');expect(page.get_by_role('heading',name='Uma ideia. Quatro linguagens.')).to_be_visible();page.get_by_role('link',name='Abrir demonstração',exact=True).click();expect(page.locator('h1')).to_contain_text('A forma');checks.append('estúdio e landing AURA sob subdiretório')
 page.goto(base+'studio/apps/web/dist/product.html?noWebGL=1');expect(page.locator('.scene-host')).to_have_attribute('data-render','fallback');checks.append('produto3D mantém fallback')
 for file in ['data/mailbox.ndjson','data/nutrilume.sqlite','server/app.mjs','.env']:
  assert page.request.get(base+file).status==404
 checks.append('runtime privado ausente da publicação')
 assert not errors,errors;b.close()
server.shutdown();(out/'pages.json').write_text(json.dumps({'passed':True,'checks':checks,'errors':errors},ensure_ascii=False,indent=2)+'\n');print(json.dumps({'passed':True,'checks':checks},ensure_ascii=False))
