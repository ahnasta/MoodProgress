/* ============================
   GLOBAL: animation observer + helper
   ============================ */
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add("show");
  });
}, {threshold: 0.12});
document.querySelectorAll(".card, .how, .list .item, .headline, .hover-pop").forEach(el => {
  el.classList.add("fade");
  observer.observe(el);
});

/* ============================
   NAV: active detection for icon-only nav
   ============================ */
document.querySelectorAll("nav a[data-nav]").forEach(link => {
  try {
    const linkPath = new URL(link.href).pathname.replace(/^\/+/, "");
    const locPath = location.pathname.replace(/^\/+/, "");
    if (!locPath || locPath === "index.html") {
      if (linkPath === "" || linkPath === "index.html") link.classList.add("active");
    } else if (linkPath === locPath) {
      link.classList.add("active");
    }
  } catch (e) {}
});

/* logo click -> home */
document.querySelectorAll("[data-nav-logo]").forEach(el => {
  el.addEventListener("click", () => window.location.href = "index.html");
});

/* ============================
   STORAGE KEYS & data load
   ============================ */
const KEY_JOURNAL_ARCHIVE = "mp_journalArchive_v1";
const KEY_TRACK_ARCHIVE = "mp_trackArchive_v1";
const KEY_TODO_DRAFTS = "mp_todoDrafts_v1";
const KEY_TRACKS = "mp_tracks_v1";

let journalArchive = JSON.parse(localStorage.getItem(KEY_JOURNAL_ARCHIVE) || "[]");
let trackArchive = JSON.parse(localStorage.getItem(KEY_TRACK_ARCHIVE) || "[]");
let todoDrafts = JSON.parse(localStorage.getItem(KEY_TODO_DRAFTS) || "[]");
let tracks = JSON.parse(localStorage.getItem(KEY_TRACKS) || "[]");
// 
const modeJournal = document.getElementById("modeJournal");
const journalPanel = document.getElementById("journalMode");
function switchMode(mode) {
}

/* ========== JOURNAL ========== */
const journalArea = document.getElementById("journalArea");
const journalTitle = document.getElementById("journalTitle");
const journalDrafts = document.getElementById("journalDrafts");
const saveJournalDraft = document.getElementById("saveJournalDraft");
const archiveJournalBtn = document.getElementById("archiveJournal");

if (saveJournalDraft) {
  saveJournalDraft.onclick = () => {
    if (!journalArea.value.trim()) return flash(saveJournalDraft, "Isi jurnal terlebih dahulu");
    const data = {title: journalTitle.value.trim() || "Tanpa Judul", text: journalArea.value.trim(), date: new Date().toLocaleString("id-ID")};
    addJournalDraft(data);
    journalArea.value = ""; journalTitle.value = "";
  };
}
if (archiveJournalBtn) {
  archiveJournalBtn.onclick = () => {
    if (!journalArea.value.trim()) return flash(archiveJournalBtn, "Tidak ada isi");
    const data = {title: journalTitle.value.trim() || "Tanpa Judul", text: journalArea.value.trim(), date: new Date().toLocaleString("id-ID")};
    journalArchive.unshift(data);
    localStorage.setItem(KEY_JOURNAL_ARCHIVE, JSON.stringify(journalArchive));
    journalArea.value = ""; journalTitle.value = "";
    flash(archiveJournalBtn, "Jurnal diarsipkan", 900);
  };
}
function addJournalDraft(d) {
  if (!journalDrafts) return;
  const item = document.createElement("div");
  item.className = "item show";
  item.innerHTML = `
    <div style="flex:1">
      <strong>${esc(d.title)}</strong>
      <p>${esc(d.text)}</p>
      <div class="meta">${d.date}</div>
    </div>
    <div class="actions">
      <button class="small-btn primary">Done</button>
      <button class="small-btn">Hapus</button>
    </div>
  `;
  const arch = item.querySelector(".primary");
  const del = item.querySelector(".small-btn:not(.primary)");
  arch.onclick = () => {
    journalArchive.unshift({title: d.title, text: d.text, date: new Date().toLocaleString("id-ID")});
    localStorage.setItem(KEY_JOURNAL_ARCHIVE, JSON.stringify(journalArchive));
    item.classList.add("fade-out");
    setTimeout(()=> item.remove(), 220);
  };
  del.onclick = () => { item.classList.add("fade-out"); setTimeout(()=> item.remove(), 180); };
  journalDrafts.prepend(item);
}

