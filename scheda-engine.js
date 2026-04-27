/**
 * INFERNO RPG - MOTORE UNIFICATO DELLA SCHEDA
 * Gestisce calcoli, rendering UI, temi e funzioni speciali (PDF, Avatar, Master View)
 */

// --- UTILITY ---
window.togMob = (t) => { t.classList.toggle('open'); t.nextElementSibling.classList.toggle('open'); };
window.fm = (n) => (n >= 0 ? '+' : '') + n;
window.gMod = (k) => {
    var c = D.car.find(c => c.k === k);
    var i = document.querySelector('[data-ck="' + k + '"]');
    var v = i ? parseInt(i.value) || 10 : (c ? c.v : 10);
    return Math.floor((v - 10) / 2);
};
window.gPrf = () => {
    var v = document.getElementById('f-prf');
    return parseInt((v ? v.value : '+2').replace('+', '')) || 2;
};

// --- RENDERING CARATTERISTICHE ---
window.rCar = () => {
    var c = document.getElementById('cl'); if (!c) return;
    c.innerHTML = '';
    D.car.forEach(function (cr) {
        var d = document.createElement('div'); d.className = 'caract-block';
        d.innerHTML = '<div class="caract-name">' + cr.n + '</div>' +
            '<input type="number" class="caract-val" data-ck="' + cr.k + '" value="' + cr.v + '" min="1" max="30">' +
            '<div class="caract-mod" id="cm-' + cr.k + '">' + window.fm(Math.floor((cr.v - 10) / 2)) + '</div>';
        c.appendChild(d);
    });
    c.querySelectorAll('.caract-val').forEach(function (inp) {
        inp.addEventListener('input', function () {
            var k = inp.dataset.ck;
            document.getElementById('cm-' + k).textContent = window.fm(Math.floor(((parseInt(inp.value) || 10) - 10) / 2));
            window.rAll();
        });
    });
};

// --- TIRI SALVEZZA & ABILITÀ ---
window.rTS = () => {
    var c = document.getElementById('ts-col'); if (!c) return; c.innerHTML = '';
    D.ts.forEach(function (ts, i) {
        var b = window.gMod(ts.k) + (ts.p ? window.gPrf() : 0);
        var r = document.createElement('div'); r.className = 'skill-row';
        r.innerHTML = '<div class="pdot ' + (ts.p ? 'on' : '') + '" onclick="tTS(this,' + i + ')"></div>' +
            '<span class="skill-bonus" id="tsb-' + i + '">' + window.fm(b) + '</span>' +
            '<span class="skill-name">' + ts.n + '</span>';
        c.appendChild(r);
    });
};
window.tTS = (d, i) => { d.classList.toggle('on'); D.ts[i].p = d.classList.contains('on'); window.rfTS(); };
window.rfTS = () => { D.ts.forEach(function (ts, i) { var e = document.getElementById('tsb-' + i); if (e) e.textContent = window.fm(window.gMod(ts.k) + (ts.p ? window.gPrf() : 0)); }); };

window.rAb = () => {
    var c = document.getElementById('ab-col'); if (!c) return; c.innerHTML = '';
    D.ab.forEach(function (ab, i) {
        var b = window.gMod(ab.k) + (ab.p ? window.gPrf() : 0);
        var r = document.createElement('div'); r.className = 'skill-row';
        r.innerHTML = '<div class="pdot ' + (ab.p ? 'on' : '') + '" onclick="tAb(this,' + i + ')"></div>' +
            '<span class="skill-bonus" id="abb-' + i + '">' + window.fm(b) + '</span>' +
            '<input class="skill-name-input" value="' + ab.n + '" placeholder="Abilità" onchange="D.ab[' + i + '].n=this.value">' +
            '<input class="attr-input" value="' + ab.k + '" placeholder="FOR" onchange="D.ab[' + i + '].k=this.value;rfAb()">' +
            '<button class="del-btn" onclick="delAb(' + i + ')">✕</button>';
        c.appendChild(r);
    });
};
window.tAb = (d, i) => { d.classList.toggle('on'); D.ab[i].p = d.classList.contains('on'); window.rfAb(); };
window.rfAb = () => { D.ab.forEach(function (ab, i) { var e = document.getElementById('abb-' + i); if (e) e.textContent = window.fm(window.gMod(ab.k) + (ab.p ? window.gPrf() : 0)); }); };
window.addAb = () => { D.ab.push({ n: '', k: 'FOR', p: false }); window.rAb(); };
window.delAb = (i) => { D.ab.splice(i, 1); window.rAb(); };

