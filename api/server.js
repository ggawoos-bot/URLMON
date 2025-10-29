const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();

// 미들웨어
app.use(cors());
app.use(express.json());

// Vercel 서버리스 함수를 위한 포트 설정
const PORT = process.env.PORT || 3000;

// sites.json 파일 경로
const sitesFilePath = '/tmp/sites.json';
const defaultSitesPath = path.join(__dirname, '..', 'sites.json');  // 루트 디렉토리의 sites.json

// 초기 sites.json 파일 생성 및 기본값 로드
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
                    },
                    {
                        id: 2,
                        name: "금연서비스 통합정보시스템",
                        url: "https://nosmk.khepi.or.kr",
                        enabled: true
                    },
                    {
                        id: 3,
                        name: "금연두드림 홈페이지",
                        url: "https://nosmk.khepi.or.kr/nsk/ntcc/index.do",
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

// 사이트 목록 조회
app.get('/api/sites', (req, res) => {
    try {
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
});

// 사이트 목록 저장
app.post('/api/sites', (req, res) => {
    try {
        const { sites } = req.body;
        
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
});

// 모든 요청을 처리
app.all('*', (req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Vercel 서버리스 함수용 export
module.exports = app;

// 로컬 개발용 서버 시작 (Vercel에서는 실행되지 않음)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
