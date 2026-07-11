const STORAGE_KEYS = { settings:'rusk-settings', history:'rusk-task-history' };
let settingsStorageReadable = true;

function readStoredJson(key, fallback) {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try { return JSON.parse(raw); }
  catch (error) {
    if (key === STORAGE_KEYS.settings) settingsStorageReadable = false;
    console.error(`保存データを読み込めませんでした: ${key}`, error);
    return fallback;
  }
}

function writeSettings(value) {
  if (!settingsStorageReadable) return false;
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(value));
  return true;
}

const defaultRoutines = [
  { id:'morning-toilet', title:'トイレに行く', genre:'personal', period:'morning', weekdayStart:'06:40', weekdayEnd:'06:45', weekendStart:'08:00', weekendEnd:'08:05', enabled:true },
  { id:'morning-wash', title:'洗顔', genre:'personal', period:'morning', weekdayStart:'06:45', weekdayEnd:'06:55', weekendStart:'08:05', weekendEnd:'08:15', enabled:true },
  { id:'morning-breakfast', title:'朝食', genre:'personal', period:'morning', weekdayStart:'06:55', weekdayEnd:'07:15', weekendStart:'08:15', weekendEnd:'08:35', enabled:true },
  { id:'morning-dishes', title:'朝食後皿洗い', genre:'personal', period:'morning', weekdayStart:'07:15', weekdayEnd:'07:23', weekendStart:'08:35', weekendEnd:'08:43', enabled:true },
  { id:'morning-brush', title:'歯磨き', genre:'personal', period:'morning', weekdayStart:'07:23', weekdayEnd:'07:26', weekendStart:'08:43', weekendEnd:'08:46', enabled:true },
  { id:'morning-makeup', title:'メイク', genre:'personal', period:'morning', weekdayStart:'07:26', weekdayEnd:'07:36', weekendStart:'08:46', weekendEnd:'08:56', enabled:true },
  { id:'morning-hair', title:'ヘアセット', genre:'personal', period:'morning', weekdayStart:'07:36', weekdayEnd:'07:41', weekendStart:'08:56', weekendEnd:'09:01', enabled:true },
  { id:'morning-bag', title:'荷物準備を作る', genre:'personal', period:'morning', weekdayStart:'07:41', weekdayEnd:'07:44', weekendStart:'09:01', weekendEnd:'09:04', enabled:true },
  { id:'night-unpack', title:'荷物を片付ける', genre:'personal', period:'night', weekdayStart:'20:00', weekdayEnd:'20:05', weekendStart:'19:00', weekendEnd:'19:05', enabled:true },
  { id:'night-clothes', title:'着替えを準備する', genre:'personal', period:'night', weekdayStart:'20:05', weekdayEnd:'20:10', weekendStart:'19:05', weekendEnd:'19:10', enabled:true },
  { id:'night-bath', title:'入浴', genre:'personal', period:'night', weekdayStart:'20:10', weekdayEnd:'20:40', weekendStart:'19:10', weekendEnd:'19:40', enabled:true },
  { id:'night-lotion', title:'化粧水', genre:'personal', period:'night', weekdayStart:'20:40', weekdayEnd:'20:45', weekendStart:'19:40', weekendEnd:'19:45', enabled:true },
  { id:'night-dryer', title:'ドライヤー', genre:'personal', period:'night', weekdayStart:'20:45', weekdayEnd:'21:00', weekendStart:'19:45', weekendEnd:'20:00', enabled:true },
  { id:'night-dishes', title:'夕食皿洗い', genre:'personal', period:'night', weekdayStart:'21:30', weekdayEnd:'21:45', weekendStart:'20:30', weekendEnd:'20:45', enabled:true },
  { id:'night-brush', title:'歯磨き', genre:'personal', period:'night', weekdayStart:'22:30', weekdayEnd:'22:35', weekendStart:'22:00', weekendEnd:'22:05', enabled:true },
  { id:'review', title:'今日をふりかえる', genre:'study', period:'night', weekdayStart:'22:35', weekdayEnd:'22:45', weekendStart:'22:05', weekendEnd:'22:15', enabled:true },
  { id:'other-vacuum', title:'掃除機かけ', genre:'personal', period:'other', weekdayStart:'09:00', weekdayEnd:'09:15', weekendStart:'09:00', weekendEnd:'09:15', enabled:true },
  { id:'other-toilet-cleaning', title:'トイレ掃除', genre:'personal', period:'other', weekdayStart:'09:00', weekdayEnd:'09:15', weekendStart:'09:00', weekendEnd:'09:15', enabled:true },
  { id:'other-sink', title:'シンク掃除', genre:'personal', period:'other', weekdayStart:'09:00', weekdayEnd:'09:15', weekendStart:'09:00', weekendEnd:'09:15', enabled:true },
  { id:'other-bathroom', title:'浴室掃除', genre:'personal', period:'other', weekdayStart:'09:00', weekdayEnd:'09:20', weekendStart:'09:00', weekendEnd:'09:20', enabled:true },
  { id:'other-declutter', title:'断捨離', genre:'personal', period:'other', weekdayStart:'09:00', weekdayEnd:'09:30', weekendStart:'09:00', weekendEnd:'09:30', enabled:true }
];

