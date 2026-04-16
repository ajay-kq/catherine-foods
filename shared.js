/* ============================================================
   AMMA'S KITCHEN — SHARED DATA LAYER  (shared.js)
   Included by: customer.html, admin.html, tracking.html
   ============================================================ */

const DB = {
  get(k, def = null) {
    try {
      const v = localStorage.getItem('ammas_' + k);
      return v !== null ? JSON.parse(v) : def;
    } catch { return def; }
  },
  set(k, v) {
    try { localStorage.setItem('ammas_' + k, JSON.stringify(v)); } catch { }
  },
};

const Cfg = {
  get(k, def) {
    const c = DB.get('config', {});
    return c[k] !== undefined ? c[k] : def;
  },
  set(k, v) {
    const c = DB.get('config', {}) || {};
    c[k] = v;
    DB.set('config', c);
  },
  setMany(obj) {
    const c = DB.get('config', {}) || {};
    Object.assign(c, obj);
    DB.set('config', c);
  },
};

/* ---------- Geo helpers ---------- */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcETA(distKm) {
  const prep   = parseInt(Cfg.get('prepTime', 25));
  const speed  = parseFloat(Cfg.get('delivSpeed', 0.3));   // km/min
  const buffer = parseInt(Cfg.get('delivBuffer', 5));
  const delivery = Math.round(distKm / speed + buffer);
  return { prep, delivery, total: prep + delivery, dist: parseFloat(distKm.toFixed(2)) };
}

/* ---------- Menu override helpers ---------- */
function getMenuOverrides() { return DB.get('menu_overrides', {}); }
function setMenuOverride(id, patch) {
  const ov = getMenuOverrides();
  ov[id] = Object.assign(ov[id] || {}, patch);
  DB.set('menu_overrides', ov);
}

/* ---------- Order helpers ---------- */
function getOrders()          { return DB.get('orders', []); }
function saveOrders(arr)      { DB.set('orders', arr); }
function findOrder(orderId)   { return getOrders().find(o => o.orderId === orderId) || null; }
function upsertOrder(order) {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.orderId === order.orderId);
  if (idx >= 0) orders[idx] = order; else orders.unshift(order);
  saveOrders(orders);
}

/* ---------- Golden users ---------- */
function getGoldenUsers()     { return DB.get('golden_users', []); }
function addGoldenUser(u)     { const arr = getGoldenUsers(); arr.push(u); DB.set('golden_users', arr); }

/* ---------- Toast (standalone, each page has its own element) ---------- */
function showToast(msg, duration = 2400) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

/* ---------- Image compression ---------- */
function compressImage(file, maxPx = 700, quality = 0.70) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        if (w > maxPx) { h = Math.round(h * maxPx / w); w = maxPx; }
        if (h > maxPx) { w = Math.round(w * maxPx / h); h = maxPx; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------- Age from DOB ---------- */
function ageFromDOB(dob) {
  const today = new Date(), birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return isNaN(age) ? null : age;
}
