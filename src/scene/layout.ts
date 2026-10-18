/** Keep canvas and SVG on one vertical anchor until the document catches up.
 * Interpolating the profile's remaining scroll distance late in the handoff
 * makes the face move down briefly before it resumes scrolling upward. */
export function portraitPlacement(
  profileTop: number,
  naturalPortraitTop: number,
) {
  const offset = -Math.max(0, profileTop);
  return { offset, top: naturalPortraitTop + offset };
}