const settings = readStoredJson(STORAGE_KEYS.settings, {});
const periodOptions = [
  {value:'morning',label:'朝'},
  {value:'daytime',label:'昼'},
  {value:'night',label:'夜'},
  {value:'other',label:'その他'}
];
const genreOptions = [
  {value:'work',label:'仕事'},
  {value:'personal',label:'くらし'},
  {value:'study',label:'学び'},
  {value:'important',label:'大切なこと'}
];

function routinePeriod(routine) {
  if (routine.period) return routine.period;
  if (routine.id === 'morning') return 'morning';
  if (routine.id === 'exercise') return 'daytime';
  return 'night';
}

const savedRoutines = Array.isArray(settings.routines) ? settings.routines : [];
const sourceRoutines = settings.routineSchemaVersion === 3
  ? savedRoutines
  : [...savedRoutines, ...defaultRoutines.filter(routine => !new Set(savedRoutines.map(item => item.id)).has(routine.id))];
let routines = sourceRoutines.map((routine, index) => ({
  ...routine,
  period:routinePeriod(routine),
  weekdayStart:routine.weekdayStart || routine.start || settings.defaultStart || '09:00',
  weekdayEnd:routine.weekdayEnd || routine.end || settings.defaultEnd || '10:00',
  weekendStart:routine.weekendStart || routine.start || settings.defaultStart || '09:00',
  weekendEnd:routine.weekendEnd || routine.end || settings.defaultEnd || '10:00',
  order:routine.order ?? index
}));

const holder = document.querySelector('#routine-settings');
const defaultStart = document.querySelector('#default-start');
const defaultEnd = document.querySelector('#default-end');
defaultStart.value = settings.defaultStart || '09:00';
defaultEnd.value = settings.defaultEnd || '10:00';

function normalizeRoutineOrder() {
  routines = periodOptions.flatMap(period => routines.filter(routine => routine.period === period.value));
  routines.forEach((routine, index) => {
    routine.order = index;
    routine.weekdayDurationMinutes = durationBetween(routine.weekdayStart,routine.weekdayEnd);
    routine.weekendDurationMinutes = durationBetween(routine.weekendStart,routine.weekendEnd);
  });
}

function durationBetween(start, end) {
  const [startHour,startMinute] = (start || '00:00').split(':').map(Number);
  const [endHour,endMinute] = (end || '00:00').split(':').map(Number);
  let minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  if (minutes < 0) minutes += 24 * 60;
  return minutes;
}

function saveAllSettings(showFeedback = false) {
  normalizeRoutineOrder();
  const saved = writeSettings({
    ...settings,
    defaultStart:defaultStart.value || '09:00',
    defaultEnd:defaultEnd.value || '10:00',
    routineSchemaVersion:3,
    routines
  });
  if (showFeedback && saved) {
    const button = document.querySelector('#save-settings');
    button.textContent = '保存しました';
    setTimeout(() => { button.textContent = '保存する'; }, 1300);
  }
}

let autoSaveTimer;
function scheduleAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => saveAllSettings(false), 180);
}

function timeInput(value, className) {
  const input = document.createElement('input');
  input.type = 'time';
  input.value = value;
  input.className = className;
  return input;
}

function timeRow(label, start, end, group) {
  const row = document.createElement('div');
  row.className = 'routine-time-row';
  const labelNode = document.createElement('span');
  labelNode.textContent = label;
  row.append(labelNode, timeInput(start,`${group}-start`), document.createTextNode('〜'), timeInput(end,`${group}-end`));
  return row;
}

function periodPicker(selectedPeriod, id) {
  const fieldset = document.createElement('fieldset');
  fieldset.className = 'routine-period-picker';
  const legend = document.createElement('legend');
  legend.textContent = '表示する時間帯';
  fieldset.append(legend);
  periodOptions.forEach(option => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = `routine-period-${id}`;
    input.value = option.value;
    input.checked = option.value === selectedPeriod;
    label.append(input, document.createTextNode(option.label));
    fieldset.append(label);
  });
  return fieldset;
}

function updateRoutineFromCard(card) {
  const routine = routines.find(item => item.id === card.dataset.id);
  if (!routine) return;
  routine.title = card.querySelector('.routine-title').value.trim() || '名前のないルーティン';
  routine.genre = card.querySelector('.routine-genre').value;
  routine.period = card.querySelector('.routine-period-picker input:checked')?.value || 'morning';
  routine.weekdayStart = card.querySelector('.weekday-start').value || '09:00';
  routine.weekdayEnd = card.querySelector('.weekday-end').value || '10:00';
  routine.weekendStart = card.querySelector('.weekend-start').value || '09:00';
  routine.weekendEnd = card.querySelector('.weekend-end').value || '10:00';
  routine.enabled = card.querySelector('.routine-enabled').checked;
}

