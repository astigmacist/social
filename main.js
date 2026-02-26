/* main.js — Qamqor Application Logic */

// ========== LANGUAGE ==========
window.LANG = localStorage.getItem('qamqor_lang') || 'ru';

function toggleLang() {
    window.LANG = window.LANG === 'ru' ? 'kz' : 'ru';
    localStorage.setItem('qamqor_lang', window.LANG);
    applyI18n();
    renderAll();
}

function applyI18n() {
    const lang = window.LANG;
    // Update all data-i elements
    document.querySelectorAll('[data-i]').forEach(el => {
        const key = el.getAttribute('data-i');
        const val = getT(key);
        if (val && typeof val === 'string') el.textContent = val;
    });
    // Update placeholder attributes
    document.querySelectorAll('[data-i-ph]').forEach(el => {
        const key = el.getAttribute('data-i-ph');
        const val = getT(key);
        if (val && typeof val === 'string') el.placeholder = val;
    });
    // Language button label
    const lbl = document.getElementById('langLabel');
    if (lbl) lbl.textContent = getT('nav.langSwitch');
    // HTML lang attribute
    document.documentElement.lang = lang;
}

function getT(path) {
    const keys = path.split('.');
    let obj = TRANSLATIONS[window.LANG];
    for (const k of keys) { obj = obj?.[k]; if (obj === undefined) return null; }
    return obj;
}

// ========== ICONS INTO DOM ==========
function injectIcon(elementId, iconKey, size = 18) {
    const el = document.getElementById(elementId);
    if (!el || !ICONS[iconKey]) return;
    el.innerHTML = ICONS[iconKey];
    const svg = el.querySelector('svg');
    if (svg) { svg.style.width = svg.style.height = size + 'px'; }
}

// ========== RENDER ALL DYNAMIC CONTENT ==========
function renderAll() {
    renderNav();
    renderHeroCards();
    renderBenefits('all');
    renderBenefitTabs();
    renderApplySidebar();
    renderVolunteerRoles();
    renderContacts();
    renderFooter();
    renderChatUI();
    applyI18n();
}

function renderNav() {
    injectIcon('logoIcon', 'shield', 16);
    injectIcon('footerLogoIcon', 'shield', 16);
    injectIcon('langIcon', 'globe', 14);
    injectIcon('profileIcon', 'user', 16);
    injectIcon('hero-apply-icon', 'arrow', 18);
    injectIcon('submit-icon', 'send', 18);
    injectIcon('profileBtn', 'user', 16); // redundant-safe
    ['qa-arr-0', 'qa-arr-1', 'qa-arr-2'].forEach(id => injectIcon(id, 'chevron', 14));
    ['qa-icon-0'].forEach(id => injectIconEl(id, 'document', 24));
    injectIconEl('qa-icon-1', 'info', 24);
    injectIconEl('qa-icon-2', 'users', 24);
}

function injectIconEl(id, key, size) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = ICONS[key] || '';
    const svg = el.querySelector('svg');
    if (svg) { svg.style.width = svg.style.height = size + 'px'; }
}

function renderHeroCards() {
    const el = document.getElementById('heroCards');
    if (!el) return;
    const lang = window.LANG;
    const cards = [
        { iconKey: 'document', cls: 'blue', title: lang === 'ru' ? 'Заявка принята' : 'Өтініш қабылданды', sub: lang === 'ru' ? 'Юридическая помощь' : 'Заңгерлік көмек', badge: '✓', badgeCls: 'ok' },
        { iconKey: 'banknotes', cls: 'green', title: lang === 'ru' ? 'Пособие при рождении' : 'Бала туғанда жәрдемақы', sub: lang === 'ru' ? 'Вы имеете право' : 'Сіз алуға құқылысыз', badge: lang === 'ru' ? 'Подробнее' : 'Толығырақ', badgeCls: 'info' },
        { iconKey: 'users', cls: 'teal', title: lang === 'ru' ? 'Волонтёр назначен' : 'Ерікті тағайындалды', sub: lang === 'ru' ? 'Свяжется с вами' : 'Хабарласады', badge: '✓', badgeCls: 'ok' }
    ];
    el.innerHTML = cards.map(c => `
    <div class="hero-card">
      <div class="hc-icon ${c.cls}">${ICONS[c.iconKey]}</div>
      <div class="hc-text"><h4>${c.title}</h4><p>${c.sub}</p></div>
      <span class="hc-badge ${c.badgeCls}">${c.badge}</span>
    </div>`).join('');
    el.querySelectorAll('.hc-icon svg').forEach(s => { s.style.width = s.style.height = '20px'; });
}

