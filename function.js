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
            const response = await fetch('/api/sites');
            const data = await response.json();
            this.sites = data.sites || [];
            this.nextId = this.sites.length > 0 ? Math.max(...this.sites.map(site => site.id)) + 1 : 1;
            this.renderSites();
            this.renderStatusGrid();
        } catch (error) {
            console.error('사이트 목록 로드 실패:', error);
            // 서버 연결 실패 시 로컬 스토리지에서 로드
            this.loadSitesFromLocalStorage();
        }
    }

    loadSitesFromLocalStorage() {
        try {
            const savedData = localStorage.getItem('websiteMonitorSites');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.sites = data.sites || [];
                this.nextId = this.sites.length > 0 ? Math.max(...this.sites.map(site => site.id)) + 1 : 1;
            }
            this.renderSites();
            this.renderStatusGrid();
        } catch (error) {
            console.error('로컬 스토리지에서 사이트 로드 실패:', error);
            this.sites = [];
            this.renderSites();
        }
    }

    async saveSites() {
        try {
            const response = await fetch('/api/sites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sites: this.sites })
            });

            if (!response.ok) {
                throw new Error('서버 저장 실패');
            }

            console.log('사이트 목록이 서버에 저장되었습니다.');
        } catch (error) {
            console.error('서버 저장 실패, 로컬 스토리지에 저장:', error);
            // 서버 저장 실패 시 로컬 스토리지에 백업 저장
            localStorage.setItem('websiteMonitorSites', JSON.stringify({ sites: this.sites }));
        }
    }

    renderSites() {
        this.sitesList.innerHTML = this.sites.map(site => `
            <div class="site-item ${!site.enabled ? 'disabled' : ''}" data-id="${site.id}">
                <div class="site-name">${site.name}</div>
                <div class="site-url">${site.url}</div>
                <div class="site-controls">
                    <button class="toggle-btn ${!site.enabled ? 'disabled' : ''}" 
                            onclick="monitor.toggleSite(${site.id})">
                        ${site.enabled ? '비활성화' : '활성화'}
                    </button>
                    <button class="check-btn" onclick="monitor.checkSingleSite(${site.id})">
                        상태 확인
                    </button>
                    <button class="delete-btn" onclick="monitor.deleteSite(${site.id})">
                        삭제
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderStatusGrid() {
        this.statusGrid.innerHTML = this.sites.filter(site => site.enabled).map(site => `
            <div class="status-card" id="status-${site.id}">
                <h4>${site.name}</h4>
                <p><span class="status-indicator"></span>상태 확인 대기 중</p>
                <p>URL: ${site.url}</p>
                <p>마지막 확인: -</p>
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
            alert('사이트명과 URL을 모두 입력해주세요.');
            return;
        }

        if (!this.isValidUrl(url)) {
            alert('올바른 URL 형식을 입력해주세요. (예: https://example.com)');
            return;
        }

        const newSite = {
            id: this.nextId++,
            name: name,
            url: url,
            enabled: true
        };

        this.sites.push(newSite);
        await this.saveSites();
        this.renderSites();
        this.renderStatusGrid();
        this.closeAddSiteModal();
        
        // 성공 메시지
        this.showMessage('사이트가 성공적으로 추가되었습니다!', 'success');
    }

    showMessage(message, type = 'info') {
        // 간단한 알림 메시지 표시
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            transition: all 0.3s ease;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        `;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);

        // 3초 후 자동 제거
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 3000);
    }

    async deleteSite(id) {
        if (confirm('정말로 이 사이트를 삭제하시겠습니까?')) {
            this.sites = this.sites.filter(site => site.id !== id);
            await this.saveSites();
            this.renderSites();
            this.renderStatusGrid();
            this.showMessage('사이트가 삭제되었습니다.', 'success');
        }
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

            // no-cors 모드에서는 status가 항상 0이므로, 
            // 응답이 성공적으로 받아졌으면 접속 가능으로 간주
            if (response.status === 0 || response.status >= 200) {
                this.updateSiteStatus(site.id, 'online', '접속 가능', responseTime);
                this.addToHistory(site.name, site.url, 'online', 'OK', responseTime);
            } else {
                this.updateSiteStatus(site.id, 'error', `서버 오류: ${response.status}`, responseTime);
                this.addToHistory(site.name, site.url, 'error', response.status, responseTime);
            }
        } catch (error) {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            let status = 'offline';
            let message = '접속 불가';
            
            if (error.name === 'TimeoutError') {
                message = '접속 시간 초과';
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
            alert('모니터링할 활성화된 사이트가 없습니다.');
            return;
        }

        this.isMonitoring = true;
        this.startAllMonitoringBtn.disabled = true;
        this.stopAllMonitoringBtn.disabled = false;

        const interval = parseInt(this.intervalSelect.value);
        
        // 즉시 모든 사이트 체크
        enabledSites.forEach(site => this.checkSingleSite(site.id));
        
        // 주기적으로 체크
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
        
        // 최대 50개 항목만 유지
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }

        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        if (this.history.length === 0) {
            this.historyList.innerHTML = '<p class="no-history">아직 기록이 없습니다</p>';
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
                    ${item.responseTime ? `<br>응답시간: ${item.responseTime}ms` : ''}
                </div>
            </div>
        `).join('');
    }

    getStatusText(status) {
        const statusMap = {
            'online': '접속 가능',
            'offline': '접속 불가',
            'error': '오류'
        };
        return statusMap[status] || status;
    }

    // 페이지 로드 시 이전 기록 복원
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

// 전역 변수로 모니터 인스턴스 생성
let monitor;

// 페이지 로드 시 모니터 초기화
document.addEventListener('DOMContentLoaded', () => {
    monitor = new WebsiteMonitor();
    monitor.loadHistory();
    
    // 기록이 변경될 때마다 저장
    const originalAddToHistory = monitor.addToHistory.bind(monitor);
    monitor.addToHistory = function(...args) {
        originalAddToHistory(...args);
        this.saveHistory();
    };
});