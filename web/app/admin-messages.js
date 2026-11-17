// The words of the administration surface that the contract writes, as data, one language at a
// time and never reworded (DEVICE-EXCHANGE items CZ, CY, DA and BR):
//   - the item CZ rows an administration sign-in and session meet, with the rows of items EU and EV
//     (RECOMMENDATIONS-2026-11-12) and the generic refusal of 7.10;
//   - the item CY steps those rows name;
//   - the ten reply codes of REMOTE-ADMIN `administration-reply-codes`, which are no rows of item CZ.
// Read against DEVICE-EXCHANGE 1.12.

const rows = Object.freeze({
  'admin-disabled': {
    code: 'admin-disabled',
    step: null,
    en: 'Remote administration is turned off on this server. Turn it on in the server\'s settings, on the server machine.',
    ru: 'Удалённое администрирование на этом сервере выключено. Включите его в настройках сервера на самом компьютере сервера.',
    uk: 'Віддалене адміністрування на цьому сервері вимкнено. Увімкніть його в налаштуваннях сервера на самому комп\'ютері сервера.',
  },
  'admin-bad-credentials': {
    code: 'bad-credentials',
    step: null,
    en: 'The administrator password is wrong. Type it again - it is set on the server machine.',
    ru: 'Пароль администратора неверен. Введите его ещё раз - он задан на компьютере сервера.',
    uk: 'Пароль адміністратора неправильний. Введіть його ще раз - він заданий на комп\'ютері сервера.',
  },
  'admin-session-ended': {
    code: 'admin-session-ended',
    step: null,
    en: 'The administration session has ended. Sign in again to continue.',
    ru: 'Сеанс администрирования завершён. Войдите снова, чтобы продолжить.',
    uk: 'Сеанс адміністрування завершено. Увійдіть знову, щоб продовжити.',
  },
  'rate-limited': {
    code: 'rate-limited',
    step: 'sign-in-rate',
    en: 'Too many attempts in a row.',
    ru: 'Слишком много попыток подряд.',
    uk: 'Забагато спроб поспіль.',
  },
  capacity: {
    code: 'capacity',
    step: 'operator',
    en: 'The server cannot take this: it has reached a limit of its own, or the item is too big to be listed.',
    ru: 'Сервер не может это принять: он достиг своего предела или объект слишком большой, чтобы показать его в списке.',
    uk: 'Сервер не може це прийняти: він досяг свого ліміту або об\'єкт завеликий, щоб показати його в списку.',
  },
  'tls-required': {
    code: 'tls-required',
    step: 'operator',
    en: 'The server accepts this only over a protected connection, and this one is not protected.',
    ru: 'Сервер принимает это только по защищённому соединению, а это соединение не защищено.',
    uk: 'Сервер приймає це лише через захищене з\'єднання, а це з\'єднання не захищене.',
  },
  'version-unsupported': {
    code: 'version-unsupported',
    step: 'operator',
    en: 'This program and the server speak different versions of the exchange.',
    ru: 'Эта программа и сервер работают по разным версиям обмена.',
    uk: 'Ця програма і сервер працюють за різними версіями обміну.',
  },
  unanswered: {
    code: 'unanswered',
    step: 'operator',
    en: 'The server did not answer.',
    ru: 'Сервер не ответил.',
    uk: 'Сервер не відповів.',
  },
  unreachable: {
    code: 'unreachable',
    step: 'pc-asleep',
    en: 'Cannot reach the server.',
    ru: 'Не удаётся связаться с сервером.',
    uk: 'Не вдається зв\'язатися із сервером.',
  },
  generic: {
    code: 'refused',
    step: 'operator',
    en: 'The server refused this.',
    ru: 'Сервер отказал в этом.',
    uk: 'Сервер відмовив у цьому.',
  },
});

const steps = Object.freeze({
  'pc-asleep': {
    en: 'Switch on and wake the device that runs the server or the sharing service, and keep it from going to sleep.',
    ru: 'Включите и разбудите устройство, на котором работает сервер или сервис шаринга, и не давайте ему засыпать.',
    uk: 'Увімкніть і розбудіть пристрій, на якому працює сервер або сервіс шарингу, і не давайте йому засинати.',
  },
  'sign-in-rate': {
    en: 'Wait a few seconds and try again: the server takes about one attempt per second.',
    ru: 'Подождите несколько секунд и попробуйте снова: сервер принимает не больше одной попытки в секунду.',
    uk: 'Зачекайте кілька секунд і спробуйте знову: сервер приймає не більше однієї спроби на секунду.',
  },
  operator: {
    en: 'Ask whoever runs the server: this can be fixed only on the server\'s side.',
    ru: 'Обратитесь к тому, кто управляет сервером: исправить это можно только на стороне сервера.',
    uk: 'Зверніться до того, хто керує сервером: виправити це можна лише на боці сервера.',
  },
});

