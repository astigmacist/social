// ========== LANGUAGE ==========
window.LANG = localStorage.getItem('qamqor_lang') || 'ru';
const API_BASE = '/api';

function toggleLang() {
    window.LANG = window.LANG === 'ru' ? 'kz' : 'ru';
    localStorage.setItem('qamqor_lang', window.LANG);
    
    // Add visual delay as requested
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay-lang';
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('active'), 10);

    setTimeout(() => {
        window.location.reload();
    }, 800);
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
async function renderAll() {
    renderNav();
    renderHeroCards();
    await renderBenefitTabs();
    await renderBenefits('all');
    renderApplySidebar();
    renderVolunteerRoles();
    renderContacts();
    renderFooter();
    renderChatUI();
    applyI18n();
    renderNews(); // load news section
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

async function renderBenefitTabs() {
    const el = document.getElementById('benefitsTabs');
    if (!el) return;
    try {
        const res = await fetch(`${API_BASE}/categories/`);
        const categories = await res.json();
        const lang = window.LANG;
        const allLabel = lang === 'ru' ? 'Все' : 'Барлығы';
        
        let html = `<button class="tab-btn active" data-tab="all">${allLabel}</button>`;
        html += categories.map(c => 
            `<button class="tab-btn" data-tab="${c.slug}">${lang === 'ru' ? c.title_ru : c.title_kz}</button>`
        ).join('');
        
        el.innerHTML = html;
        el.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                el.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderBenefits(btn.dataset.tab);
            });
        });
    } catch (err) {
        console.error('Fetch categories error:', err);
    }
}

async function renderBenefits(filter = 'all') {
    const grid = document.getElementById('benefitsGrid');
    if (!grid) return;
    const lang = window.LANG;
    try {
        const res = await fetch(`${API_BASE}/benefits/?category=${filter}`);
        const items = await res.json();
        const learnMore = getT('benefits.learnMore') || 'Подробнее';
        
        grid.innerHTML = items.map(b => `
        <div class="benefit-card" onclick="window.location='benefit.html?id=${b.id}'">
          <div class="bc-top">
            <div class="bc-icon">${ICONS[b.icon] || ICONS.shield}</div>
            <span class="bc-badge">${lang === 'ru' ? b.badge_ru : b.badge_kz}</span>
          </div>
          <h4>${lang === 'ru' ? b.title_ru : b.title_kz}</h4>
          <p>${lang === 'ru' ? b.short_desc_ru : b.short_desc_kz}</p>
          <span class="bc-link">${learnMore} ${ICONS.chevron}</span>
        </div>`).join('');
        grid.querySelectorAll('.bc-icon svg').forEach(s => { s.style.width = s.style.height = '22px'; });
        grid.querySelectorAll('.bc-link svg').forEach(s => { s.style.width = s.style.height = '14px'; });
    } catch (err) {
        grid.innerHTML = '<p>Ошибка загрузки данных.</p>';
    }
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
        return 'Я могу помочь с информацией о льготах, подажей заявки или поиском контактов. Уточните ваш вопрос или выберите одну из категорий в разделе «Льготы и пособия».';
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

// ========== FORM SUBMIT ==========
async function submitApply(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const origContent = btn.innerHTML;
    const submitting = getT('apply.submitting') || 'Жіберілуде...';
    btn.disabled = true;
    btn.innerHTML = `<span>${submitting}</span>`;

    const name = document.getElementById('fName')?.value.trim() || '—';
    const phone = document.getElementById('fPhone')?.value.trim() || '—';
    const email = document.getElementById('fEmail')?.value.trim() || '';
    const type = document.getElementById('fType');
    const typeText = type ? type.options[type.selectedIndex]?.text : '—';
    const desc = document.getElementById('fDesc')?.value.trim() || '—';

    const token = localStorage.getItem('qamqor_access_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await fetch(`${API_BASE}/apply/`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                full_name: name,
                phone: phone,
                email: email,
                help_type: typeText,
                description: desc
            })
        });

        if (!response.ok) throw new Error('API error');
        const data = await response.json();
        const appNum = data.application_number || `Q-${Date.now().toString().slice(-6)}`;

        // Show modal
        const tr = TRANSLATIONS[window.LANG].modal;
        document.getElementById('modalIconWrap').innerHTML = ICONS.check;
        document.getElementById('modalIconWrap').querySelector('svg').style.cssText = 'width:28px;height:28px';
        document.getElementById('modalTitle').textContent = tr.success;
        document.getElementById('modalMsg').innerHTML = `${tr.successMsg} <strong>${appNum}</strong>`;
        document.getElementById('modalOverlay').classList.add('active');

        // Animate tracker steps
        const steps = document.querySelectorAll('.ts');
        steps.forEach((s, i) => setTimeout(() => s.classList.add('active'), i * 600));

        e.target.reset();
    } catch (err) {
        alert('Ошибка при отправке заявки.');
    } finally {
        btn.innerHTML = origContent;
        btn.disabled = false;
    }
}