function renderBenefitTabs() {
    const el = document.getElementById('benefitsTabs');
    if (!el) return;
    const tabs = getT('benefits.tabs');
    if (!tabs || typeof tabs !== 'object') return;
    el.innerHTML = Object.entries(tabs).map(([key, label]) =>
        `<button class="tab-btn${key === 'all' ? ' active' : ''}" data-tab="${key}">${label}</button>`).join('');
    el.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            el.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderBenefits(btn.dataset.tab);
        });
    });
}

function renderBenefits(filter = 'all') {
    const grid = document.getElementById('benefitsGrid');
    if (!grid) return;
    const lang = window.LANG;
    const items = filter === 'all' ? BENEFITS : BENEFITS.filter(b => b.category === filter);
    const learnMore = getT('benefits.learnMore') || 'Подробнее';
    grid.innerHTML = items.map(b => `
    <div class="benefit-card" onclick="window.location='benefit.html?id=${b.id}'">
      <div class="bc-top">
        <div class="bc-icon">${ICONS[b.icon] || ICONS.shield}</div>
        <span class="bc-badge">${b.badge[lang]}</span>
      </div>
      <h4>${b.title[lang]}</h4>
      <p>${b.shortDesc[lang]}</p>
      <span class="bc-link">${learnMore} ${ICONS.chevron}</span>
    </div>`).join('');
    grid.querySelectorAll('.bc-icon svg').forEach(s => { s.style.width = s.style.height = '22px'; });
    grid.querySelectorAll('.bc-link svg').forEach(s => { s.style.width = s.style.height = '14px'; });
}

function renderApplySidebar() {
    const el = document.getElementById('applySidebar');
    if (!el) return;
    const lang = window.LANG;
    const cards = getT('apply.infoCards') || [];
    const iconKeys = ['clock', 'lock', 'star', 'user'];
    const tracker = getT('apply.tracker') || {};

    el.innerHTML = cards.map((c, i) => `
    <div class="info-card">
      <div class="ic-icon">${ICONS[iconKeys[i]] || ICONS.shield}</div>
      <div><h4>${c.title}</h4><p>${c.desc}</p></div>
    </div>`).join('') +
        `<div class="tracker-card">
    <h4>${tracker.title || ''}</h4>
    <p class="tracker-hint">${tracker.hint || ''}</p>
    <div class="track-steps" id="trackSteps">
      ${(tracker.steps || []).map((s, i) => `
        ${i > 0 ? '<div class="ts-line"></div>' : ''}
        <div class="ts${i === 0 ? ' active' : ''}"><div class="ts-dot"></div><span>${s}</span></div>`).join('')}
    </div>
  </div>`;
    el.querySelectorAll('.ic-icon svg').forEach(s => { s.style.width = s.style.height = '18px'; });
}

function renderVolunteerRoles() {
    const grid = document.getElementById('rolesGrid');
    if (!grid) return;
    const lang = window.LANG;
    const roleIcons = ['briefcase', 'heart', 'users', 'globe'];
    const roleDescs = {
        ru: [
            { desc: 'Консультации по правовым вопросам и помощь с документами', items: ['Онлайн консультации', 'Помощь с заявлениями', 'Правовое просвещение'] },
            { desc: 'Психологическая поддержка людям в кризисных ситуациях', items: ['Индивидуальные беседы', 'Групповая поддержка', 'Кризисная помощь'] },
            { desc: 'Помощь пожилым и людям с ОВЗ в повседневной жизни', items: ['Доставка продуктов', 'Сопровождение', 'Помощь по дому'] },
            { desc: 'Помощь пожилым с освоением технологий и онлайн-сервисов', items: ['Обучение eGov', 'Помощь со смартфоном', 'Видеозвонки с родными'] }
        ],
        kz: [
            { desc: 'Құқықтық мәселелер бойынша кеңес және құжаттарға көмек', items: ['Онлайн кеңестер', 'Өтініштерге көмек', 'Құқықтық білім беру'] },
            { desc: 'Дағдарыс жағдайындағы адамдарға психологиялық қолдау', items: ['Жеке сұхбат', 'Топтық қолдау', 'Дағдарыс көмегі'] },
            { desc: 'Қарттар мен МЖТ бар адамдарға күнделікті өмірде көмек', items: ['Азық-түлік жеткізу', 'Серіктестік', 'Үйде көмек'] },
            { desc: 'Қарттарға технологиялар мен онлайн-қызметтерді меңгеруге көмек', items: ['eGov үйрету', 'Смартфонға көмек', 'Бейнебайланыс'] }
        ]
    };
    const roleNames = getT('volunteers.roleNames') || [];
    const data = roleDescs[lang] || roleDescs.ru;

    grid.innerHTML = data.map((r, i) => `
    <div class="role-card">
      <div class="role-icon">${ICONS[roleIcons[i]] || ICONS.users}</div>
      <h3>${roleNames[i] || ''}</h3>
      <p>${r.desc}</p>
      <ul>${r.items.map(item => `<li>${item}</li>`).join('')}</ul>
    </div>`).join('');
    grid.querySelectorAll('.role-icon svg').forEach(s => { s.style.width = s.style.height = '22px'; });

    // Volunteer role options
    const vRole = document.getElementById('vRole');
    if (vRole && roleNames.length) {
        const ph = getT('volunteers.fRolePh') || '';
        vRole.innerHTML = `<option value="">${ph}</option>` + roleNames.map(r => `<option>${r}</option>`).join('');
    }
}