/* ========== TODO (mode 2) ========== */
const addTodoBtn = document.getElementById("addTodoBtn");
const todoText = document.getElementById("todoText");
const todoDraftsEl = document.getElementById("todoDrafts");
const saveTodosDraft = document.getElementById("saveTodosDraft");

if (addTodoBtn) {
  addTodoBtn.onclick = () => {
    const val = todoText.value.trim();
    if (!val) return flash(addTodoBtn, "Tulis tugas dulu");
    const item = {id: genId(), text: val, date: new Date().toLocaleString("id-ID")};
    // add to drafts and persist
    todoDrafts.unshift(item);
    localStorage.setItem(KEY_TODO_DRAFTS, JSON.stringify(todoDrafts));
    todoText.value = "";
    renderTodoDrafts();
  };
}
if (saveTodosDraft) saveTodosDraft.onclick = () => flash(saveTodosDraft, "Draft disimpan");

/* render todo drafts */
function renderTodoDrafts() {
  if (!todoDraftsEl) return;
  todoDraftsEl.innerHTML = "";
  if (!todoDrafts.length) {
    todoDraftsEl.innerHTML = `<div class="item show"><div><p class="meta">Belum ada draft To-Do</p></div></div>`;
    return;
  }
  todoDrafts.forEach(d => {
    const item = document.createElement("div");
    item.className = "item show";
    item.innerHTML = `
      <div style="flex:1">
        <strong>${esc(truncate(d.text, 120))}</strong>
        <div class="meta">${d.date}</div>
      </div>
      <div class="actions">
        <button class="small-btn primary">Tambah ke Tracks</button>
        <button class="small-btn">Hapus</button>
      </div>
    `;
    const toTracks = item.querySelector(".primary");
    const del = item.querySelector(".small-btn:not(.primary)");
    // -> B behavior: move to tracks (remove from notes)
    toTracks.onclick = () => {
      tracks.unshift({id: d.id, text: d.text, date: new Date().toLocaleString("id-ID")});
      localStorage.setItem(KEY_TRACKS, JSON.stringify(tracks));
      todoDrafts = todoDrafts.filter(x => x.id !== d.id);
      localStorage.setItem(KEY_TODO_DRAFTS, JSON.stringify(todoDrafts));
      renderTodoDrafts();
      renderTrackList();
      flash(toTracks, "Dikirim ke Tracks", 700);
    };
    del.onclick = () => {
      todoDrafts = todoDrafts.filter(x => x.id !== d.id);
      localStorage.setItem(KEY_TODO_DRAFTS, JSON.stringify(todoDrafts));
      item.classList.add("fade-out");
      setTimeout(()=> renderTodoDrafts(), 200);
    };
    todoDraftsEl.appendChild(item);
  });
}
renderTodoDrafts();

/* ============================
   TRACKS PAGE
   - render tracks
   - checking => move to trackArchive
   ============================ */
const trackList = document.getElementById("trackList");
function renderTrackList() {
  if (!trackList) return;
  trackList.innerHTML = "";
  if (!tracks.length) {
    trackList.innerHTML = `<div class="item show"><div><p class="meta">Tidak ada tracks aktif. Tambahkan dari Notes → To-Do.</p></div></div>`;
    return;
  }
  tracks.forEach(t => {
    const item = document.createElement("div");
    item.className = "item show";
    item.innerHTML = `
      <label style="flex:1;display:flex;gap:12px;align-items:center">
        <input type="checkbox" />
        <div>
          <strong>${esc(truncate(t.text, 140))}</strong>
          <div class="meta">${t.date}</div>
        </div>
      </label>
      <div class="actions">
        <button class="small-btn">Hapus</button>
      </div>
    `;
    const checkbox = item.querySelector("input[type=checkbox]");
    const del = item.querySelector(".small-btn");
    checkbox.onchange = () => {
      if (checkbox.checked) {
        trackArchive.unshift({text: t.text, date: new Date().toLocaleString("id-ID")});
        localStorage.setItem(KEY_TRACK_ARCHIVE, JSON.stringify(trackArchive));
        tracks = tracks.filter(x => x.id !== t.id);
        localStorage.setItem(KEY_TRACKS, JSON.stringify(tracks));
        item.classList.add("fade-out");
        setTimeout(()=> renderTrackList(), 220);
      }
    };
    del.onclick = () => {
      tracks = tracks.filter(x => x.id !== t.id);
      localStorage.setItem(KEY_TRACKS, JSON.stringify(tracks));
      item.classList.add("fade-out");
      setTimeout(()=> renderTrackList(), 220);
    };
    trackList.appendChild(item);
  });
}
renderTrackList();

