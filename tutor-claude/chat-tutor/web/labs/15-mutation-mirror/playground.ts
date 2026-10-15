// 원본 페이지 자체의 스크립트 (고객사 업무 코드 역할). 복제본에는 이 스크립트가 따라가지 않는다.
const list = document.getElementById('list')!;
let n = 0;
document.getElementById('add')!.onclick = () => list.appendChild(Object.assign(document.createElement('li'), { textContent: `항목 ${++n}` }));
document.getElementById('remove')!.onclick = () => list.lastElementChild?.remove();
document.getElementById('color')!.onclick = () => list.querySelectorAll('li').forEach((li) => li.classList.toggle('hot'));
document.getElementById('move')!.onclick = () => list.firstElementChild && list.appendChild(list.firstElementChild);
document.getElementById('many')!.onclick = () => {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 100; i++) frag.appendChild(Object.assign(document.createElement('li'), { textContent: `대량 ${++n} — 반복되는 텍스트는 압축이 잘 된다` }));
  list.appendChild(frag);
};