async function submitVol(e) {
    e.preventDefault();
    const name = e.target.querySelector('input[type="text"]').value;
    const phone = e.target.querySelector('input[type="tel"]').value;
    const role = document.getElementById('vRole').value;
    const about = e.target.querySelector('textarea').value;

    const token = localStorage.getItem('qamqor_access_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await fetch(`${API_BASE}/volunteer/`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name, phone, role, about })
        });

        if (!response.ok) throw new Error('API error');

        const tr = TRANSLATIONS[window.LANG].modal;
        document.getElementById('modalIconWrap').innerHTML = ICONS.check;
        document.getElementById('modalIconWrap').querySelector('svg').style.cssText = 'width:28px;height:28px';
        document.getElementById('modalTitle').textContent = tr.volSuccess;
        document.getElementById('modalMsg').textContent = tr.volMsg;
        document.getElementById('modalOverlay').classList.add('active');
        e.target.reset();
    } catch (err) {
        alert('Ошибка при регистрации.');
    }
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

// ========== PHONE MASK ==========
function applyPhoneMask(input) {
    input.addEventListener('input', function (e) {
        let raw = this.value.replace(/\D/g, '');
        // Always keep leading 7
        if (raw.startsWith('8')) raw = '7' + raw.slice(1);
        if (!raw.startsWith('7')) raw = '7' + raw;
        raw = raw.slice(0, 11); // max 11 digits with country code

        let formatted = '+7';
        if (raw.length > 1) formatted += ' (' + raw.slice(1, 4);
        if (raw.length >= 4) formatted += ')';
        if (raw.length > 4) formatted += ' ' + raw.slice(4, 7);
        if (raw.length > 7) formatted += ' ' + raw.slice(7, 9);
        if (raw.length > 9) formatted += ' ' + raw.slice(9, 11);
        this.value = formatted;
    });

    input.addEventListener('keydown', function (e) {
        if ((e.key === 'Backspace' || e.key === 'Delete') && this.value.length <= 3) {
            this.value = '+7';
            e.preventDefault();
        }
    });

    input.addEventListener('focus', function () {
        if (!this.value) this.value = '+7';
    });

    input.addEventListener('blur', function () {
        if (this.value === '+7') this.value = '';
    });
}

function cleanPhone(val) {
    return val.replace(/\D/g, '');
}

// Smart mask for login field (phone OR email)
function applyLoginMask(input) {
    input.addEventListener('input', function () {
        const val = this.value;
        if (val.includes('@') || (val.length > 0 && !/^[+\d]/.test(val))) return;
        let raw = val.replace(/\D/g, '');
        if (!raw) { this.value = ''; return; }
        if (raw.startsWith('8')) raw = '7' + raw.slice(1);
        if (!raw.startsWith('7')) raw = '7' + raw;
        raw = raw.slice(0, 11);
        let fmt = '+7';
        if (raw.length > 1) fmt += ' (' + raw.slice(1, 4);
        if (raw.length >= 4) fmt += ')';
        if (raw.length > 4) fmt += ' ' + raw.slice(4, 7);
        if (raw.length > 7) fmt += ' ' + raw.slice(7, 9);
        if (raw.length > 9) fmt += ' ' + raw.slice(9, 11);
        this.value = fmt;
    });
}

