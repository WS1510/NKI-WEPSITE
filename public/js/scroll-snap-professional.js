/* =========================================================================
   PROFESSIONAL SCROLL SNAP JAVASCRIPT ENHANCEMENTS
   전문적인 스크롤 스냅 JavaScript 개선사항
   
   Features:
   - Scroll snap event monitoring
   - Accessibility improvements
   - Performance optimizations
   - Cross-browser compatibility
   - Debug utilities
   ========================================================================= */

(function() {
    'use strict';

    // Configuration
    const SCROLL_SNAP_CONFIG = {
        debounceDelay: 100,
        snapThreshold: 50,
        sections: [
            { selector: '.hero', name: 'Hero' },
            { selector: '.business-field-section', name: 'Business Field' },
            { selector: '.quick-links-section', name: 'Quick Links' }
        ],
        debug: false // Set to true for development
    };

    // State management
    let currentSection = 0;
    let isScrolling = false;
    let scrollTimeout;
    let isInitialized = false;

    // DOM elements
    let sections = [];
    let debugPanel = null;

    /**
     * Initialize scroll snap functionality
     */
    function initScrollSnap() {
        if (isInitialized) return;

        // Check for scroll snap support
        if (!checkScrollSnapSupport()) {
            console.warn('CSS Scroll Snap not supported in this browser');
            return;
        }

        // Get all snap sections
        sections = SCROLL_SNAP_CONFIG.sections.map(config => {
            const element = document.querySelector(config.selector);
            if (element) {
                return {
                    element,
                    name: config.name,
                    selector: config.selector
                };
            }
            return null;
        }).filter(Boolean);

        if (sections.length === 0) {
            console.warn('No scroll snap sections found');
            return;
        }

        // Setup event listeners
        setupEventListeners();

        // Initialize debug panel if enabled
        if (SCROLL_SNAP_CONFIG.debug) {
            createDebugPanel();
        }

        // Setup accessibility features
        setupAccessibility();

        // Initial state
        updateCurrentSection();

        isInitialized = true;
        
        if (SCROLL_SNAP_CONFIG.debug) {
            console.log('Professional Scroll Snap initialized', {
                sections: sections.length,
                support: getScrollSnapSupport()
            });
        }
    }

    /**
     * Check if browser supports CSS Scroll Snap
     */
    function checkScrollSnapSupport() {
        if (typeof CSS !== 'undefined' && CSS.supports) {
            return CSS.supports('scroll-snap-type', 'y mandatory') ||
                   CSS.supports('-webkit-scroll-snap-type', 'y mandatory');
        }
        
        // Fallback check
        const testElement = document.createElement('div');
        return 'scrollSnapType' in testElement.style ||
               'webkitScrollSnapType' in testElement.style;
    }

    /**
     * Get detailed scroll snap support information
     */
    function getScrollSnapSupport() {
        if (typeof CSS === 'undefined' || !CSS.supports) return 'unknown';
        
        const support = {
            scrollSnapType: CSS.supports('scroll-snap-type', 'y mandatory'),
            scrollSnapAlign: CSS.supports('scroll-snap-align', 'start'),
            scrollPadding: CSS.supports('scroll-padding-top', '10px'),
            scrollMargin: CSS.supports('scroll-margin-top', '10px'),
            webkit: CSS.supports('-webkit-scroll-snap-type', 'y mandatory')
        };

        return support;
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Scroll event with debouncing
        window.addEventListener('scroll', debounce(handleScroll, SCROLL_SNAP_CONFIG.debounceDelay), { passive: true });

        // Resize event
        window.addEventListener('resize', debounce(handleResize, 250), { passive: true });

        // Keyboard navigation
        document.addEventListener('keydown', handleKeyboard);

        // Touch events for mobile enhancement
        if ('ontouchstart' in window) {
            setupTouchEvents();
        }

        // Intersection Observer for better performance
        if ('IntersectionObserver' in window) {
            setupIntersectionObserver();
        }
    }

    /**
     * Handle scroll events
     */
    function handleScroll() {
        isScrolling = true;
        
        // Clear existing timeout
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }

        // Update current section
        updateCurrentSection();

        // Set timeout to detect when scrolling stops
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
            onScrollEnd();
        }, 150);

        // Update debug panel
        if (SCROLL_SNAP_CONFIG.debug && debugPanel) {
            updateDebugPanel();
        }
    }

    /**
     * Handle scroll end
     */
    function onScrollEnd() {
        const newSection = getCurrentSectionIndex();
        
        if (newSection !== currentSection) {
            const oldSection = currentSection;
            currentSection = newSection;
            
            // Trigger custom event
            triggerSectionChange(oldSection, newSection);
        }

        if (SCROLL_SNAP_CONFIG.debug) {
            console.log('Scroll ended at section:', sections[currentSection]?.name || 'Unknown');
        }
    }

    /**
     * Update current section based on scroll position
     */
    function updateCurrentSection() {
        const scrollY = window.scrollY;
        const viewportHeight = window.innerHeight;
        const scrollCenter = scrollY + (viewportHeight / 2);

        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const rect = section.element.getBoundingClientRect();
            const sectionTop = scrollY + rect.top;
            const sectionBottom = sectionTop + rect.height;

            if (scrollCenter >= sectionTop && scrollCenter <= sectionBottom) {
                currentSection = i;
                break;
            }
        }
    }

    /**
     * Get current section index based on viewport
     */
    function getCurrentSectionIndex() {
        const scrollY = window.scrollY;
        const viewportHeight = window.innerHeight;
        
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const rect = section.element.getBoundingClientRect();
            const sectionTop = scrollY + rect.top;
            
            if (scrollY < sectionTop + (rect.height / 2)) {
                return i;
            }
        }
        
        return sections.length - 1;
    }

    /**
     * Handle keyboard navigation
     */
    function handleKeyboard(event) {
        // Only handle if no input is focused
        if (document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'TEXTAREA' ||
            document.activeElement.contentEditable === 'true') {
            return;
        }

        switch (event.key) {
            case 'ArrowDown':
            case 'PageDown':
                event.preventDefault();
                scrollToNextSection();
                break;
            case 'ArrowUp':
            case 'PageUp':
                event.preventDefault();
                scrollToPreviousSection();
                break;
            case 'Home':
                event.preventDefault();
                scrollToSection(0);
                break;
            case 'End':
                event.preventDefault();
                scrollToSection(sections.length - 1);
                break;
        }
    }

    /**
     * Scroll to next section
     */
    function scrollToNextSection() {
        const nextIndex = Math.min(currentSection + 1, sections.length - 1);
        scrollToSection(nextIndex);
    }

    /**
     * Scroll to previous section
     */
    function scrollToPreviousSection() {
        const prevIndex = Math.max(currentSection - 1, 0);
        scrollToSection(prevIndex);
    }

    /**
     * Scroll to specific section
     */
    function scrollToSection(index) {
        if (index < 0 || index >= sections.length) return;

        const section = sections[index];
        const rect = section.element.getBoundingClientRect();
        const scrollTop = window.scrollY + rect.top;

        // Use smooth scrolling
        window.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
        });
    }

    /**
     * Setup accessibility features
     */
    function setupAccessibility() {
        // Add ARIA labels to sections
        sections.forEach((section, index) => {
            const element = section.element;
            
            if (!element.getAttribute('aria-label')) {
                element.setAttribute('aria-label', `Section ${index + 1}: ${section.name}`);
            }
            
            if (!element.getAttribute('role')) {
                element.setAttribute('role', 'region');
            }
        });

        // Add skip links
        addSkipLinks();
    }

    /**
     * Add skip navigation links
     */
    function addSkipLinks() {
        const skipNav = document.createElement('nav');
        skipNav.className = 'skip-navigation';
        skipNav.setAttribute('aria-label', 'Skip navigation');
        
        const skipList = document.createElement('ul');
        
        sections.forEach((section, index) => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            
            link.href = `#section-${index}`;
            link.textContent = `Skip to ${section.name}`;
            link.className = 'skip-link';
            
            link.addEventListener('click', (e) => {
                e.preventDefault();
                scrollToSection(index);
                link.blur();
            });
            
            listItem.appendChild(link);
            skipList.appendChild(listItem);
        });
        
        skipNav.appendChild(skipList);
        document.body.insertBefore(skipNav, document.body.firstChild);
    }

    /**
     * Handle resize events
     */
    function handleResize() {
        // Recalculate section positions
        updateCurrentSection();
        
        if (SCROLL_SNAP_CONFIG.debug && debugPanel) {
            updateDebugPanel();
        }
    }

    /**
     * Setup touch events for mobile
     */
    function setupTouchEvents() {
        let touchStartY = 0;
        let touchEndY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            touchEndY = e.changedTouches[0].screenY;
            handleTouchGesture();
        }, { passive: true });
        
        function handleTouchGesture() {
            const swipeThreshold = 50;
            const diff = touchStartY - touchEndY;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // Swiped up
                    scrollToNextSection();
                } else {
                    // Swiped down
                    scrollToPreviousSection();
                }
            }
        }
    }

    /**
     * Setup Intersection Observer for better performance
     */
    function setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: [0.1, 0.5, 0.9]
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const sectionIndex = sections.findIndex(s => s.element === entry.target);
                
                if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                    // Section is more than 50% visible
                    triggerSectionVisible(sectionIndex);
                }
            });
        }, options);

        sections.forEach(section => {
            observer.observe(section.element);
        });
    }

    /**
     * Trigger section change event
     */
    function triggerSectionChange(oldIndex, newIndex) {
        const event = new CustomEvent('scrollSnapSectionChange', {
            detail: {
                oldSection: oldIndex,
                newSection: newIndex,
                oldSectionName: sections[oldIndex]?.name,
                newSectionName: sections[newIndex]?.name
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Trigger section visible event
     */
    function triggerSectionVisible(sectionIndex) {
        const event = new CustomEvent('scrollSnapSectionVisible', {
            detail: {
                section: sectionIndex,
                sectionName: sections[sectionIndex]?.name
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Create debug panel
     */
    function createDebugPanel() {
        debugPanel = document.createElement('div');
        debugPanel.className = 'scroll-snap-debug';
        debugPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            z-index: 10000;
            min-width: 200px;
            max-width: 300px;
        `;
        
        document.body.appendChild(debugPanel);
        updateDebugPanel();
    }

    /**
     * Update debug panel
     */
    function updateDebugPanel() {
        if (!debugPanel) return;
        
        const scrollY = window.scrollY;
        const viewportHeight = window.innerHeight;
        const support = getScrollSnapSupport();
        
        debugPanel.innerHTML = `
            <strong>Scroll Snap Debug</strong><br>
            <hr style="margin: 8px 0; border: 1px solid #444;">
            Current Section: ${currentSection + 1}/${sections.length}<br>
            Section Name: ${sections[currentSection]?.name || 'Unknown'}<br>
            Scroll Y: ${scrollY}px<br>
            Viewport Height: ${viewportHeight}px<br>
            Is Scrolling: ${isScrolling}<br>
            <hr style="margin: 8px 0; border: 1px solid #444;">
            <strong>Browser Support:</strong><br>
            ${Object.entries(support).map(([key, value]) => 
                `${key}: ${value ? '✓' : '✗'}`
            ).join('<br>')}
        `;
    }

    /**
     * Utility: Debounce function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Public API
     */
    window.ScrollSnapPro = {
        init: initScrollSnap,
        scrollToSection: scrollToSection,
        getCurrentSection: () => currentSection,
        getSections: () => sections,
        isSupported: checkScrollSnapSupport,
        getSupport: getScrollSnapSupport
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrollSnap);
    } else {
        initScrollSnap();
    }

})();