function moveRoutine(id, direction) {
  const routine = routines.find(item => item.id === id);
  if (!routine) return;
  const group = routines.filter(item => item.period === routine.period);
  const index = group.findIndex(item => item.id === id);
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= group.length) return;
  [group[index], group[targetIndex]] = [group[targetIndex], group[index]];
  let groupIndex = 0;
  routines = routines.map(item => item.period === routine.period ? group[groupIndex++] : item);
  saveAllSettings(false);
  renderRoutines();
}

function createRoutineCard(routine, groupIndex, groupLength) {
  const card = document.createElement('div');
  card.className = 'routine-editor';
  card.dataset.id = routine.id;
  const top = document.createElement('div');
  top.className = 'routine-editor-top';
  const enabled = document.createElement('input');
  enabled.type = 'checkbox';
  enabled.checked = routine.enabled;
  enabled.className = 'routine-enabled';
  const title = document.createElement('input');
  title.type = 'text';
  title.maxLength = 30;
  title.value = routine.title;
  title.className = 'routine-title';
  title.setAttribute('aria-label','ルーティン名');
  const orderActions = document.createElement('div');
  orderActions.className = 'routine-order-actions';
  const up = document.createElement('button');
  up.type = 'button';
  up.textContent = '↑';
  up.setAttribute('aria-label','ルーティンを上へ移動');
  up.disabled = groupIndex === 0;
  up.addEventListener('click', () => moveRoutine(routine.id, -1));
  const down = document.createElement('button');
  down.type = 'button';
  down.textContent = '↓';
  down.setAttribute('aria-label','ルーティンを下へ移動');
  down.disabled = groupIndex === groupLength - 1;
  down.addEventListener('click', () => moveRoutine(routine.id, 1));
  orderActions.append(up, down);
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'remove-routine';
  remove.textContent = '削除';
  remove.addEventListener('click', () => { routines = routines.filter(item => item.id !== routine.id); saveAllSettings(false); renderRoutines(); });
  top.append(enabled, title, orderActions, remove);

  const details = document.createElement('div');
  details.className = 'routine-editor-details';
  const select = document.createElement('select');
  select.className = 'routine-genre';
  genreOptions.forEach(option => {
    const item = document.createElement('option');
    item.value = option.value;
    item.textContent = option.label;
    item.selected = option.value === routine.genre;
    select.append(item);
  });
  details.append(select, timeRow('平日',routine.weekdayStart,routine.weekdayEnd,'weekday'), timeRow('土日',routine.weekendStart,routine.weekendEnd,'weekend'));
  card.append(top, periodPicker(routine.period,routine.id), details);

  card.addEventListener('input', event => {
    updateRoutineFromCard(card);
    scheduleAutoSave();
    if (event.target.matches('.routine-period-picker input')) {
      saveAllSettings(false);
      renderRoutines();
    }
  });
  card.addEventListener('change', () => { updateRoutineFromCard(card); saveAllSettings(false); });
  return card;
}

function renderRoutines() {
  normalizeRoutineOrder();
  holder.replaceChildren();
  periodOptions.forEach(period => {
    const section = document.createElement('section');
    section.className = 'routine-period-section';
    const heading = document.createElement('h3');
    heading.className = 'routine-period-heading';
    heading.textContent = period.label;
    section.append(heading);
    const group = routines.filter(routine => routine.period === period.value);
    if (!group.length) {
      const empty = document.createElement('p');
      empty.className = 'routine-period-empty';
      empty.textContent = 'この時間帯のルーティンはありません。';
      section.append(empty);
    } else {
      group.forEach((routine, index) => section.append(createRoutineCard(routine, index, group.length)));
    }
    holder.append(section);
  });
}

document.querySelector('#add-routine').addEventListener('click', () => {
  const start = defaultStart.value || '09:00';
  const end = defaultEnd.value || '10:00';
  const routine = {id:crypto.randomUUID(),title:'新しいルーティン',genre:'personal',period:'morning',weekdayStart:start,weekdayEnd:end,weekendStart:start,weekendEnd:end,enabled:true,order:0};
  routines.unshift(routine);
  saveAllSettings(false);
  renderRoutines();
  const newRoutine = holder.querySelector(`[data-id="${routine.id}"]`);
  newRoutine?.scrollIntoView({behavior:'smooth',block:'center'});
  const newTitle = newRoutine?.querySelector('.routine-title');
  newTitle?.focus();
  newTitle?.select();
});

defaultStart.addEventListener('change', () => saveAllSettings(false));
defaultEnd.addEventListener('change', () => saveAllSettings(false));
document.querySelector('#save-settings').addEventListener('click', () => saveAllSettings(true));
document.querySelector('#clear-task-history').addEventListener('click', () => {
  const message = '実施済みタスクと削除済みタスクの履歴をすべて削除します。この操作は元に戻せません。よろしいですか？';
  if (!window.confirm(message)) return;
  localStorage.removeItem(STORAGE_KEYS.history);
  const button = document.querySelector('#clear-task-history');
  button.textContent = '履歴をクリアしました';
  setTimeout(() => { button.textContent = '実施済み・削除済み履歴をクリアにする'; }, 1500);
});
window.addEventListener('beforeunload', () => { clearTimeout(autoSaveTimer); saveAllSettings(false); });

renderRoutines();
