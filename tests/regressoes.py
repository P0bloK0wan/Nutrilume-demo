import os
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_page(viewport={'width':390,'height':850})
    pg.goto(os.getenv('BASE_URL','http://127.0.0.1:8766/demo.html'))
    pg.click('#v-nut'); pg.click('[data-n=plano]')
    pg.fill('#fbQ','frango');pg.click('#foodBank [data-fb]');pg.fill('#fbG','150');pg.click('#fbAdd')
    pg.locator('#planEd .ed').last.locator('[data-f="0"]').fill('Alface')
    assert pg.evaluate('draft[edMeal].at(-1)[3]===undefined'), 'renomear deve invalidar macros'
    pg.click('[data-n=pac]');pg.locator('#lista button').nth(1).click();pg.click('[data-n=plano]')
    assert 'Carlos' in pg.inner_text('#edPub'), 'destinatário precisa acompanhar seleção'
    pg.locator('#planEd .ed').first.locator('[data-f="0"]').fill('Plano Carlos')
    pg.click('#edPub')
    pg.click('[data-n=pac]');pg.locator('#lista button').first.click();pg.click('[data-n=plano]')
    assert 'Plano Carlos' not in pg.inner_text('#planEd'), 'rascunhos devem ser separados'
    pg.click('#metaForm button');pg.click('#v-pac');pg.click('#metaBtn')
    before=pg.evaluate('meta.d')
    if not pg.is_disabled('#metaBtn'):pg.click('#metaBtn')
    assert pg.evaluate('meta.d')==before, 'dia não pode contar duas vezes'
    pg.click('#btnPerfil');pg.locator('#pf-pac [name=nome]').fill('Julia Teste');pg.locator('#pf-pac button[type=submit]').click()
    pg.click('nav.tabs [data-go=hoje]')
    assert 'Julia' in pg.inner_text('#paciente .hello h1'), 'saudação deve acompanhar perfil'
    assert pg.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'sem transbordamento móvel'
    b.close()
print('6 regressões PASS')
