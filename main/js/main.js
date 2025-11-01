// Main JavaScript File
document.addEventListener('DOMContentLoaded', function() {
    
    // Header scroll effect
    const header = document.querySelector('.header');
    // designated sales email for quote requests (test address)
    const SALES_EMAIL = 'gg6532@nki-1.co.kr';
    
    // toggle header scrolled state using class (avoids inline style overrides)
    // once the header becomes 'scrolled' it will remain so for the session
    let headerScrolledOnce = false;
    const setHeaderScrolled = () => {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
            headerScrolledOnce = true;
        } else {
            // only remove if user has never scrolled past threshold in this session
            if (!headerScrolledOnce) {
                header.classList.remove('scrolled');
            }
        }
    };

    window.addEventListener('scroll', setHeaderScrolled);
    // ensure correct state on load (in case page is loaded scrolled)
    window.addEventListener('load', setHeaderScrolled);
    
    // Smooth scrolling for navigation links (탭 기반 네비게이션 제거)
    const navLinks = document.querySelectorAll('.nav-list a:not(.tab-nav-btn)');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetHref = this.getAttribute('href');
            // Only handle in-page anchors (starting with '#') for smooth scrolling
            if (!targetHref || targetHref.charAt(0) !== '#') {
                // allow normal navigation for external pages (e.g., careers.html)
                return;
            }

            e.preventDefault();
            const targetSection = document.querySelector(targetHref);

            if (targetSection) {
                const headerHeight = header.offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Main Tab Navigation
    const tabNavButtons = document.querySelectorAll('.tab-nav-btn');
    const mainTabContents = document.querySelectorAll('.main-tab-content');

    tabNavButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabNavButtons.forEach(btn => btn.classList.remove('active'));
            mainTabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            const targetContent = document.querySelector(`#${targetTab}-tab`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // Scroll to top of tab content
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    });
    
    // Button click handlers for main tab navigation
    const buttonsWithTab = document.querySelectorAll('[data-tab]');
    
    // Handle buttons with data-tab attribute for main tab navigation
    buttonsWithTab.forEach(button => {
        button.addEventListener('click', function(e) {
            // Skip if this is a tab navigation button in header (handled above)
            if (button.classList.contains('tab-nav-btn')) return;
            // Skip if this is a sub-tab button (handled separately)
            if (button.classList.contains('tab-btn')) return;

            const targetTab = button.getAttribute('data-tab');
            if (targetTab) {
                e.preventDefault();
                
                // Switch to the main tab
                const tabNavButtons = document.querySelectorAll('.tab-nav-btn');
                const mainTabContents = document.querySelectorAll('.main-tab-content');
                
                // Remove active class from all buttons and contents
                tabNavButtons.forEach(btn => btn.classList.remove('active'));
                mainTabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to target tab
                const targetNavBtn = document.querySelector(`.tab-nav-btn[data-tab="${targetTab}"]`);
                if (targetNavBtn) {
                    targetNavBtn.classList.add('active');
                }
                
                const targetContent = document.querySelector(`#${targetTab}-tab`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
                
                // Scroll to top
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        });
    });
    const contactForm = document.querySelector('.contact-form-container');
    const messageTextarea = document.querySelector('#message');
    const charCount = document.querySelector('.char-count');
    
    if (messageTextarea && charCount) {
        messageTextarea.addEventListener('input', function() {
            const currentLength = this.value.length;
            const maxLength = 500;
            charCount.textContent = `${currentLength}/${maxLength} 글자`;
            
            if (currentLength > maxLength) {
                charCount.style.color = '#FF3B30';
                this.value = this.value.substring(0, maxLength);
            } else if (currentLength > maxLength * 0.9) {
                charCount.style.color = '#FF9500';
            } else {
                charCount.style.color = '#666';
            }
        });
    }
    
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Form validation
            const requiredFields = contactForm.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = '#FF3B30';
                } else {
                    field.style.borderColor = '#e1e8ed';
                }
            });
            
            if (isValid) {
                const payload = {
                    name: contactForm.querySelector('#name').value.trim(),
                    company: contactForm.querySelector('#company').value.trim(),
                    email: contactForm.querySelector('#email').value.trim(),
                    phone: contactForm.querySelector('#phone').value.trim(),
                    service: contactForm.querySelector('#service').value || '견적문의',
                                        message: contactForm.querySelector('#message').value.trim()
                };

                                                // handle attachments with validation: max 3 files, max size 5MB per file
                                                const MAX_ATTACHMENTS = 3;
                                                const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
                                                const attachmentsInput = contactForm.querySelector('#attachments');
                                                const attachments = [];

                                                const showFormError = (msg) => {
                                                    let resultArea = contactForm.querySelector('.submit-result');
                                                    if(!resultArea){ resultArea = document.createElement('div'); resultArea.className = 'submit-result'; contactForm.insertBefore(resultArea, contactForm.firstChild); }
                                                    resultArea.innerHTML = `<div style="color:#721c24;background:#f8d7da;border:1px solid #f5c6cb;padding:8px;border-radius:4px;">${escapeHtml(msg)}</div>`;
                                                };

                                                if(attachmentsInput && attachmentsInput.files && attachmentsInput.files.length){
                                                    const filesAll = Array.from(attachmentsInput.files);
                                                    if(filesAll.length > MAX_ATTACHMENTS){
                                                        showFormError(`첨부파일은 최대 ${MAX_ATTACHMENTS}개까지 허용합니다.`);
                                                        if(submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
                                                        return;
                                                    }
                                                    // validate sizes
                                                    const oversized = filesAll.filter(f => f.size > MAX_FILE_SIZE);
                                                    if(oversized.length){
                                                        const names = oversized.map(f=>f.name).join(', ');
                                                        showFormError(`다음 파일이 허용 용량(${Math.round(MAX_FILE_SIZE/1024/1024)}MB)을 초과합니다: ${escapeHtml(names)}`);
                                                        if(submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
                                                        return;
                                                    }

                                                    const files = filesAll.slice(0, MAX_ATTACHMENTS);
                                                    // helper to read as base64 for small files (<=5MB)
                                                    const readFileAsBase64 = (file) => new Promise((resolve,reject)=>{
                                                        const reader = new FileReader();
                                                        reader.onload = ()=> resolve(reader.result);
                                                        reader.onerror = reject;
                                                        reader.readAsDataURL(file);
                                                    });
                                                    for(const f of files){
                                                        try{ const dataUrl = await readFileAsBase64(f); attachments.push({ name:f.name, size:f.size, type:f.type, dataUrl }); } catch(e){ attachments.push({ name:f.name, size:f.size, type:f.type }); }
                                                    }
                                                }
                                                if(attachments.length) payload.attachments = attachments;

                // disable submit button while sending
                const submitBtn = contactForm.querySelector('.submit-btn');
                const originalText = submitBtn ? submitBtn.textContent : null;
                if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '전송 중...'; }

                // client-side send: prefer BroadcastChannel/sendNkiQuote, then nkiReceptionAdd, then localStorage fallback
                const sendClient = (payload) => {
                    // prefer embedded helper
                    if (typeof window.sendNkiQuote === 'function') {
                        try { return Promise.resolve(window.sendNkiQuote(payload)); } catch(e) { /* continue to other fallbacks */ }
                    }
                    // direct API to reception page
                    if (typeof window.nkiReceptionAdd === 'function') {
                        try { window.nkiReceptionAdd(payload); return Promise.resolve({ ok: true, via: 'nkiReceptionAdd' }); } catch(e) { /* fallback */ }
                    }
                    // fallback: localStorage append and dispatch storage event
                    try {
                        const KEY = 'nki_reception_local_v1';
                        const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
                        const id = (arr.length ? (arr[arr.length-1].id || 0) : 0) + 1;
                        const entry = Object.assign({ id: id, timestamp: new Date().toISOString(), handled: false }, payload);
                        arr.push(entry);
                        localStorage.setItem(KEY, JSON.stringify(arr));
                        // notify other tabs
                        try { window.dispatchEvent(new Event('storage')); } catch(e) { /* ignore */ }
                        return Promise.resolve({ ok: true, via: 'localStorage' });
                    } catch (e) {
                        return Promise.reject(e);
                    }
                };

                sendClient(payload).then(result => {
                    // create or reuse result area
                    let resultArea = contactForm.querySelector('.submit-result');
                    if (!resultArea) {
                        resultArea = document.createElement('div');
                        resultArea.className = 'submit-result';
                        resultArea.style.margin = '12px 0';
                        resultArea.style.padding = '10px 12px';
                        resultArea.style.borderRadius = '6px';
                        contactForm.insertBefore(resultArea, contactForm.firstChild);
                    }

                    if (result && result.ok) {
                        // remove any existing inline result area
                        try { if (resultArea && resultArea.parentNode) resultArea.parentNode.removeChild(resultArea); } catch (e) { console.warn('Could not remove inline result area', e); }

                        // show popup modal with the requested message; fallback to inline if it fails
                        try { console.log('Showing quote success modal (client-send)'); showQuoteSuccessModal(); } catch (modalErr) {
                            console.error('Modal show failed', modalErr);
                            if (resultArea) {
                                resultArea.innerHTML = `<div style="color:#155724;background:#d4edda;border:1px solid #c3e6cb;padding:12px;border-radius:6px;"><strong>성공적으로 전송이 완료되었습니다.</strong><div style="margin-top:8px;color:#0b5394;">견적 요청이 로컬에 저장되었습니다. 수신 페이지에서 확인하세요.</div></div>`;
                            }
                        }

                        contactForm.reset();
                        if (charCount) charCount.textContent = '0/500 글자';
                    } else {
                        const errMsg = (result && result.message) ? result.message : '전송에 실패했습니다. 다시 시도해주세요.';
                        resultArea.innerHTML = `<div style="color:#721c24;background:#f8d7da;border:1px solid #f5c6cb;padding:8px;border-radius:4px;">전송 실패: ${errMsg}</div>`;
                    }
                }).catch(err => {
                    console.error(err);
                    let resultArea = contactForm.querySelector('.submit-result');
                    if (!resultArea) { resultArea = document.createElement('div'); resultArea.className = 'submit-result'; contactForm.insertBefore(resultArea, contactForm.firstChild); }
                    resultArea.innerHTML = `<div style="color:#721c24;background:#f8d7da;border:1px solid #f5c6cb;padding:8px;border-radius:4px;">전송 실패: ${String(err)}</div>`;
                }).finally(() => {
                    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
                });
            } else {
                alert('필수 필드를 모두 입력해주세요.');
            }
        });
    }

    // Delegated handler: quick-quote buttons can have data-quote or data-service attributes
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('[data-quote], [data-service]');
        if (!btn) return;
        // prevent default if it's a button inside
        e.preventDefault();

        const service = btn.dataset.service || btn.getAttribute('data-service') || btn.getAttribute('data-quote') || '견적문의';
        const subject = `[견적문의] ${service}`;
        const body = encodeURIComponent(`안녕하세요,%0D%0A%0D%0A서비스: ${service}%0D%0A%0D%0A(자세한 내용 입력)
`);
        const mailto = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(subject)}&body=${body}`;
        window.location.href = mailto;
    });
    
    // Chat widget functionality
    const chatWidget = document.querySelector('.chat-widget');
    
    if (chatWidget) {
        chatWidget.addEventListener('click', function() {
            // Add chat functionality here
            alert('채팅 기능은 추후 구현될 예정입니다.');
        });
    }
    
    // Feature cards animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
            }
        });
    }, observerOptions);
    
    // Observe feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        observer.observe(card);
    });
    
    // Add loading animation
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
    });
    
    // Mobile menu toggle (for future mobile menu implementation)
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.nav');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
    
    // Parallax effect for hero background
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const heroBackground = document.querySelector('.hero-background');
        
        if (heroBackground) {
            const speed = scrolled * 0.5;
            heroBackground.style.transform = `translateY(${speed}px)`;
        }
    });
    
    // Form validation helper function
    function validateForm(form) {
        const inputs = form.querySelectorAll('input[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('error');
            } else {
                input.classList.remove('error');
            }
        });
        
        return isValid;
    }
    
    // Utility function for smooth animations
    function animateOnScroll() {
        const elements = document.querySelectorAll('[data-animate]');
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('animated');
            }
        });
    }
    
    window.addEventListener('scroll', animateOnScroll);
    
    // Initialize default tab (회사소개)
    document.addEventListener('DOMContentLoaded', function() {
        const defaultTab = document.querySelector('.tab-nav-btn[data-tab="company"]');
        const defaultContent = document.querySelector('#company-tab');
        
        if (defaultTab && defaultContent) {
            // Ensure company tab is active by default
            document.querySelectorAll('.tab-nav-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.main-tab-content').forEach(content => content.classList.remove('active'));
            
            defaultTab.classList.add('active');
            defaultContent.classList.add('active');
        }
    });

    // Initialize
    animateOnScroll();

    // Tabs functionality (기존 탭 + 사이드 탭 + 회사 네비게이션 탭)
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const sideTabButtons = document.querySelectorAll('.side-tab-btn');
    const sideTabContents = document.querySelectorAll('.side-tab-content');
    const companyNavButtons = document.querySelectorAll('.company-nav-btn');
    const companyTabContents = document.querySelectorAll('.company-tab-content');

    // 기존 탭 기능
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // 사이드 탭 기능
    sideTabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all side tab buttons and contents
            sideTabButtons.forEach(btn => btn.classList.remove('active'));
            sideTabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // 회사 네비게이션 탭 기능
    companyNavButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all company nav buttons and contents
            companyNavButtons.forEach(btn => btn.classList.remove('active'));
            companyTabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // Show success modal for quote submission
    function showQuoteSuccessModal() {
        console.log('showQuoteSuccessModal called');
        // If a modal already exists, don't create another
        if (document.querySelector('.quote-success-modal')) return;

    const overlay = document.createElement('div');
    overlay.className = 'quote-success-modal overlay';

    const dialog = document.createElement('div');
    dialog.className = 'quote-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');

    const title = document.createElement('h3');
    title.textContent = '성공적으로 전송이 완료되었습니다.';
        title.style.margin = '0 0 10px 0';
        title.style.color = '#0b5394';

        const p1 = document.createElement('p');
        p1.style.margin = '0 0 8px 0';
        p1.textContent = '견적 요청이 정상적으로 접수되었습니다.';

        const p2 = document.createElement('p');
        p2.style.margin = '0 0 8px 0';
        p2.textContent = '보내주신 내용은 담당자가 신속히 검토 후 연락드리겠습니다.';

        const p3 = document.createElement('p');
        p3.style.margin = '0 0 12px 0';
        p3.textContent = '귀사의 성공적인 비즈니스를 위해 최선의 제안을 드리겠습니다.';

        const btn = document.createElement('button');
        btn.textContent = '확인';
        btn.style.background = '#0b5394';
        btn.style.color = '#fff';
        btn.style.border = 'none';
        btn.style.padding = '10px 14px';
        btn.style.borderRadius = '6px';
        btn.style.cursor = 'pointer';

        btn.addEventListener('click', closeModal);

        dialog.appendChild(title);
    dialog.appendChild(p1);
    dialog.appendChild(p2);
    dialog.appendChild(p3);
        dialog.appendChild(btn);

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // allow CSS transition to run
        requestAnimationFrame(() => {
            overlay.classList.add('modal-open');
            dialog.classList.add('modal-open');
        });

        // focus button after open
        btn.focus();

        function closeModal() {
            dialog.classList.add('modal-leave');
            overlay.classList.remove('modal-open');
            // wait for transition duration (match CSS ~300ms)
            setTimeout(() => {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 320);
        }

        // close on ESC
        function escHandler(e) {
            if (e.key === 'Escape') closeModal();
        }
        document.addEventListener('keydown', escHandler, { once: true });
    }

    // expose for debugging in console
    try { window.showQuoteSuccessModal = showQuoteSuccessModal; } catch (e) { /* ignore */ }

    // (Note) Apply modal removed: uses standalone apply.html now

    // Brand crossfade removed: logo remains static
});