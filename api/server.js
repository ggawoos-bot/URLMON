const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();

// 미들웨어
app.use(cors());
app.use(express.json());

// sites.json 파일 경로
const sitesFilePath = '/tmp/sites.json';

// 초기 sites.json 파일 생성
if (!fs.existsSync(sitesFilePath)) {
    const initialData = {
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
    try {
        fs.writeFileSync(sitesFilePath, JSON.stringify(initialData, null, 2), 'utf8');
        console.log('Initial sites.json created');
    } catch (error) {
        console.error('Failed to create initial sites.json:', error);
    }
}

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

module.exports = app;