// ========== AUTH MODAL ==========
function openAuthModal() {
    if (localStorage.getItem('qamqor_access_token')) {
        window.location = 'profile.html';
        return;
    }
    document.getElementById('authOverlay')?.classList.add('active');
    const regPh = document.getElementById('regPhone');
    if (regPh && !regPh._maskApplied) { applyPhoneMask(regPh); regPh._maskApplied = true; }
    const loginPh = document.getElementById('loginPhone');
    if (loginPh && !loginPh._maskApplied) { applyLoginMask(loginPh); loginPh._maskApplied = true; }
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

async function doLogin() {
    const rawInput = document.getElementById('loginPhone')?.value.trim();
    const pass = document.getElementById('loginPass')?.value;
    if (!rawInput || !pass) {
        alert(window.LANG === 'kz' ? 'Барлық өрістерді толтырыңыз' : 'Заполните все поля');
        return;
    }
    const btn = document.querySelector('#authLogin .btn-primary');
    if (btn) { btn.disabled = true; btn.textContent = '...'; }
    try {
        const res = await fetch(`${API_BASE}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login: rawInput, password: pass }),
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.error || (window.LANG === 'kz' ? 'Қате логин немесе пароль' : 'Неверный логин или пароль'));
            return;
        }
        localStorage.setItem('qamqor_access_token', data.tokens.access);
        localStorage.setItem('qamqor_refresh_token', data.tokens.refresh);
        localStorage.setItem('qamqor_user', JSON.stringify(data.user));
        closeAuthModal();
        updateProfileBtn(data.user);
        setTimeout(() => window.location = 'profile.html', 300);
    } catch (err) {
        alert('Ошибка соединения с сервером.');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = window.LANG === 'kz' ? 'Кіру' : 'Войти в аккаунт'; }
    }
}

async function doRegister() {
    const name = document.getElementById('regName')?.value.trim();
    const phone = document.getElementById('regPhone')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const pass = document.getElementById('regPass')?.value;
    const ok = document.getElementById('regConsent')?.checked;
    if (!name || !phone || !pass) { alert(window.LANG === 'kz' ? 'Міндетті өрістерді толтырыңыз' : 'Заполните обязательные поля'); return; }
    if (!ok) { alert(window.LANG === 'kz' ? 'Деректерді өңдеуге келісім беріңіз' : 'Дайте согласие на обработку данных'); return; }
    if (pass.length < 8) { alert(window.LANG === 'kz' ? 'Пароль кемінде 8 таңба' : 'Пароль минимум 8 символов'); return; }
    const btn = document.querySelector('#authRegister .btn-primary');
    if (btn) { btn.disabled = true; btn.textContent = '...'; }
    try {
        const res = await fetch(`${API_BASE}/auth/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, email, password: pass }),
        });
        const data = await res.json();
        if (!res.ok) {
            const errs = data.errors ? Object.values(data.errors).flat().join('\n') : 'Ошибка регистрации.';
            alert(errs);
            return;
        }
        localStorage.setItem('qamqor_access_token', data.tokens.access);
        localStorage.setItem('qamqor_refresh_token', data.tokens.refresh);
        localStorage.setItem('qamqor_user', JSON.stringify(data.user));
        closeAuthModal();
        updateProfileBtn(data.user);
        setTimeout(() => window.location = 'profile.html', 300);
    } catch (err) {
        alert('Ошибка соединения с сервером.');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = window.LANG === 'kz' ? 'Тіркелу' : 'Создать аккаунт'; }
    }
}

