const defaultRoutines = [
  { id:'morning', title:'朝の準備', genre:'personal', period:'morning', weekdayStart:'08:00', weekdayEnd:'08:30', weekendStart:'09:00', weekendEnd:'09:30', enabled:true },
  { id:'exercise', title:'ストレッチ', genre:'personal', period:'daytime', weekdayStart:'18:00', weekdayEnd:'18:15', weekendStart:'10:00', weekendEnd:'10:15', enabled:true },
  { id:'review', title:'今日をふりかえる', genre:'study', period:'night', weekdayStart:'21:00', weekdayEnd:'21:20', weekendStart:'20:00', weekendEnd:'20:20', enabled:true },
  { id:'reading', title:'読書', genre:'study', period:'night', weekdayStart:'22:00', weekdayEnd:'22:30', weekendStart:'15:00', weekendEnd:'15:30', enabled:false },
  { id:'other-vacuum', title:'掃除機かけ', genre:'personal', period:'other', weekdayStart:'09:00', weekdayEnd:'09:15', weekendStart:'09:00', weekendEnd:'09:15', enabled:true },
  { id:'other-toilet-cleaning', title:'トイレ掃除', genre:'personal', period:'other', weekdayStart:'09:00', weekdayEnd:'09:15', weekendStart:'09:00', weekendEnd:'09:15', enabled:true },
  { id:'other-sink', title:'シンク掃除', genre:'personal', period:'other', weekdayStart:'09:00', weekdayEnd:'09:15', weekendStart:'09:00', weekendEnd:'09:15', enabled:true },
  { id:'other-bathroom', title:'浴室掃除', genre:'personal', period:'other', weekdayStart:'09:00', weekdayEnd:'09:20', weekendStart:'09:00', weekendEnd:'09:20', enabled:true },
  { id:'other-declutter', title:'断捨離', genre:'personal', period:'other', weekdayStart:'09:00', weekdayEnd:'09:30', weekendStart:'09:00', weekendEnd:'09:30', enabled:true }
];
const settings = JSON.parse(localStorage.getItem('rusk-settings') || '{}');
function routinePeriod(routine) {
  if (routine.period) return routine.period;
  if (routine.id === 'morning') return 'morning';
  if (routine.id === 'exercise') return 'daytime';
  return 'night';
}
const savedRoutines = Array.isArray(settings.routines) ? settings.routines : [];
const savedRoutineIds = new Set(savedRoutines.map(routine => routine.id));
let routines = [...savedRoutines, ...defaultRoutines.filter(routine => !savedRoutineIds.has(routine.id))].map(routine => ({
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
const periodOptions = [{value:'morning',label:'朝'},{value:'daytime',label:'昼'},{value:'night',label:'夜'},{value:'other',label:'その他'}];
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
document.querySelector('#save-settings').addEventListener('click',()=>{routines=collectRoutines();localStorage.setItem('rusk-settings',JSON.stringify({defaultStart:document.querySelector('#default-start').value,defaultEnd:document.querySelector('#default-end').value,routines}));const button=document.querySelector('#save-settings');button.textContent='保存しました';setTimeout(()=>button.textContent='保存する',1300);});
renderRoutines();
