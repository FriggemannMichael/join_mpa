    // Brand-Splash-Logo in Mobile ausblenden
    const brandSplash = document.getElementById('brandSplash');
    if (window.innerWidth <= 600 && brandSplash) {
        brandSplash.style.display = 'none';
    }
/**
 * Steuert Splash-Screen Animation und Logo-Wechsel
 * @module splashScreen
 */

/**
 * Initialisiert Splash-Screen Animation und Logo-Tausch
 */
function initSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    const splashLogo = document.getElementById('splash-logo');
    if (!splashScreen || !splashLogo) return;

    // Responsive Werte für Start- und Zielposition
    if (window.innerWidth <= 600) {
        const baseW = 428, baseH = 926;
        const w = window.innerWidth, h = window.innerHeight;
        // Splash Logo Startwerte (zentriert)
        const start = {
            top: ((h - (100 * h / baseH)) / 2),
            left: ((w - (121 * w / baseW)) / 2),
            width: 100 * w / baseW,
            height: 121 * h / baseH
        };
        // Zielwerte oben links
        const end = {
            top: 37 * h / baseH,
            left: 38 * w / baseW,
            width: 64 * w / baseW,
            height: 78 * h / baseH
        };

        // Splash Logo initial setzen
        splashLogo.style.position = 'absolute';
        splashLogo.style.top = start.top + 'px';
        splashLogo.style.left = start.left + 'px';
        splashLogo.style.width = start.width + 'px';
        splashLogo.style.height = start.height + 'px';
    splashLogo.style.transition = 'all 500ms ease-in-out';
        splashScreen.style.backgroundColor = '#2A3647';
        splashScreen.style.position = 'fixed';
        splashScreen.style.inset = '0';
        splashScreen.style.zIndex = '9999';
        splashScreen.style.display = 'flex';
        splashScreen.style.justifyContent = 'center';
        splashScreen.style.alignItems = 'center';

        setTimeout(() => {
            splashLogo.style.top = end.top + 'px';
            splashLogo.style.left = end.left + 'px';
            splashLogo.style.width = end.width + 'px';
            splashLogo.style.height = end.height + 'px';
        }, 100);

        splashLogo.addEventListener('transitionend', () => {
            splashScreen.style.backgroundColor = '#F6F7F8';

            // Login-Logo einblenden und positionieren (direkt nach Animation)
            const loginLogo = document.getElementById('login-logo');
            if (loginLogo) {
                loginLogo.style.display = 'block';
                loginLogo.style.position = 'absolute';
                loginLogo.style.top = (37 * h / baseH) + 'px';
                loginLogo.style.left = (38 * w / baseW) + 'px';
                loginLogo.style.width = (64 * w / baseW) + 'px';
                loginLogo.style.height = (78 * h / baseH) + 'px';
            }

            // Login-Bereich direkt anpassen
            const loginCard = document.querySelector('.login-card');
            if (loginCard) {
                loginCard.style.display = 'flex';
                loginCard.style.position = 'absolute';
                loginCard.style.top = (225 * h / baseH) + 'px';
                loginCard.style.left = (16 * w / baseW) + 'px';
                loginCard.style.width = (396 * w / baseW) + 'px';
                loginCard.style.height = (475 * h / baseH) + 'px';
                loginCard.style.borderRadius = (30 * w / baseW) + 'px';
                loginCard.style.background = '#fff';
                loginCard.style.boxShadow = '0 0 14px 3px rgba(0,0,0,0.04)';
                loginCard.style.flexDirection = 'column';
                loginCard.style.paddingTop = (32 * h / baseH) + 'px';
                loginCard.style.paddingBottom = (32 * h / baseH) + 'px';
                loginCard.style.gap = (32 * h / baseH) + 'px';
            }

            // Splash-Logo erst nach kurzem Delay ausblenden
            setTimeout(() => {
                splashLogo.style.opacity = '0';
                splashLogo.style.pointerEvents = 'none';
                splashScreen.style.opacity = '0';
                splashScreen.style.pointerEvents = 'none';
            }, 100);
        }, { once: true });
    } else {
        // Desktop: Splash und Login-Logo ausblenden, Standard-Layout bleibt
        const splashScreen = document.getElementById('splash-screen');
        const splashLogo = document.getElementById('splash-logo');
        const loginLogo = document.getElementById('login-logo');
        if (splashScreen) splashScreen.style.display = 'none';
        if (splashLogo) splashLogo.style.display = 'none';
        if (loginLogo) loginLogo.style.display = 'none';
        const loginContainer = document.getElementById('login-container');
        if (loginContainer) loginContainer.style.display = '';
    }
}

window.addEventListener('DOMContentLoaded', initSplashScreen);
