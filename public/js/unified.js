/**
 * =============================================================================
 * NKI Website - Unified JavaScript
 * 통합 JavaScript 파일: 모든 기능을 체계적으로 관리
 * 
 * 구조:
 * 1. Core Utilities
 * 2. Navigation & Header
 * 3. Animations & Scroll Effects
 * 4. Quote System
 * 5. UI Components
 * 6. Initialization
 * =============================================================================
 */

// =============================================================================
// 1. CORE UTILITIES - 핵심 유틸리티 함수들
// =============================================================================

const NKI = {
    // Configuration
    config: {
        salesEmail: 'gg6532@nki-1.co.kr',
        apiEndpoint: '/api/quote',
        scrollOffset: 100,
        animationDuration: 300
    },
    
    // Utility functions
    utils: {
        // DOM 요소 선택
        $(selector) {
            return document.querySelector(selector);
        },
        
        $$(selector) {
            return document.querySelectorAll(selector);
        },
        
        // 클래스 조작
        addClass(element, className) {
            if (element) element.classList.add(className);
        },
        
        removeClass(element, className) {
            if (element) element.classList.remove(className);
        },
        
        toggleClass(element, className) {
            if (element) element.classList.toggle(className);
        },
        
        // 이벤트 리스너
        on(element, event, handler) {
            if (element) element.addEventListener(event, handler);
        },
        
        // 스무스 스크롤
        smoothScrollTo(targetY, duration = 800) {
            const startY = window.pageYOffset;
            const difference = targetY - startY;
            const startTime = performance.now();
            
            function step() {
                const progress = (performance.now() - startTime) / duration;
                const ease = progress < 0.5 
                    ? 4 * progress * progress * progress 
                    : (progress - 1) * (2 * progress - 2) * (2 * progress - 2) + 1;
                
                window.scrollTo(0, startY + difference * Math.min(ease, 1));
                
                if (progress < 1) {
                    requestAnimationFrame(step);
                }
            }
            
            requestAnimationFrame(step);
        },
        
        // 디바운스 함수
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        // 쓰로틀 함수
        throttle(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
    }
};

// =============================================================================
// 2. NAVIGATION & HEADER - 네비게이션과 헤더 관리
// =============================================================================

NKI.header = {
    init() {
        this.setupScrollEffect();
        this.setupSmoothScrolling();
        this.setupMobileNavigation();
        this.setupScrollIndicator();
    },
    
    // 헤더 스크롤 효과
    setupScrollEffect() {
        const header = NKI.utils.$('.header');
        if (!header) return;
        
        const handleScroll = NKI.utils.throttle(() => {
            const scrollY = window.pageYOffset;
            
            if (scrollY > NKI.config.scrollOffset) {
                NKI.utils.addClass(header, 'scrolled');
                header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                header.style.backdropFilter = 'blur(10px)';
            } else {
                NKI.utils.removeClass(header, 'scrolled');
                header.style.backgroundColor = '#ffffff';
                header.style.backdropFilter = 'none';
            }
        }, 16);
        
        NKI.utils.on(window, 'scroll', handleScroll);
    },
    
    // 스무스 스크롤링
    setupSmoothScrolling() {
        const navLinks = NKI.utils.$$('.nav-link, a[href^="#"]');
        
        navLinks.forEach(link => {
            NKI.utils.on(link, 'click', (e) => {
                const targetHref = link.getAttribute('href');
                
                // 페이지 내 앵커만 처리
                if (!targetHref || targetHref.charAt(0) !== '#') {
                    return;
                }
                
                e.preventDefault();
                
                const targetId = targetHref.substring(1);
                const targetElement = NKI.utils.$(`#${targetId}`);
                
                if (targetElement) {
                    const headerHeight = NKI.utils.$('.header')?.offsetHeight || 80;
                    const targetY = targetElement.offsetTop - headerHeight;
                    
                    NKI.utils.smoothScrollTo(targetY);
                }
            });
        });
    },
    
    // 모바일 네비게이션
    setupMobileNavigation() {
        const navToggle = NKI.utils.$('.nav-toggle');
        const navMenu = NKI.utils.$('.nav-menu');
        
        if (navToggle && navMenu) {
            NKI.utils.on(navToggle, 'click', () => {
                NKI.utils.toggleClass(navMenu, 'active');
                NKI.utils.toggleClass(navToggle, 'active');
            });
            
            // 메뉴 링크 클릭 시 모바일 메뉴 닫기
            const menuLinks = NKI.utils.$$('.nav-menu .nav-link');
            menuLinks.forEach(link => {
                NKI.utils.on(link, 'click', () => {
                    NKI.utils.removeClass(navMenu, 'active');
                    NKI.utils.removeClass(navToggle, 'active');
                });
            });
        }
    },
    
    // 스크롤 인디케이터 설정
    setupScrollIndicator() {
        const scrollIndicator = NKI.utils.$('.scroll-indicator');
        if (!scrollIndicator) return;
        
        NKI.utils.on(scrollIndicator, 'click', () => {
            // 다음 섹션(business-field-section)으로 스크롤
            const nextSection = NKI.utils.$('.business-field-section');
            if (nextSection) {
                const headerHeight = NKI.utils.$('.header')?.offsetHeight || 80;
                const targetY = nextSection.offsetTop - headerHeight;
                NKI.utils.smoothScrollTo(targetY);
            }
        });
        
        // 스크롤에 따른 인디케이터 숨김/표시
        const handleScroll = NKI.utils.throttle(() => {
            const heroSection = NKI.utils.$('.hero');
            if (!heroSection) return;
            
            const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
            const scrollPosition = window.pageYOffset + window.innerHeight;
            
            // 히어로 섹션 하단 근처에서 인디케이터 숨기기
            if (scrollPosition > heroBottom - 100) {
                scrollIndicator.style.opacity = '0';
                scrollIndicator.style.pointerEvents = 'none';
            } else {
                scrollIndicator.style.opacity = '1';
                scrollIndicator.style.pointerEvents = 'auto';
            }
        }, 16);
        
        NKI.utils.on(window, 'scroll', handleScroll);
        
        // 애니메이션 효과 추가
        scrollIndicator.style.transition = 'opacity 0.3s ease';
        
        // 초기 스타일 설정
        scrollIndicator.style.cursor = 'pointer';
    }
};

// =============================================================================
// 3. ANIMATIONS & SCROLL EFFECTS - 애니메이션과 스크롤 효과
// =============================================================================

NKI.animations = {
    init() {
        this.setupScrollAnimations();
        this.setupHoverEffects();
    },
    
    // 스크롤 애니메이션
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    NKI.utils.addClass(entry.target, 'animate-fade-in-up');
                }
            });
        }, observerOptions);
        
        // 애니메이션 대상 요소들
        const animateElements = NKI.utils.$$(`
            .section-header,
            .quick-link-card,
            .card,
            .hero-content
        `);
        
        animateElements.forEach(el => observer.observe(el));
    },
    
    // 호버 효과
    setupHoverEffects() {
        // 카드 호버 효과
        const cards = NKI.utils.$$('.card, .quick-link-card');
        
        cards.forEach(card => {
            NKI.utils.on(card, 'mouseenter', () => {
                NKI.utils.addClass(card, 'hover-lift');
            });
            
            NKI.utils.on(card, 'mouseleave', () => {
                NKI.utils.removeClass(card, 'hover-lift');
            });
        });
    }
};

