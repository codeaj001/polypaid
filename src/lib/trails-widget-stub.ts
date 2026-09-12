/**
 * Build-time stand-in for the `0xtrails/widget` package.
 * vite.config.ts points the `0xtrails/widget` import at this file only
 * when the real package isn't installed, so the app always builds. Once
 * you `npm install 0xtrails`, vite.config.ts detects it and this stub is
 * no longer used — the real widget takes over automatically.
 */
export const TrailsWidget = undefined;
