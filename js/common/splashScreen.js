/**
 * Controls splash screen animation and logo transition
 * @module splashScreen
 */

/**
 * Initializes splash screen animation and logo transition
 */
function initSplashScreen() {
  const splashScreen = document.getElementById("splash-screen");
  const splashLogo = document.getElementById("splash-logo");
  if (!splashScreen || !splashLogo) return;

  // Responsive values for start and target position
  if (window.innerWidth <= 600) {
    const baseW = 428,
      baseH = 926;
    const w = window.innerWidth,
      h = window.innerHeight;
    // Splash logo start values (centered)
    const start = {
      top: (h - (100 * h) / baseH) / 2,
      left: (w - (121 * w) / baseW) / 2,
      width: (100 * w) / baseW,
      height: (121 * h) / baseH,
    };
    // Target values top left
    const end = {
      top: (37 * h) / baseH,
      left: (38 * w) / baseW,
      width: (64 * w) / baseW,
      height: (78 * h) / baseH,
    };

    // Set splash logo initial values
    splashLogo.style.position = "absolute";
    splashLogo.style.top = start.top + "px";
    splashLogo.style.left = start.left + "px";
    splashLogo.style.width = start.width + "px";
    splashLogo.style.height = start.height + "px";
    splashLogo.style.transition = "all 500ms ease-in-out";
    splashScreen.style.backgroundColor = "#2A3647";
    splashScreen.style.position = "fixed";
    splashScreen.style.inset = "0";
    splashScreen.style.zIndex = "9999";
    splashScreen.style.display = "flex";
    splashScreen.style.justifyContent = "center";
    splashScreen.style.alignItems = "center";

    setTimeout(() => {
      splashLogo.style.top = end.top + "px";
      splashLogo.style.left = end.left + "px";
      splashLogo.style.width = end.width + "px";
      splashLogo.style.height = end.height + "px";
    }, 100);

    splashLogo.addEventListener(
      "transitionend",
      () => {
        splashScreen.style.backgroundColor = "#F6F7F8";

        // Make login card visible (CSS handles positioning)
        const loginCard = document.querySelector(".login-card");
        if (loginCard) {
          loginCard.classList.remove("login-card-hidden");
        }

        // Fade out splash logo after short delay
        setTimeout(() => {
          splashLogo.style.opacity = "0";
          splashLogo.style.pointerEvents = "none";
          splashScreen.style.opacity = "0";
          splashScreen.style.pointerEvents = "none";
        }, 100);
      },
      { once: true }
    );
  } else {
    // Desktop: Hide splash, standard layout remains
    const splashScreen = document.getElementById("splash-screen");
    const splashLogo = document.getElementById("splash-logo");
    if (splashScreen) splashScreen.style.display = "none";
    if (splashLogo) splashLogo.style.display = "none";

    // Make login card visible
    const loginCard = document.querySelector(".login-card");
    if (loginCard) {
      loginCard.classList.remove("login-card-hidden");
    }
  }
}

window.addEventListener("DOMContentLoaded", initSplashScreen);
