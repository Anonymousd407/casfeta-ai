import asyncio
import os
import tempfile
from pathlib import Path
os.environ['CASFETA_DB_PATH'] = str(Path(tempfile.gettempdir())/'casfeta_test.db')
import httpx
from app.main import app

SAMPLE = 'The vendor may terminate this agreement at its sole discretion. This agreement shall automatically renew each year. All fees are non-refundable.'

async def workflow():
    async with app.router.lifespan_context(app):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url='http://testserver') as client:
            assert (await client.get('/api/health')).status_code == 200
            result=(await client.post('/api/analyze/text',json={'title':'Demo contract','text':SAMPLE})).json()
            assert result['score'] > 0
            assert len(result['findings']) >= 2
            rid=result['id']
            assert (await client.get('/api/reports/'+rid)).status_code==200
            assert (await client.get('/api/reports/'+rid+'/pdf')).content.startswith(b'%PDF')
            assert any(r['id']==rid for r in (await client.get('/api/history')).json())
            assert (await client.delete('/api/reports/'+rid)).status_code==200
            assert (await client.get('/api/reports/'+rid)).status_code==404

def test_workflow():
    asyncio.run(workflow())

async def validation():
    async with app.router.lifespan_context(app):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url='http://testserver') as client:
            assert (await client.post('/api/analyze/text',json={'text':'short'})).status_code==422
            assert (await client.post('/api/analyze/file',files={'file':('oops.exe',b'bad')})).status_code==415

def test_validation():
    asyncio.run(validation())