// =============================================================================
// 4. QUOTE SYSTEM - 견적 요청 시스템
// =============================================================================

NKI.quote = {
    init() {
        this.setupQuoteForm();
        this.setupChatWidget();
    },
    
    // 견적 전송 함수
    async sendQuote(payload) {
        try {
            // 1차: 서버 API 시도
            const response = await fetch(NKI.config.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                const data = await response.json();
                return { ok: true, via: 'server', data };
            }
        } catch (error) {
            console.warn('Server API failed, trying fallback methods:', error);
        }
        
        // 2차: BroadcastChannel 시도
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                const channel = new BroadcastChannel('nki-quote-channel');
                channel.postMessage({ type: 'quote', payload });
                return { ok: true, via: 'BroadcastChannel' };
            } catch (error) {
                console.warn('BroadcastChannel failed:', error);
            }
        }
        
        // 3차: localStorage 백업
        try {
            const storageKey = 'nki_reception_local_v1';
            const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const newId = existingData.length > 0 
                ? (existingData[existingData.length - 1].id || 0) + 1 
                : 1;
            
            const entry = {
                id: newId,
                timestamp: new Date().toISOString(),
                handled: false,
                ...payload
            };
            
            existingData.push(entry);
            localStorage.setItem(storageKey, JSON.stringify(existingData));
            
            // 스토리지 이벤트 발생
            window.dispatchEvent(new Event('storage'));
            
            return { ok: true, via: 'localStorage' };
        } catch (error) {
            return { ok: false, error: String(error) };
        }
    },
    
    // 견적 폼 설정
    setupQuoteForm() {
        const quoteForm = NKI.utils.$('.quote-form');
        if (!quoteForm) return;
        
        NKI.utils.on(quoteForm, 'submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(quoteForm);
            const payload = {
                name: formData.get('name'),
                company: formData.get('company'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                service: formData.get('service'),
                message: formData.get('message')
            };
            
            // 로딩 상태 표시
            const submitBtn = NKI.utils.$('.quote-form .btn-primary');
            const originalText = submitBtn?.textContent;
            if (submitBtn) {
                submitBtn.textContent = '전송 중...';
                submitBtn.disabled = true;
            }
            
            try {
                const result = await this.sendQuote(payload);
                
                if (result.ok) {
                    this.showSuccessMessage();
                    quoteForm.reset();
                } else {
                    this.showErrorMessage(result.error);
                }
            } catch (error) {
                this.showErrorMessage('전송 중 오류가 발생했습니다.');
                console.error('Quote submission error:', error);
            } finally {
                // 로딩 상태 해제
                if (submitBtn) {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            }
        });
    },
    
    // 채팅 위젯 설정
    setupChatWidget() {
        const chatWidget = NKI.utils.$('.chat-widget');
        if (!chatWidget) return;
        
        NKI.utils.on(chatWidget, 'click', () => {
            this.openQuoteModal();
        });
    },
    
    // 성공 메시지 표시
    showSuccessMessage() {
        alert('견적 요청이 성공적으로 전송되었습니다. 빠른 시일 내에 연락드리겠습니다.');
    },
    
    // 에러 메시지 표시
    showErrorMessage(error) {
        alert(`전송 실패: ${error || '알 수 없는 오류가 발생했습니다.'}`);
    },
    
    // 견적 모달 열기
    openQuoteModal() {
        // 모달이 있다면 열기, 없다면 스크롤
        const modal = NKI.utils.$('.quote-modal');
        const contactSection = NKI.utils.$('#contact');
        
        if (modal) {
            NKI.utils.addClass(modal, 'show');
        } else if (contactSection) {
            const headerHeight = NKI.utils.$('.header')?.offsetHeight || 80;
            const targetY = contactSection.offsetTop - headerHeight;
            NKI.utils.smoothScrollTo(targetY);
        }
    }
};

