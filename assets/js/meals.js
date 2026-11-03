/* Today's meals: one breakfast, lunch, dinner and snack per day, picked by date so
   everyone sees the same menu on the same day. */
(() => {
  const grid = document.getElementById('ml-grid');
  if (!grid) return;
  const M = {
    Breakfast: [
      ['Rice porridge with minced pork and egg', 'โจ๊กหมูใส่ไข่', 'Skip the fried dough sticks and add ginger and spring onion.'],
      ['Rice soup with fish', 'ข้าวต้มปลา', 'Clear broth and white fish keep it light. Add celery and garlic oil only a little.'],
      ['Steamed egg with brown rice', 'ไข่ตุ๋น ข้าวกล้อง', 'Brown rice keeps you full longer than white rice.'],
      ['Grilled chicken with a little sticky rice', 'ไก่ย่าง ข้าวเหนียว', 'Take the skin off and keep the sticky rice to one small bag.'],
      ['Unsweetened soy milk with boiled egg and fruit', 'น้ำเต้าหู้ไม่หวาน ไข่ต้ม ผลไม้', 'Ask for no sugar and no toppings in the soy milk.'],
      ['Clear noodle soup with fish balls', 'ก๋วยเตี๋ยวลูกชิ้นปลาน้ำใส', 'Thin rice noodles, extra bean sprouts and no added sugar.'],
      ['Omelette with vegetables and brown rice', 'ไข่เจียวผัก ข้าวกล้อง', 'Ask for little oil, or have the egg steamed instead.']
    ],
    Lunch: [
      ['Holy basil chicken with a boiled egg', 'ข้าวกะเพราไก่ ไข่ต้ม', 'Ask for less oil and a boiled egg instead of a fried one.'],
      ['Papaya salad with grilled chicken', 'ส้มตำ ไก่ย่าง', 'Ask for less sugar and eat it with the fresh vegetables on the side.'],
      ['Spicy minced chicken salad', 'ลาบไก่', 'Plenty of herbs and raw vegetables. Keep sticky rice small.'],
      ['Glass noodle salad with shrimp', 'ยำวุ้นเส้นกุ้ง', 'Glass noodles fill the bowl, so one portion is enough.'],
      ['Stir-fried mixed vegetables with brown rice', 'ผัดผักรวม ข้าวกล้อง', 'Add tofu or chicken for protein.'],
      ['Clear sukiyaki with seafood', 'สุกี้น้ำทะเล', 'Use only a little of the sauce, since most of the sugar and salt is in it.'],
      ['Clear noodle soup with chicken', 'ก๋วยเตี๋ยวไก่น้ำใส', 'Skip the crispy pork and add more vegetables.']
    ],
    Dinner: [
      ['Clear tom yum with shrimp', 'ต้มยำกุ้งน้ำใส', 'The clear version has no coconut milk or evaporated milk.'],
      ['Clear soup with tofu and minced pork', 'ต้มจืดเต้าหู้หมูสับ', 'Light and filling. Add seaweed or Chinese cabbage.'],
      ['Steamed fish with lime and chilli', 'ปลานึ่งมะนาว', 'Steamed, not fried. Have it with vegetables and a little rice.'],
      ['Mackerel with shrimp paste dip and boiled vegetables', 'ปลาทู น้ำพริกกะปิ ผักต้ม', 'A classic plate that is already close to 2:1:1.'],
      ['Grilled chicken breast with seafood dipping sauce', 'อกไก่ย่าง น้ำจิ้มซีฟู้ด', 'Lean protein with a dip that has no oil.'],
      ['Stir-fried morning glory with tofu', 'ผัดผักบุ้ง เต้าหู้', 'Ask for little oil and less oyster sauce.'],
      ['Spicy seafood salad', 'ยำทะเล', 'Plenty of herbs and onion, and no rice needed.']
    ],
    Snack: [
      ['Guava', 'ฝรั่ง', 'High in fibre and vitamin C. Skip the sugar and salt dip.'],
      ['Papaya', 'มะละกอ', 'Sweet without added sugar.'],
      ['Boiled corn', 'ข้าวโพดต้ม', 'One cob is enough.'],
      ['Unsweetened soy milk', 'น้ำเต้าหู้ไม่หวาน', 'Good protein between meals.'],
      ['Boiled peanuts', 'ถั่วต้ม', 'A small handful, since nuts are rich.'],
      ['Green mango', 'มะม่วงดิบ', 'Have it without the sweet chilli dip.'],
      ['Plain yoghurt with fruit', 'โยเกิร์ตรสธรรมชาติ ผลไม้', 'Choose plain yoghurt with no added sugar.']
    ]
  };
  const day0 = Math.floor(Date.now() / 864e5);
  let shift = 0;
  const show = () => {
    const d = day0 + shift, date = new Date(d * 864e5);
    document.getElementById('ml-date').textContent = shift ? date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Today, ' + date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    grid.innerHTML = Object.entries(M).map(([meal, list], k) => {
      const [en, th, tip] = list[(d * (k + 3) + k * 2) % list.length];
      return `<article class="ml-card"><span class="ml-meal">${meal}</span><h3>${en}</h3><p class="ml-th" lang="th">${th}</p><p>${tip}</p></article>`;
    }).join('');
  };
  document.getElementById('ml-next').addEventListener('click', () => { shift++; show(); document.dispatchEvent(new CustomEvent('buddy', { detail: 'meals' })); });
  show();
})();
