/**
 * script.js - Peña Los Magníficos
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Smooth Scroll (Lenis) ---
    if (typeof Lenis !== 'undefined') {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        });

        window.lenis = lenis;

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        // Integrate with anchor links for smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');

                // Only handle if it's a valid internal ID (starts with # and is not just # or #!)
                if (href.startsWith('#') && href.length > 1 && !href.startsWith('#!')) {
                    const targetElement = document.querySelector(href);
                    if (targetElement) {
                        e.preventDefault();
                        lenis.scrollTo(targetElement, {
                            offset: -130,
                            duration: 1.5
                        });
                    }
                }
            });
        });
    }

    // --- Sidebar Toggle (Desktop & Mobile) ---
    const burgerMenu = document.getElementById('burger-menu');
    const burgerMob = document.getElementById('burger-mob'); // Keep for compatibility if still used
    const sidebarClose = document.getElementById('sidebar-close');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const mainSidebar = document.getElementById('main-sidebar');
    const desktopToggle = document.getElementById('desktop-nav-toggle');

    const toggleSidebar = () => {
        mainSidebar.classList.toggle('active');
        if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
    };

    if (burgerMenu) burgerMenu.addEventListener('click', toggleSidebar);
    if (burgerMob) burgerMob.addEventListener('click', toggleSidebar);
    if (desktopToggle) desktopToggle.addEventListener('click', toggleSidebar);

    if (sidebarClose) {
        sidebarClose.addEventListener('click', () => {
            mainSidebar.classList.remove('active');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            mainSidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }

    // --- Close Sidebar on Link Click ---
    const allSidebarLinks = document.querySelectorAll('.main-sidebar a');
    allSidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Don't close if it's a dropdown trigger
            if (link.classList.contains('dropdown-trigger')) return;

            mainSidebar.classList.remove('active');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        });
    });

    // --- Sidebar Dropdowns ---
    const dropdownTriggers = document.querySelectorAll('.dropdown-trigger');
    dropdownTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const parent = trigger.parentElement;
            parent.classList.toggle('active');
        });
    });

    // --- Lightbox Gallery ---
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');

    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            lightboxImg.src = item.querySelector('img').src;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
            if (window.lenis) window.lenis.stop();
        });
    });

    if (lightboxClose) {
        lightboxClose.onclick = () => {
            lightbox.classList.remove('active');
            document.body.style.overflow = 'auto';
            if (window.lenis) window.lenis.start();
        };
    }

    // --- Active Link on Scroll ---
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop - 150) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${current}`) {
                item.classList.add('active');
            }
        });
    });

    // --- Login Modal & Auth ---
    const loginTriggers = document.querySelectorAll('#login-trigger, #login-trigger-header, #login-trigger-footer');
    const loginModal = document.getElementById('login-modal');
    const modalClose = document.getElementById('modal-close');
    const loginForm = document.getElementById('login-form');
    const authContainerSidebar = document.getElementById('auth-container-sidebar');
    const authContainerHeader = document.getElementById('auth-container-header');
    const authContainerFooter = document.getElementById('auth-container-footer');

    loginTriggers.forEach(trigger => {
        trigger.onclick = (e) => {
            e.preventDefault();
            loginModal.classList.add('active');
            if (mainSidebar) mainSidebar.classList.remove('active'); // Close sidebar on mobile after clicking login
        };
    });

    if (modalClose) {
        modalClose.onclick = () => loginModal.classList.remove('active');
    }

    const updateUI = (user) => {
        // Update Sidebar Auth
        if (authContainerSidebar) {
            authContainerSidebar.innerHTML = `
                <div class="user-sidebar-info">
                    <div class="user-badge-sidebar">
                        <i class="fas fa-user-circle"></i>
                        <span>${user.name}</span>
                    </div>
                    <div class="sidebar-auth-actions">
                        ${user.role === 'admin' ? '<a href="dashboard.html" class="btn-dash-sidebar"><i class="fas fa-tachometer-alt"></i> Dashboard</a>' : ''}
                        <a href="#" class="btn-logout-sidebar logout-action"><i class="fas fa-sign-out-alt"></i> Salir</a>
                    </div>
                </div>
            `;
        }

        // Update Header Auth
        if (authContainerHeader) {
            authContainerHeader.innerHTML = `
                <div class="user-header-info">
                    <div class="user-badge-header">
                        <i class="fas fa-user-circle"></i>
                        <span>${user.name}</span>
                    </div>
                    ${user.role === 'admin' ? '<a href="dashboard.html" class="btn-admin-action" title="Panel de Control"><i class="fas fa-tachometer-alt"></i></a>' : ''}
                    <a href="#" class="btn-admin-action logout logout-action" title="Cerrar sesión"><i class="fas fa-sign-out-alt"></i></a>
                </div>
            `;
        }
        // Update Footer Auth
        if (authContainerFooter) {
            authContainerFooter.innerHTML = `
                <span style="font-weight: 700; color: #c5a059;">Hola, ${user.name}</span>
                ${user.role === 'admin' ? '| <a href="dashboard.html" class="btn-dash-footer" style="text-decoration: none; color: inherit; font-weight: 700; margin: 0 5px;">Dashboard</a>' : ''}
                | <a href="#" class="logout-action" style="text-decoration: none; color: #ef4444; font-weight: 600;">Cerrar sesión</a>
            `;
        }

        // Attach Logout Action
        document.querySelectorAll('.logout-action').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                localStorage.clear();
                window.location.reload();
            };
        });
    };

    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const username = e.target[0].value;
            const password = e.target[1].value;
            const msg = document.getElementById('login-message');

            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem('magnificos_token', data.token);
                    localStorage.setItem('magnificos_user', JSON.stringify(data.user));
                    window.location.reload();
                } else {
                    msg.innerText = data.message;
                    msg.className = 'error-msg';
                }
            } catch (err) {
                alert("Error de conexión con el servidor");
            }
        };
    }

    // Check Auth on load
    const savedUser = localStorage.getItem('magnificos_user');
    if (savedUser) updateUI(JSON.parse(savedUser));

    // --- Load Blogs (Homepage Only) ---
    const blogGrid = document.getElementById('blog-grid');
    let allHomepageBlogs = [];

    const loadBlogs = async () => {
        if (!blogGrid) return;
        try {
            const res = await fetch('/api/blogs');
            const blogs = await res.json();
            allHomepageBlogs = blogs;

            if (blogs.length === 0) {
                blogGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666; padding: 3rem;">No hay noticias todavía.</p>';
                return;
            }
            blogGrid.innerHTML = blogs.map((blog, index) => `
                <article class="blog-card reveal" onclick="openHomeBlogReader(${index})">
                    <div class="blog-img"><img src="${blog.image}" alt=""></div>
                    <div class="blog-info">
                        <span class="blog-date">${blog.date}</span>
                        <h3>${blog.title}</h3>
                        <p>${blog.content.substring(0, 120)}...</p>
                        <span class="blog-link" style="cursor: pointer;">Leer más →</span>
                    </div>
                </article>
            `).join('');

            // Re-trigger reveal animations
            if (window.revealObserver) {
                document.querySelectorAll('.blog-card.reveal').forEach(el => window.revealObserver.observe(el));
            }
        } catch (err) { console.error(err); }
    };

    // --- Load Activities (Homepage Only) ---
    const homeActivitiesGrid = document.getElementById('home-activities-grid');
    const loadHomeActivities = async () => {
        if (!homeActivitiesGrid) return;
        try {
            const res = await fetch('/api/activities?year=2025');
            const activities = await res.json();

            // Ordenar: próximamente primero, finalizadas después
            const getEffectiveStatus = (act) => {
                let status = act.status || 'upcoming';
                if (status !== 'past' && act.date) {
                    const [d, m, y] = act.date.split('/');
                    const actDate = new Date(y, m - 1, d);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (actDate < today) status = 'past';
                }
                return status;
            };
            activities.sort((a, b) => {
                const sa = getEffectiveStatus(a) === 'upcoming' ? 0 : 1;
                const sb = getEffectiveStatus(b) === 'upcoming' ? 0 : 1;
                return sa - sb;
            });

            if (activities.length === 0) {
                homeActivitiesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666; padding: 3rem;">No hay actividades programadas próximamente.</p>';
                return;
            }

            // Mostramos solo las 3 primeras para la home
            const homeActivities = activities.slice(0, 3);
            homeActivitiesGrid.innerHTML = homeActivities.map(act => {
                // Lógica de estado automático
                let status = act.status || 'upcoming';
                if (status !== 'past' && act.date) {
                    const [d, m, y] = act.date.split('/');
                    const actDate = new Date(y, m - 1, d);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (actDate < today) status = 'past';
                }

                return `
                <div class="activity-item reveal">
                    <div class="activity-img">
                        <img src="${act.image}" alt="${act.title}">
                    </div>
                    <div class="activity-info">
                        <div class="status-badge ${status === 'past' ? 'status-past' : 'status-upcoming'}">
                            <span class="status-dot"></span>
                            ${status === 'past' ? 'Finalizada' : 'Próximamente'}
                        </div>
                        <div class="activity-date-full">
                            <i class="far fa-calendar-alt"></i>
                            <span>${act.date}</span>
                        </div>
                        <h3>${act.title}</h3>
                        <p>${act.description}</p>
                    </div>
                </div>
            `}).join('');

            if (window.revealObserver) {
                document.querySelectorAll('.activity-item.reveal').forEach(el => window.revealObserver.observe(el));
            }
        } catch (err) { console.error(err); }
    };

    // --- Load Gallery (Homepage Only) ---
    const homeGalleryGrid = document.getElementById('home-gallery-grid');
    const loadHomeGallery = async () => {
        if (!homeGalleryGrid) return;
        try {
            const res = await fetch('/api/gallery');
            const images = await res.json();

            if (images.length === 0) {
                homeGalleryGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666; padding: 3rem;">No hay fotos en la galería todavía.</p>';
                return;
            }

            // Mostramos solo las 6 últimas fotos
            const homeImages = images.slice(0, 6);
            homeGalleryGrid.innerHTML = homeImages.map(img => `
                <div class="gallery-item reveal-zoom">
                    <img src="${img.image}" alt="${img.title || 'Foto'}">
                    <div class="gallery-overlay"><i class="fas fa-search-plus"></i></div>
                </div>
            `).join('');

            // Re-vincular eventos de lightbox para los nuevos elementos
            const newGalleryItems = homeGalleryGrid.querySelectorAll('.gallery-item');
            newGalleryItems.forEach(item => {
                item.addEventListener('click', () => {
                    lightboxImg.src = item.querySelector('img').src;
                    lightbox.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    if (window.lenis) window.lenis.stop();
                });
            });

            if (window.revealObserver) {
                document.querySelectorAll('.gallery-item.reveal-zoom').forEach(el => window.revealObserver.observe(el));
            }
        } catch (err) { console.error(err); }
    };

    // --- Load Collaborators ---
    const loadCollaborators = async () => {
        const grid = document.getElementById('colaboradores-grid');
        if (!grid) return;

        try {
            const res = await fetch('/api/collaborators');
            const collaborators = await res.json();

            if (collaborators.length === 0) {
                grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; opacity: 0.5;">No hay colaboradores registrados.</p>';
                return;
            }

            grid.innerHTML = collaborators.map(c => `
                <a href="${c.link}" target="_blank" class="colaborador-card reveal">
                    <img src="${c.image}" alt="${c.name}" class="colaborador-logo">
                    <span>${c.name}</span>
                </a>
            `).join('');

            // Observar para animaciones
            if (window.revealObserver) {
                document.querySelectorAll('.colaborador-card.reveal').forEach(el => window.revealObserver.observe(el));
            }
        } catch (e) {
            console.error('Error al cargar colaboradores:', e);
        }
    };

    window.openHomeBlogReader = (index) => {
        const blog = allHomepageBlogs[index];
        if (!blog) return;

        const modal = document.getElementById('blog-modal-reader');
        if (!modal) return;

        document.getElementById('modal-blog-img-reader').src = blog.image || 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=600';
        document.getElementById('modal-blog-date-reader').innerText = blog.date;
        document.getElementById('modal-blog-title-reader').innerText = blog.title;
        document.getElementById('modal-blog-text-reader').innerHTML = blog.content.split('\n').map(p => `<p style="margin-bottom: 1.5rem;">${p}</p>`).join('');

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (window.lenis) window.lenis.stop();
    };

    const closeHomeBlogReader = () => {
        const modal = document.getElementById('blog-modal-reader');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            if (window.lenis) window.lenis.start();
        }
    };

    const closeBtn = document.getElementById('blog-modal-close-reader');
    if (closeBtn) closeBtn.onclick = closeHomeBlogReader;

    const modalOverlay = document.getElementById('blog-modal-reader');
    if (modalOverlay) {
        modalOverlay.onclick = (e) => {
            if (e.target.id === 'blog-modal-reader') closeHomeBlogReader();
        };
    }

    loadBlogs();
    loadHomeActivities();
    loadHomeGallery();
    loadCollaborators();

    // --- Load Settings (Podcast Links) ---
    const loadSettings = async () => {
        try {
            const res = await fetch('/api/settings?t=' + Date.now());
            const settings = await res.json();

            const updatePodcast = (prefix, linkId, imgId, titleId) => {
                const link = document.getElementById(linkId);
                const img = document.getElementById(imgId) || (link ? link.querySelector('img') : null);
                const title = document.getElementById(titleId);

                const linkVal = settings[`${prefix}_link`];
                const logoVal = settings[`${prefix}_logo`];
                const titleVal = settings[`${prefix}_title`];

                if (link && linkVal) link.href = linkVal;
                if (img && logoVal) {
                    const isBase64 = logoVal.startsWith('data:');
                    img.src = isBase64 ? logoVal : `${logoVal}${logoVal.includes('?') ? '&' : '?'}v=${Date.now()}`;
                }
                if (title && titleVal) title.innerText = titleVal;
            };

            // Update Header (if still exists)
            updatePodcast('podcast1', 'podcast-link-1');
            updatePodcast('podcast2', 'podcast-link-2');

            // Update Home Section
            updatePodcast('podcast1', 'home-podcast-link-1', 'home-podcast-img-1', 'home-podcast-title-1');
            updatePodcast('podcast2', 'home-podcast-link-2', 'home-podcast-img-2', 'home-podcast-title-2');

        } catch (err) {
            console.error("Error al cargar configuración:", err);
        }
    };

    loadSettings();

    // --- Live Event Countdown (cargado desde settings) ---
    const countdownEl = document.getElementById('event-countdown');
    if (countdownEl) {
        const loadEventCountdown = async () => {
            try {
                const res = await fetch('/api/settings');
                const settings = await res.json();
                const eventName = settings.event_name || 'Próximo Evento';
                const eventDate = settings.event_date;

                if (!eventDate) {
                    countdownEl.innerText = 'Próximo evento en camino...';
                    return;
                }

                const dateObj = new Date(eventDate + 'T00:00:00');
                const formatted = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
                countdownEl.innerText = `${eventName}: ${formatted}`;
            } catch (err) {
                countdownEl.innerText = 'Próximo evento en camino...';
            }
        };
        loadEventCountdown();
    }

    // --- SCROLL REVEAL ANIMATIONS ---
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-zoom');

    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Animate only once
            }
        });
    };

    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    window.revealObserver = new IntersectionObserver(revealCallback, revealOptions);
    revealElements.forEach(el => window.revealObserver.observe(el));

    // --- Dynamic Timeline Line Growth ---
    const timeline = document.querySelector('.timeline');
    const timelineLine = document.getElementById('timeline-line');

    if (timeline && timelineLine) {
        window.addEventListener('scroll', () => {
            const timelineRect = timeline.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            // Calculate how much of the timeline is visible
            if (timelineRect.top < windowHeight && timelineRect.bottom > 0) {
                const visibleHeight = windowHeight - timelineRect.top;
                const totalHeight = timelineRect.height;
                let progress = (visibleHeight / totalHeight) * 100;

                // Clamp progress between 0 and 100
                progress = Math.min(Math.max(progress, 0), 100);

                // Optional: delay or adjust progress for better feel
                // For a more fluid feel, we can use the center of the viewport
                const centerOffset = windowHeight / 2;
                const scrollProgress = ((centerOffset - timelineRect.top) / totalHeight) * 100;
                const finalProgress = Math.min(Math.max(scrollProgress, 0), 100);

                timelineLine.style.setProperty('--line-height', `${finalProgress}%`);
            }
        });
    }
});

// --- TRACKING ANALYTICS EN TIEMPO REAL ---
(function () {
    // Solo rastreamos en páginas públicas, no en el dashboard
    if (window.location.pathname.includes('dashboard')) return;

    const deviceMatch = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/);
    const deviceType = deviceMatch ? 'Móvil' : 'Desktop';
    const isSocial = document.referrer.includes('facebook') || document.referrer.includes('twitter') || document.referrer.includes('instagram');
    const source = isSocial ? 'Social' : (document.referrer ? 'Referido' : 'Directo');
    // Para simplificar, asignamos "España" pero un caso real usaría una API GeoIP
    const country = 'España';

    setTimeout(() => {
        // Enviar tracking después de 2 segundos (bounce falso si se va antes)
        fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                path: window.location.pathname === '/' || window.location.pathname === '' ? '/inicio' : window.location.pathname,
                country: country,
                device: deviceType,
                source: source,
                bounce: 0 // Si llegó hasta aquí, no es rebote
            })
        }).catch(err => console.log('Tracking no disponible en este entorno.'));
    }, 2000);
})();