// --- EMBLEMI & ATTACCHI ---
var SN = ['Base', 'Tormentato', 'Arso', 'Condannato'], SC = ['sp0', 'sp1', 'sp2', 'sp3'];
window.rEmbl = () => {
    var tb = document.getElementById('etb'); if (!tb) return; tb.innerHTML = '';
    D.em.forEach(function (e, i) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td><input class="cell-input" value="' + e.n + '" placeholder="Nome" onchange="D.em[' + i + '].n=this.value"></td>' +
            '<td><input class="cell-input" value="' + e.b + '" style="width:40px" placeholder="+0" onchange="D.em[' + i + '].b=this.value"></td>' +
            '<td><input class="cell-input" value="' + e.d + '" placeholder="1d6" onchange="D.em[' + i + '].d=this.value"></td>' +
            '<td><span class="stato-pill ' + SC[e.s || 0] + '" data-s="' + (e.s || 0) + '" onclick="cycS(this,' + i + ')">' + (SN[e.s || 0]) + '</span></td>' +
            '<td><input class="cell-input" value="' + (e.nt || '') + '" placeholder="Note..." onchange="D.em[' + i + '].nt=this.value"></td>' +
            '<td><button class="del-btn" onclick="delEm(' + i + ')">✕</button></td>';
        tb.appendChild(tr);
    });
};
window.cycS = (b, i) => { var s = (parseInt(b.dataset.s) + 1) % 4; b.dataset.s = s; D.em[i].s = s; b.textContent = SN[s]; b.className = 'stato-pill ' + SC[s]; };
window.addEmbl = () => { D.em.push({ n: '', b: '', d: '', s: 0, nt: '' }); window.rEmbl(); };
window.delEm = (i) => { D.em.splice(i, 1); window.rEmbl(); };

window.rAtk = () => {
    var tb = document.getElementById('atb'); if (!tb) return; tb.innerHTML = '';
    D.atk.forEach(function (a, i) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td><input class="cell-input" value="' + a.n + '" placeholder="Nome attacco" onchange="D.atk[' + i + '].n=this.value"></td>' +
            '<td class="bonus-cell click-edit" onclick="edAtk(' + i + ',\'b\',this)">' + (a.b || '—') + '</td>' +
            '<td class="click-edit" onclick="edAtk(' + i + ',\'d\',this)" style="font-size:13px;cursor:pointer">' + (a.d || '—') + '</td>' +
            '<td class="click-edit" onclick="edAtk(' + i + ',\'nt\',this)" style="font-size:12px;color:var(--ink3);cursor:pointer">' + (a.nt || '') + '</td>' +
            '<td><button class="del-btn" onclick="delAtk(' + i + ')">✕</button></td>';
        tb.appendChild(tr);
    });
};
window.edAtk = (i, f, td) => {
    var inp = document.createElement('input'); inp.value = D.atk[i][f] || ''; inp.placeholder = '...';
    inp.style.cssText = 'background:transparent;border:none;border-bottom:1px solid var(--borderl);font-family:inherit;font-size:inherit;color:var(--ink);width:100%;outline:none;';
    td.innerHTML = ''; td.appendChild(inp); inp.focus();
    inp.onblur = function () { D.atk[i][f] = inp.value; window.rAtk(); };
    inp.onkeydown = function (e) { if (e.key === 'Enter') inp.blur(); };
};
window.addAtk = () => { D.atk.push({ n: '', b: '', d: '', nt: '' }); window.rAtk(); };
window.delAtk = (i) => { D.atk.splice(i, 1); window.rAtk(); };