const replyCodes = Object.freeze({
  'bad-request': {
    en: 'The server did not accept this request. Check what was entered and try again.',
    ru: 'Сервер не принял этот запрос. Проверьте введённое и повторите.',
    uk: 'Сервер не прийняв цей запит. Перевірте введене й повторіть.',
  },
  'no-account': {
    en: 'There is no such account.',
    ru: 'Такой учётной записи нет.',
    uk: 'Такого облікового запису немає.',
  },
  exists: {
    en: 'This already exists on the server.',
    ru: 'Это уже есть на сервере.',
    uk: 'Це вже є на сервері.',
  },
  'bad-login': {
    en: 'The login is not allowed: 3 to 64 characters - lower-case Latin letters, digits, dot, underscore and hyphen.',
    ru: 'Логин не принят: от 3 до 64 символов - строчные латинские буквы, цифры, точка, подчёркивание и дефис.',
    uk: 'Логін не прийнято: від 3 до 64 символів - малі латинські літери, цифри, крапка, підкреслення й дефіс.',
  },
  'weak-password': {
    en: 'The password was not accepted: it does not meet the rules.',
    ru: 'Пароль не принят: он не соответствует правилам.',
    uk: 'Пароль не прийнято: він не відповідає правилам.',
  },
  'not-found': {
    en: 'It was not found on the server. It may have been removed already.',
    ru: 'Этого нет на сервере. Возможно, оно уже удалено.',
    uk: 'Цього немає на сервері. Можливо, воно вже видалене.',
  },
  capacity: {
    en: 'The server cannot take this now: a limit of its own is reached. Try again later.',
    ru: 'Сервер сейчас не может это принять: достигнут его предел. Повторите позже.',
    uk: 'Сервер зараз не може це прийняти: досягнуто його ліміту. Повторіть пізніше.',
  },
  'bad-kind': {
    en: 'An account is either "own device or family" or "guest".',
    ru: 'Учётная запись бывает либо «своё устройство или семья», либо «гость».',
    uk: 'Обліковий запис буває або «свій пристрій або сім\'я», або «гість».',
  },
  'bad-limit': {
    en: 'A limit is not allowed: it must be a whole number inside the range the server accepts.',
    ru: 'Предел не принят: нужно целое число в границах, которые принимает сервер.',
    uk: 'Ліміт не прийнято: потрібне ціле число в межах, які приймає сервер.',
  },
  internal: {
    en: 'The server could not do this. Details are in the server\'s log.',
    ru: 'Серверу не удалось это сделать. Подробности - в журнале сервера.',
    uk: 'Серверу не вдалося це зробити. Подробності - в журналі сервера.',
  },
});

const languages = ['en', 'ru', 'uk'];

function pick(entry, language) {
  return entry[languages.includes(language) ? language : 'en'];
}

// A sign-in or session row: what happened, then what to try (the step's text, or nothing when the
// row carries its own advice), and the code for the details line - never the headline (item DA).
// `id` is a key of the rows above or a wire `refused.reason`; an unknown one is the generic refusal.
export function rowMessage(id, language) {
  const row = rows[id] ?? rows.generic;
  return Object.freeze({
    code: rows[id] ? row.code : id,
    what: pick(row, language),
    advice: row.step ? pick(steps[row.step], language) : '',
  });
}

// The words of a failed `admin-reply` code; a code with no row shows the row of `internal`.
export function replyMessage(code, language) {
  const known = Object.hasOwn(replyCodes, code);
  return Object.freeze({ code, what: pick(replyCodes[known ? code : 'internal'], language), advice: '' });
}

// The id of the row for a refusal of `admin-auth` itself (item EU): a wrong password has its own row.
export function signInRowId(reason) {
  return reason === 'bad-credentials' ? 'admin-bad-credentials' : reason;
}

export const messageIds = Object.freeze(Object.keys(rows));
export const replyCodeIds = Object.freeze(Object.keys(replyCodes));
