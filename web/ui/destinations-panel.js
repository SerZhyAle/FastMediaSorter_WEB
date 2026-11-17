import { commandButton, element } from './components.js';

// The destination settings panel inside the viewer (owner ruling 2026-11-10): one row per slot,
// in key order 1..9, 0, each with its key, its folder and the actions. The sorter object of
// app/sorting.js owns the slots; this module draws them and forwards the person's input.

function fill(text, values) {
  return text.replace(/\{(\w+)\}/gu, (match, name) => String(values[name] ?? match));
}

export function destinationsPanel({ sorter, strings, slots }) {
  const rows = slots.map((slot) => {
    const handle = sorter.state.slots.get(slot);
    const label = fill(strings.destinationSlot, { n: slot });
    return element('li', { class: 'destination-row', 'data-slot': slot }, [
      element('kbd', { class: 'destination-key', title: label, text: slot }),
      element('span', { class: handle ? 'destination-folder' : 'destination-folder is-unset', text: handle ? handle.name : strings.destinationNotSet }),
      element('div', { class: 'command-row destination-actions', role: 'group', 'aria-label': label }, [
        commandButton({ id: `destination.choose.${slot}`, label: strings.chooseDestination, onActivate: () => sorter.choose(slot) }),
        handle ? commandButton({
          id: `destination.move.${slot}`, label: strings.moveHere, rank: 'primary',
          attributes: { title: `${strings.moveHere} (${slot})` }, onActivate: () => sorter.moveCurrentTo(slot),
        }) : null,
        handle ? commandButton({ id: `destination.clear.${slot}`, label: strings.clearDestination, rank: 'secondary', onActivate: () => sorter.clear(slot) }) : null,
      ]),
    ]);
  });
  return element('section', { class: 'destinations', 'aria-label': strings.destinations }, [
    element('p', { class: 'explanation', text: strings.destinationsHint }),
    element('ol', { class: 'destination-list' }, rows),
    element('div', { class: 'command-row' }, [
      commandButton({ id: 'destination.close', label: strings.closeDestinations, rank: 'secondary', onActivate: () => sorter.closePanel() }),
    ]),
  ]);
}
