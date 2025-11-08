/**
 * Controls splash screen animation and logo transition
 * @module splashScreen
 */

/**
 * Initializes splash screen animation and logo transition
 */
function initSplashScreen() {
  const elements = getSplashElements();
  if (!elements) return;
  if (isMobileViewport()) {
    runMobileSplashAnimation(elements);
    return;
  }
  hideSplashForDesktop(elements);
}

/**
 * Provides splash screen elements if available
 * @returns {{splashScreen: HTMLElement, splashLogo: HTMLElement}|null}
 */
function getSplashElements() {
  const splashScreen = document.getElementById("splash-screen");
  const splashLogo = document.getElementById("splash-logo");
  if (!splashScreen || !splashLogo) return null;
  return { splashScreen, splashLogo };
}

/**
 * Detects if viewport should use mobile animation
 * @returns {boolean}
 */
function isMobileViewport() {
  return window.innerWidth <= 600;
}

/**
 * Runs mobile splash animation sequence
 * @param {{splashScreen: HTMLElement, splashLogo: HTMLElement}} elements
 */
function runMobileSplashAnimation({ splashScreen, splashLogo }) {
  const frames = buildMobileFrames();
  prepareLogoForAnimation(splashLogo, frames.start);
  configureMobileScreen(splashScreen);
  animateMobileLogo(splashLogo, frames.end);
  splashLogo.addEventListener(
    "transitionend",
    () => handleTransitionFinish(splashScreen, splashLogo),
    { once: true }
  );
}

/**
 * Builds start and end frames for mobile animation
 * @returns {{start: object, end: object}}
 */
function buildMobileFrames() {
  const base = { width: 428, height: 926 };
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  return {
    start: buildMobileStartFrame(base, viewport),
    end: buildMobileEndFrame(base, viewport),
  };
}

/**
 * Builds the starting frame for the logo
 * @param {{width:number,height:number}} base
 * @param {{width:number,height:number}} viewport
 * @returns {{top:number,left:number,width:number,height:number}}
 */
function buildMobileStartFrame(base, viewport) {
  return {
    top: (viewport.height - (100 * viewport.height) / base.height) / 2,
    left: (viewport.width - (121 * viewport.width) / base.width) / 2,
    width: (100 * viewport.width) / base.width,
    height: (121 * viewport.height) / base.height,
  };
}

/**
 * Builds the ending frame for the logo
 * @param {{width:number,height:number}} base
 * @param {{width:number,height:number}} viewport
 * @returns {{top:number,left:number,width:number,height:number}}
 */
function buildMobileEndFrame(base, viewport) {
  return {
    top: (37 * viewport.height) / base.height,
    left: (38 * viewport.width) / base.width,
    width: (64 * viewport.width) / base.width,
    height: (78 * viewport.height) / base.height,
  };
}

/**
 * Applies absolute positioning and transition to logo
 * @param {HTMLElement} splashLogo
 * @param {{top:number,left:number,width:number,height:number}} frame
 */
function prepareLogoForAnimation(splashLogo, frame) {
  splashLogo.style.position = "absolute";
  splashLogo.style.transition = "all 500ms ease-in-out";
  applyLogoFrame(splashLogo, frame);
}

/**
 * Applies frame values to logo element
 * @param {HTMLElement} splashLogo
 * @param {{top:number,left:number,width:number,height:number}} frame
 */
function applyLogoFrame(splashLogo, frame) {
  splashLogo.style.top = `${frame.top}px`;
  splashLogo.style.left = `${frame.left}px`;
  splashLogo.style.width = `${frame.width}px`;
  splashLogo.style.height = `${frame.height}px`;
}

/**
 * Configures splash screen container for animation
 * @param {HTMLElement} splashScreen
 */
function configureMobileScreen(splashScreen) {
  splashScreen.style.backgroundColor = "#2A3647";
  splashScreen.style.position = "fixed";
  splashScreen.style.inset = "0";
  splashScreen.style.zIndex = "9999";
  splashScreen.style.display = "flex";
  splashScreen.style.justifyContent = "center";
  splashScreen.style.alignItems = "center";
}

/**
 * Animates logo towards end frame
 * @param {HTMLElement} splashLogo
 * @param {{top:number,left:number,width:number,height:number}} endFrame
 */
function animateMobileLogo(splashLogo, endFrame) {
  setTimeout(() => applyLogoFrame(splashLogo, endFrame), 100);
}

/**
 * Handles mobile animation completion
 * @param {HTMLElement} splashScreen
 * @param {HTMLElement} splashLogo
 */
function handleTransitionFinish(splashScreen, splashLogo) {
  splashScreen.style.backgroundColor = "#F6F7F8";
  revealLoginCard();
  scheduleSplashFadeOut(splashScreen, splashLogo);
}

/**
 * Reveals login card after splash
 */
function revealLoginCard() {
  const loginCard = document.querySelector(".login-card");
  if (!loginCard) return;
  loginCard.classList.remove("login-card-hidden");
}

/**
 * Fades splash elements after transition
 * @param {HTMLElement} splashScreen
 * @param {HTMLElement} splashLogo
 */
function scheduleSplashFadeOut(splashScreen, splashLogo) {
  setTimeout(() => {
    splashLogo.style.opacity = "0";
    splashLogo.style.pointerEvents = "none";
    splashScreen.style.opacity = "0";
    splashScreen.style.pointerEvents = "none";
  }, 100);
}

/**
 * Hides splash when large viewport is detected
 * @param {{splashScreen: HTMLElement, splashLogo: HTMLElement}} elements
 */
function hideSplashForDesktop({ splashScreen, splashLogo }) {
  splashScreen.style.display = "none";
  splashLogo.style.display = "none";
  revealLoginCard();
}

window.addEventListener("DOMContentLoaded", initSplashScreen);