function updateProfileBtn(user) {
    const lbl = document.getElementById('profileBtnLabel');
    const btn = document.getElementById('profileBtn');
    const name = user?.full_name || user?.name || user?.username;
    if (lbl && name) lbl.textContent = name.split(' ')[0];
    if (btn) btn.classList.add('logged-in');
}

function doEGovLogin() {
    // Close auth modal and show eGov info overlay
    closeAuthModal();
    showEGovModal();
}

function showEGovModal() {
    const overlay = document.getElementById('egovOverlay');
    if (overlay) { overlay.classList.add('active'); return; }

    // Create eGov info modal dynamically
    const d = document.createElement('div');
    d.id = 'egovOverlay';
    d.className = 'modal-overlay active';
    d.onclick = () => d.classList.remove('active');
    d.innerHTML = `
      <div class="egov-info-modal" onclick="event.stopPropagation()">
        <div class="egov-logo-row">
          <div class="egov-logo-badge">eGov.kz</div>
        </div>
        <h3>${window.LANG === 'kz' ? 'eGov арқылы кіру' : 'Вход через eGov.kz'}</h3>
        <p>${window.LANG === 'kz'
          ? 'eGov.kz — ҚР мемлекеттік порталы. Оны пайдаланып кіру үшін ЭЦҚ (цифрлық қолтаңба) немесе eGov Mobile қосымшасы қажет.'
          : 'eGov.kz — государственный портал РК. Для входа через eGov необходима ЭЦП (электронная цифровая подпись) или приложение eGov Mobile.'
        }</p>
        <p style="font-size:0.8rem;color:#9ca3af">${window.LANG === 'kz'
          ? 'Интеграция іске асырылу үстінде. Қазір тіркелу арқылы кіруіңізді сұраймыз.'
          : 'Интеграция находится в разработке. Пока что, пожалуйста, войдите или зарегистрируйтесь на Qamqor.'}</p>
        <div class="egov-btn-group">
          <a href="https://egov.kz" target="_blank" class="egov-btn-primary">Перейти на eGov.kz</a>
          <button class="egov-btn-secondary" onclick="document.getElementById('egovOverlay').classList.remove('active'); openAuthModal()">
            ${window.LANG === 'kz' ? 'Тіркелу' : 'Зарегистрироваться'}
          </button>
        </div>
      </div>`;
    document.body.appendChild(d);
}

function showReset() {
    alert(window.LANG === 'kz' ? 'Телефонмен хабарласыңыз: +7 775 488 23 43' : 'Обратитесь по телефону: +7 775 488 23 43');
}

document.addEventListener('DOMContentLoaded', () => {
    // Only run full render on index page (not profile/benefit pages)
    const isIndexPage = !window.location.pathname.includes('profile.html') &&
                        !window.location.pathname.includes('benefit.html') &&
                        !window.location.pathname.includes('volunteer-portal.html');

    if (isIndexPage) {
        renderAll();
    } else {
        // On other pages still inject icons and apply translations
        applyI18n();
        const li = document.getElementById('langIcon');
        if (li) injectIcon('langIcon', 'globe', 14);
    }

    // Restore auth state from JWT on all pages
    const token = localStorage.getItem('qamqor_access_token');
    if (token) {
        const user = JSON.parse(localStorage.getItem('qamqor_user') || 'null');
        if (user) updateProfileBtn(user);
    }

    if (isIndexPage) {
        document.querySelectorAll('input[type="tel"]').forEach(applyPhoneMask);

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
    }
});

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

