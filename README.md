# Amma's Kitchen — Deployment Guide

## What's in this package

| File | Description |
|------|-------------|
| `customer.html` | Customer-facing website (menu, cart, checkout, tracking link, chatbot, Golden People) |
| `admin.html` | Admin panel (orders, menu mgmt, toggles, UPI, offers, notifications, Google Sheets) |
| `tracking.html` | Live order tracking map page |
| `shared.js` | Shared data layer (localStorage, helpers — must be in same folder as HTML files) |
| `index.html` | Auto-redirects `/` → `customer.html` |
| `netlify.toml` | Netlify config |
| `vercel.json` | Vercel config |
| `_redirects` | Netlify redirect fallback |

---

## ⚡ Fastest: Deploy to Netlify (Free, 5 minutes)

1. Go to **https://app.netlify.com**
2. Sign up / log in (free account)
3. Click **"Add new site"** → **"Deploy manually"**
4. Drag and drop the entire `ammas-kitchen` folder onto the upload area
5. Done! You get a live URL like `https://ammas-kitchen-abc123.netlify.app`

### To use a custom domain on Netlify:
- Site settings → Domain management → Add custom domain
- Point your domain's DNS A record to Netlify's IP (shown in dashboard)

---

## ⚡ Alternative: Deploy to Vercel (Free, 5 minutes)

1. Install Vercel CLI: `npm i -g vercel`
2. Open terminal in this folder
3. Run: `vercel`
4. Follow prompts — done!

Or use the web dashboard at **https://vercel.com/new** and import this folder.

---

## ⚡ Alternative: GitHub Pages (Free, 10 minutes)

1. Create a new GitHub repository (public or private)
2. Upload all files in this folder to the repository root
3. Go to **Settings** → **Pages**
4. Source: **Deploy from branch** → `main` → `/ (root)`
5. Click Save — site is live at `https://yourusername.github.io/repo-name/`

---

## ⚡ Alternative: Any Static Web Host

This is a **100% static site** — no server, no database, no Node.js needed.
Upload all files to any web host that serves static files:

- **cPanel hosting**: Upload via File Manager to `public_html/`
- **AWS S3 + CloudFront**: Enable static website hosting on the bucket
- **Google Firebase Hosting**: `firebase deploy`
- **Render.com**: New Static Site → connect GitHub repo

**One rule**: All 4 files (`customer.html`, `admin.html`, `tracking.html`, `shared.js`) must be in the **same folder**.

---

## 🔧 After Deployment — First-Time Setup (Admin Panel)

Open `your-url.com/admin.html` and configure:

### 1. Sender Location (📍 tab)
Enter your kitchen's GPS coordinates:
```
9.91918526788082, 78.09422025024031
```
→ Replace with your actual location. To get: Open Google Maps → right-click your address → copy the two numbers.

### 2. UPI Settings (💳 tab)
- Upload your UPI QR code image
- Enter your UPI ID (e.g. `yourname@ybl`)

### 3. Notifications (🔔 tab)
- Enter your 10-digit WhatsApp number (gets all order alerts)
- Enter your 10-digit SMS number
- Configure SMTP for customer email confirmations:
  - Host: `smtp.gmail.com`, Port: `587`
  - Use a Gmail address + App Password (not your regular Gmail password)
  - To get App Password: Google Account → Security → 2-Step Verification → App passwords

### 4. Google Sheets (📊 tab) — Optional
Auto-log every order to a Google Sheet:
1. Create a new Google Sheet
2. Go to Extensions → Apps Script
3. Paste this script and deploy as Web App:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders') 
                || SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.orderId, data.date, data.customer?.name, data.customer?.mobile,
    data.customer?.whatsapp, data.customer?.email, data.loc?.address,
    data.loc?.lat, data.loc?.lng, data.loc?.dist, data.loc?.eta?.total,
    (data.items||[]).map(i=>i.name+'x'+i.qty).join(', '),
    data.total, data.txnId, data.status, data.isGolden ? 'Yes' : 'No'
  ]);
  return ContentService.createTextOutput('ok');
}

function doGet(e) {
  return ContentService.createTextOutput('Amma Kitchen webhook active');
}
```

4. Deploy → Execute as: **Me** → Who can access: **Anyone**
5. Copy the Web App URL → paste into Admin → Google Sheets tab

---

## 📱 Site URLs

| Page | URL |
|------|-----|
| Customer site | `your-domain.com/` or `your-domain.com/customer.html` |
| Admin panel | `your-domain.com/admin.html` |
| Order tracking | `your-domain.com/tracking.html?order=ORDERID` |

> **Security note:** The admin panel has no password by default. For production, consider adding Netlify Password Protection (free on paid plans) or Cloudflare Access (free tier available) to protect `/admin.html`.

---

## 💾 How data is stored

All data (orders, menu settings, toggle states, UPI info) is stored in the browser's **localStorage** on the device where admin.html is opened. This means:

- ✅ Works with zero backend — no server costs
- ✅ All orders visible in admin panel on the same device/browser
- ⚠️ If you clear browser data, settings reset (but orders in Google Sheets are safe)
- ⚠️ Admin panel should be used on one consistent device/browser

For multi-device access, the optional **Google Sheets integration** acts as your persistent database — every order is logged there automatically.

---

## 🛟 Support Checklist

If something isn't working:

- [ ] Are all 4 files in the **same folder**? (`shared.js` must be alongside the HTML files)
- [ ] Are you opening files via a **web server** (http://...) not directly from disk (file://...)?  
  → Netlify/Vercel/GitHub Pages all serve correctly. Opening HTML directly from your computer may block `shared.js` loading.
- [ ] Did you set your **kitchen location** in Admin → Sender Location?
- [ ] Did you upload your **UPI QR** in Admin → UPI Settings?
- [ ] Is the **offer ticker** showing? Check Admin → Site Toggles → Offer Ticker is ON.
