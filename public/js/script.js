/**
 * -----------------------------------------------------------------------------
 * ANTIGRAVITY ENGINE - CLIENT INTERACTIONS & ZERO-G PHYSICS PARTICLES
 * -----------------------------------------------------------------------------
 */

document.addEventListener('DOMContentLoaded', () => {
    initTabNavigation();
    initZeroGravityParticles();
    initDecorativeEffects();
    initLanguageSystem();
});

/**
 * 1. PREMIUM GLASSMORPHIC TAB NAVIGATION SYSTEM
 */
function initTabNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTabId = tab.getAttribute('data-tab');
            
            // 1. Remove active state from all tabs
            navTabs.forEach(t => t.classList.remove('active'));
            
            // 2. Add active state to clicked tab
            tab.classList.add('active');
            
            // 3. Switch tab sections with accessible attributes
            tabContents.forEach(content => {
                const contentId = content.getAttribute('id');
                
                if (contentId === targetTabId) {
                    content.classList.add('active');
                    content.setAttribute('aria-hidden', 'false');
                } else {
                    content.classList.remove('active');
                    content.setAttribute('aria-hidden', 'true');
                }
            });
        });
    });

    // Wire up landing page action buttons to switch tabs programmatically
    const btnExplore = document.getElementById('btn-explore-now');
    const btnProjects = document.getElementById('tab-btn-projects');
    if (btnExplore && btnProjects) {
        btnExplore.addEventListener('click', () => {
            btnProjects.click();
        });
    }

    const btnDeploy = document.getElementById('btn-deploy-project');
    const btnContact = document.getElementById('tab-btn-contact');
    if (btnDeploy && btnContact) {
        btnDeploy.addEventListener('click', () => {
            btnContact.click();
        });
    }
}

/**
 * 2. ZERO-GRAVITY INTERACTIVE PARTICLE PHYSICS ENGINE
 */
function initZeroGravityParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    let particlesArray = [];
    let animationFrameId;
    
    // Mouse configurations for gravity/anti-gravity deflection
    const mouse = {
        x: null,
        y: null,
        radius: 120 // Influence radius
    };

    // Track mouse movement
    window.addEventListener('mousemove', (event) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    });

    // Reset mouse when leaving window bounds
    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Resize canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
    }
    
    window.addEventListener('resize', resizeCanvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Particle Object Blueprint
    class Particle {
        constructor(x, y, directionX, directionY, size, color) {
            this.x = x;
            this.y = y;
            this.vx = directionX; // Velocity X
            this.vy = directionY; // Velocity Y
            this.size = size;
            this.color = color;
            this.baseSize = size;
        }

        // Render individual particle
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        // Calculate next frame positioning and interactive forces
        update() {
            // Screen boundaries wrap around (zero-gravity infinite space)
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;

            // Interactive mouse repulsion/deflection (Antigravity Force Field)
            if (mouse.x !== null && mouse.y !== null) {
                let dx = this.x - mouse.x;
                let dy = this.y - mouse.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < mouse.radius) {
                    // Normalize vectors
                    let force = (mouse.radius - distance) / mouse.radius; // Closer = stronger force
                    let directionX = dx / distance;
                    let directionY = dy / distance;
                    
                    // Deflect particle away gently
                    this.x += directionX * force * 5;
                    this.y += directionY * force * 5;
                    
                    // Temporarily expand particle glow when activated
                    if (this.size < this.baseSize * 1.8) {
                        this.size += 0.15;
                    }
                } else if (this.size > this.baseSize) {
                    // Shrink back to normal
                    this.size -= 0.1;
                }
            } else if (this.size > this.baseSize) {
                this.size -= 0.1;
            }

            // Normal drifting movement
            this.x += this.vx;
            this.y += this.vy;
            
            this.draw();
        }
    }

    // Initialize/Spawn Particles
    function initParticles() {
        particlesArray = [];
        // Adaptive density based on screen resolution
        const numberOfParticles = Math.floor((canvas.width * canvas.height) / 11000);
        const particleColors = [
            'rgba(10, 245, 255, 0.25)', // Glow Cyan
            'rgba(157, 78, 221, 0.20)', // Glow Violet
            'rgba(99, 102, 241, 0.18)'  // Glow Indigo
        ];

        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 2) + 1.2;
            let x = Math.random() * canvas.width;
            let y = Math.random() * canvas.height;
            // Drifts at extremely slow velocities (zero-gravity feeling)
            let directionX = (Math.random() * 0.4) - 0.2;
            let directionY = (Math.random() * 0.4) - 0.2;
            let color = particleColors[Math.floor(Math.random() * particleColors.length)];

            particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
        }
    }

    // Draw glowing neural connections between nearby particles
    function drawConnections() {
        let maxDistance = 140;
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a; b < particlesArray.length; b++) {
                let dx = particlesArray[a].x - particlesArray[b].x;
                let dy = particlesArray[a].y - particlesArray[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    // Opacity decreases as distance increases (delightful glow fade)
                    let opacity = (1 - (distance / maxDistance)) * 0.09;
                    ctx.strokeStyle = `rgba(138, 43, 226, ${opacity})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    // Core Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
        
        drawConnections();
        animationFrameId = requestAnimationFrame(animate);
    }

    // Kickstart engine
    initParticles();
    animate();
}

/**
 * 3. DELIGHTFUL MICRO-INTERACTION POLISHES
 */
function initDecorativeEffects() {
    // 3D Glassmorphic tilt interaction on cards
    const cards = document.querySelectorAll('.glass-card.interactive-hover');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // x coordinate inside element
            const y = e.clientY - rect.top;  // y coordinate inside element
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Calculate tilt angle (max 5 degrees for premium subtleness)
            const rotateX = ((centerY - y) / centerY) * 4;
            const rotateY = ((x - centerX) / centerX) * 4;
            
            card.style.transform = `perspective(1000px) translateY(-5px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        
        card.addEventListener('mouseleave', () => {
            // Restore perfectly flat floating card state
            card.style.transform = 'perspective(1000px) translateY(0) rotateX(0) rotateY(0)';
        });
    });
}

