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

            // Login-Card sichtbar machen (CSS übernimmt die Positionierung)
            const loginCard = document.querySelector('.login-card');
            if (loginCard) {
                loginCard.classList.remove('login-card-hidden');
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
        // Desktop: Splash ausblenden, Standard-Layout bleibt
        const splashScreen = document.getElementById('splash-screen');
        const splashLogo = document.getElementById('splash-logo');
        if (splashScreen) splashScreen.style.display = 'none';
        if (splashLogo) splashLogo.style.display = 'none';

        // Login-Card sichtbar machen
        const loginCard = document.querySelector('.login-card');
        if (loginCard) {
            loginCard.classList.remove('login-card-hidden');
        }
    }
}

window.addEventListener('DOMContentLoaded', initSplashScreen);