// --- MAGIE (Versione con Descrizione) ---
window.rSpells = () => {
    var c0 = document.getElementById('sp-0'); if (!c0) return; c0.innerHTML = '';
    (D.spells[0] || []).forEach(function (s, i) {
        var r = document.createElement('div'); r.className = 'spell-row';
        r.style.flexDirection = 'column'; r.style.alignItems = 'stretch'; r.style.gap = '4px';
        r.innerHTML = '<div style="display:flex; align-items:center; gap:8px;">' +
            '<input class="spell-name-input" value="' + (s.n || '') + '" placeholder="Nome trucchetto..." onchange="D.spells[0][' + i + '].n=this.value">' +
            '<button class="del-btn" onclick="window.delSpell(0,' + i + ')">✕</button>' +
        '</div>' +
        '<input class="spell-desc-input" value="' + (s.d || '') + '" placeholder="Effetto del trucchetto..." onchange="D.spells[0][' + i + '].d=this.value" style="font-size:10px; color:var(--ink3); background:transparent; border:none; border-bottom:1px solid rgba(160,120,32,0.1); margin-left:4px; outline:none; font-style:italic;">';
        c0.appendChild(r);
    });
    
    var sg = document.getElementById('spell-grid'); if (!sg) return; sg.innerHTML = '';
    for (var lv = 1; lv <= 9; lv++) {
        var sl = D.slots[lv] || { tot: 0, used: 0 };
        var spells = D.spells[lv] || [];
        var box = document.createElement('div'); box.className = 'spell-level';
        var lvl = lv;
        var slotsHtml = '';
        for (var s = 0; s < Math.max(sl.tot || 0, 0); s++) { 
            slotsHtml += '<div class="sl-slot-dot' + (s < sl.used ? ' used' : '') + '" onclick="window.toggleSlot(' + lvl + ',' + s + ')"></div>'; 
        }
        
        box.innerHTML = '<div class="sl-head" style="display:flex; justify-content:space-between; align-items:center; padding-bottom:6px; border-bottom:1px solid var(--borderl); margin-bottom:6px;">' +
            '<span class="sl-lbl" style="white-space:nowrap; font-size:11px; color:var(--g); letter-spacing:1px;">Livello ' + lv + '</span>' +
            '<div class="sl-slots" style="display:flex; align-items:center; gap:4px;">' + slotsHtml +
                '<input type="number" min="0" max="9" value="' + (sl.tot || 0) + '" ' +
                'style="width:24px; background:transparent; border:none; border-bottom:1px solid rgba(160,120,32,0.3); font-family:\'Cormorant SC\',serif; font-size:14px; color:var(--g); text-align:center; outline:none;" ' +
                'onchange="D.slots[' + lv + '].tot=parseInt(this.value)||0;window.rSpells()">' +
                '<button style="background:rgba(139,0,0,0.1); border:1px solid rgba(139,0,0,0.2); color:#e06060; border-radius:3px; padding:2px 5px; cursor:pointer; font-size:9px;" onclick="window.resetSlots(' + lv + ')">↺</button>' +
            '</div>' +
        '</div>' +
        '<div class="sl-body" id="sp-' + lv + '"></div>' +
        '<div style="padding:4px 0;"><button class="add-btn" onclick="window.addSpell(' + lv + ')">+ incantesimo</button></div>';
        
        sg.appendChild(box);
        var body = document.getElementById('sp-' + lv);
        spells.forEach(function (sp, si) {
            var r = document.createElement('div'); r.className = 'spell-row';
            r.style.flexDirection = 'column'; r.style.alignItems = 'stretch'; r.style.gap = '4px';
            r.innerHTML = '<div style="display:flex; align-items:center; gap:8px;">' +
                '<div class="spell-prep ' + (sp.prep ? 'on' : '') + '" onclick="window.togglePrep(' + lvl + ',' + si + ')"></div>' +
                '<input class="spell-name-input" value="' + (sp.n || '') + '" onchange="D.spells[' + lvl + '][' + si + '].n=this.value" placeholder="Nome incantesimo...">' +
                '<button class="del-btn" onclick="window.delSpell(' + lvl + ',' + si + ')">✕</button>' +
            '</div>' +
            '<input class="spell-desc-input" value="' + (sp.d || '') + '" onchange="D.spells[' + lvl + '][' + si + '].d=this.value" placeholder="Descrizione effetto..." style="font-size:10px; color:var(--ink3); background:transparent; border:none; border-bottom:1px solid rgba(160,120,32,0.1); margin-left:24px; outline:none; font-style:italic;">';
            body.appendChild(r);
        });
    }
};


window.addSpell = (lv) => { D.spells[lv] = D.spells[lv] || []; D.spells[lv].push({ n: '', prep: false }); window.rSpells(); };
window.delSpell = (lv, i) => { D.spells[lv].splice(i, 1); window.rSpells(); };
window.togglePrep = (lv, i) => { D.spells[lv][i].prep = !D.spells[lv][i].prep; window.rSpells(); };
window.toggleSlot = (lv, idx) => { var sl = D.slots[lv] || { tot: 0, used: 0 }; sl.used = (sl.used === idx + 1) ? idx : idx + 1; D.slots[lv] = sl; window.rSpells(); };
window.resetSlots = (lv) => { D.slots[lv].used = 0; window.rSpells(); };