/**
 * 4. PREMIUM BILINGUAL SYSTEM (ZERO-RELOAD)
 */
function initLanguageSystem() {
    const btnPl = document.getElementById('lang-btn-pl');
    const btnEn = document.getElementById('lang-btn-en');
    const body = document.body;
    
    // Select placeholder-dynamic inputs
    const inputName = document.getElementById('form-name');
    const inputEmail = document.getElementById('form-email');
    const txtMessage = document.getElementById('form-message');
    const form = document.getElementById('cosmic-contact-form');
    
    const metaDesc = document.getElementById('meta-desc');
    const docTitle = document.getElementById('doc-title');

    // Language definitions for placeholders, title, description, and alert messages
    const dictionary = {
        pl: {
            title: "B. Dec | DevOps & Cloud Infrastructure Engineer | Interaktywne CV",
            description: "B. Dec - DevOps & Cloud Infrastructure Engineer Portfolio. Automatyzacja, IaC, Kubernetes i skalowalna architektura chmurowa.",
            placeholders: {
                name: "np. Locon / Tomasz",
                email: "tomasz@firma.pl",
                message: "Cześć, chcielibyśmy omówić z Tobą utrzymanie platformy GCP oraz orkiestrację Kubernetes/GKE..."
            },
            alert: "Sygnał rekrutacyjny nadany pomyślnie! Jako DevOps odpiszę na Twój e-mail w czasie krótszym niż SLA ;)"
        },
        en: {
            title: "B. Dec | DevOps & Cloud Infrastructure Engineer | Interactive CV",
            description: "B. Dec - DevOps & Cloud Infrastructure Engineer Portfolio. Automation, IaC, Kubernetes and scalable cloud architecture.",
            placeholders: {
                name: "e.g. Locon / Thomas",
                email: "thomas@company.com",
                message: "Hi, we would like to discuss GCP platform maintenance and Kubernetes/GKE orchestration with you..."
            },
            alert: "Recruitment signal transmitted successfully! As a DevOps, I will respond to your email faster than the SLA ;)"
        }
    };

    function setLanguage(lang) {
        // 1. Save selection
        localStorage.setItem('cv-lang', lang);
        
        // 2. Toggle body classes
        if (lang === 'en') {
            body.classList.remove('lang-pl');
            body.classList.add('lang-en');
            btnPl.classList.remove('active');
            btnEn.classList.add('active');
        } else {
            body.classList.remove('lang-en');
            body.classList.add('lang-pl');
            btnEn.classList.remove('active');
            btnPl.classList.add('active');
        }
        
        // 3. Update SEO metadata titles & descriptions
        if (docTitle) docTitle.textContent = dictionary[lang].title;
        if (metaDesc) metaDesc.setAttribute('content', dictionary[lang].description);
        
        // 4. Update Form Placeholders dynamically
        if (inputName) inputName.placeholder = dictionary[lang].placeholders.name;
        if (inputEmail) inputEmail.placeholder = dictionary[lang].placeholders.email;
        if (txtMessage) txtMessage.placeholder = dictionary[lang].placeholders.message;
    }

    // Initialize from LocalStorage or fall back to browser preference
    let initialLang = localStorage.getItem('cv-lang');
    
    if (!initialLang) {
        // Retrieve browser language (e.g. "pl", "pl-PL", "en", "en-US")
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang && browserLang.toLowerCase().startsWith('en')) {
            initialLang = 'en';
        } else {
            // Default to Polish as primary base
            initialLang = 'pl';
        }
    }
    
    setLanguage(initialLang);

    // Bind event listeners
    if (btnPl) {
        btnPl.addEventListener('click', () => setLanguage('pl'));
    }
    if (btnEn) {
        btnEn.addEventListener('click', () => setLanguage('en'));
    }

    // Set up Contact Form submit handler for bilingual notifications
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const currentLang = localStorage.getItem('cv-lang') || 'pl';
            alert(dictionary[currentLang].alert);
            form.reset();
        });
    }
}