function renderContacts() {
    const grid = document.getElementById('contactsGrid');
    if (!grid) return;
    const items = getT('contacts.items') || [];
    const iconKeys = ['phone', 'mail', 'location', 'chat'];
    grid.innerHTML = items.map((item, i) => `
    <div class="contact-card">
      <div class="cc-icon">${ICONS[iconKeys[i]] || ICONS.phone}</div>
      <h4>${item.label}</h4>
      <p class="cc-val">${item.value}</p>
      <p class="cc-hint">${item.hint}</p>
    </div>`).join('');
    grid.querySelectorAll('.cc-icon svg').forEach(s => { s.style.width = s.style.height = '22px'; });
}

function renderFooter() {
    const fl = document.getElementById('footerHelpList');
    if (!fl) return;
    const list = getT('footer.helpList') || [];
    fl.innerHTML = list.map(h => `<li>${h}</li>`).join('');
}

function renderChatUI() {
    injectIcon('chatFabIcon', 'chat', 22);
    injectIcon('chatAvatar', 'shield', 18);
    injectIcon('chatCloseBtn', 'close', 18);
    injectIcon('chatSendBtn', 'send', 16);
    if (document.getElementById('chatBody') && !chatInitialized) {
        initChat();
        chatInitialized = true;
    }
}

// ========== CHAT WIDGET ==========
let chatInitialized = false;

function toggleChat() {
    const win = document.getElementById('chatWindow');
    if (win) win.classList.toggle('open');
}

function initChat() {
    const body = document.getElementById('chatBody');
    if (!body) return;
    const lang = window.LANG;
    const welcome = getT('chat.welcome');
    const suggestions = getT('chat.suggestions') || [];
    body.innerHTML = `
    <div class="chat-msg bot">
      <div class="chat-bubble">${welcome}</div>
      <div class="chat-suggestions">
        ${suggestions.map(s => `<button class="chat-sug" onclick="sendChatMsg('${s}')">${s}</button>`).join('')}
      </div>
    </div>`;
}

function sendChat() {
    const input = document.getElementById('chatInput');
    if (!input || !input.value.trim()) return;
    sendChatMsg(input.value.trim());
    input.value = '';
}

function sendChatMsg(msg) {
    const body = document.getElementById('chatBody');
    if (!body) return;
    const lang = window.LANG;

    // Add user message
    body.innerHTML += `<div class="chat-msg user"><div class="chat-bubble">${msg}</div></div>`;

    // Typing indicator
    const typingId = 'typing_' + Date.now();
    const typingLabel = getT('chat.typing') || '...';
    body.innerHTML += `<div class="chat-msg bot" id="${typingId}"><div class="chat-bubble">${typingLabel}</div></div>`;
    body.scrollTop = body.scrollHeight;

    setTimeout(() => {
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();
        const response = getBotResponse(msg.toLowerCase(), lang);
        body.innerHTML += `<div class="chat-msg bot"><div class="chat-bubble">${response}</div></div>`;
        body.scrollTop = body.scrollHeight;
    }, 900);
}

