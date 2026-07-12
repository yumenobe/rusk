const form = document.querySelector('#task-form');
const titleInput = document.querySelector('#title');
const memoInput = document.querySelector('#memo');
const startInput = document.querySelector('#start-time');
const endInput = document.querySelector('#end-time');
const genreInput = document.querySelector('#genre');
const taskList = document.querySelector('#task-list');
const emptyState = document.querySelector('#empty-state');
const template = document.querySelector('#task-template');
const sortHint = document.querySelector('#sort-hint');
const genres = { work: '仕事', personal: 'くらし', study: '学び', important: '大切なこと' };
const STORAGE_KEYS = { tasks:'rusk-tasks', settings:'rusk-settings', history:'rusk-task-history' };
const storageReadable = { tasks:true, settings:true, history:true };
function readStoredJson(key, fallback, stateKey) {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try { return JSON.parse(raw); }
  catch (error) { storageReadable[stateKey] = false; console.error(`保存データを読み込めませんでした: ${key}`, error); return fallback; }
}
function writeStoredJson(key, value, stateKey) {
  if (!storageReadable[stateKey]) return false;
  localStorage.setItem(key, JSON.stringify(value));
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
const ROUTINE_SCHEMA_VERSION = 3;
function migratedSettings() {
  const current = readStoredJson(STORAGE_KEYS.settings, {}, 'settings');
  if (current.routineSchemaVersion === ROUTINE_SCHEMA_VERSION && Array.isArray(current.routines)) return current;
  const legacyTitles = new Set(['朝の準備', 'ストレッチ']);
  const kept = Array.isArray(current.routines)
    ? current.routines.filter(routine => !['morning', 'exercise'].includes(routine.id) && !legacyTitles.has(routine.title))
    : [];
  const keptIds = new Set(kept.map(routine => routine.id));
  const migrated = { ...current, routineSchemaVersion: ROUTINE_SCHEMA_VERSION, routines: [...defaultRoutines.filter(routine => !keptIds.has(routine.id)), ...kept] };
  writeStoredJson(STORAGE_KEYS.settings, migrated, 'settings');
  return migrated;
}
let activeSort = 'time';
let activeRoutinePeriod = 'morning';
let activeTimePeriod = new Date().getHours() < 12 ? 'am' : 'pm';
let selectedDate = localDate(new Date());
let tasks = readStoredJson(STORAGE_KEYS.tasks, [], 'tasks');
if (!Array.isArray(tasks)) tasks = [];
tasks = tasks.map((task, index) => { const startTime=task.startTime || task.deadline; const endTime=task.endTime || addHour(task.deadline); return { ...task, startTime, endTime, durationMinutes:task.durationMinutes ?? Math.max(0,Math.round((new Date(endTime)-new Date(startTime))/60_000)), priority: task.priority ?? index, order:task.order ?? task.priority ?? index }; });
let taskHistory = readStoredJson(STORAGE_KEYS.history, [], 'history');
if (!Array.isArray(taskHistory)) taskHistory = [];

function localDateTimeValue(date) { return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); }
function localDate(date) { return localDateTimeValue(date).slice(0, 10); }
function addHour(value) { const date = new Date(value); date.setHours(date.getHours() + 1); return localDateTimeValue(date); }
function editableDateTimeValue(value) { return value ? value.replace('T',' ') : ''; }
function parseEditableDateTime(value) { const text=value.trim(); const match=text.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/)||text.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/); if(!match)return null; const [,year,month,day,hour,minute]=match.map(Number); const date=new Date(year,month-1,day,hour,minute); return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day&&date.getHours()===hour&&date.getMinutes()===minute?date:null; }
function settings() { return migratedSettings(); }
function routinePeriod(routine) {
  if (routine.period) return routine.period;
  if (routine.id === 'morning') return 'morning';
  if (routine.id === 'exercise') return 'daytime';
  return 'night';
}
function calendarUrl(task) { const stamp = value => new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''); const params = new URLSearchParams({action:'TEMPLATE',text:task.title,details:task.memo || 'rusk から追加',dates:`${stamp(task.startTime)}/${stamp(task.endTime)}`}); return `https://calendar.google.com/calendar/render?${params}`; }
function save() { return writeStoredJson(STORAGE_KEYS.tasks, tasks, 'tasks'); }
function saveHistory() { return writeStoredJson(STORAGE_KEYS.history, taskHistory, 'history'); }
function recordHistory(task, historyType) { taskHistory = taskHistory.filter(item => !(item.taskId === task.id && item.historyType === historyType)); taskHistory.push({ ...task, taskId:task.id, historyType, recordedAt:new Date().toISOString() }); saveHistory(); }
function dateLabel() { document.querySelector('#date-page-label').textContent = new Intl.DateTimeFormat('ja-JP',{year:'numeric',month:'long',day:'numeric',weekday:'short'}).format(new Date(`${selectedDate}T12:00`)); document.querySelector('#date-picker').value = selectedDate; }
function selectedTasks() { return tasks.filter(task => task.startTime?.slice(0,10) === selectedDate); }
function sortedTasks() { return selectedTasks().filter(task => activeSort !== 'time' || activeTimePeriod === 'all' || (activeTimePeriod === 'am' ? new Date(task.startTime).getHours() < 12 : new Date(task.startTime).getHours() >= 12)).sort((a,b) => Number(a.completed)-Number(b.completed) || (activeSort === 'time' ? new Date(a.startTime)-new Date(b.startTime) : a.priority-b.priority)); }
function renderRoutines() {
  const setting = settings();
  const routines = (setting.routines || defaultRoutines).map(routine => ({ ...routine, period:routinePeriod(routine) }));
  const enabled = routines.filter(routine => routine.enabled);
  const visible = enabled.filter(routine => routine.period === activeRoutinePeriod);
  const area = document.querySelector('#routine-area');
  const list = document.querySelector('#routine-list');
  area.hidden = !enabled.length;
  list.replaceChildren();
  visible.forEach(routine => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'routine-button';
    button.textContent = `＋ ${routine.title}`;
    button.addEventListener('click', () => addRoutine(routine));
    list.append(button);
  });
  if (!visible.length && enabled.length) {
    const message = document.createElement('p');
    message.className = 'routine-empty';
    message.textContent = 'この時間帯のルーティンはありません。';
    list.append(message);
  }
}
function render() {
  taskList.replaceChildren(); const visible = sortedTasks(); emptyState.hidden = visible.length !== 0;
  document.querySelector('#time-filter').hidden = activeSort !== 'time';
  document.querySelector('#task-count').textContent = `${visible.length} ITEM${visible.length === 1 ? '' : 'S'}`;
  sortHint.textContent = activeSort === 'priority' ? 'PCはドラッグ、スマホは↑↓で優先度を並べ替えられます' : '開始時間が早いタスクから表示しています'; dateLabel(); renderRoutines();
  visible.forEach(task => {
    const node = template.content.cloneNode(true), card = node.querySelector('.task-card'); card.dataset.id = task.id; card.draggable = activeSort === 'priority'; card.classList.toggle('completed',task.completed);
    const tag = node.querySelector('.genre-tag'); tag.textContent = genres[task.genre]; tag.classList.add(task.genre); node.querySelector('h3').textContent = task.title; node.querySelector('.task-memo').textContent = task.memo || 'メモはありません'; node.querySelector('.calendar-button').href = calendarUrl(task);
    const editStart = node.querySelector('.edit-start'), editEnd = node.querySelector('.edit-end'); editStart.value = editableDateTimeValue(task.startTime); editEnd.value = editableDateTimeValue(task.endTime);
    const timeButton = node.querySelector('.task-time-button'), timeEditor = node.querySelector('.time-editor');
    const formatTime = value => value?.slice(11,16) || '--:--';
    node.querySelector('.task-time-value').textContent = `${formatTime(task.startTime)} 〜 ${formatTime(task.endTime)}`;
    timeButton.addEventListener('click', () => { const willOpen = timeEditor.hidden; timeEditor.hidden = !willOpen; timeButton.setAttribute('aria-expanded', String(willOpen)); });
  const saveTimeButton = node.querySelector('.save-time-button');

saveTimeButton.addEventListener('click', () => {
  const parsedStart=parseEditableDateTime(editStart.value),parsedEnd=parseEditableDateTime(editEnd.value);
  if(!parsedStart){editStart.setCustomValidity('YYYY-MM-DD HH:mm または12桁の数字で入力してください。');editStart.reportValidity();return;}
  editStart.setCustomValidity('');
  if(!parsedEnd){editEnd.setCustomValidity('YYYY-MM-DD HH:mm または12桁の数字で入力してください。');editEnd.reportValidity();return;}
  editEnd.setCustomValidity('');
  if (parsedEnd <= parsedStart) {
    editEnd.setCustomValidity('終了時間は開始時間より後に設定してください。');
    editEnd.reportValidity();
    return;
  }

  task.startTime = localDateTimeValue(parsedStart);
  task.endTime = localDateTimeValue(parsedEnd);
  task.durationMinutes = Math.max(0,Math.round((new Date(task.endTime)-new Date(task.startTime))/60_000));
  save();

  saveTimeButton.textContent = '変更しました';
  saveTimeButton.disabled = true;

  setTimeout(() => {
    saveTimeButton.textContent = '時間を変更';
    saveTimeButton.disabled = false;
    render();
  }, 1200);
});
    node.querySelector('.set-current-time-button').addEventListener('click',()=>{const duration=Math.max(1,task.durationMinutes||Math.round((new Date(task.endTime)-new Date(task.startTime))/60_000)||60);const now=new Date();now.setSeconds(0,0);const end=new Date(now.getTime()+duration*60_000);editStart.value=editableDateTimeValue(localDateTimeValue(now));editEnd.value=editableDateTimeValue(localDateTimeValue(end));editStart.setCustomValidity('');editEnd.setCustomValidity('');});
    const moveUp = node.querySelector('.move-up-button'), moveDown = node.querySelector('.move-down-button');
    const priorityTasks = sortedTasks();
    const taskPosition = priorityTasks.findIndex(item => item.id === task.id);
    moveUp.disabled = activeSort !== 'priority' || taskPosition <= 0 || priorityTasks[taskPosition - 1]?.completed !== task.completed;
    moveDown.disabled = activeSort !== 'priority' || taskPosition === -1 || taskPosition >= priorityTasks.length - 1 || priorityTasks[taskPosition + 1]?.completed !== task.completed;
    moveUp.addEventListener('click', () => moveTask(task.id, -1));
    moveDown.addEventListener('click', () => moveTask(task.id, 1));
    node.querySelector('.check-button').addEventListener('click', () => { task.completed=!task.completed; if(task.completed)recordHistory(task,'completed');else{taskHistory=taskHistory.filter(item=>!(item.taskId===task.id&&item.historyType==='completed'));saveHistory();} save(); render(); }); node.querySelector('.delete-button').addEventListener('click', () => { recordHistory(task,'deleted'); tasks=tasks.filter(item=>item.id!==task.id); save(); render(); });
    card.addEventListener('dragstart',()=>card.classList.add('dragging')); card.addEventListener('dragend',()=>{card.classList.remove('dragging');updatePriorityFromDom();}); taskList.append(node);
  });
}
function moveTask(taskId, direction) {
  if (activeSort !== 'priority') return;
  const visible = sortedTasks();
  const index = visible.findIndex(task => task.id === taskId);
  const targetIndex = index + direction;
  if (index < 0 || targetIndex < 0 || targetIndex >= visible.length) return;
  const current = visible[index];
  const target = visible[targetIndex];
  const currentPriority = current.priority;
  current.priority = target.priority;
  target.priority = currentPriority;
  current.order = current.priority;
  target.order = target.priority;
  save();
  render();
}
function updatePriorityFromDom() { if(activeSort !== 'priority') return; [...taskList.children].forEach((card,index)=>{const task=tasks.find(item=>item.id===card.dataset.id);if(task){task.priority=index;task.order=index;}});save();render(); }
function addTask(task) { const active = tasks.filter(item => !item.completed); const topPriority = active.length ? Math.min(...active.map(item => item.priority ?? 0)) - 1 : 0; const priority=task.genre === 'important' ? topPriority : tasks.length; const durationMinutes=Math.max(0,Math.round((new Date(task.endTime)-new Date(task.startTime))/60_000)); tasks.push({...task,id:crypto.randomUUID(),completed:false,priority,order:priority,durationMinutes,createdAt:new Date().toISOString()});save();render(); }
function addRoutine(routine) { const setting=settings(), day = new Date(`${selectedDate}T12:00`).getDay(), weekend = day === 0 || day === 6; const startTime = weekend ? (routine.weekendStart || routine.start) : (routine.weekdayStart || routine.start); const endTime = weekend ? (routine.weekendEnd || routine.end) : (routine.weekdayEnd || routine.end); const start = new Date(`${selectedDate}T${startTime || setting.defaultStart || '09:00'}`), end = new Date(`${selectedDate}T${endTime || setting.defaultEnd || '10:00'}`); if(end<=start) end.setDate(end.getDate()+1); addTask({title:routine.title,memo:'毎日のルーティン',genre:routine.genre,startTime:localDateTimeValue(start),endTime:localDateTimeValue(end)}); }
taskList.addEventListener('dragover',event=>{if(activeSort !== 'priority')return;event.preventDefault();const dragging=taskList.querySelector('.dragging');if(!dragging)return;const after=[...taskList.querySelectorAll('.saved-card:not(.dragging)')].find(card=>event.clientY<card.getBoundingClientRect().top+card.offsetHeight/2);taskList.insertBefore(dragging,after||null);});
document.querySelectorAll('.sort-button').forEach(button=>button.addEventListener('click',()=>{activeSort=button.dataset.sort;document.querySelectorAll('.sort-button').forEach(item=>item.classList.toggle('is-active',item===button));render();}));
function updateTimePeriodButtons() { document.querySelectorAll('.time-filter-button').forEach(item=>{const selected=item.dataset.timePeriod===activeTimePeriod;item.classList.toggle('is-active',selected);item.setAttribute('aria-pressed',String(selected));}); }
document.querySelector('#time-filter').addEventListener('click',event=>{const button=event.target.closest('.time-filter-button');if(!button)return;activeTimePeriod=button.dataset.timePeriod;updateTimePeriodButtons();render();});
const routineToggle = document.querySelector('#routine-toggle');
const routineContent = document.querySelector('#routine-content');
if (routineToggle && routineContent) {
  routineToggle.addEventListener('click', () => {
    const expanded = routineToggle.getAttribute('aria-expanded') === 'true';
    routineToggle.setAttribute('aria-expanded', String(!expanded));
    routineContent.hidden = expanded;
  });
}
const routineFilter = document.querySelector('.routine-filter');
if (routineFilter) {
  routineFilter.addEventListener('click', event => {
    const button = event.target.closest('.routine-filter-button');
    if (!button || !routineFilter.contains(button)) return;
    activeRoutinePeriod = button.dataset.period || 'all';
    document.querySelectorAll('.routine-filter-button').forEach(item => {
      const selected = item === button;
      item.classList.toggle('is-active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    renderRoutines();
  });
}
document.querySelector('#previous-day').addEventListener('click',()=>{const date=new Date(`${selectedDate}T12:00`);date.setDate(date.getDate()-1);selectedDate=localDate(date);setDefaultTimes();render();}); document.querySelector('#next-day').addEventListener('click',()=>{const date=new Date(`${selectedDate}T12:00`);date.setDate(date.getDate()+1);selectedDate=localDate(date);setDefaultTimes();render();}); document.querySelector('#today-button').addEventListener('click',()=>{selectedDate=localDate(new Date());activeTimePeriod=new Date().getHours()<12?'am':'pm';updateTimePeriodButtons();setDefaultTimes();render();});
const datePicker = document.querySelector('#date-picker'); datePicker.addEventListener('change',()=>{if(!datePicker.value)return;selectedDate=datePicker.value;setDefaultTimes();render();});
function shiftCurrentDayTasks(direction) { const minutesInput=document.querySelector('#shift-minutes'); const minutes=Number.parseInt(minutesInput.value,10); if(!Number.isFinite(minutes)||minutes<1){minutesInput.setCustomValidity('1分以上を入力してください。');minutesInput.reportValidity();return;} minutesInput.setCustomValidity(''); const offset=direction*minutes*60_000; sortedTasks().filter(task=>!task.completed).forEach(task=>{task.startTime=localDateTimeValue(new Date(new Date(task.startTime).getTime()+offset));task.endTime=localDateTimeValue(new Date(new Date(task.endTime).getTime()+offset));});save();render(); }
document.querySelector('#shift-earlier').addEventListener('click',()=>shiftCurrentDayTasks(-1));
document.querySelector('#shift-later').addEventListener('click',()=>shiftCurrentDayTasks(1));
const bulkShiftToggle=document.querySelector('#bulk-shift-toggle'),bulkShiftContent=document.querySelector('#bulk-shift-content');bulkShiftToggle.addEventListener('click',()=>{const expanded=bulkShiftToggle.getAttribute('aria-expanded')==='true';bulkShiftToggle.setAttribute('aria-expanded',String(!expanded));bulkShiftContent.hidden=expanded;});
form.addEventListener('submit',event=>{event.preventDefault();if(new Date(endInput.value)<=new Date(startInput.value)){endInput.setCustomValidity('終了時間は開始時間より後に設定してください。');endInput.reportValidity();return;}addTask({title:titleInput.value.trim(),memo:memoInput.value.trim(),startTime:startInput.value,endTime:endInput.value,genre:genreInput.value});form.reset();genreInput.value='work';setDefaultTimes();form.classList.remove('is-open');titleInput.focus();}); endInput.addEventListener('input',()=>endInput.setCustomValidity(''));
document.querySelector('#open-composer').addEventListener('click',()=>{form.classList.add('is-open');titleInput.focus();}); document.querySelector('#close-composer').addEventListener('click',()=>form.classList.remove('is-open'));
function setDefaultTimes(){const setting=settings();const start=new Date(`${selectedDate}T${setting.defaultStart || '09:00'}`);const end=new Date(`${selectedDate}T${setting.defaultEnd || '10:00'}`);if(end<=start)end.setDate(end.getDate()+1);startInput.value=localDateTimeValue(start);endInput.value=localDateTimeValue(end);}
updateTimePeriodButtons();setDefaultTimes();render();