// --- SPERANZA & RISORSE ---
window.rSpe = () => {
    var v = parseInt(document.getElementById('f-spe').value) || 0;
    var mx = parseInt(document.getElementById('f-spemax').value) || 33;
    var c = document.getElementById('spe-d'); if (!c) return; c.innerHTML = '';
    for (var i = 1; i <= Math.min(mx, 50); i++) {
        var d = document.createElement('div'); d.className = 'sdot' + (i <= v ? ' on' : '') + (i <= 5 ? ' w' : '');
        (function (idx) { d.onclick = function () { document.getElementById('f-spe').value = idx; D.spe = idx; window.rSpe(); }; })(i);
        c.appendChild(d);
    }
};
window.rRes = () => {
    var c = document.getElementById('res-list'); if (!c) return; c.innerHTML = '';
    (D.res || []).forEach(function (r, i) {
        var row = document.createElement('div'); row.className = 'res-row';
        row.innerHTML = '<input class="res-name-in" value="' + (r.n || '') + '" onchange="D.res[' + i + '].n=this.value">' +
            '<input type="number" class="res-cur" value="' + (r.cur || 0) + '" onchange="D.res[' + i + '].cur=parseInt(this.value)||0">' +
            '<span>/</span><input type="number" class="res-max-in" value="' + (r.max || 0) + '" onchange="D.res[' + i + '].max=parseInt(this.value)||0">' +
            '<button class="del-btn" onclick="delRes(' + i + ')">✕</button>';
        c.appendChild(row);
    });
};
window.addRes = () => { D.res = D.res || []; D.res.push({ n: '', cur: 0, max: 0 }); window.rRes(); };
window.delRes = (i) => { D.res.splice(i, 1); window.rRes(); };

window.rPriv = () => {
    var c = document.getElementById('pv-l'); if (!c) return; c.innerHTML = '';
    (D.pv || []).forEach(function (p, i) {
        var d = document.createElement('div'); d.className = 'priv-item';
        d.innerHTML = '<div style="flex:1"><input class="priv-name-input" value="' + (p.n || '') + '" onchange="D.pv[' + i + '].n=this.value">' +
            '<input class="priv-desc-input" value="' + (p.d || '') + '" onchange="D.pv[' + i + '].d=this.value"></div>' +
            '<button class="del-btn" onclick="delPriv(' + i + ')">✕</button>';
        c.appendChild(d);
    });
};
window.addPriv = () => { D.pv = D.pv || []; D.pv.push({ n: '', d: '' }); window.rPriv(); };
window.delPriv = (i) => { D.pv.splice(i, 1); window.rPriv(); };

window.rAll = () => { window.rfTS(); window.rfAb(); };

// --- TEMI & CUSTOM ---
window.setTheme = (name, btn) => {
    document.body.className = 't-' + name; D.theme = name;
    document.querySelectorAll('.tdot').forEach(b => b.classList.remove('on'));
    if (btn) btn.classList.add('on');
    document.getElementById('cpk').classList.remove('show');
};
window.togCustom = (btn) => {
    var p = document.getElementById('cpk');
    if (p.classList.contains('show')) { p.classList.remove('show'); }
    else { p.classList.add('show'); document.querySelectorAll('.tdot').forEach(b => b.classList.remove('on')); btn.classList.add('on'); D.theme = 'custom'; window.applyCustom(); }
};
window.applyCustom = () => {
    var r = document.getElementById('cp1').value, g = document.getElementById('cp2').value, bg = document.getElementById('cp3').value;
    var isDark = parseInt(bg.replace('#', ''), 16) < 0x888888;
    document.body.className = '';
    var s = document.body.style;
    s.setProperty('--r', r); s.setProperty('--g', g); s.setProperty('--bg', bg);
    s.setProperty('--ink', isDark ? '#f0e8d8' : '#1a1208');
};