function getBotResponse(msg, lang) {
    const kw = {
        apply: ['заявк', 'подать', 'обратиться', 'помощь', 'өтініш', 'беру', 'жіберу'],
        benefits: ['льгот', 'пособи', 'жеңілдік', 'жәрдемақы', 'право', 'права', 'положен'],
        docs: ['документ', 'справк', 'нужн', 'требует', 'құжат', 'анықтама'],
        contacts: ['телефон', 'номер', 'адрес', 'email', 'байланыс', 'хабарлас'],
        asp: ['асп', 'малообеспеч', 'аас', 'ааk', 'атаулы'],
        birth: ['рождени', 'ребёнк', 'бала', 'туу'],
        unemploy: ['безработ', 'работ', 'жұмыссыз', 'жұмыс']
    };

    if (lang === 'ru') {
        if (kw.apply.some(k => msg.includes(k))) return 'Чтобы подать заявку, перейдите в раздел <strong>«Подать заявку»</strong> на главной странице. Заполните форму с личными данными, выберите тип помощи и опишите ситуацию. Ответ — в течение 1–2 рабочих дней.';
        if (kw.benefits.some(k => msg.includes(k))) return 'В разделе <strong>«Льготы и пособия»</strong> представлено 12 видов льгот с фильтрами по категориям (семья, пожилые, ОВЗ, безработица, жильё). Нажмите на карточку для подробной информации с официальными источниками.';
        if (kw.docs.some(k => msg.includes(k))) return 'Обычно требуются: <strong>удостоверение личности</strong>, справка о доходах, справка о составе семьи. Конкретный список документов зависит от вида льготы — откройте нужную льготу для полного списка.';
        if (kw.contacts.some(k => msg.includes(k))) return 'Телефон: <strong>+7 775 488 23 43</strong>. Email: aruzhanmamanova0@gmail.com. Telegram: @qamqorym_bot. Адрес: г. Кызылорда, Айтеке би 29а.';
        if (kw.asp.some(k => msg.includes(k))) return 'АСП — Адресная социальная помощь для семей с доходом ниже прожиточного минимума. Вы можете <a href="benefit.html?id=asp" style="color:var(--primary)">прочитать подробнее</a> или подать заявку онлайн через eGov.kz.';
        if (kw.birth.some(k => msg.includes(k))) return 'Пособие при рождении: от 38 МРП на первого ребёнка до 150 МРП на четвёртого и более. <a href="benefit.html?id=birth" style="color:var(--primary)">Подробнее о льготе.</a>';
        if (kw.unemploy.some(k => msg.includes(k))) return 'Пособие по безработице назначается при постановке на учёт в ЦЗН в течение 30 дней после увольнения. <a href="benefit.html?id=unemployment" style="color:var(--primary)">Подробнее.</a>';
        return 'Я могу помочь с информацией о льготах, подачей заявки или поиском контактов. Уточните ваш вопрос или выберите одну из категорий в разделе «Льготы и пособия».';
    } else {
        if (kw.apply.some(k => msg.includes(k))) return '«<strong>Өтініш беру</strong>» бөліміне өтіңіз. Жеке деректерді толтырыңыз, көмек түрін таңдап, жағдайыңызды сипаттаңыз. Жауап — 1–2 жұмыс күні ішінде.';
        if (kw.benefits.some(k => msg.includes(k))) return '«<strong>Жеңілдіктер</strong>» бөлімінде 12 түрлі жеңілдік санаттар бойынша сүзгіде берілген. Толық ақпарат алу үшін картаны басыңыз.';
        if (kw.docs.some(k => msg.includes(k))) return 'Әдетте: <strong>жеке куәлік</strong>, табыс туралы анықтама, отбасы құрамы туралы анықтама қажет. Нақты тізім жеңілдік түріне байланысты.';
        if (kw.contacts.some(k => msg.includes(k))) return 'Телефон: <strong>+7 775 488 23 43</strong>. Email: aruzhanmamanova0@gmail.com. Telegram: @qamqorym_bot. Мекенжай: г. Қызылорда, Айтеке би 29а.';
        if (kw.asp.some(k => msg.includes(k))) return 'ААК — табысы күнкөріс минимумынан төмен отбасыларға арналған атаулы әлеуметтік көмек. <a href="benefit.html?id=asp" style="color:var(--primary)">Толығырақ оқу.</a>';
        if (kw.birth.some(k => msg.includes(k))) return 'Бала туғанда жәрдемақы: бірінші балаға 38 АЕК-тен, төртінші және одан көп балаға 150 АЕК-ке дейін. <a href="benefit.html?id=birth" style="color:var(--primary)">Толығырақ.</a>';
        if (kw.unemploy.some(k => msg.includes(k))) return 'Жұмыссыздық жәрдемақысы жұмыстан шыққаннан кейін 30 күн ішінде ЕОО-да есепке тұрса тағайындалады. <a href="benefit.html?id=unemployment" style="color:var(--primary)">Толығырақ.</a>';
        return 'Мен жеңілдіктер, өтінім беру немесе байланыс туралы ақпарат бере аламын. Сұрағыңызды нақтылаңыз.';
    }
}

