/**
 * Ambient module declaration so TypeScript compiles even before the real
 * `0xtrails` package is installed. Once installed, its own shipped types
 * (if any) take precedence for actual usage.
 */
declare module '0xtrails/widget' {
  export const TrailsWidget: any;
}
