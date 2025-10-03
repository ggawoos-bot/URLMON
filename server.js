const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// sites.json 파일 경로
const sitesFilePath = path.join(__dirname, 'sites.json');

// 사이트 목록 조회
app.get('/api/sites', (req, res) => {
    try {
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
        
        // 유효성 검사
        if (!Array.isArray(sites)) {
            return res.status(400).json({ error: '잘못된 데이터 형식입니다.' });
        }

        // sites.json 파일에 저장
        const data = { sites };
        fs.writeFileSync(sitesFilePath, JSON.stringify(data, null, 2), 'utf8');
        
        res.json({ message: '사이트 목록이 저장되었습니다.', sites });
    } catch (error) {
        console.error('사이트 목록 저장 오류:', error);
        res.status(500).json({ error: '사이트 목록을 저장할 수 없습니다.' });
    }
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
    console.log(`API 엔드포인트:`);
    console.log(`  GET  /api/sites - 사이트 목록 조회`);
    console.log(`  POST /api/sites - 사이트 목록 저장`);
});