// ========== TELEGRAM BOT ==========
const TG_BOT_TOKEN = '8664671759:AAHT_7pxYevgmUaa1LnZeuA6Y7uoobUHwLU';
const TG_CHAT_ID = '8664671759'; // будет заменено на реальный chat_id после первого сообщения боту

async function sendToTelegram(text) {
    try {
        await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'HTML' })
        });
    } catch (err) {
        console.warn('Telegram send error:', err);
    }
}

// ========== FORM SUBMIT ==========
function submitApply(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const origContent = btn.innerHTML;
    const submitting = getT('apply.submitting') || 'Жіберілуде...';
    btn.disabled = true;
    btn.innerHTML = `<span>${submitting}</span>`;

    const num = 'Q-' + Date.now().toString().slice(-6);
    const name = document.getElementById('fName')?.value.trim() || '—';
    const phone = document.getElementById('fPhone')?.value.trim() || '—';
    const email = document.getElementById('fEmail')?.value.trim() || '—';
    const type = document.getElementById('fType');
    const typeText = type ? type.options[type.selectedIndex]?.text : '—';
    const desc = document.getElementById('fDesc')?.value.trim() || '—';
    const now = new Date().toLocaleDateString(window.LANG === 'kz' ? 'kk-KZ' : 'ru-RU');

    // Send to Telegram
    const tgText = [
        `📋 <b>Новая заявка ${num}</b>`,
        `👤 Имя: ${name}`,
        `📞 Телефон: ${phone}`,
        `📧 Email: ${email}`,
        `🏷 Тип помощи: ${typeText}`,
        `📝 Описание: ${desc}`,
        `📅 Дата: ${now}`
    ].join('\n');
    sendToTelegram(tgText);

    setTimeout(() => {
        // Save to localStorage
        const apps = JSON.parse(localStorage.getItem('qamqor_apps') || '[]');
        apps.push({ number: num, type: typeText, date: now, status: 'pending' });
        localStorage.setItem('qamqor_apps', JSON.stringify(apps));

        // Show modal
        const tr = TRANSLATIONS[window.LANG].modal;
        document.getElementById('modalIconWrap').innerHTML = ICONS.check;
        document.getElementById('modalIconWrap').querySelector('svg').style.cssText = 'width:28px;height:28px';
        document.getElementById('modalTitle').textContent = tr.success;
        document.getElementById('modalMsg').innerHTML = `${tr.successMsg} <strong>${num}</strong>`;
        document.getElementById('modalOverlay').classList.add('active');

        // Animate tracker steps
        const steps = document.querySelectorAll('.ts');
        steps.forEach((s, i) => setTimeout(() => s.classList.add('active'), i * 600));

        btn.innerHTML = origContent;
        btn.disabled = false;
        e.target.reset();
    }, 1200);
}

function submitVol(e) {
    e.preventDefault();
    setTimeout(() => {
        const tr = TRANSLATIONS[window.LANG].modal;
        document.getElementById('modalIconWrap').innerHTML = ICONS.check;
        document.getElementById('modalIconWrap').querySelector('svg').style.cssText = 'width:28px;height:28px';
        document.getElementById('modalTitle').textContent = tr.volSuccess;
        document.getElementById('modalMsg').textContent = tr.volMsg;
        document.getElementById('modalOverlay').classList.add('active');
        e.target.reset();
    }, 900);
}

function closeModal() {
    document.getElementById('modalOverlay')?.classList.remove('active');
}

// ========== NAV UTILS ==========
function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toggleMenu() {
    document.getElementById('navLinks')?.classList.toggle('open');
}

window.addEventListener('scroll', () => {
    document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 10);
});

// ========== AUTH MODAL ==========
function openAuthModal() {
    const user = JSON.parse(localStorage.getItem('qamqor_user') || 'null');
    if (user) {
        // Already logged in → go to profile
        window.location = 'profile.html';
        return;
    }
    injectIcon('authLogoIcon', 'shield', 16);
    injectIcon('authCloseBtn', 'close', 16);
    // eGov icon (globe)
    const eg = document.getElementById('authEgovIcon');
    if (eg) { eg.innerHTML = ICONS.globe; const s = eg.querySelector('svg'); if (s) s.style.cssText = 'width:18px;height:18px'; }
    document.getElementById('authOverlay')?.classList.add('active');
}