// =============================================================================
// 5. UI COMPONENTS - UI 컴포넌트들
// =============================================================================

NKI.components = {
    init() {
        this.setupModals();
        this.setupDropdowns();
    },
    
    // 모달 설정
    setupModals() {
        const modals = NKI.utils.$$('.modal');
        
        modals.forEach(modal => {
            const closeBtn = modal.querySelector('.modal-close');
            const modalContent = modal.querySelector('.modal-content');
            
            // 닫기 버튼
            if (closeBtn) {
                NKI.utils.on(closeBtn, 'click', () => {
                    NKI.utils.removeClass(modal, 'show');
                });
            }
            
            // 배경 클릭으로 닫기
            NKI.utils.on(modal, 'click', (e) => {
                if (e.target === modal) {
                    NKI.utils.removeClass(modal, 'show');
                }
            });
            
            // ESC 키로 닫기
            NKI.utils.on(document, 'keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('show')) {
                    NKI.utils.removeClass(modal, 'show');
                }
            });
        });
    },
    
    // 드롭다운 설정
    setupDropdowns() {
        const dropdowns = NKI.utils.$$('.dropdown');
        
        dropdowns.forEach(dropdown => {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            const menu = dropdown.querySelector('.dropdown-menu');
            
            if (toggle && menu) {
                NKI.utils.on(toggle, 'click', (e) => {
                    e.preventDefault();
                    NKI.utils.toggleClass(dropdown, 'active');
                });
                
                // 외부 클릭 시 닫기
                NKI.utils.on(document, 'click', (e) => {
                    if (!dropdown.contains(e.target)) {
                        NKI.utils.removeClass(dropdown, 'active');
                    }
                });
            }
        });
    }
};

// =============================================================================
// 6. INITIALIZATION - 초기화
// =============================================================================

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 NKI Website initialized');
    
    // 모든 모듈 초기화
    NKI.header.init();
    NKI.animations.init();
    NKI.quote.init();
    NKI.components.init();
    
    // 전역 함수로 견적 전송 함수 노출 (하위 호환성)
    window.sendNkiQuote = NKI.quote.sendQuote.bind(NKI.quote);
});

// 성능 모니터링 (개발 모드)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        console.log(`📊 Page loaded in ${loadTime.toFixed(2)}ms`);
    });
}

// 전역 NKI 객체 노출
window.NKI = NKI;