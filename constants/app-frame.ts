// Referenzmaße aus den mobilen Hintergrundbildern (bg1-bg4: 1024x1536).
// Daraus leiten wir ein stabiles Handy-Seitenverhältnis für Desktop ab.
const referenceBackgroundWidth = 1024;
const referenceBackgroundHeight = 1536;

// Zielbereich der sichtbaren App-Breite im Desktopmodus.
const contentMinWidth = 420;
const contentMaxWidth = 480;

// Seitlicher Freiraum links/rechts bis zum Wechsel in den Desktop-Frame.
const desktopSideSpace = Math.floor((referenceBackgroundWidth - contentMaxWidth) / 2);

// Dunkelgrüne, natürliche Farbpalette für den Desktop-Hintergrund.
const desktopBackgroundGradientColors = ['#72c5df', '#1c6d45', '#ad7642'] as const;

// Vertikaler Abstand oben/unten um den zentrierten App-Frame.
const desktopVerticalInset = 24;

// Effektive App-Breite im Desktopmodus, hart zwischen min/max begrenzt.
const desktopContentWidth = Math.min(
  contentMaxWidth,
  Math.max(contentMinWidth, referenceBackgroundWidth)
);

// Zentrale, leicht anpassbare Layout-Konfiguration für den AppFrame.
export const APP_FRAME_CONFIG = {
  referenceBackgroundWidth,
  referenceBackgroundHeight,
  referencePhoneAspectRatio: referenceBackgroundHeight / referenceBackgroundWidth,
  desktopContentMinWidth: contentMinWidth,
  desktopContentMaxWidth: contentMaxWidth,
  desktopSideSpace,
  desktopBackgroundGradientColors,
  desktopVerticalInset,
  desktopContentWidth,
  desktopBreakpoint: desktopContentWidth + desktopSideSpace * 2,
} as const;
