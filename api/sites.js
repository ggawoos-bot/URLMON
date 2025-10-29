const fs = require('fs');
const path = require('path');

// sites.json 파일 경로
const sitesFilePath = '/tmp/sites.json';
const defaultSitesPath = path.join(__dirname, '..', 'sites.json');  // 루트 디렉토리의 sites.json

// 초기 sites.json 파일 생성 및 기본값 로드
function ensureSitesFile() {
    if (!fs.existsSync(sitesFilePath)) {
        try {
            let initialData;
            
            // 루트 디렉토리의 sites.json이 있으면 그것을 사용
            if (fs.existsSync(defaultSitesPath)) {
                console.log('Loading sites from root sites.json');
                const data = fs.readFileSync(defaultSitesPath, 'utf8');
                initialData = JSON.parse(data);
                console.log(`Loaded ${initialData.sites.length} sites from default configuration`);
            } else {
                // 없으면 기본값 사용
                console.log('Default sites.json not found, using fallback data');
                initialData = {
                    sites: [
                        {
                            id: 1,
                            name: "Google",
                            url: "https://www.google.com",
                            enabled: true
                        }
                    ]
                };
            }
            
            fs.writeFileSync(sitesFilePath, JSON.stringify(initialData, null, 2), 'utf8');
            console.log('Initial sites.json created from default sites');
        } catch (error) {
            console.error('Failed to create initial sites.json:', error);
        }
    }
}

// GET /api/sites
module.exports = async (req, res) => {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // GET 요청 처리
    if (req.method === 'GET') {
        try {
            ensureSitesFile();
            
            // /tmp/sites.json이 없으면 루트 sites.json에서 다시 로드
            if (!fs.existsSync(sitesFilePath)) {
                if (fs.existsSync(defaultSitesPath)) {
                    console.log('Reloading sites from root sites.json');
                    const data = fs.readFileSync(defaultSitesPath, 'utf8');
                    const initialData = JSON.parse(data);
                    fs.writeFileSync(sitesFilePath, JSON.stringify(initialData, null, 2), 'utf8');
                    console.log(`Reloaded ${initialData.sites.length} sites from default configuration`);
                }
            }
            
            if (fs.existsSync(sitesFilePath)) {
                const data = fs.readFileSync(sitesFilePath, 'utf8');
                const sites = JSON.parse(data);
                res.json(sites);
            } else {
                res.json({ sites: [] });
            }
        } catch (error) {
            console.error('사이트 목록 읽기 오류:', error);
            res.status(500).json({ error: '사이트 목록을 읽을 수 없습니다.' });
        }
        return;
    }

    // POST 요청 처리
    if (req.method === 'POST') {
        try {
            // Vercel에서 body가 버퍼일 수 있으므로 파싱
            let body = req.body;
            if (typeof body === 'string') {
                body = JSON.parse(body);
            } else if (Buffer.isBuffer(body)) {
                body = JSON.parse(body.toString());
            }
            
            const { sites } = body;
            
            if (!Array.isArray(sites)) {
                return res.status(400).json({ error: '잘못된 데이터 형식입니다.' });
            }

            const data = { sites };
            fs.writeFileSync(sitesFilePath, JSON.stringify(data, null, 2), 'utf8');
            
            res.json({ message: '사이트 목록이 저장되었습니다.', sites });
        } catch (error) {
            console.error('사이트 목록 저장 오류:', error);
            res.status(500).json({ error: '사이트 목록을 저장할 수 없습니다.' });
        }
        return;
    }

    // 다른 메서드
    res.status(405).json({ error: 'Method not allowed' });
};

