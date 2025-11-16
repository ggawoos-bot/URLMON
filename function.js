class WebsiteMonitor {
    constructor() {
        this.sites = [];
        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.history = [];
        this.nextId = 1;
        this.initializeElements();
        this.bindEvents();
        this.loadSites();
    }

    initializeElements() {
        this.sitesList = document.getElementById('sitesList');
        this.statusGrid = document.getElementById('statusGrid');
        this.historyList = document.getElementById('historyList');
        this.intervalSelect = document.getElementById('intervalSelect');
        this.startAllMonitoringBtn = document.getElementById('startAllMonitoring');
        this.stopAllMonitoringBtn = document.getElementById('stopAllMonitoring');
        this.addSiteBtn = document.getElementById('addSiteBtn');
        this.modal = document.getElementById('addSiteModal');
        this.siteNameInput = document.getElementById('siteName');
        this.siteUrlInput = document.getElementById('siteUrl');
        this.saveSiteBtn = document.getElementById('saveSiteBtn');
        this.cancelSiteBtn = document.getElementById('cancelSiteBtn');
        this.closeBtn = document.querySelector('.close');
    }

    bindEvents() {
        this.startAllMonitoringBtn.addEventListener('click', () => this.startAllMonitoring()); 
        this.stopAllMonitoringBtn.addEventListener('click', () => this.stopAllMonitoring());   
        this.addSiteBtn.addEventListener('click', () => this.openAddSiteModal());
        this.saveSiteBtn.addEventListener('click', () => this.saveSite());
        this.cancelSiteBtn.addEventListener('click', () => this.closeAddSiteModal());
        this.closeBtn.addEventListener('click', () => this.closeAddSiteModal());

        // 모달 외부 클릭 시 닫기
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeAddSiteModal();
            }
        });
    }

    async loadSites() {
        try {
            const response = await fetch('/sites');
            const data = await response.json();
            this.sites = data.sites || [];
            this.nextId = this.sites.length > 0 ? Math.max(...this.sites.map(site => site.id)) + 1 : 1;
            this.renderSites();
            this.renderStatusGrid();
        } catch (error) {
            console.error('사이트 목록 로드 실패:', error);
            // 서버 연결 실패 시 로컬 스토리지에서 로드
            await this.loadSitesFromLocalStorage();
        }
    }

    async loadSitesFromLocalStorage() {
        try {
            const savedSites = localStorage.getItem('websiteMonitorSites');
            if (savedSites) {
                this.sites = JSON.parse(savedSites);
                this.nextId = this.sites.length > 0 ? Math.max(...this.sites.map(site => site.id)) + 1 : 1;
                this.renderSites();
                this.renderStatusGrid();
            } else {
                // 기본 사이트 목록
                this.sites = [
                    { id: 1, name: "Google", url: "https://www.google.com", enabled: true },
                    { id: 2, name: "금연 성공 지원 센터", url: "https://nosmk.khepi.or.kr", enabled: true },
                    { id: 3, name: "금연 길라잡이 서비스", url: "https://nosmk.khepi.or.kr/nsk/ntcc/index.do", enabled: true }
                ];
                this.nextId = 4;
                this.renderSites();
                this.renderStatusGrid();
            }
        } catch (error) {
            console.error('로컬 스토리지에서 사이트 로드 실패:', error);
        }
    }

    renderSites() {
        if (this.sites.length === 0) {
            this.sitesList.innerHTML = '<p class="no-sites">등록된 사이트가 없습니다.</p>';
            return;
        }

        this.sitesList.innerHTML = this.sites.map(site => `
            <div class="site-item ${site.enabled ? 'enabled' : 'disabled'}">
                <div class="site-info">
                    <h3>${site.name}</h3>
                    <p>${site.url}</p>
                </div>
                <div class="site-actions">
                    <button class="btn-toggle" onclick="monitor.toggleSite(${site.id})">
                        ${site.enabled ? '비활성화' : '활성화'}
                    </button>
                    <button class="btn-check" onclick="monitor.checkSingleSite(${site.id})">
                        확인
                    </button>
                    <button class="btn-delete" onclick="monitor.deleteSite(${site.id})">
                        삭제
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderStatusGrid() {
        if (this.sites.length === 0) {
            this.statusGrid.innerHTML = '<p class="no-sites">등록된 사이트가 없습니다.</p>';
            return;
        }

        this.statusGrid.innerHTML = this.sites.map(site => `
            <div id="status-${site.id}" class="status-card ${site.enabled ? 'enabled' : 'disabled'}">
                <div class="status-header">
                    <h4>${site.name}</h4>
                    <span class="status-indicator ${site.enabled ? 'enabled' : 'disabled'}"></span>
                </div>
                <p>${site.enabled ? '활성화됨' : '비활성화됨'}</p>
                <p>마지막 확인: 확인되지 않음</p>
            </div>
        `).join('');
    }

    openAddSiteModal() {
        this.modal.style.display = 'block';
        this.siteNameInput.value = '';
        this.siteUrlInput.value = '';
        this.siteNameInput.focus();
    }

    closeAddSiteModal() {
        this.modal.style.display = 'none';
    }

    async saveSite() {
        const name = this.siteNameInput.value.trim();
        const url = this.siteUrlInput.value.trim();

        if (!name || !url) {
            alert('사이트 이름과 URL을 모두 입력해주세요.');
            return;
        }

        if (!this.isValidUrl(url)) {
            alert('올바른 URL을 입력해주세요 (http:// 또는 https://로 시작).');
            return;
        }

        const newSite = {
            id: this.nextId++,
            name,
            url,
            enabled: true
        };

        this.sites.push(newSite);
        await this.saveSites();
        this.renderSites();
        this.renderStatusGrid();
        this.closeAddSiteModal();
        this.showMessage('사이트가 추가되었습니다.', 'success');
    }

    async deleteSite(id) {
        if (!confirm('정말로 이 사이트를 삭제하시겠습니까?')) {
            return;
        }

        this.sites = this.sites.filter(site => site.id !== id);
        await this.saveSites();
        this.renderSites();
        this.renderStatusGrid();
        this.showMessage('사이트가 삭제되었습니다.', 'success');
    }

    async toggleSite(id) {
        const site = this.sites.find(s => s.id === id);
        if (site) {
            site.enabled = !site.enabled;
            await this.saveSites();
            this.renderSites();
            this.renderStatusGrid();
            this.showMessage(`사이트가 ${site.enabled ? '활성화' : '비활성화'}되었습니다.`, 'success');
        }
    }

    async checkSingleSite(id) {
        const site = this.sites.find(s => s.id === id);
        if (!site || !site.enabled) return;

        this.updateSiteStatus(site.id, 'checking', '확인 중...', '');

        const startTime = Date.now();

        try {
            const response = await this.simpleFetch(site.url, 5000);
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            // no-cors 모드에서는 status가 0으로 반환될 수 있음
            // 실제로는 성공한 것으로 간주하고 온라인 상태로 표시
            if (response.status === 0 || response.status >= 200) {
                this.updateSiteStatus(site.id, 'online', '온라인 상태', responseTime);
                this.addToHistory(site.name, site.url, 'online', 'OK', responseTime);
            } else {
                this.updateSiteStatus(site.id, 'error', `서버 오류: ${response.status}`, responseTime);
                this.addToHistory(site.name, site.url, 'error', response.status, responseTime);
            }
        } catch (error) {
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            let status = 'offline';
            let message = '오프라인 상태';

            if (error.name === 'TimeoutError') {
                message = '응답 시간 초과';
            } else if (error.name === 'TypeError' && error.message.includes('CORS')) {
                status = 'error';
                message = 'CORS 오류';
            } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                message = '네트워크 오류';
            }

            this.updateSiteStatus(site.id, status, message, responseTime);
            this.addToHistory(site.name, site.url, status, error.message, responseTime);       
        }
    }

    updateSiteStatus(id, status, message, responseTime) {
        const statusCard = document.getElementById(`status-${id}`);
        if (!statusCard) return;

        const indicator = statusCard.querySelector('.status-indicator');
        const statusText = statusCard.querySelector('p');
        const lastCheck = statusCard.querySelectorAll('p')[2];

        statusCard.className = `status-card ${status}`;
        indicator.className = `status-indicator ${status}`;
        statusText.innerHTML = `<span class="status-indicator ${status}"></span>${message}`;   

        if (responseTime) {
            lastCheck.textContent = `마지막 확인: ${new Date().toLocaleString('ko-KR')} (${responseTime}ms)`;
        } else {
            lastCheck.textContent = `마지막 확인: ${new Date().toLocaleString('ko-KR')}`;    
        }
    }

    async startAllMonitoring() {
        const enabledSites = this.sites.filter(site => site.enabled);

        if (enabledSites.length === 0) {
            alert('활성화된 사이트가 없습니다.');
            return;
        }

        this.isMonitoring = true;
        this.startAllMonitoringBtn.disabled = true;
        this.stopAllMonitoringBtn.disabled = false;

        const interval = parseInt(this.intervalSelect.value);

        // 즉시 모든 사이트 확인
        enabledSites.forEach(site => this.checkSingleSite(site.id));

        // 주기적으로 확인
        this.monitoringInterval = setInterval(() => {
            enabledSites.forEach(site => this.checkSingleSite(site.id));
        }, interval);
    }

    stopAllMonitoring() {
        this.isMonitoring = false;
        this.startAllMonitoringBtn.disabled = false;
        this.stopAllMonitoringBtn.disabled = true;

        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }

    async simpleFetch(url, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                method: 'GET',
                mode: 'no-cors',
                signal: controller.signal,
                cache: 'no-cache'
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                const timeoutError = new Error('Request timeout');
                timeoutError.name = 'TimeoutError';
                throw timeoutError;
            }
            throw error;
        }
    }

    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    async saveSites() {
        try {
            const response = await fetch('/sites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sites: this.sites })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('사이트 목록이 서버에 저장되었습니다:', data);
            } else {
                throw new Error('서버 저장 실패');
            }
        } catch (error) {
            console.error('서버 저장 실패, 로컬 스토리지에 저장:', error);
            localStorage.setItem('websiteMonitorSites', JSON.stringify(this.sites));
        }
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            border-radius: 5px;
            color: white;
            z-index: 1000;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        `;
        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    addToHistory(siteName, url, status, details, responseTime) {
        const historyItem = {
            siteName,
            url,
            status,
            details,
            responseTime,
            timestamp: new Date()
        };

        this.history.unshift(historyItem);

        // 최근 50개만 유지
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }

        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        if (this.history.length === 0) {
            this.historyList.innerHTML = '<p class="no-history">기록이 없습니다</p>'; 
            return;
        }

        this.historyList.innerHTML = this.history.map(item => `
            <div class="history-item ${item.status}">
                <div>
                    <div><strong>${item.siteName}</strong></div>
                    <div style="font-size: 0.9rem; color: #666;">${item.url}</div>
                    <div class="history-status ${item.status}">
                        ${this.getStatusText(item.status)}
                    </div>
                </div>
                <div class="history-time">
                    ${item.timestamp.toLocaleString('ko-KR')}
                    ${item.responseTime ? `<br>응답 시간: ${item.responseTime}ms` : ''}       
                </div>
            </div>
        `).join('');
    }

    getStatusText(status) {
        const statusMap = {
            'online': '온라인 상태',
            'offline': '오프라인 상태',
            'error': '오류'
        };
        return statusMap[status] || status;
    }

    // 로컬 스토리지에서 기존 기록 불러오기
    loadHistory() {
        const savedHistory = localStorage.getItem('websiteMonitorHistory');
        if (savedHistory) {
            try {
                this.history = JSON.parse(savedHistory).map(item => ({
                    ...item,
                    timestamp: new Date(item.timestamp)
                }));
                this.updateHistoryDisplay();
            } catch (error) {
                console.error('기록 복원 중 오류:', error);
            }
        }
    }

    // 기록을 로컬 스토리지에 저장
    saveHistory() {
        localStorage.setItem('websiteMonitorHistory', JSON.stringify(this.history));
    }
}

// 페이지 로드 시 웹사이트 모니터 객체 생성
let monitor;

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', () => {       
    monitor = new WebsiteMonitor();
    monitor.loadHistory();

    // 기록 저장 자동화
    const originalAddToHistory = monitor.addToHistory.bind(monitor);
    monitor.addToHistory = function(...args) {
        originalAddToHistory(...args);
        this.saveHistory();
    };
});