// ========== PHONE MASK ==========
function applyPhoneMask(input) {
    input.addEventListener('input', function (e) {
        let raw = this.value.replace(/\D/g, '');
        // Always keep leading 7
        if (raw.startsWith('8')) raw = '7' + raw.slice(1);
        if (!raw.startsWith('7')) raw = '7' + raw;
        raw = raw.slice(0, 11); // max 11 digits with country code

        let formatted = '+7';
        if (raw.length > 1) formatted += ' (' + raw.slice(1, 4);
        if (raw.length >= 4) formatted += ')';
        if (raw.length > 4) formatted += ' ' + raw.slice(4, 7);
        if (raw.length > 7) formatted += ' ' + raw.slice(7, 9);
        if (raw.length > 9) formatted += ' ' + raw.slice(9, 11);
        this.value = formatted;
    });

    input.addEventListener('keydown', function (e) {
        // Allow deletion — clear to +7 if backspacing past prefix
        if ((e.key === 'Backspace' || e.key === 'Delete') && this.value.length <= 3) {
            this.value = '+7';
            e.preventDefault();
        }
    });

    input.addEventListener('focus', function () {
        if (!this.value) this.value = '+7';
    });

    input.addEventListener('blur', function () {
        if (this.value === '+7') this.value = '';
    });
}

function cleanPhone(val) {
    return val.replace(/\D/g, '');
}

// Smart mask for login field (phone OR email)
function applyLoginMask(input) {
    input.addEventListener('input', function () {
        const val = this.value;
        // If it looks like an email, don't apply phone mask
        if (val.includes('@') || (val.length > 0 && !/^[+\d]/.test(val))) return;
        // Otherwise apply phone mask
        let raw = val.replace(/\D/g, '');
        if (!raw) { this.value = ''; return; }
        if (raw.startsWith('8')) raw = '7' + raw.slice(1);
        if (!raw.startsWith('7')) raw = '7' + raw;
        raw = raw.slice(0, 11);
        let fmt = '+7';
        if (raw.length > 1) fmt += ' (' + raw.slice(1, 4);
        if (raw.length >= 4) fmt += ')';
        if (raw.length > 4) fmt += ' ' + raw.slice(4, 7);
        if (raw.length > 7) fmt += ' ' + raw.slice(7, 9);
        if (raw.length > 9) fmt += ' ' + raw.slice(9, 11);
        this.value = fmt;
    });
}


// ========== NEWS RENDERING ==========
async function renderNews() {
    const grid = document.getElementById('newsGrid');
    if (!grid) return;
    try {
        const res = await fetch(`${API_BASE}/news/?limit=6`);
        const news = await res.json();
        if (!news.length) {
            grid.innerHTML = '<p class="news-loading">Новостей пока нет.</p>';
            return;
        }
        const lang = window.LANG;
        const catColors = { news:'news', announcement:'announcement', law:'law', event:'event' };
        const catLabels = {
            ru: { news:'Новости', announcement:'Объявление', law:'Законодательство', event:'Мероприятие' },
            kz: { news:'Жаңалықтар', announcement:'Хабарлама', law:'Заңнама', event:'Іс-шара' }
        };
        grid.innerHTML = news.map(item => {
            const title = lang === 'kz' ? item.title_kz : item.title_ru;
            const body = lang === 'kz' ? item.body_kz : item.body_ru;
            const catKey = item.category;
            const catLabel = catLabels[lang]?.[catKey] || item.category_display;
            const date = new Date(item.created_at).toLocaleDateString(lang === 'kz' ? 'kk-KZ' : 'ru-RU', {day:'numeric',month:'long'});
            const sourceBtn = item.source_url
                ? `<a href="${item.source_url}" target="_blank" class="news-source-link">🔗 Источник</a>`
                : '<span></span>';
            return `
              <div class="news-card">
                <div class="news-meta">
                  <span class="news-badge ${catColors[catKey]}">${catLabel}</span>
                  <span class="news-date">${date}</span>
                </div>
                <div class="news-title">${title}</div>
                <div class="news-body">${body}</div>
                <div class="news-footer">${sourceBtn}</div>
              </div>`;
        }).join('');
    } catch(e) {
        grid.innerHTML = '<p class="news-loading">Не удалось загрузить новости.</p>';
    }
}
