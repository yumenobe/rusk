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
  { id:'review', title:'今日をふりかえる', genre:'study', period:'night', weekdayStart:'22:35', weekdayEnd:'22:45', weekendStart:'22:05', weekendEnd:'22:15', enabled:true }
];
const settings = JSON.parse(localStorage.getItem('rusk-settings') || '{}');
const ROUTINE_SCHEMA_VERSION = 2;
function migrateRoutines(savedRoutines) {
  if (!Array.isArray(savedRoutines) || settings.routineSchemaVersion !== ROUTINE_SCHEMA_VERSION) {
    const legacyTitles = new Set(['朝の準備', 'ストレッチ']);
    const kept = Array.isArray(savedRoutines)
      ? savedRoutines.filter(routine => !['morning', 'exercise'].includes(routine.id) && !legacyTitles.has(routine.title))
      : [];
    const keptIds = new Set(kept.map(routine => routine.id));
    return [...defaultRoutines.filter(routine => !keptIds.has(routine.id)), ...kept];
  }
  return savedRoutines;
}
function routinePeriod(routine) {
  if (routine.period) return routine.period;
  if (routine.id === 'morning') return 'morning';
  if (routine.id === 'exercise') return 'daytime';
  return 'night';
}
let routines = migrateRoutines(settings.routines).map(routine => ({
  ...routine,
  period:routinePeriod(routine),
  weekdayStart:routine.weekdayStart || routine.start || settings.defaultStart || '09:00',
  weekdayEnd:routine.weekdayEnd || routine.end || settings.defaultEnd || '10:00',
  weekendStart:routine.weekendStart || routine.start || settings.defaultStart || '09:00',
  weekendEnd:routine.weekendEnd || routine.end || settings.defaultEnd || '10:00'
}));
const holder = document.querySelector('#routine-settings');
document.querySelector('#default-start').value = settings.defaultStart || '09:00'; document.querySelector('#default-end').value = settings.defaultEnd || '10:00';
const genreOptions = [{value:'work',label:'仕事'},{value:'personal',label:'くらし'},{value:'study',label:'学び'},{value:'important',label:'大切なこと'}];
const periodOptions = [{value:'morning',label:'朝'},{value:'daytime',label:'昼'},{value:'night',label:'夜'}];
function timeInput(value, className) { const input=document.createElement('input'); input.type='time'; input.value=value; input.className=className; return input; }
function timeRow(label, start, end, group) { const row=document.createElement('div'); row.className='routine-time-row'; const labelNode=document.createElement('span');labelNode.textContent=label; const startInput=timeInput(start,`${group}-start`),endInput=timeInput(end,`${group}-end`);row.append(labelNode,startInput,document.createTextNode('〜'),endInput);return row; }
function periodPicker(selectedPeriod, index) {
  const fieldset=document.createElement('fieldset'); fieldset.className='routine-period-picker';
  const legend=document.createElement('legend'); legend.textContent='表示する時間帯'; fieldset.append(legend);
  periodOptions.forEach(option=>{const label=document.createElement('label');const input=document.createElement('input');input.type='radio';input.name=`routine-period-${index}`;input.value=option.value;input.checked=option.value===selectedPeriod;label.append(input,document.createTextNode(option.label));fieldset.append(label);});
  return fieldset;
}
function renderRoutines() { holder.replaceChildren(); routines.forEach((routine,index) => { const card=document.createElement('div'); card.className='routine-editor'; const top=document.createElement('div'); top.className='routine-editor-top'; const enabled=document.createElement('input'); enabled.type='checkbox'; enabled.checked=routine.enabled; enabled.className='routine-enabled'; const title=document.createElement('input'); title.type='text'; title.maxLength=30; title.value=routine.title; title.className='routine-title'; title.setAttribute('aria-label','ルーティン名'); const remove=document.createElement('button'); remove.type='button'; remove.className='remove-routine'; remove.textContent='削除'; remove.addEventListener('click',()=>{routines.splice(index,1);renderRoutines();}); top.append(enabled,title,remove);
  const details=document.createElement('div'); details.className='routine-editor-details'; const select=document.createElement('select'); select.className='routine-genre'; genreOptions.forEach(option=>{const item=document.createElement('option');item.value=option.value;item.textContent=option.label;item.selected=option.value===routine.genre;select.append(item);}); details.append(select,timeRow('平日',routine.weekdayStart,routine.weekdayEnd,'weekday'),timeRow('土日',routine.weekendStart,routine.weekendEnd,'weekend')); card.append(top,periodPicker(routine.period,index),details); holder.append(card); }); }
function collectRoutines() { return [...holder.children].map((card,index)=>({ id:routines[index].id, title:card.querySelector('.routine-title').value.trim() || '名前のないルーティン', genre:card.querySelector('.routine-genre').value, period:card.querySelector('.routine-period-picker input:checked')?.value || 'morning', weekdayStart:card.querySelector('.weekday-start').value || '09:00', weekdayEnd:card.querySelector('.weekday-end').value || '10:00', weekendStart:card.querySelector('.weekend-start').value || '09:00', weekendEnd:card.querySelector('.weekend-end').value || '10:00', enabled:card.querySelector('.routine-enabled').checked })); }
document.querySelector('#add-routine').addEventListener('click',()=>{const start=document.querySelector('#default-start').value || '09:00',end=document.querySelector('#default-end').value || '10:00';routines.push({id:crypto.randomUUID(),title:'新しいルーティン',genre:'personal',period:'morning',weekdayStart:start,weekdayEnd:end,weekendStart:start,weekendEnd:end,enabled:true});renderRoutines();});
document.querySelector('#save-settings').addEventListener('click',()=>{routines=collectRoutines();localStorage.setItem('rusk-settings',JSON.stringify({routineSchemaVersion:ROUTINE_SCHEMA_VERSION,defaultStart:document.querySelector('#default-start').value,defaultEnd:document.querySelector('#default-end').value,routines}));const button=document.querySelector('#save-settings');button.textContent='保存しました';setTimeout(()=>button.textContent='保存する',1300);});
renderRoutines();
