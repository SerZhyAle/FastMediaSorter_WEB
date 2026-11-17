// The viewer rows of VIEWER-KEYBOARD (INPUT-PARITY 0.5) that this surface offers. Letters are read
// from the physical key (`code`), so they work on every layout (INPUT-CHORD rule 1). A chord with
// Ctrl, Alt or the platform key stays the browser's.

const letterCommands = Object.freeze({
  KeyY: 'random',
  KeyN: 'jump',
  KeyG: 'toggleGrid',
  KeyF: 'fullscreen',
  KeyS: 'slideshow',
  KeyI: 'randomSlideshow',
});

// The player rows of the same table: on a video or audio view. Ctrl+arrows exist only there; any
// other chord with Ctrl stays the browser's.
function playerCommand({ key, code, shiftKey, ctrlKey }) {
  if (ctrlKey) {
    if (shiftKey) return null;
    return { ArrowLeft: 'seekBack60', ArrowRight: 'seekForward60', ArrowUp: 'volumeUp', ArrowDown: 'volumeDown' }[key] ?? null;
  }
  if (key === 'MediaPlayPause') return 'playPause';
  if (key === 'ArrowLeft') return shiftKey ? 'seekBack3' : 'seekBack10';
  if (key === 'ArrowRight') return shiftKey ? 'seekForward3' : 'seekForward10';
  if (shiftKey) return code === 'KeyL' ? 'abLoop' : null;
  if (key === ' ' || code === 'KeyK') return 'playPause';
  return {
    BracketLeft: 'slower', BracketRight: 'faster', Backslash: 'normalSpeed',
    Period: 'frameForward', Comma: 'frameBack', KeyM: 'mute',
  }[code] ?? null;
}

export function viewerCommand(event, { isPlayer = false } = {}) {
  if (event.altKey || event.metaKey) return null;
  if (isPlayer) {
    const command = playerCommand(event);
    if (command || event.ctrlKey) return command;
  }
  if (event.ctrlKey) return null;
  const { key, code, shiftKey } = event;
  switch (key) {
    case 'PageDown': return shiftKey ? 'forward100' : 'next';
    case 'PageUp': return shiftKey ? 'back100' : 'previous';
    case 'Home': return 'first';
    case 'End': return 'last';
    case 'ArrowUp': return 'back10';
    case 'ArrowDown': return 'forward10';
    case 'ArrowRight': return isPlayer ? null : 'next';
    case 'ArrowLeft': return isPlayer ? null : 'previous';
    case ' ': return isPlayer || shiftKey ? null : 'next';
    case 'F4': return 'chooseFromList';
    case 'Escape': return 'back';
    default: break;
  }
  if (code === 'NumpadAdd' || key === '+' || key === '=') return 'zoomIn';
  if (code === 'NumpadSubtract' || key === '-') return 'zoomOut';
  if (code === 'NumpadDivide') return 'fit';
  if (code === 'NumpadMultiply') return 'actualSize';
  if (code === 'KeyR') return shiftKey ? 'rotateLeft' : 'rotateRight';
  if (!shiftKey && letterCommands[code]) return letterCommands[code];
  return null;
}

// The ten destination slots of VIEWER-KEYBOARD: the top-row digits and the keypad digits, read
// from the physical key so every layout works. Shift+digit (copy) is not offered here; a chord
// with Ctrl, Alt or the platform key stays the browser's. Returns '0'..'9' or null.
export function destinationSlot(event) {
  if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return null;
  const match = /^(Digit|Numpad)([0-9])$/u.exec(event.code ?? '');
  if (!match) return null;
  // With Num Lock off a keypad key is End, PageDown and the rest, and stays navigation.
  if (match[1] === 'Numpad' && event.key !== match[2]) return null;
  return match[2];
}

export const destinationSlots = Object.freeze(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);

// Chords as INPUT-CHORD rule 5 shows them: Latin modifier names, `+` between keys.
export const commandChords = Object.freeze({
  next: 'PageDown',
  previous: 'PageUp',
  random: 'Y',
  jump: 'N',
  zoomIn: '+',
  zoomOut: '-',
  rotateRight: 'R',
  rotateLeft: 'Shift+R',
  fullscreen: 'F',
  slideshow: 'S',
  randomSlideshow: 'I',
  back: 'Esc',
  playPause: 'K',
  seekBack10: 'Left',
  seekForward10: 'Right',
  slower: '[',
  faster: ']',
  normalSpeed: '\\',
  frameForward: '.',
  frameBack: ',',
  abLoop: 'Shift+L',
  mute: 'M',
  volumeUp: 'Ctrl+Up',
  volumeDown: 'Ctrl+Down',
});
