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
const defaultRoutines = [{ id:'morning',title:'朝の準備',genre:'personal',weekdayStart:'08:00',weekdayEnd:'08:30',weekendStart:'09:00',weekendEnd:'09:30',enabled:true },{ id:'exercise',title:'ストレッチ',genre:'personal',weekdayStart:'18:00',weekdayEnd:'18:15',weekendStart:'10:00',weekendEnd:'10:15',enabled:true },{ id:'review',title:'今日をふりかえる',genre:'study',weekdayStart:'21:00',weekdayEnd:'21:20',weekendStart:'20:00',weekendEnd:'20:20',enabled:true },{ id:'reading',title:'読書',genre:'study',weekdayStart:'22:00',weekdayEnd:'22:30',weekendStart:'15:00',weekendEnd:'15:30',enabled:false }];
let activeSort = 'priority';
let selectedDate = localDate(new Date());
let tasks = JSON.parse(localStorage.getItem('rusk-tasks') || '[]').map((task, index) => ({ ...task, startTime: task.startTime || task.deadline, endTime: task.endTime || addHour(task.deadline), priority: task.priority ?? index }));

function localDateTimeValue(date) { return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); }
function localDate(date) { return localDateTimeValue(date).slice(0, 10); }
function addHour(value) { const date = new Date(value); date.setHours(date.getHours() + 1); return localDateTimeValue(date); }
function settings() { return JSON.parse(localStorage.getItem('rusk-settings') || '{}'); }
function calendarUrl(task) { const stamp = value => new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''); const params = new URLSearchParams({action:'TEMPLATE',text:task.title,details:task.memo || 'rusk から追加',dates:`${stamp(task.startTime)}/${stamp(task.endTime)}`}); return `https://calendar.google.com/calendar/render?${params}`; }
function save() { localStorage.setItem('rusk-tasks', JSON.stringify(tasks)); }
function dateLabel() { document.querySelector('#date-page-label').textContent = new Intl.DateTimeFormat('ja-JP',{year:'numeric',month:'long',day:'numeric',weekday:'short'}).format(new Date(`${selectedDate}T12:00`)); }
function selectedTasks() { return tasks.filter(task => task.startTime?.slice(0,10) === selectedDate); }
function sortedTasks() { return selectedTasks().slice().sort(activeSort === 'time' ? (a,b) => new Date(a.startTime)-new Date(b.startTime) : (a,b) => a.priority-b.priority); }
function renderRoutines() { const setting = settings(); const routines = setting.routines || defaultRoutines; const enabled = routines.filter(routine => routine.enabled); const area = document.querySelector('#routine-area'), list = document.querySelector('#routine-list'); area.hidden = !enabled.length; list.replaceChildren(); enabled.forEach(routine => { const button = document.createElement('button'); button.type = 'button'; button.className = 'routine-button'; button.textContent = `＋ ${routine.title}`; button.addEventListener('click', () => addRoutine(routine)); list.append(button); }); }
function render() {
  taskList.replaceChildren(); const visible = sortedTasks(); emptyState.hidden = visible.length !== 0;
  document.querySelector('#task-count').textContent = `${visible.length} ITEM${visible.length === 1 ? '' : 'S'}`;
  sortHint.textContent = activeSort === 'priority' ? 'ドラッグ＆ドロップで優先度を並べ替えられます' : '開始時間が早いタスクから表示しています'; dateLabel(); renderRoutines();
  visible.forEach(task => {
    const node = template.content.cloneNode(true), card = node.querySelector('.task-card'); card.dataset.id = task.id; card.draggable = activeSort === 'priority'; card.classList.toggle('completed',task.completed);
    const tag = node.querySelector('.genre-tag'); tag.textContent = genres[task.genre]; tag.classList.add(task.genre); node.querySelector('h3').textContent = task.title; node.querySelector('.task-memo').textContent = task.memo || 'メモはありません'; node.querySelector('.calendar-button').href = calendarUrl(task);
    const editor = node.querySelector('.time-editor'), editButton = node.querySelector('.edit-time-button'), editStart = node.querySelector('.edit-start'), editEnd = node.querySelector('.edit-end'); editStart.value = task.startTime; editEnd.value = task.endTime;
    editButton.addEventListener('click', () => { editor.hidden = !editor.hidden; editButton.textContent = editor.hidden ? '時間を変更' : '閉じる'; });
    node.querySelector('.save-time-button').addEventListener('click', () => { if (new Date(editEnd.value) <= new Date(editStart.value)) { editEnd.setCustomValidity('終了時間は開始時間より後に設定してください。'); editEnd.reportValidity(); return; } task.startTime = editStart.value; task.endTime = editEnd.value; save(); render(); });
    node.querySelector('.check-button').addEventListener('click', () => { task.completed=!task.completed; save(); render(); }); node.querySelector('.delete-button').addEventListener('click', () => { tasks=tasks.filter(item=>item.id!==task.id); save(); render(); });
    card.addEventListener('dragstart',()=>card.classList.add('dragging')); card.addEventListener('dragend',()=>{card.classList.remove('dragging');updatePriorityFromDom();}); taskList.append(node);
  });
}
function updatePriorityFromDom() { if(activeSort !== 'priority') return; [...taskList.children].forEach((card,index)=>{const task=tasks.find(item=>item.id===card.dataset.id);if(task)task.priority=index;});save();render(); }
function addTask(task) { tasks.push({...task,id:crypto.randomUUID(),completed:false,priority:tasks.length});save();render(); }
function addRoutine(routine) { const setting=settings(), day = new Date(`${selectedDate}T12:00`).getDay(), weekend = day === 0 || day === 6; const startTime = weekend ? (routine.weekendStart || routine.start) : (routine.weekdayStart || routine.start); const endTime = weekend ? (routine.weekendEnd || routine.end) : (routine.weekdayEnd || routine.end); const start = new Date(`${selectedDate}T${startTime || setting.defaultStart || '09:00'}`), end = new Date(`${selectedDate}T${endTime || setting.defaultEnd || '10:00'}`); if(end<=start) end.setDate(end.getDate()+1); addTask({title:routine.title,memo:'毎日のルーティン',genre:routine.genre,startTime:localDateTimeValue(start),endTime:localDateTimeValue(end)}); }
taskList.addEventListener('dragover',event=>{if(activeSort !== 'priority')return;event.preventDefault();const dragging=taskList.querySelector('.dragging');if(!dragging)return;const after=[...taskList.querySelectorAll('.saved-card:not(.dragging)')].find(card=>event.clientY<card.getBoundingClientRect().top+card.offsetHeight/2);taskList.insertBefore(dragging,after||null);});
document.querySelectorAll('.sort-button').forEach(button=>button.addEventListener('click',()=>{activeSort=button.dataset.sort;document.querySelectorAll('.sort-button').forEach(item=>item.classList.toggle('is-active',item===button));render();}));
document.querySelector('#previous-day').addEventListener('click',()=>{const date=new Date(`${selectedDate}T12:00`);date.setDate(date.getDate()-1);selectedDate=localDate(date);setDefaultTimes();render();}); document.querySelector('#next-day').addEventListener('click',()=>{const date=new Date(`${selectedDate}T12:00`);date.setDate(date.getDate()+1);selectedDate=localDate(date);setDefaultTimes();render();}); document.querySelector('#today-button').addEventListener('click',()=>{selectedDate=localDate(new Date());setDefaultTimes();render();});
form.addEventListener('submit',event=>{event.preventDefault();if(new Date(endInput.value)<=new Date(startInput.value)){endInput.setCustomValidity('終了時間は開始時間より後に設定してください。');endInput.reportValidity();return;}addTask({title:titleInput.value.trim(),memo:memoInput.value.trim(),startTime:startInput.value,endTime:endInput.value,genre:genreInput.value});form.reset();genreInput.value='work';setDefaultTimes();form.classList.remove('is-open');titleInput.focus();}); endInput.addEventListener('input',()=>endInput.setCustomValidity(''));
document.querySelector('#open-composer').addEventListener('click',()=>{form.classList.add('is-open');titleInput.focus();}); document.querySelector('#close-composer').addEventListener('click',()=>form.classList.remove('is-open'));
function setDefaultTimes(){const setting=settings();const start=new Date(`${selectedDate}T${setting.defaultStart || '09:00'}`);const end=new Date(`${selectedDate}T${setting.defaultEnd || '10:00'}`);if(end<=start)end.setDate(end.getDate()+1);startInput.value=localDateTimeValue(start);endInput.value=localDateTimeValue(end);}
setDefaultTimes();save();render();