// --- DATA MANAGEMENT ---
window.collect = () => {
    ['nome', 'cls', 'all', 'pec', 'pfx', 'pf', 'ca', 'ini', 'vel', 'prf', 'vir', 'viz', 'cr', 'nt'].forEach(k => {
        var e = document.getElementById('f-' + k); if (e) D[k] = e.value;
    });
    D.spe = parseInt(document.getElementById('f-spe').value) || 0;
    D.speMax = parseInt(document.getElementById('f-spemax').value) || 33;
    D.di = document.getElementById('di-d').classList.contains('on');
    D.spCar = document.getElementById('sp-car').value; D.spCd = document.getElementById('sp-cd').value; D.spBon = document.getElementById('sp-bon').value;
    D.car.forEach(c => { var i = document.querySelector('[data-ck="' + c.k + '"]'); if (i) c.v = parseInt(i.value) || 10; });
};

window.salva = () => {
    window.collect();
    var key = 'inferno_gen_' + (D.nome || 'scheda');
    localStorage.setItem(key, JSON.stringify(D));
    localStorage.setItem('inferno_gen_last', key);
    if (window._fbSaveGen) { window._fbSaveGen(D); }
};

window.applyAll = () => {
    ['nome', 'cls', 'all', 'pec', 'pfx', 'pf', 'ca', 'ini', 'vel', 'prf', 'vir', 'viz', 'cr', 'nt'].forEach(k => {
        var e = document.getElementById('f-' + k); if (e && D[k] !== undefined) e.value = D[k];
    });
    document.getElementById('f-spe').value = D.spe || 33;
    document.getElementById('f-spemax').value = D.speMax || 33;
    if (D.avatar) {
        var img = document.getElementById('avatar-img'); img.src = D.avatar; img.style.display = 'block';
        document.getElementById('avatar-placeholder').style.display = 'none';
    }
    if (D.di) document.getElementById('di-d').classList.add('on');
    document.getElementById('sp-car').value = D.spCar || ''; document.getElementById('sp-cd').value = D.spCd || ''; document.getElementById('sp-bon').value = D.spBon || '';
    if (D.theme && D.theme !== 'custom') { var b = document.querySelector('[data-t="' + D.theme + '"]'); window.setTheme(D.theme, b); }
    window.rCar(); window.rTS(); window.rAb(); window.rEmbl(); window.rAtk(); window.rSpells(); window.rSpe(); window.rRes(); window.rPriv(); window.rAll();
};

// --- SPECIAL FEATURES ---
window.copiaLinkMaster = () => {
    // Puliamo l'URL attuale da eventuali parametri di visualizzazione esistenti
    let url = window.location.href.split('&view=true')[0].split('?view=true')[0];
    
    // Decidiamo se usare ? o &
    let joiner = url.includes('?') ? '&' : '?';
    
    // Se siamo nella scheda generica ma non c'è un ID, ne mettiamo uno di fallback
    if (window.location.pathname.includes('Generica') && !url.includes('id=')) {
        url += joiner + 'id=default';
        joiner = '&';
    }
    
    const masterUrl = url + joiner + 'view=true';
    
    navigator.clipboard.writeText(masterUrl).then(() => {
        alert("Link Master Copiato! Inviandolo al Master, lui vedrà la scheda senza poterla modificare.");
    });
};

window.esportaPDF = () => {
    var btn = document.getElementById('btn-pdf'); var old = btn.innerHTML; btn.innerHTML = '⏳...';
    document.querySelector('.toolbar').style.display = 'none';
    html2pdf().set({ margin: [10, 0, 10, 0], filename: (D.nome || 'Smarrito') + '.pdf', jsPDF: { unit: 'mm', format: 'a4' } })
        .from(document.body).save().then(() => { document.querySelector('.toolbar').style.display = 'flex'; btn.innerHTML = old; });
};

window.caricaAvatar = (e) => {
    var file = e.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
        var img = new Image();
        img.onload = function () {
            var canvas = document.createElement('canvas'); var ctx = canvas.getContext('2d');
            canvas.width = 256; canvas.height = 256;
            var sz = Math.min(img.width, img.height);
            ctx.drawImage(img, (img.width - sz) / 2, (img.height - sz) / 2, sz, sz, 0, 0, 256, 256);
            D.avatar = canvas.toDataURL('image/jpeg', 0.8);
            document.getElementById('avatar-img').src = D.avatar; document.getElementById('avatar-img').style.display = 'block';
            document.getElementById('avatar-placeholder').style.display = 'none';
            window.salva();
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
};