function closeAuthModal() {
    document.getElementById('authOverlay')?.classList.remove('active');
}

function switchAuthTab(tab) {
    document.getElementById('authLogin').style.display = tab === 'login' ? '' : 'none';
    document.getElementById('authRegister').style.display = tab === 'register' ? '' : 'none';
    document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
    document.getElementById('tabReg').classList.toggle('active', tab === 'register');
}

function doLogin() {
    const phone = document.getElementById('loginPhone')?.value.trim();
    const pass = document.getElementById('loginPass')?.value;
    if (!phone || !pass) { alert(window.LANG === 'kz' ? 'Барлық өрістерді толтырыңыз' : 'Заполните все поля'); return; }

    // Check stored users
    const users = JSON.parse(localStorage.getItem('qamqor_users') || '[]');
    const found = users.find(u => (u.phone === phone || u.email === phone) && u.pass === pass);
    if (!found) {
        alert(window.LANG === 'kz' ? 'Қате логин немесе пароль' : 'Неверный логин или пароль');
        return;
    }
    localStorage.setItem('qamqor_user', JSON.stringify(found));
    closeAuthModal();
    updateProfileBtn(found);
    setTimeout(() => window.location = 'profile.html', 300);
}

function doRegister() {
    const name = document.getElementById('regName')?.value.trim();
    const phone = document.getElementById('regPhone')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const pass = document.getElementById('regPass')?.value;
    const ok = document.getElementById('regConsent')?.checked;
    if (!name || !phone || !pass) { alert(window.LANG === 'kz' ? 'Міндетті өрістерді толтырыңыз' : 'Заполните обязательные поля'); return; }
    if (!ok) { alert(window.LANG === 'kz' ? 'Деректерді өңдеуге келісім беріңіз' : 'Дайте согласие на обработку данных'); return; }
    if (pass.length < 8) { alert(window.LANG === 'kz' ? 'Пароль кемінде 8 таңба' : 'Пароль минимум 8 символов'); return; }

    const users = JSON.parse(localStorage.getItem('qamqor_users') || '[]');
    if (users.find(u => u.phone === phone || (email && u.email === email))) {
        alert(window.LANG === 'kz' ? 'Бұл пайдаланушы тіркелген' : 'Такой пользователь уже зарегистрирован');
        return;
    }
    const newUser = { name, phone, email, pass, createdAt: new Date().toISOString() };
    users.push(newUser);
    localStorage.setItem('qamqor_users', JSON.stringify(users));
    localStorage.setItem('qamqor_user', JSON.stringify(newUser));
    closeAuthModal();
    updateProfileBtn(newUser);
    setTimeout(() => window.location = 'profile.html', 300);
}

function doEGovLogin() {
    // Simulate eGov auth — in production this would be an OAuth redirect
    const mockUser = { name: 'eGov Пайдаланушы', phone: '+7 (705) 000-00-00', email: 'egov@qamqor.kz', source: 'egov' };
    localStorage.setItem('qamqor_user', JSON.stringify(mockUser));
    closeAuthModal();
    updateProfileBtn(mockUser);
    setTimeout(() => window.location = 'profile.html', 300);
}

function showReset() {
    alert(window.LANG === 'kz' ? 'Телефонмен хабарласыңыз: +7 775 488 23 43' : 'Обратитесь по телефону: +7 775 488 23 43');
}

function updateProfileBtn(user) {
    const btn = document.getElementById('profileBtn');
    const lbl = document.getElementById('profileBtnLabel');
    if (btn) btn.classList.add('logged-in');
    if (lbl && user?.name) lbl.textContent = user.name.split(' ')[0];
}

// On load — init everything
document.addEventListener('DOMContentLoaded', () => {
    renderAll();

    // Restore logged-in state
    const user = JSON.parse(localStorage.getItem('qamqor_user') || 'null');
    if (user) updateProfileBtn(user);

    // Scroll fade-in animation
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'none'; } });
    }, { threshold: 0.1 });

    setTimeout(() => {
        document.querySelectorAll('.qa-card, .benefit-card, .role-card, .contact-card').forEach(el => {
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            el.style.opacity = '0';
            el.style.transform = 'translateY(16px)';
            obs.observe(el);
        });
    }, 100);
});