/* ============================
   ARCHIVE PAGE
   ============================ */
const archiveJournalBtn2 = document.getElementById("archiveJournalBtn");
const archiveTracksBtn2 = document.getElementById("archiveTracksBtn");
const archiveJournalList = document.getElementById("archiveJournal");
const archiveTracksList = document.getElementById("archiveTracks");

if (archiveJournalBtn2 && archiveTracksBtn2) {
  archiveJournalBtn2.onclick = () => switchArchive("journal");
  archiveTracksBtn2.onclick = () => switchArchive("tracks");
  loadJournalArchive();
}
function switchArchive(type) {
  if (type === "journal") {
    archiveJournalBtn2.classList.add("active");
    archiveTracksBtn2.classList.remove("active");
    archiveJournalList.classList.remove("hidden");
    archiveTracksList.classList.add("hidden");
    loadJournalArchive();
  } else {
    archiveTracksBtn2.classList.add("active");
    archiveJournalBtn2.classList.remove("active");
    archiveTracksList.classList.remove("hidden");
    archiveJournalList.classList.add("hidden");
    loadTrackArchive();
  }
}
function loadJournalArchive() {
  if (!archiveJournalList) return;
  archiveJournalList.innerHTML = "";
  if (!journalArchive.length) {
    archiveJournalList.innerHTML = `<div class="item show"><div><p class="meta">Belum ada jurnal terarsip.</p></div></div>`;
    return;
  }
  journalArchive.forEach(a => {
    const item = document.createElement("div");
    item.className = "item show";
    item.innerHTML = `
      <div>
        <strong>${esc(a.title)}</strong>
        <p>${esc(a.text)}</p>
        <div class="meta">${a.date}</div>
      </div>
    `;
    archiveJournalList.appendChild(item);
  });
}
function loadTrackArchive() {
  if (!archiveTracksList) return;
  archiveTracksList.innerHTML = "";
  if (!trackArchive.length) {
    archiveTracksList.innerHTML = `<div class="item show"><div><p class="meta">Belum ada track yang selesai.</p></div></div>`;
    return;
  }
  trackArchive.forEach(a => {
    const item = document.createElement("div");
    item.className = "item show";
    item.innerHTML = `
      <div>
        <p>${esc(a.text)}</p>
        <div class="meta">${a.date}</div>
      </div>
    `;
    archiveTracksList.appendChild(item);
  });
}
if (archiveJournalList) loadJournalArchive();
if (archiveTracksList) loadTrackArchive();

/* ============================
   Utilities
   ============================ */
function genId(){ return Math.random().toString(36).slice(2,9); }
function esc(s){ if (!s) return ""; return String(s).replace(/[&<>"']/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function truncate(s,max=120){ return s && s.length>max ? s.slice(0,max-1)+"…" : s || ""; }
function flash(btn, txt="OK", duration=700){
  if (!btn) return;
  const orig = btn.innerHTML;
  btn.innerHTML = txt;
  btn.disabled = true;
  setTimeout(()=>{ btn.innerHTML = orig; btn.disabled = false; }, duration);
}

/* reflect storage changes across tabs */
window.addEventListener("storage", (e)=>{
  if (e.key === KEY_TODO_DRAFTS) { todoDrafts = JSON.parse(localStorage.getItem(KEY_TODO_DRAFTS)||"[]"); renderTodoDrafts(); }
  if (e.key === KEY_TRACKS) { tracks = JSON.parse(localStorage.getItem(KEY_TRACKS)||"[]"); renderTrackList(); }
  if (e.key === KEY_JOURNAL_ARCHIVE) { journalArchive = JSON.parse(localStorage.getItem(KEY_JOURNAL_ARCHIVE)||"[]"); if (archiveJournalList) loadJournalArchive(); }
  if (e.key === KEY_TRACK_ARCHIVE) { trackArchive = JSON.parse(localStorage.getItem(KEY_TRACK_ARCHIVE)||"[]"); if (archiveTracksList) loadTrackArchive(); }
});

