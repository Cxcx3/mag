# The Spotlight Magazine

A beautiful, interactive 3D magazine built with vanilla HTML/CSS/JavaScript. Features a password-protected editor for customization and is deployed to GitHub Pages.

## 🎯 Features

- **3D Page Flip Animation** — Realistic page-turning with CSS transforms
- **Password-Protected Editor** — Edit cover, cities, back cover (password: `spotlight2024`)
- **Responsive Design** — Works perfectly on desktop, tablet, and mobile
- **localStorage Persistence** — Changes save automatically to your browser
- **No Dependencies** — Pure vanilla JS, no frameworks needed
- **Google Fonts** — Anton (headlines) + Space Grotesk (body text)

## 🚀 Live Demo

Visit: **https://cxcx3.github.io/mag/**

## 🔧 How to Use

### View the Magazine
1. Open the link in any modern browser
2. Click/tap to turn pages, or use arrow keys
3. Swipe left/right on mobile

### Edit the Magazine
1. Click the **EDIT MAGAZINE** button (top right)
2. Enter password: `spotlight2024`
3. Choose a tab (Cover, Cities, Back Cover)
4. Edit text, URLs, colors
5. Click **SAVE & PREVIEW**

### Change the Password
Edit line 386 in `index.html`:
```javascript
const ADMIN_PASSWORD = 'spotlight2024';  // Change this
```

## 📁 File Structure

```
/workspaces/mag/
├── index.html          # Complete app (all code in one file)
└── README.md           # This file
```

## 🛠️ Deployment

Already deployed to GitHub Pages! To update after making changes:

```bash
git add index.html
git commit -m "Update magazine content"
git push origin main
```

Changes appear on the live site within 1-2 minutes.

## 📋 Default Content

- **Cover**: "The Spotlight Magazine" — Salt Lake City → Draper
- **Cities**: 6 featured cities with spotlights and local businesses
  - Salt Lake City
  - West Jordan
  - Millcreek
  - Cottonwood Heights
  - Sandy
  - Draper
- **Back Cover**: Call-to-action for business advertising

## 🔐 Security Note

The password is stored client-side (visible in page source). This is suitable for casual protection on a public magazine. For serious authentication, deploy a backend system.

## 💾 Data Storage

All edits save to browser `localStorage` under key `spotlightMagazineFullV2`. Data persists across page reloads but is **browser-specific** (not synced across devices).

---

**Made with ❤️ using vanilla web technologies**
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>The Spotlight Magazine — Bold Edition</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{
    --ink:#14121A;
    --coral:#FF4D6D;
    --yellow:#FFD23F;
    --violet:#6C4AB6;
    --paper:#F5F1E8;
    --cyan:#3FDDE0;
  }
  *{box-sizing:border-box; -webkit-tap-highlight-color:transparent;}
  html,body{
    margin:0; padding:0; height:100%;
    background:var(--ink);
    font-family:'Space Grotesk', sans-serif;
    color:var(--ink);
    overflow-x:hidden;
  }
  body{
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    min-height:100vh; padding:24px 12px 40px;
    background:
      radial-gradient(circle at 15% 20%, rgba(255,77,109,0.18), transparent 45%),
      radial-gradient(circle at 85% 80%, rgba(63,221,224,0.14), transparent 45%),
      var(--ink);
  }
  .masthead{
    text-align:center; margin-bottom:18px; color:var(--paper);
  }
  .masthead .eyebrow{
    font-size:11px; letter-spacing:0.35em; text-transform:uppercase;
    color:var(--yellow); font-weight:600; margin-bottom:6px;
  }
  .masthead h1{
    font-family:'Anton', sans-serif; font-weight:400;
    font-size:clamp(28px,7vw,42px); letter-spacing:0.02em;
    margin:0; line-height:0.95;
    text-transform:uppercase;
  }
  .masthead h1 span{ color:var(--coral); }
  .book-wrap{
    position:relative;
    width:min(92vw, 380px);
    aspect-ratio: 3 / 4.6;
    perspective:2400px;
  }
  .book{
    position:absolute; inset:0;
  }
  .page{
    position:absolute; inset:0;
    transform-origin:left center;
    transform-style:preserve-3d;
    transition:transform 0.85s cubic-bezier(.45,.05,.15,1);
    transform:rotateY(0deg);
    border-radius:6px;
    box-shadow:0 18px 40px rgba(0,0,0,0.45);
  }
  .page.flipped{ transform:rotateY(-178deg); }
  .face{
    position:absolute; inset:0;
    backface-visibility:hidden;
    border-radius:6px;
    overflow:hidden;
    display:flex; flex-direction:column;
  }
  .face.back{
    transform:rotateY(180deg);
    background:
      repeating-linear-gradient(135deg, rgba(0,0,0,0.05) 0 2px, transparent 2px 14px),
      var(--paper);
    display:flex; align-items:center; justify-content:center;
  }
  .face.back .mark{
    font-family:'Anton', sans-serif; font-size:13px; letter-spacing:0.3em;
    color:rgba(20,18,26,0.35); text-transform:uppercase; transform:rotate(-90deg);
  }
  .sheet{
    width:100%; height:100%; padding:22px 18px; overflow-y:auto;
    display:flex; flex-direction:column;
  }
  /* ---- MEDIA (photos / gifs / videos) ---- */
  .media-box{
    width:100%; border-radius:8px; overflow:hidden; position:relative;
    background:linear-gradient(150deg, var(--cyan), var(--violet));
  }
  .media-box img, .media-box video{
    width:100%; height:100%; object-fit:cover; display:block;
  }
  .media-box.placeholder{
    display:flex; align-items:center; justify-content:center; text-align:center;
  }
  .media-box.placeholder span{
    font-size:9px; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.85); font-weight:700; padding:0 12px; line-height:1.4;
  }
  /* ---- COVER ---- */
  .cover{ background:var(--ink); color:var(--paper); justify-content:space-between; position:relative;}
  .cover::before{
    content:""; position:absolute; top:-40px; right:-60px; width:220px; height:220px;
    background:var(--coral); border-radius:50%; filter:blur(10px); opacity:0.35;
  }
  .cover .top-tag{
    font-size:10px; letter-spacing:0.3em; text-transform:uppercase; color:var(--cyan); font-weight:600;
  }
  .cover .title{
    font-family:'Anton', sans-serif; font-size:clamp(34px,10vw,52px); line-height:0.9;
    text-transform:uppercase; margin:10px 0 4px; position:relative; z-index:1;
  }
  .cover .title .hi{color:var(--coral);}
  .cover .sub{ font-size:12px; letter-spacing:0.2em; text-transform:uppercase; color:var(--yellow); font-weight:600; margin-bottom:16px;}
  .cover-photo{
    flex:1; margin:6px 0 14px;
    border:3px solid var(--yellow);
    min-height:150px;
  }
  .cover .flip-hint{
    font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:var(--paper); opacity:0.7;
    display:flex; align-items:center; gap:6px;
  }
  /* ---- CITY PAGES ---- */
  .city-page{ background:var(--paper); }
  .city-band{
    display:flex; align-items:center; justify-content:space-between;
    padding:10px 14px; margin:-22px -18px 16px; 
  }
  .city-band .cnum{
    font-family:'Anton', sans-serif; font-size:11px; letter-spacing:0.2em; color:rgba(255,255,255,0.85);
  }
  .city-band .cname{
    font-family:'Anton', sans-serif; font-size:22px; text-transform:uppercase; color:#fff; letter-spacing:0.01em;
  }
  .stamp{
    align-self:flex-end; margin:-6px 4px 14px 0;
    border:2px dashed var(--ink); border-radius:8px; padding:6px 12px;
    transform:rotate(-6deg); font-size:10px; letter-spacing:0.18em; text-transform:uppercase; font-weight:700;
    background:var(--yellow); color:var(--ink);
  }
  .section-label{
    font-size:10px; letter-spacing:0.25em; text-transform:uppercase; font-weight:700; color:var(--violet);
    margin:4px 0 8px;
  }
  .spotlight-card{
    display:flex; gap:12px; align-items:center; margin-bottom:18px;
    background:#fff; border:2px solid var(--ink); border-radius:10px; padding:10px;
  }
  .spotlight-photo{
    width:64px; height:64px; border-radius:8px; flex-shrink:0;
  }
  .spotlight-photo span{ font-size:8px; }
  .spotlight-info .name{ font-family:'Anton', sans-serif; font-size:16px; text-transform:uppercase; margin:0 0 2px;}
  .spotlight-info .role{ font-size:10px; letter-spacing:0.12em; text-transform:uppercase; color:var(--coral); font-weight:700; margin:0 0 4px;}
  .spotlight-info .bio{ font-size:11px; line-height:1.4; margin:0; color:#3a3540;}
  .ad-card{
    background:#fff; border-radius:10px; padding:12px; margin-bottom:12px;
    border-left:5px solid var(--coral); box-shadow:0 3px 0 rgba(20,18,26,0.08);
  }
  .ad-card:nth-of-type(2n){ border-left-color:var(--cyan); }
  .ad-card:nth-of-type(3n){ border-left-color:var(--yellow); }
  .ad-card .ad-media{ height:110px; margin-bottom:8px; }
  .ad-card .biz-name{ font-family:'Anton', sans-serif; font-size:14px; text-transform:uppercase; margin:0 0 3px;}
  .ad-card .biz-tag{ font-size:10px; color:var(--violet); font-weight:700; text-transform:uppercase; letter-spacing:0.08em; margin:0 0 6px;}
  .ad-card .biz-blurb{ font-size:11.5px; line-height:1.4; margin:0 0 6px; color:#3a3540;}
  .ad-card .biz-cta{ font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:var(--ink); }
  .ad-card .biz-cta::after{ content:" →"; }
  .ad-card .biz-cta a{ color:inherit; text-decoration:none; }
  /* ---- STOREFRONT AD (immersive "walk into the store" layout) ---- */
  .storefront-ad{
    position:relative; border-radius:12px; overflow:hidden; min-height:400px;
    margin-bottom:16px; border:3px solid var(--ink);
    background:
      repeating-linear-gradient(180deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 76px),
      linear-gradient(180deg, #46402F 0%, #302B20 45%, #1C1812 100%);
  }
  .storefront-ad.has-photo{ background-size:cover; background-position:center; }
  .storefront-ad.has-photo img.sf-bg{
    position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0;
    filter:blur(2.5px) brightness(0.62) saturate(1.15);
    transform:scale(1.06);
  }
  .storefront-ad.has-photo::after{
    content:""; position:absolute; inset:0; z-index:1;
    background:linear-gradient(180deg, rgba(20,18,26,0.55) 0%, rgba(20,18,26,0.15) 30%, rgba(20,18,26,0.15) 65%, rgba(20,18,26,0.6) 100%);
  }
  .sf-banner{ position:relative; z-index:5; text-align:center; padding:14px 10px 6px; }
  .sf-banner .biz-title{
    font-family:'Anton', sans-serif; font-size:clamp(22px,7vw,30px); line-height:0.95;
    text-transform:uppercase; color:var(--yellow);
    -webkit-text-stroke:2px var(--ink); text-shadow:2px 2px 0 var(--ink);
    letter-spacing:0.01em; display:inline-block; margin:0 6px;
  }
  .sf-banner .chev{ font-family:'Anton', sans-serif; font-size:22px; color:var(--yellow); }
  .sf-banner .sf-loc{
    display:block; margin-top:2px; font-size:10px; letter-spacing:0.2em; text-transform:uppercase;
    color:#fff; opacity:0.85; font-weight:600;
  }
  .sf-stage{ position:relative; height:280px; z-index:2; }
  .sf-product{
    position:absolute; display:flex; align-items:center; justify-content:center;
    text-align:center; color:#fff; font-family:'Space Grotesk', sans-serif; font-weight:700;
    font-size:9px; letter-spacing:0.04em; text-transform:uppercase; box-shadow:0 6px 14px rgba(0,0,0,0.4);
    padding:4px;
  }
  .sf-product.bag{ border-radius:10px 10px 4px 4px; }
  .sf-product.cup{ clip-path:polygon(18% 0%, 82% 0%, 94% 100%, 6% 100%); border-radius:4px 4px 0 0; }
  .sf-badge-new{
    position:absolute; z-index:6; border:3px solid var(--cyan); border-radius:4px; padding:3px 8px;
    font-family:'Anton', sans-serif; color:#fff; font-size:13px; transform:rotate(-8deg);
    text-shadow:0 2px 4px rgba(0,0,0,0.7); background:rgba(20,18,26,0.15);
  }
  .sf-price{ position:absolute; z-index:6; display:flex; align-items:baseline; gap:6px; }
  .sf-price .amt{
    font-family:'Anton', sans-serif; font-size:30px; color:#fff;
    background:#B8001F; padding:2px 10px; border-radius:4px; box-shadow:0 4px 10px rgba(0,0,0,0.35);
  }
  .sf-price .pct{
    font-family:'Anton', sans-serif; font-style:italic; font-size:22px; color:#fff;
    -webkit-text-stroke:1px var(--ink); transform:rotate(-6deg); text-shadow:2px 2px 0 var(--ink);
  }
  .sf-note{
    position:absolute; z-index:6; width:118px; background:#0c0a08; color:#fff;
    padding:14px 10px; font-size:10.5px; line-height:1.45; text-align:center; font-weight:600;
    clip-path: polygon(0% 5%, 10% 0%, 22% 4%, 34% 0%, 46% 4%, 58% 0%, 70% 4%, 82% 0%, 94% 4%, 100% 0%, 100% 95%, 90% 100%, 78% 96%, 66% 100%, 54% 96%, 42% 100%, 30% 96%, 18% 100%, 8% 96%, 0% 100%);
  }
  .sf-footer{ position:relative; z-index:5; display:flex; align-items:center; justify-content:center; gap:10px; padding:12px 10px 16px; }
  .sf-cta{
    background:#fff; color:var(--violet); border-radius:20px; padding:9px 18px;
    font-weight:700; font-size:12px; box-shadow:0 4px 10px rgba(0,0,0,0.35);
    text-decoration:none; text-align:center; white-space:nowrap;
  }
  .sf-next{
    width:38px; height:38px; border-radius:50%; background:var(--violet); border:3px solid #fff;
    color:#fff; display:flex; align-items:center; justify-content:center; font-size:15px;
    cursor:pointer; flex-shrink:0; box-shadow:0 4px 10px rgba(0,0,0,0.35);
  }
  .sf-blurb{ position:relative; z-index:5; font-size:11px; line-height:1.4; color:#fff; opacity:0.85; text-align:center; padding:0 16px 12px; }
  .footer-note{
    margin-top:auto; padding-top:10px; font-size:9px; text-align:center; color:rgba(20,18,26,0.4);
    letter-spacing:0.1em; text-transform:uppercase;
  }
  /* ---- BACK COVER ---- */
  .back-cover{ background:var(--coral); color:var(--ink); justify-content:center; align-items:center; text-align:center;}
  .back-cover h2{ font-family:'Anton', sans-serif; font-size:26px; text-transform:uppercase; margin:0 0 10px; line-height:1.05;}
  .back-cover p{ font-size:12px; line-height:1.5; max-width:260px; margin:0 auto 18px;}
  .back-cover .cta-box{
    background:var(--ink); color:var(--paper); border-radius:10px; padding:14px 18px;
    font-size:12px; font-weight:700; letter-spacing:0.05em;
  }
  .back-cover .cta-box .handle{ color:var(--yellow); }
  /* ---- CITY COLOR THEMES ---- */
  .theme-slc .city-band{ background:var(--violet); }
  .theme-wj .city-band{ background:#1E7A3D; }
  .theme-mc .city-band{ background:var(--coral); }
  .theme-ch .city-band{ background:#2E8B8B; }
  .theme-sandy .city-band{ background:#B8860B; }
  .theme-draper .city-band{ background:#4A3F8F; }
  /* ---- NAV ---- */
  .controls{
    display:flex; align-items:center; gap:14px; margin-top:20px;
  }
  .nav-btn{
    width:42px; height:42px; border-radius:50%; border:none; cursor:pointer;
    background:var(--paper); color:var(--ink); font-size:18px; font-weight:700;
    display:flex; align-items:center; justify-content:center;
    transition:transform 0.15s, opacity 0.2s;
  }
  .nav-btn:hover{ transform:scale(1.08); }
  .nav-btn:disabled{ opacity:0.25; cursor:default; transform:none; }
  .dots{ display:flex; gap:6px; flex-wrap:wrap; max-width:160px; justify-content:center; }
  .dot{
    width:8px; height:8px; border-radius:50%; background:rgba(245,241,232,0.3); border:none; cursor:pointer; padding:0;
    transition:background 0.2s, transform 0.2s;
  }
  .dot.active{ background:var(--coral); transform:scale(1.3); }
  .page-count{
    color:var(--paper); opacity:0.6; font-size:11px; letter-spacing:0.1em; margin-top:10px;
  }
  .tap-zone{ position:absolute; top:0; bottom:0; width:18%; z-index:500; cursor:pointer; }
  .tap-zone.left{ left:0; }
  .tap-zone.right{ right:0; }
</style>
</head>
<body>

  <div class="masthead">
    <div class="eyebrow">Wasatch Front · Digital Edition</div>
    <h1>The <span>Spotlight</span> Magazine</h1>
  </div>

  <div class="book-wrap">
    <div class="book" id="book"></div>
    <div class="tap-zone left" onclick="prevPage()"></div>
    <div class="tap-zone right" onclick="nextPage()"></div>
  </div>

  <div class="controls">
    <button class="nav-btn" id="prevBtn" onclick="prevPage()">‹</button>
    <div class="dots" id="dots"></div>
    <button class="nav-btn" id="nextBtn" onclick="nextPage()">›</button>
  </div>
  <div class="page-count" id="pageCount"></div>

<script>
/* =========================================================================
   HOW TO EDIT THIS MAGAZINE
   -------------------------------------------------------------------------
   Everything you'll ever want to change lives below in the PAGES array
   and the CITIES array further down. You do not need to touch any CSS
   or the flip-engine code at the bottom of the file.

   ADDING A PHOTO, GIF, OR VIDEO TO ANY BUSINESS OR MODEL:
   Every business ad and every model spotlight accepts an optional
   "media" field. Leave it as null to show a placeholder box, or fill
   it in like this:

     media: { type: 'image', url: 'https://example.com/photo.jpg' }
     media: { type: 'gif',   url: 'https://example.com/animated.gif' }
     media: { type: 'video', url: 'https://example.com/clip.mp4' }

   Notes:
   - 'image' and 'gif' both just use a normal picture URL (gifs animate
     automatically once you use a .gif link).
   - 'video' expects a direct .mp4 link and will autoplay silently on
     loop, like an Instagram Reel preview.
   - The URL must be a direct link to a hosted file (e.g. from your own
     website, an image host, or a link a business sends you) — links to
     an Instagram post page itself won't embed directly.

   ADDING A NEW CITY PAGE:
   Copy one of the objects inside the CITIES array below, change the
   theme class, number, city name, model info, and business list, and
   it will automatically appear as a new page between the cover and
   back cover, with its own nav dot.
   ========================================================================= */

const DEFAULT_CITIES = [
  {
    theme:'theme-slc', num:'01', name:'Salt Lake City',
    model:{ name:'Ava Sinclair', role:'Cover-Featured Model',
      bio:'Downtown-based model and content creator, bringing SLC street style to every page.',
      media:null },
    ads:[
      { name:'Peak & Pine Coffee Roasters', tag:'Local Roaster',
        blurb:'Small-batch beans roasted weekly in the Granary District. Try the seasonal cardamom pour-over.',
        cta:'Visit us downtown', link:'#', media:null },
      { name:'Wasatch Wax Candle Co.', tag:'Handmade Goods',
        blurb:'Soy candles poured in small batches, inspired by canyon hikes and mountain air.',
        cta:'Shop the collection', link:'#', media:null },
      { name:'Iron Door Fitness', tag:'Studio & Gym',
        blurb:'Boutique strength studio with sunrise classes and a members-only sauna.',
        cta:'Book a free class', link:'#', media:null },
    ]
  },
  {
    theme:'theme-wj', num:'02', name:'West Jordan',
    model:{ name:'Devon Marsh', role:'Featured Model',
      bio:'West Jordan-raised model and this issue\'s face for the west valley.',
      media:null },
    ads:[
      { name:'7-Eleven', tag:'West Jordan Location', style:'storefront',
        loc:'West Jordan · Redwood Rd', badge:'NEW!', price:'$1.99', discount:'-40%',
        promoLines:['Try the new', 'flavor drinks &', 'new chips —', 'all under $10.', 'New deals', 'coming soon.'],
        blurb:'Open 24 hours on Redwood Road — fresh Slurpees, hot food, and gas, right in the heart of West Jordan.',
        cta:'Get Directions', link:'#',
        /* Real store interior photo — swap this URL any time you get a new one.
           The blur/darken treatment is applied automatically via CSS so your
           overlay text (badge, price, promo note) always stays readable on top. */
        media:{ type:'image', url:'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAcFBQYFBAcGBgYIBwcICxILCwoKCxYPEA0SGhYbGhkWGRgcICgiHB4mHhgZIzAkJiorLS4tGyIyNTEsNSgsLSz/2wBDAQcICAsJCxULCxUsHRkdLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCz/wAARCAJ8AeADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDboozRmsjUKKM0ZoAKKM0ZoAKKM0ZoAKKM0ZoAKKM0ZoAKKM0ZoAKKM0ZoAKKM0ZoAK53xD4ekuJ11bSnMGqQcgrjEo9DXRZozTAx/D3iGLW7ZkdfIv4PlngbgqfUe1bFZ+rfDzWNV265ocDQ6hCMgjAE4/ukU/wAKXlx4nWa2S2MWpWp23Fsx2up9cHtQK5dorWPhfWR/y5N+YpP+Ea1f/nyf8xQMyqK1f+Ea1f8A583/ADFNPh3Vl62UlAGZRV86HqY/5cZv++aadH1If8uM/wD3xQBSoq2dK1AdbKYf8Ao/su//AOfSb/vmgCpUVzcw2ds9xcSLFFGMszdBU98kmmWcl3eRvBBEMs7rgCuWt9M1DxldJfXNtPHoiNmGHaR5/wDtH2oAit4bjxhdLd3iNDo0TZggbg3BH8Te1dUqqihVUKo4AAwBTjCYQIyhTaMBSMYFJTAUUUmaMmkAtFJmjNAC0UZpM0gFopMmjJpgLRSZNGTQAtFJk0ZNAC0UmTRk0ALRSZNGTQAtFJk0ZNAWFopMmjJoAWikyaM0ALRSZoyaAFopMmjJoAbRXkQ+IHiA8/aYh/2yFPHj7XhybiM/9shV8rFzI9b5pK8n/wCE/wBd/wCe0f8A37FJ/wAJ9r2f+PiID08oUcrDmR6zml3fSvJ/+E813/n4i/79Cj/hO9f/AOfmL/v0KOVhzI9Y3fSl615MPHevk/8AHzF/36FP/wCE714dbiP/AL9ClysXMj1akNeU/wDCea7/AM/Ef/fsUf8ACe64Os8Z/wC2Yo5WHMj1WnZxXk//AAn+t/8APWL/AL4FdBo3iq/v9Bv5pJUNxCRsO0cfhT5GHMjuM0E+1Zfwn1CTxVqVxDq0gkWMcBRs/lXS/EBdO8NQLJagjI6Fs80ezkLnRm59KOar6LqumapbWqG7SO6Y/MhP3qj+JNy/hqCFtOkWN3UZ3fNn86PZsOdFulHSvHrj4g+IY2wLmP8A79Coj8RvEY/5e4/+/IpcrK5kez5qzpyLLqVvG4yrSAEfjXin/CwvEXl7vtUX/foVY0j4j+IF1uyLzxSL56AqYgMgsB1o5RcyZ9E+LdZvbDVUtLWUwRRxggL715t4itNQuNUj8Q6Vctb63AeJFIXzh/db1qx8evE2paB4p0uOwlSNJ7RnbKA5IfArhvCPjDWdY8TW9ldTo8L5LARgHis6t4RcuxpSSlJRZ6R4d+IWsazDLFJefZb63OyaCSRVKn2B7VuDxB4gbpqC/wDf5K8T8eapcad8QJ5LcpFJEQVdV5weefWqLePNdAyJ4Mf9cVrDlrVEpRejN26MHyyWqPfV8ReJFOBdK3/bVP8AGnr4l8Rk8vkfVT/Wvnw+PdeP/LxB/wB+Vpw8e63jBmgP/bBaPZ4nug9pQ7H0IPE3iDaf/sf8aX/hJ/EIHA3fgv8AjXz6PHetn/lrB/34Wum8Lz+J/EEgnkmgt7JeWlaFVz9Kift6a5pSRpTVGo+WKZ66PFPiJR/qv/Ian+tQah8QNT0m3aa/EcCKM5kixn/GuUudUtbC3keB1IiHzXU33FPsO5/WvM9U8Ttq+pJcX7m6ghOUhYnDEdCef0rPD1K9V+R1V8JSpJXdmzvLzxbe+PNRjudXH/Ejsm8xLRIz+9YfxyY7fWvQIfHV6sEawW9ssSqAihcADsBXkPhvXbnVp7sSttiSGQqi8KPl9BxWO3jXV7aQwxTx+XGdqgoOgr0IJydjlxGHp06cZwd7n0LqMkGv+Fn1NovJuIG2kjo1cbmpJdeu7H9nmLVgy/a7p1+bbwCzkdPoK8kPj3XQxxPH/wB+xWqg2cNz1fNGfpXlB8e67/z8R/8AfoUn/Ce69/z8Rf8AfoU/ZSDmR6xmjNeTjx5rxP8Ax8Rf9+hXoXgC8utfs3lv5A5BIG1QtZzXIryMauIhSV5Gtk0ZPoK3l0i3I53fnTv7Ftz6/nXP7aJx/wBqUDn8n0ozXQf2Lb+/50HRbYf3vzo9tEX9qUTnxmjn0rqtO8O21zN86sUHX5iK1D4W0gHlH/77NZTxdOD1PRoVFWV4nBUVvar4ZlGpxfYCFts/OrcnH1qm3hq/+0OFlUJnjihYum9Tf2bM3ApKmm8Pa2ruEIx2+Wobbw94ilnCs6hc85QVaxMA5GH4Uta+i+Hro6u8WpjfbqeoG2um/wCEV0ojiJv++zWbxlNCcWjgqK6O50O2hmZMNgHjmozo1tjPzfnWqxEXseZPMKUHZnP0vWt/+xrYjofzpp0e3HrT9tEj+1KJg0VrT6dCiErnNed+LvEV/pWorDZyIqlcnKA1cainsbUsbSqu0Trs0Zry4+NtdH/LeP8A79ik/wCE41z/AJ7x/wDfsVrY7bo9RzRmvKz4514dLiP/AL9Ck/4TrXv+fiP/AL9CjlYcxyUaE4HrW2nhbVnsRdpaO0JGQwU81kWy7p4R2Livr3wotknw909JzGsfl8kgVsc58sweGNWuLRrqOzkMS9TtNRnw7qa+WWtnUSfdyDzX1YqwIo+wvH/ZYP7zCjn1qvrOiRapd2c1gIhaxgHIHvRcR8u6j4d1TTEDXVq8an+IjipYvCmtT2wnhtGeMjOcV9CfFC4s4vB97HflGYx4h2qOD+FUvhtqlxe+AIgWUMJQnKj7tIZ4DJoeqWbxNPaOok+7wea1z4M1tlDLZOQRkfKa+ktT03T9TW28ny5WtRggAVPqOpGz1K3iimjUYUNHsBoEz5hfwZriozGyfC8k4Nc7cK0MzRuMMvUV9fx6s15ouqswQtEWVTtHTHSvkvXC8utXLleS56D3ppgZ24bua1LWSWK1k8iQorfeA71Visi7LnjNatvZi3hmEg+Q9KoLnonwNhH9pXD9ytbvxoINkO3NY/wYVhq04jGE28Gu7+Ifh221iBEubsQexFNyUdx06cpOyPn/AMLMR4qtD3312/xjmkmtrIn72VAxU2mfDdLXWoLqz1BLgRvnYBg0fGNDHbWagbXR1/CiMk1oOpTlB2Z4/qsTxSrvUrkd6oitTxDcTXEsJlbdgcVlE1kw3LBP7qi0mFvfQTHny5Ff8iDTWb91UJ74pDse7ftHKk9n4W1AAZnikH4bVbr+Nea/DfnxzZj2b+Ven/HFItQ+FfhLVUcELsVccgh4vX/gFeV/D25htfG1lLPIsSfMCzHA6VjiNaUjfD6VIlj4lnPjy8/3V/rXMJJgYPQ1634i8F6R4g1mbUX1+3ieQAbVcY46dRWOfhdppPy+Jrf/AMdNc1DFU401Fs6a+FqSm5JHnrDH0pM16FcfC4JZSvZ63b3MqrlYyQu72z61T8K+DdP1i5H2m/8AJmt5MT2soCnA64OeRXUsTTcXJMw+q1OZRaJPBPg1NSjbVNVBi06Pkbv466/WtbtrOwHmJ9nsoxmG3U4aTsCfQfqe1LrusWtjZbyBHZW52W8OP9Yw7n2/n0ryfWdYuNWvnnnkZmJ4BPSuCMJ4qfPLboe0vZ5fT7yZb1zxDda1P87bLdT8kS8Ko+lZW6oQ+KcHyelevCKgrI8GrWnWnzTd2dr4F6agf+mLj/x2uUmfNxIT/eP867DwTZ3NvYX880TRxtE2GbjtiuORHudRWCJdzyy7FHqS2AKim/fbPQxKccLTTPc/idc/2Z8DvDuniEKbjyi2Oi4Td/PNeEhs817V+0FK9tYeGNOR9sSQMzRA8ZAUA/hkj868RJ7Ct46HlEwNGR6123w68EP4nvYsxrK0pOxX+6oHV29hXuKfBPSxGoa9+YDnFsmKHUsB8tAjPUfnXsnwoXGhs3csa9BPwT0ztfY/7dUqeD4Rx2qbbfW5oV9EhCj9DXNW/eKxyYig6seVEadOlSCpx8Mpx08SXY/7Z/8A16X/AIVtdj7viW6/79//AF64vqz7nl/2XU7or96Y7YH41b/4VzqIHHie5/GMf40w/DvVh08TTfjH/wDXo+rS7gsrmnua2mxeVaKT1PNWDErZyRWL/wAIR4jUYTxZMB6bDTT4J8UZ48Vv+KmuGpl1SUr3Po8O1Rgom15C568Un2dP71Yn/CE+LAePFWfqGpR4O8Wjj/hJoz9UNT/Z1XudHt0bmwBdu7FRiIB+HPFZP/CJeLh/zMVufrEacPC3jBTka9Zn6wf/AFql4Ct0H7aJrGBXP3qkSPYNucgVir4b8aR52a3Yc/8ATD/61NOg+Ou2r2B/7ZD/AAqVl1bqJ1Yk2sw7ZVcdCKofw0+fw343nXbJqNg4H+wB/wCy1AfCnjToLqwP4/8A2Nd8MNOKsz5nFYGpUnzQ2JR0pjdDUY8K+NB/y2sD/wAC/wDsaQ+FvGn97Tz/AMD/APrVf1eZy/2dWILn/VmvFPGb+d4gI/ugivY9V0nxVpVobm7tbeeBPvmE5Kj1rxXxCXfxBKzLgMNw+la0aTg9TrwuFnRn75isnFRlDVlhUbLXbse0VytM21YZaj2mncRRhViFK9RXceDNQ1K88QWemzXs5t242BjiuPiIEYxWno2ryaPqkV9Cu6SLOBTEfUMfg2DyJIkuJVhljClQ/SqdxYW0Omy6VCbtTHGzLLnA4HrXjqfGLWkSRQD84wPm6Ut98YtYvNGNj5YQsu1pd3JpWJR0vgnTIdUsb/UtZknv0tuViB3Z5x0rovCOjRapd3VzaQXVna7WRYnG3n1xXjvhP4haj4TklMK+fHL95GbArZufjZrDBRbQC2AbcdrdfakUehap4avbDQ7xYJLoXEki7WBPArej0S0kA0yYXf2oRKxnOccj1ryW4+O+sS2xj+yLk9y9Vp/jprTWAtxCBJn/AFm7kigR7wnhuzsdFELySFWPztu5NZ0vgLw6lnNcNZ7io3cqK8Uj+OesCJI5oBKqjGC3Wp2+PWqvA8Rsl2MMY30xWOX1K3M2r3rWqbYIZWA9sGq6XpngdWAwO9UV8QXMslyqDatw5dgPetm10Zv7AkvByuMnHatIgeofBa32Wsl8cfPlAK6jxvLll3H6Vy3wcuFbQvLU5KuSRXcax4em1q8jIbZGvVjXHVvJ2R6+EcKbvIyPBGlS3eprNyI05Nc1+0HbLEltIigZZQfrXrWnvpugWiwqwMnTI7mvJfjnP9r0+2D9WmXH0ranBqOpw4vERqVNDwrWefJ+hrN6YNdBr+lfZPIPmb94/KsFxjj0pswQ9j+7FRZqVx+6FQ0hnvfxAg+1fsyeFp1YYtvIJ75+Urj82/SvBq93uRLd/siQEcmFwTgdhOfT6V4KTzQMfmjPPBxUe6lBpWQ+Zk63EyfdmkX6MRW14c06/wBTnnnt5WVoF3l3Y447ZrB69K7+Y/8ACL+AY4l+W6v/AJj9P/1g/kKiaUVZLc7sJD2knKb0ic/4g1+51W5xMQixDYsaH5Vx6ViBzmmd6XrWkYqKsjlq1JVZXkyaJHmkVI1LMxwAK7ix0bT/AAzYrqGsYkuWGY4fT0z/AJyai8MWFvoejy69qCqXxiCNx1P+f6Vy+raxcazfPc3DEknhc9Khtydlsd8IwwtNVJq8nsv1NPWPFd7qpKK3k2+MCNOABUXhGzk1Hxpo9rE4V5LuPBPswP8ASsQGu3+D9mL74raKhOPKkabpnO1ScVqkorQ4KtedZ802dV+0VOD4502BXyIbLO0HoSx6/hivI93Nd58bryO7+LOp+Xn9ykUJz6qv/wBcVwFWYH0v8BI1ETtgZWyTB+rc17SBXjnwITFtL7WkQ/U17IKye40JRVDWtZsdA0qfUtSuFt7WAZZjz9AB3J9K8pl+O17eTyPonhK7u7SIndKxYnH0VSB9CaqMJS2JlOMdz2XFFcX4F+JmleN0khjjey1CEbntZSCSPVT3H8qTwd8Q/wDhMZNZjg0uS3fS32AGYP5p+bGOBj7v60cktQU4na0tcb8PvFeteKLe+k1jRG0prebZGCGG4f8AAupHqOK7LNTJOLsxxaeqCisLxf4mi8I+G59Ymt3uUhKjy0YKTk46mrHhvXI/Efhyy1eKFoI7uPzAjkErzjkj6UWdrjur2NWkozXPeM/GVl4J0dNRvoJ54nlEQWEAtkgnuR6UkruyBtJXZ0NLVHSNUi1nRbPUoEdIruFZkV8bgGGcHHesGD4h6XcePpPCKQXX2+POZCq+Vwu7rnPQ+lOzYXSOsopM8UtIYlFLSUAFLRRQA10WRGRwGVhgg9xXyl47s47XXZVjACpLJGPoDxX1dXyz8QjnXLj/AK+Zf50CZxhphXNPIpKYyJhTMVMRTCOKYGdEcRinhqgQ/LTt3vTJJM00sfWm7qYx5ouA/dio5HpC1RO1IYF6jY5NOphoGJmkJNFOERYZoFYs2DqtwA2MGvTdOtoj4JvTHIG4BI9K8pVSrcGvVtCEFp8Pbk7t0k6g/Q1tAlknwh1h9P16W3xuicYx6c17DrV5dGFhbv8AKemK8L+F1tJd+JykZwQ2Tn0r1Lxl4W1u7tvM068aIrxhXxmtIqK1aIlzPqMsy8V4JL252DPCsetct8YJ1vLa12n5FK96qaf4P1+41e3NxqEsio/zqzVL8XIFsrK1iGRjaDVOSaMYU9bnn2vPDFpdlzlmU5ya5RzuJNaWqeZN5SAM4UcYrNaN0PzKVPuK5GdY5/8AUioM4qxJ/qRVU1IHvnhG5kuv2UvEEbkEWxnjQAfw5U/zY14Qkck0wjiRpHY4CqMk1718GZ1vfgn4t090DCAynGOu6LP/ALLXlHw6P/FbWR9FY/jigmTsrmGdH1ME50274/6Yt/hQNJ1FULNYXKqBkkxGvbvD95eajZTXM91dSBbuSMJCAdqqeM5Pep59RnPiy3siCtvPaTyNG45BA4pXOX6y72seIaLatd6tbr5bOgcF8AkD616V4g0Gx16ZM6i0ccQCxARnOAAOeKo+D55dN8J+ItQtSsc6XAUOVDY5IHWvRkkmtbdJbmOe6BhVyfsyCPJAPXrwaiS5j0aGZRw8XTlG6Z5aPh9YYz/a+OccoR/SpI/h5Zhgw1VHwcgNkA/pXeru1LUryzuoo5mtbuN02oF+Tk54xUljfzXWlXV1OkRY+e8PyAFVTAHbuSfyqbS7mizLDJ/wvxPL/Hl/5l7FptruNtbIBwOCfX8TzXI7SDypH4V71pTLPptle3xgJnQSsi2hYfTdTI7y0l1fVrGTTrIx2kce2R0+VSwByccn6d81pH3UcVfMHXqOTR4TjBwQa9S/Z9s4rn4miaQNutbWSRMHoThTn8CaXxRYQanp2sx3Wm29tfaRh0ltxgSKfX161s/s3RbdT1+6K5MdsgB+pOa0vdBTnzo85+Il6t/8SNeuFOVa7dfT7uF/9lrmg3NWdUu5L/Wb28lAV7ieSVgvQEsTx+dVKLmh9TfAxAtrP7W0Q/nXr4ryX4ILi0uvaCH+VetCoA8U/aJvJ1stFsldlgkkkkcdmYAAZ+mTXq3h/SbHRtAs7HT41jtoolC7f4uOpPcnrmsX4j+CIvHHhs2YdYruBvMt5G6BsYIPsRXm+neJPij4Ns00SXwzJqawLshm8p5MKOANycEfXBroS54JJ7GDfLNtnr9p4Z0XTdSudTtNNt4by5yZJlT5m49e34V5V8E3KSeMZVOGE+c+n+sNdJ8OtO8ctc3+reKb2SKK6BMdgwB2n1wPuj2z9ayPhLoOr6TZ+KxqGnXNq9w+YhLGVMnD9PXqKFommyZatNIPhd4y1A+D/Eesa3ez3y2EhZfMbJACk4H1NZehL8RfiJZTa7B4gGkWxlZbeBMgcfTt7nrWh8LvCN/L8P8AxBpOrWVzYPfSlV8+MqSCvDAHrzWX4W8QeLvhtps/h+78J3d+iSM1vNErFST7gHI7+tVom7biV7K5r+PYvEVp8D54/EtzBc6h58al4h/Du4ye596w7Lx9qUfgnw34T8JKZdZuIQskqjiH5jx9ccn0FdF42m8R+JfguZL/AEKe21OSaMm1iUuxAbrtHI49a5CTwFrPhzwdoXi3w/Ddrq9v+8urcoS/J/udcY4I9DVR5XHXuKTfPoe7eHrG+0/Q7eDU9QfUL0LmadgBuY9cAdAO1ee/tAn/AIoW0X1vF/8AQTXfeF9a/wCEg8P22ovazWcsi4lgmjKNG46jB7Z6H0rhfjzaXN54Ns47a3lncXYbbEhYgbT2FYUvjVzep8Dsc1oPxqm0jw9Yad/wi91MtrbpCJRIQH2jGfu1Q8Caz/wkXx9fVzavam4SRvKc5K/uwOfyr2nwlbCPwXpCSRbXWziDKy4IO0da8t0a3mX9pm/k8iVYsS4fyyF/1Y74xWqlF81kYSjO0bs09c8b+JfEPja68OeErqysY7LInu7jByRjOM+hIHHvVzwt4y8Qaf42Xwr4pltryS4Tfa3duAA3HQ+ucH8q8/8AEXhmy8J/EC/uPEukX17od+7PDcWzEFGY7u3fORg10vw/03wVrHi9LjQtC1iH7Cvmx3dy7eWH6bcHvg+tLlXLsCcr7kt58QvGUnxK1Pw9o9vbXgjZkhR4wojAA+Zm7gVteKPH2s+EPCmj2t3bwXHifUQEKZ/dq2eTx16jFYPg6Jj+0J4jZ1bGyXBI4/hp3xz8PXdzd6ZrsdnNeWVqvl3KQ53Ku7OeOgPIz2pWjzJDTlyuVx9540+IPgv7PqXiSPTb/S5ZAkotsB4s/SvXrK6ivrKG7gbdFOiyIfUEZFfO8b/C7UXtbW3g8RXNxcOqGFHZ9hPHPXOPavoTTLGHTNLtrG33eTbRLEm45O0DAzU1Uu1jSk292W6+VfHjbtbn97iU/wDj1fVVfKXjk/8AE7l/67S/+h1kjc5VqZintTaBjcUhUU6igRz8bAJTt9Z/21R0BoN8PQ0JgaG+ms/NZ/2//ZNL9tU9QaALpYYqMmq322P3o+2xe9K4Fg8imdKat7Djo35UfbYP7rUXC5PCm5uRSlSrkHpTYtRgQ/cb8qe2pwP1jb8qAHQReY+B3rv7Qi38JvExyzLXn8ep28ZysbZHtV0eJ/3QjIfYO1aRlYlq51Hw81STSPETyIuS5x9K7fxh4+1HT3BhkOGAJUV45F4hS3m8yJXVvUCn6h4ofUAPNV2xVc5PKdnbfEbVrnXInjkMa55HrWh8RtQbU4rDzH3M7KCfrXlsepiOZZEVgV5HFXLvxNNe+V5oY+UwYfhRcOU62/0uHRvszyAOJRkE1zfiK8tLqQG3jVSOOKg1bxVc6wkKzjaIRhQorKNzG3UN+VQykh0n+qqqamNxGRjDflTPNhPZvyqRnuv7O7w3nhzxZpLP80qo5A6hWQpn+deZ+AoVg8fQxKSVj80An2Br0P8AZnlgfxDr9uGw8tpHhT1IDNn+Y/OvLri9l8L+NLyS0Zop7S5kQZAPRiKCJxbTSPUfC0EC6VIdsEd0b2VnE4bJG4bSMdqsXrrD8QbEXDpGTYyoXwdu8j6etee/8LU1jHWLPr5dO/4Wrq7cuIXPq0eTSscPsal27HVv4ck0P4eazG08V2t5KsmYskAb+Qcj0Nb10zWOkzS2Fpau0dnkO853Y2Ddxn69q5jwn401LXp7iOY26QRpub9yG6At0/Cr914y0tori1l1O0jMimJ8WwDAHgjOahyS0OyGWYirFTsreptWmt2sNul9JKgbUbICM7cfNgAD68frULTR28N3p8fyNaaY7kE55b5v8/WsfTPFWk6fp9vYxalayxW4Kp5luGIHpyans7uFrzUNYtruK6lmi/eqYsKyjjA6gdahzSNP7Gru7jbTzNLw+jWvh/Tfs5kf9wrYFxgZxz8tUUBOueKX94B/46a5QfFMxtlNPt1K8AhcYon+KXmwSothDG0pBdwDk4rWzPP+r1FfQ6jW2P2rxmT08lFH5Ctb4IxS6b8LvFmqFNoZX8t/XbGc/ka8+1X4lQanYXEA06KGS6XbLIpOTXofh1k0n9l3VboTtEt15hRidpO5sYH16VS2OqjBxTueCbi+GPUjJpakMllnjfSedZer0zoPqj4IMrWV0QQf3EP8q9ZFfMXwf+IFro8yRElwieTLFkBmTOQy+pFe6L8RvDJUE37LnnBif/CkB1BoGBXND4heGW5/tIfjGw/pTx4+8Mn/AJikY+qt/hSA6LAorAHjrw0f+YtAPrmnDxt4bIz/AGxbD6tigDe4pMViDxp4bPTWbT/vugeM/Dh/5jNp/wB/KANvAowKxh4x8On/AJjNn/38FKPF/h4/8xmz/wC/ooA2cUhGazIfE2i3Egjh1S1kc9FWQEn8KtT6lZ2se+e5jiX+87YFAFkCjFUV1zS3GV1G1I9pVp39r6d/z/2v/f1f8aeoFtkVgQQCD2NCqqqAoAHoKq/2rp5Gft1t/wB/V/xpf7UsP+f62/7+r/jSEWNihidoye+KUgHtVf8AtOwP/L7b/wDf1f8AGlXULM9LuA/9tF/xoASDTrK1maWC0ghkb7zRxqpP1IFWhUH221PS5hP/AAMU4XMJ6TRn6MKAsSmvk7xwc63If+msv/odfTPiDxFY6FpctzNPHvCny4ww3O3YAV8seJb0XmqE8EjJYj1JyaYzGNJSmkpgFJS0mKQHN/2bH70o02P3ra+yrS/ZlrPmKMcabF704abF25rTnCW8e5hkURI0q7o4HYH0qopy2C1zMGmwjtS/2bD/AHf0rdh065lPy2UrfQVZTRb0/wDMPmP4VTgy/ZtnNjTogPu/pR/Z0Wen6V1A0a8/6B0o/ClGjXv/AEDpvyo5GJwaOY/s2PHQ/lThp8Xda6kaLeY/5B8v/fNKNGuwOdOl/KjlkugrM5X+z4v7ppw06L+7XU/2Tcf9A+X/AL5p39lXH/QPl/75pWYuVnLjT4e60n9nRf3a6n+y7n/nwl/KmnTbhf8AlwkB+lCuHKcz/Z0X92gafH2T9K6NrOcdbCT8qiMEy9bN/wAqeocpgnT48/c/Sj+z4/7n6VtE4/5d2/KmNKF6QMPwrT2cgsY/9nx5+5+lH2CL/nnWv54I5t2/Kk3L/wA8G/Kp5H2FY7j4CRJa/ESRV+QS2bqcd/mX/wCvXHeNNHjh8caykkZDG7kbBHPJz/Wuu+EVwYfiTYqiMglSRW46jbn+YFUviUgh+I2sK8DHM24HHUbRRytOwWOD/s2D+5R/ZsP9wVpll7W7Um9e8DCnyS7BY0/B9slvJdbBtzE//oBrnJdNhaVyUGSx7e9dd4aIP2tlQriF+v8Au1ieZGsxVoiRuOfzrKEW5s9XFXWGpfMyv7Ktz/APyrq/CVslvpWqIg4MZP6rWZK1srfIhIrc0Ap/ZWpsoIGxQf8AvpaVWLSFlrftbPszjDpEAPCik/smH+6PyrX+0WqZ3A1JAsF0m6McVqeZLRu5i/2VAOq17R4h0+DTv2bNL052DCdo3AxjJLb683+xpnGK9W+KUMdv4G8N6UkRyQCoXthcY/WjRkKSPCDpFt/cH5Un9j2/90V7Cfg7PaeCL3W9UvRZXEUYljtyuQAOznsT29K88+yqAMg00CstzDTSYEYMoKkdCOCKuh71R8uo3Y/7bN/jV4WZldY4lZ3YgKoHJPYV7Do/wKtf+EZe51e7nTUniMgjjICQnGQD6n1p3SEeIibUM/8AISu/+/rUNPfkf8hG7H/bZv8AGrstqI5WQ9VJFM8hTRdFFLztQ7anef8Af5v8at6fb63qVyttZXOo3U7fdSN2Y/kK2vDXhW78Ua1Dp1lGdznLyEfLGvdjX0r4T8HaR4K0nybJFEhUNcXL8NIQOpPYe1JsD58j+F3xKe0E6JcqG6I9yobH0rndb0rxd4Zuxb6tNeWjt93fyrfQ9DX0nD8VvC9x4gGlR3Llmfy1n2fumbOMA/1rW8aeGbTxV4Wu9OuYlZyhaF8ZaOQDgj8am4HyKupayp/5Ck34gH+la/h2z8W+J9Yj03S7ySSZ+SzKgVF7sxxwKprp5e4EKgtIW2hR1JzjFfTnw38EW3g7w8qsofULoB7iQjnPZB7CmxFvwd4PtfCWjqss5vL4qGnu5QAScc44G1R/+utq9gttZ0eWH93cQXEZCkEMpyOCDXiXxH8d6h4q1o+GPD7uLTzfIZoyQ1w+cEf7oP517N4c0oaF4Z0/TC+/7JAsRY98DmpGfOV78PPibaXTQx28s65IDReUwx2PTiremfCf4m310qXc1vYQH700zRtt/wCAqMmvZ9P+J3hvVNZj0uzluZbuSQxBRbtjIPJz2HvXXCq5mKyOW0D4faJomlrbzW0WpT4+e4uIlLOT1wOij2FfOnj+/utG8e6tp+kSxrZQTbY1eJTt4GVB7gGvafit8Rk8PWUui6VLnVp0w7ryLdD3/wB4jp6da+c3tnkcuzFmJySTkmnHuFg/4STXRz5tqfrAKT/hKddH8Vr/AN+B/jSG1bPamG1b0oYiX/hK/EPZrb/vz/8AXqRPFniEnmSAD2i/+vVcW7elOWEjqKkaNMeIdTuIcSyoGPG5UwaokknPrTVG3inUDENJTqaaACiiikA0DigilHSjrWJdirfrusnJ7Cu9+Gdha31oouVUjbjn1rh7oZtJB6iuw+GUwa1eMg5VgK7sKrs0ja56fb6BDaXGfLU/hW7b+HVmG7ykUH0pdNh+0ImTzXV2dt5UeM5rpqvlZ0uaSOXfw4sbfNGuPakTw/bsclQK7FoFZSDVc2KA8mso1TL2lzmj4etscAVJZ6XZwmRpoEZR0yK6AWSHo9D6Qky/M3FKVS6Jc0VINK0uVNxtoBn2FSNpGkxoW+zwYHsKP7JhWTyzJggZx7UqaTBKCBJkdxXM5Mz5ivbWWi3Slo7aHAOOVxVRNJ06fVGP2eERRgqe2TWwNEt8YT5V7io30CH+FsUrsOYrroOj/wDPvbH64rP1nTNGstPmlNpakbTjABOcVqnw9DglmrLl0jTZ0laaTfFFnPJwMVUHrqVc8au9OE0jyrEqBjnAHSs+TTR1CKfwr1zS9AsNZu52WMC0U/IT/FWkfAmltKCiDbXrQxMIqzQ9Dwz7B/0x/Sm/2af+eVe8HwDphzhBiqq+EtFjkkjdFPljLe1H1ql2EeWeDtmleMNOupF2Isu1jjoCMV1HxC8EarqnimTUbGxNzDOq8oRwQO+a7G38GaPcjzFiGzoMVr2ekT2qGOO9l8pfuqTnFYVK8XPngJo8OPw78Qgf8geb81/xpv8AwrzxD/0BpvzX/GvX/EWo3mj2YeG8kMznao96wIfEXiXYrNe8nsUFaQq1J7JBys4iy8Fa7ZNJ5ujXPlyRlDsK55/GoW8CXPX+ydQH/AUP9a9GPiTX1Ufv1bPqlWIdX8R3A+SWEfVK46mGqym53tc9OnjHGmqc4J2PKm8DTDrpWo/hEh/9mqVPC99a2F1BbaVqBedVHzxAAYYHsT6V6hPqXiiLpNak+8Z/xrPuPE/ie1R3d7LCjJHlH/Gs5YWp1dxrHKPw00meJXfhLW1RlXRL5m/2bdj/AErqPAHw5vdQspBfW8tiRyBOpQnn3rYu/jP4is95FtYvtPeMj+tdx8OvGuoeNIJGu4oLd0GR5aZB/Opqprc8Sr7zMGP4UIkiu1yjKrAkBuvNejP4btdR1mwvbqMSLpqYhRhkbyOv4YqL7XqDX4t40Tk43BOQPWukjQRxhR2Fc0KkZfCJU+UxfF2lTa14bn02FgpuCFYn+7nJrwbxn4Nbwx5YYg7+eDXsWp+ILubxeljZjdbxFVdh0J71yfxK0+517xJp2l2q7pZyE+g7n8BWsXcmrBxabM/4M+C1vbtvEd9CGggbZao4+846v9B29/pXoHxP15tA8DXckbbZ7rFtGR2LdT+Wa6XS9Og0jSrawtl2w28YjX6DvXiXxu143viSDSInJisU3SL28xuf5Yo3LR5fgU6OJ55kijQvI7BVUdyegpMV6X8G/Ccera9JrFyha308jywejSnp+Q/mKdwPUvh/4Oh8IeHliYBr64Ae4k9T2Uewrzr4v+PZbm9k8OaZPi1i4u5EP+sf+5n0Hf3+lej/ABB8UDwr4SuLuNh9ql/c24P989/wGTXzC8jSyNI7FnclmY9ST1NJDCJ2imR0+8rAj6g19f2TtJYWzv8AeaNSfrgV8i2MH2nUbaAjIklVD+JAr6+iiWGGOJfuooUfhxTkB8/+F9Gt5/jtcWkyoI7e7nmVAOPlJKjFeyeNG1f/AIRS8j0O1a41CdfJjCsF2BuC2SewrwLUdbk8PfFfUNVsRzBfSHYT94bjuH4817hpPxJ8Marp63J1SC1bA3xXDbGQ+nPX8KAMn4ffC+28LFdR1BlutTK8cfLBnqF9T70/4p+NP7B0b+ytPlJ1a+GxFTlo0PBbHqegqp4t+MWk6VatDojpqV4wwHGfKj9ye/0FV/hp4Qu7u6bxf4iLT39z81ukoyUB/jweh9PQUgNP4YeAF8Mab/aGoRg6rdL82efJQ/wfX1P4VP8AEf4gQ+ENNNvaMkmrTr+6Q8iMf32/oO9X/HXjO28HaG052y3suVt4SfvN6n2FfNGq6neazqc2oX0zTXE7bnY/y+lMZBdXU99dy3VzK008zF3kc5LE96ixQOtFO4gxSGlJxTc07gNI5oIpaQ9aAGkUypKbjmkMbSEU/FKkLvnapOOTikIioqQoQcGk2UgI6KTIpMjNc+pYS4aBl9RXR/C5z9qnixn565w4IxWl4P0fxL9tluNGgEibuWLbcV14afJK7GnY+jdIimQKShA+ldbbK5jGVP5V4ha3HxGtwB5EbY6ZmFacWufERRg2UR/7a10VZ870G5XR7E5Kjoaqxs7Ocg4ryttc+IDdbCI/9taYda8fwI8slpEkaAsxM2AAOSTXPYSZ6zKHjQsqkmqf9oXYOPJP5V5nZ+JvGupWa3NlDbXED/dkjnBU/Q0/+0viEf8Al1jH/bUU1qD7M9FM11IxkMRyRjpTku57ddoiJPc7a84/tL4hf8+sX/f2g6j8Qf8An1i/7+0WA9G/tS7B4gP/AHzS/wBq3n/PA/lXnQ1L4gjraQ/9/RR/afxB6/Y4f+/op2A9Bl1S+2ELARn/AGaxboX9xC1usG1XbLYXGa5htT+IJH/HrEPpKKrSXvxFduLZB/21FVFJBodNPFqJgTT7aJoYh1ZVwfzq3Dfarp8QhSAuo/iYEmuMFx8R/wDnkv8A38FAu/iMrYNvGf8AtqKppMq6O5/tnWNpIgx/wE1nG61ErKDF80vDHbXOfb/iHtwbaMg/9NRUf2rx9/z4RH/trQoJ7jUkddFreqW8QjS3Xav+zUg8R6sBj7OP++a437V4+/58I/8Av9S/avH/APz4R/8Af0VXJFD5onRzR3Wr3fnXi4VcYUDHNS/2f7GuV+1ePD102E+/m0G58eAf8gyH/v7XRCpGKsg5kdV9hPvQ0FxGvyEge1cl9r8d/wDQMh/7+0hvfHQ66ZD/AN/av2y6jc0dOkksUu6ZnIHasfxHqkP2d1CPudcdKyZp/G8n/MMh/wC/tZF7p/jS8b95psY4x/rKtVIdSOZHF69+7iZvVq9U+CT+TGw/vDmvN9c8J+JltTLdWQWIHJKtkivTvg7o989uJxGVtlO1pDwCfQVwYiam9DirN86seyxxR7t6qM+uKqa3fPYaXLJCu+dhtjX1atADCgAYArntbF290rbZViHAKDI/GuKySsjpjurlDwto4sYfPu5A1y53HnrmtDS9Kjl1641eVcuuYYs9h/Eagj0m4dopRK2AQa6WGIQxKg6CmlZaE1JupO7INSvoNL0y5vrhwkNvG0jknsBmvk3V9Sn1jWLrUbht0tzIZG9s9q93+ME2p3GgW+jaXaXFxJeyZl8lCcIvOCenJx+VeB3ljd6dOYLy2ltpR/BKpU1aAg6c19P/AA60QaD4G0+BkKzTR/aJc9d784/AYH4V84eHrD+1fEum2AQOLi5RCp6EbuR+Wa+tcCOPphVHQegoYHgPxp17+0fFqabE5MOnptYdvMbk/pivOK0vEeoHVPE2o3rEnz53YZ9M8fpWZkU0B1nwx0sar8QtOjZC0UDGd+OgUZGfbOK+l7q5SztJbmU4jiRpGx2AGT/KvJfgTopW11DWpFH7xhbxH2HLH+Vdj8UNYGjfD/UHDMstyv2aMj1bjP5ZpPcD5pu7g3V7NcE8yyM/5nNRD1zSV2Hw38HN4v8AEarOh/s61xJcnOM+iD6/yzTA6X4WfDb+1mj17WIv9BU5t4GH+uI/iP8As56eteveI/EFj4V0KXUb1gscQwkY4MjdlUVemmtdL05pZTHbWttHknoqKB+gr5q+IHjWbxjrpkQsmnwErbRH07sfc1O4GXrGq6p4z8TtcyrJcXd0+yKFOdo/hRR/nua9Q8O/Au3ayjm1++mWdxloLcgBPYtzk1f+D3gddN08eINQi/026X/R1b/lnH/e+rfy+tV/GXxhl0XxUlhpUMNza2zbbln53t3VT2xTYHF/Ev4ejwhdw3OnJcy6XKoBlk+by3z90kevauBr621O3t/EHhG5jlT9xeWhPK5K5XIOD3HB+or5JxihAJSUvekIoATNIeTS0UwEpKWmkEUDFFW7C9NnI7BVbcuORVLmnpjvQIfM4klZxxmmUHimFs1IFc0VF9oi/vij7RF/fFYWLJHbah9a9JF9PpHwsSayYRSSSxgsBzya8weeIofmFej6iQ3wmtyOhmi/nWkbktnoWkaJNd6Hb3LSuXcZJ3GtGHw6rnEly6/VjWl4c8uPwtaO7Kq7erdKraj4o0bTgTNcocdlOa461WalZIm5V1ew0rw7otxqmo6iY7eBcnDElj2UDuTXiGufFHUNQ8+3sbeO1s5VaPEhLuVIxyc4Bx6V1Pxo1xNU8M6K9jIWtLiaR2+qqNufzNZPww07R7nwn4muriGGfUIrdxGJAGKJ5bHcAffvUuvNRuz1cPThGl7WSuc54c8fX3h+zhsfs8VxZxk/JuKNyeeR/hXtPhfU/DHifSVvYdSe2cfLLBK5Dxt6e4968iutMt7r4V6NPHboLwOw8wABmG8jBPetHwb4E1qC8kmvoDBaSRHDq4OWzxwPxrejVs7SegYlUpxlJaSR7L/ZugHpq4P/AG0Ncx491XRvDHhma4sdVWfUnIS3h3lsnPJIz0Az+lefeJfDXiRQgso5p03tnyDyBjvXGahour2cBur+zuI49wj8yUcbj2zW9Woo3UTHDYdTtKUvkemfDPxNfeKvFL6fq1zHHbrbtKCgKncCMc5969aXR9IA41EH38w184/D2XyfErtu2jyGz+Yr09tbtVhMYZt54ya3w0eanzNmOOioVeWCsegrpOldRqII/wB81Yj0bTmXcLzI/wB8153b6nDBEN0mSeg9att4hmijjCRhULYrTkXc4OZj/iB4n0rwZCi5kuryYExQrIRx/eY9h/OvI5/id4ilm3pNFCmeEVSR9Mk81m+NtUl1fxjqFxKxIWTykBOdqrwB/P8AOtnQIdPtdKj8y1ilklXc7SKCee1Y0qdTE1HCDskezy0sNSUqiu2a/hv4qbrlLfXoP3bnH2iBiu36r6fSvQ21nSUUETSYPIPmHmvA/EVpb2uqf6KNsUq7wo/hPcV1XhrUFudBjWY7pICUOe4HT9K3wsX7WVGrujLFUo+zValszrvFXxF03Q7dYbBHvL+QZ2tKdkY9W9T7VwLfE/xMZt4uYlH9zy+P51y1xK95eySnlpXJ59zxXo8eg6daaYlv9mikO0bmYZZj9azo0amMnLkdkjafscLCPPG7Zo+EPibDqd2lhrSfZ5n4SeNyEY+hHb+Vd5LfWEaFjO+P98185araiw1WaCMkKjZQ9wOor1XRdWTVdAsmZd8rxhWGM5YcU8O05OnV3Rz4yiopVaWzOnl1zTEzi6bP+/VN/ENj0W5Yn/frW0/4YXuqRrLcRxWMbDPzjLfkK6vSvhV4d0/a1zAb6Ud5eF/75FdMnRXU89KR57/b8JGFkJ+jV1Phi0fWLdpAXVRnBINegQ6JpVtjydNtIyvQrCoP8qvAKF4AAFYTqxatFF2fU8Z0S8vbjx7caFcsr2zFlKleRXrtjY2+m2MVpaxLFDEu1VHavLNX1W2uvi9K9kuxra1aN5B/G4BOf6fhXn2t/F7xZdxyac17HDEMozwxhXce57fhWDFe2p7/AHHjPRbe9e2N2jMhwxU5APpWhZa5puoHFvdxO3dc4P5GvkSPU7gAbW246Yq1/beoH/l7l/76pWZmqkuqPr4FGGVII9jTs1wnwg06Wz8Aw3U7lpb+Rrgkk8L91R+Q/Wt7xnrQ8P8Ag7UdQDbZI4isfTlzwuPxpGy1Vy9qWt6ZpERk1C/t7VVG795IASPYdTXgvxV8cab4tvbSDTIi0NpuP2hhgyE9gPSuAuJ5rmUyzyvNIerOxYn8TUfNVYZ2Pwrh8/4laSBj5Gd/u56IT/k19H6xMbfQ76YHBjgdhg46Ka+dfhC6p8TdNLnGVlUfUocV9Gatbi70S9tieJoHT81IpMD5BZizFupY5NEUbzSpHGMu7BVHqScCkYbWKjtxXoPwe8KnW/FQ1K4jzZ6aRJyOHl/hH4dfwFMD3LwtoqeHvDFhpigZgiAcgYyx5Y/nXj3xv8R/bdettEgfMVkvmSgf89G6D8B/OvZfEWt23hzw/eapdMBHbRl8E43Hso9ya+Uby8u9Z1S51CWKR5bqRpXKrxknNICqK+nfhzoNr4d8E2ewKJLqMXE8hP3mIz+QFfNQtLgdLaX/AL5NbLeJPFDaMulG+vvsKp5fkjpt9M4zj8aYHU/FH4iv4huZNG0uQjTIXw8in/j4I/8AZQenr1rjPDGkprPirTdPkz5c86q+P7ueaofZbj/n3l/75NaGhXV1ouvWWpLayubWVZNu08gdR+VAH0h4v1RfDngm/vYV2+TD5cQXsThV/mK+dPCnh288W+JIbOFXdXfdcS9o1zliTX0nZXmj+MfD4KrHdWk64eCUcj1Vl7GpY4NF8K6W3lxWmmWkYy21QgOB+ZP60rgUvF2qw+FvAt9cowj8m38mAf7ZG1APx/lXyoa7T4n+PtT8Y6itpp9lLHpFs2YtykNK3Tew7ewrh0S+C/PZSZ/3TRcB9FHl3Pe3kH/ATTGkCEh/lPoeKaAWkNIZYwMlh+dAZWXIPFMBaKSm5pAOPSkDAU0nikzTAezZpuMCkzRSA4X+05PSj+05PSq/le1Hkn0rNIosf2jIa9unJb4O2pP/AD2i/nXhn2chc817lOMfB2z/AOu0X86tEM73XbmWH4Y2ZjcqWj7VwGneB9c8RhZY45DG38eeK7rxAN3wxsR6pXRfCfUludANu2A6NjpXWopQvYlI4Zfh9Nqfhq68L3MixX8Ugms5H6bgMEH2IOPyryfVtA8QeEr6SG/tLqwkwULjIV1PBww4INfQPxG8baZ4J8V2ElzZXE9xLCZlMRUADdt5z9KWHxfZ+Pfh7rF9FbOiRQzRmOcBiGEZIP614WLrKMr2PUw1SpShqvdPnmHxFex6TBprbHtYG3IMYI5yea9M0z4owtpAhjtjuChSCeRXEXugWi/DfS9YiQpdPuEpzw43EDj16Vh6MHbUkRBneCCK1pw52oPqb16VOpGU46NHvuk/aL61N2k2A6Z215h4/wBVvpYJtPlJ+zpcBh9QDWlolnqlxJhLiSKFBz8xArN8eKq6em11fMoyQcnoa1qYd0bnFhI/vEzA8I5OtNzj903P5V181zEg7OR71weihzfMEJB2Guu0nTbi8uY0VSwJ5PtWMKk0uVHXi4x5rs6HSLJr0LdXDEIPurWrekKsQAyC4GKstam1hhjRQI1qteE3F/bxwKGUMCQPWvQpXPInqzyrxtpE+jeKrqOVGVJz58TH+JW5/nkUyw1i3jtEin3qyDGQMgivevEmj+EvENhbWOt39pBdwLhczqkkZP16V59e/BR4itza63BNYv8AMkgGSw9iODTpqrRqOVF7nrKdOtTUaytY811O8W+vPMRSsajaoPXHrXo3wo8Pw61o2pmXqkqqp+q1yPjXRbLw/qVrp1m5kdYA8zseSxJ/oB+derfB/TZbP4eT37fL9quHZfooC5/PNZ0ZzWIcpb9TavCLw6jHY8S1fTptH1m5sJl2yW8hXPqAeD+VdJH4utpLJBN5iyquCAuQT7Gul8R6VomsXMr3OoQLcBj84lG4ex9a5w+AVDbv7RDR+y812UKWIozbw9mmZVXSqwXttGjlL67a+vZLhhgueB6DtXqXwgvrWw1DTrjUSFtQ8ihm6Kx6E/j/ADrzPWbeC01WW3t/9XFhM56nHJ/Oux8PhbbQIFKuXcFiPqe1cmHozqVpJ79R4ycY0I8p9SS69pMEPmyalbKnr5gNcnrPxY0axDJp0cupTDj5BtQfUmvFLW3ee48mCG4V/RqlOkTz3nlmC4Eif3OleisJZ6s8TnPQ7/4p62bdHhgtbcSDptLFfzrovh/r2o65BJNqNyZnGccAAfgK8gvJfJK27hlKcYbrXpfwpYGykwQeWrpxGHpwpXitSeZnLWp/4urqPukn8q8k1EZ1G54/jP8AOvW7Q5+Kt/8A7kn8qwvAegWeseIbz7UpbDkD25ryJ6Fo89hc8KQRWlpdjLqmq2tjEp33MqxLx6nFe933wssJoV8uEA9eAKueGPh7a6Prlve+UN0OWUkdDiouzWyO5sLOLTtOt7KEYjt41iUAdgMV5J8dvEQSCy0CI/M5+0y4PYcKP617CSFUk9hXl/iT4fjxHrlxqV0JN8p4A7KOAKCTwTdmkya9kb4RW56LLTf+FQ2/92Wr0LPLtB1R9F1+x1JCc2syyHHUgHkflmvri3nivbSOeJg8UyB1PqpGRXirfCKAHjzfzr0TwhFdaDpUel3SySwQ/LDIRkqv90+tSyTgZPgfc3Xi66ZruO30cyeYhX5pCCclQOgx616zomiWHhzSItO0+IQ28IPU8k9yT3NSvqMSZ+SViOwQ81yHjIa14h02TTbMSafbTArK6N+8dfTPYVIjx/40/EhfE+spoWly79Mspf3jqQVnkHGQR2HavU/hj4f0y48GWc0lsrOy8k15u/wTS0j80tIAvPJr2P4e2osfDMNqpyIxii47Gv8A8I1pRH/HolL/AMI1pX/Polaq0uaLiMn/AIRrSv8An0Smt4Y0lhzaJWwaaxwKVwMmLw3psDbooTG3qjY/lRN4b024GJomkA6B2J/nWluzS7sUDMX/AIRDRgci0UU4+EtGIx9kWmTa/wCVqP2cpn6VPbays8yxhSCTVWEV/wDhC9CJ/wCPJTXlHxM8A2NrfrdW8ARJCele61y/j3Tvt3h93Ay0Y4oQz5O1uxFjcmKMY+XNOtV22ceeu2r3iqNl1QgjkDFUoj+4Ue1UIfTSeaKQ0gCiiigBc0U00HpQBbv/AIeyzasllaJtzwSKu3nwhubC0klecll7GvU5rNLfxTGFlV/lDHHaovE9w09vcFm6EYA9K4lUZ0yhY8u0r4R32r6U19HKRGuQfbFdZrdi+n/C+K1OWMM8akjnvXoHhECHwHKuP4TmsU6xp2g+C72bVbc3cRuAQi8EZreE7sylE2JNOOp+BdPtg2GC9KPAuhXmgXssksmImBAGaPD2s6brOix3cFhcLEQcLu6Yrlb74paVY30ts2n3RMbFeG9K2nVko8qM+U2/jT4Wm8U6Lbahp+Jr7T92Yx96SM8kD3BGcfWvEtC8Wav4Wgv7K2IEN7G0U8Ey8cgrkdwQDXpP/C3NJBx/Z91/31WTrXjrw1q1lcLLoRe4eJlSR1BIYg4OfrXmulKW+p6GHxShH2c1dHBT+Ib258OWehnYtrakldq/M5Jzyfxrb8JaHMspvZ0KZXbGpHPPU1e8J+JvDuj6LDDf6Kbi9QsWmCjJyeK6H/hZPhwdNHuR/wACFelhIRhJVJ9AxOJunTpo2rK1WPR3TcVZ2xmuL8d6ZFYeHIijFna4GTj2Nbo+J/hwLj+y7n/vqmP8SvDM42yaPcOvoxBrpryjUTOOjUdOSkcX8O9Jj1jxObaZyiCFnJ+hHFe0aVoVpZGQqFG07Qf61x8XxI8NQt+40eZD6rgf0qx/ws/RsY/s26x/vVywpxjEvEV3WlzLQ5L4sSS2/jFI4Z5An2WM4ViBnmul+ENoLvQ7m5mkYslzgFjk/dHrTpfiD4dlbdLo80h6ZbBNLH8StChG2PSbiNeuFIGaUY8s+e5Uq6dJU7bGX8XfBt1Hqh8RWcRntbhQJ9gyY3Axkj0I71yWlePNZ0nR10yKSOW2jz5ayjPl57CvRW+KWkbSv9m3RU8EFs1j3HibwVcTedJ4YJfrkYGamUG5c0HY6qWLioKM1c8/hhv/ABHqzOxaaaZsvIei/j/SvfdN36b4dt9LtXCwQxBFAPX1P51xUHjPwpBH5ceizRJ/dQgCrS/EDw2ox/Zt4f8AgdaU4KnruwqYtT0S0PP/ABn4en0nWZp/L3W1wxdXHIUnkg1Ut/FOpW1kLdHQhRtV2GWAr0abxz4TmBWbSblweoZ8g1RGtfD4yeZ/wjsm7/e4/KmoShJypytcHi4NWqRucBpWlz6te/Nny926SQ9/X8a7+EpbFdqghMACrieL/BsaBF0edFHRVYDFL/wmfg7p/ZVx/wB9iu7CTp4eLW7fU4cRXlXlfZIkTxI1vcrOsC71705fGlzDeGeOEBjUJ8W+DGH/ACCrn/vsUDxV4LPXTLgfV66HioM51EydWvm1W6e6f5XPavTfg6yrZSBmAY7utcSfFXgkcNplx/38FX7D4h+FtMTFrZ3EY9nrKtiFOPKgcS1afL8Vr4dfkk/lVT4asV1m/I6hz/OtTw34l8Na1qF29hZzRX7QufMds54rG+GG463fKeSX/rXnXuCPZm+3G2R47g8jgVW03UtTttUBvEZ7dgQSDkr71ens5PIjCSYOKrfYriI7mkHHNXZNAnqWNa1mZohFYK2TyzsMfgK5251rVYbQuzsCCBgVcbUFlujArBmHarP2FJ4THIMqeoqJSjBXZVm2JpWuXC28Udy26WQ8ZPNdBaTPI534rln0OKOaOUlj5ZyOa1baQjkHmuJYqEpWRv7N2KXi/VNR05RJZgFB15rN0fxVdXdmrysQ27bVPxXf3D3BtkIG7oTXP6XP9hVYJGy+7Ndd9LjpwvKx6SL+cIG8w8019VljwS2frWTFd+ZEvPaq11fxtE0fnKDWDmdyoX0sb+q3YuNBeQYJ6UeCG36WfavK/F3xZsPB1oumTWsl7NMhfKOAF7AGqWg/tCaDpGg28i20sly8m2a2PDKmD8yt0POOK1PPqKzsfRS0Yrxj/hp3wV9mZ1g1HzApIQxAZOOmc1g/8NXWHlSt/wAI5OGx+6Xzgef9rjp9KDI+haRhkV49F+0j4QPhJNSleX+0doVrBVO7fjnnpt965a0/apiZ70XmhiNVizbeXISWk9G9vegD6FAANDkCJj7V836f+1XKbuBdR8OoLfGJXhlO/PqAeMVsXP7UOiNrkcEWlz/2W6fvJ2/1it7L6U0B6IymXW5JNpIUntWvpUH+kAkdDmvN3/aD8E20duVkmnMzhX2x4MY9T9K2dY+N3hHQp7Qm5W5huYzJvhOdvGQCOxNUI9R6iq19bi5spYWGQykV4Rd/tTaasi/ZNId4yRnzHwwGef05ruLz45+C7fSbi+ivXuooFX7i/fY/wjPUip6jPE/H9kbPxNNERjk4rnQNqAelaPjv4meHvFGufbrW2u4lIxhgO3+NczH4p0uZMyLNAVIG3G7cO59qoDVoqB9e8Otpomiu7oXAkIMTxjlexB9amM1m9mt3DewNbnqzOFZT6FTzkfSgBCaM022nsry6jt4dSs98hwC0u0Zxnqabcz2tjG0l3dRxAKSFDBmcjsAP60AOLU0txWbba/pcz4lmltxg8smeccdK0baN720+02qmeLnLRqSFx6+lID2vR7E/2s5MxkcLgljVnWoIodLnaTaSSOfxqjoGs+HkmeSfV4wT7Vnav4i0i6vnhOqobbcOg615yTPSaVzrtIl+yeE7hOOUJArhPGrbvh1cMepmUn862tZ8T6BBooS11OMtt5Wue8U3C3PwseVTlWkQg/jXRR3OaojypfF2taXIbazvZY4l6IGOKiXxDqDZkktBITyWZSSapRRef4ljjPR2Ar2WHwzD/ZseI0xtGcVszGzPJ/8AhI7gt/x4p/3walXxFcH/AJh4/wC+a9NHhKz3KdyZPOMU6bw9ax37QwhFwucYzSug5GeZDxFcKf8AkHD/AL5p/wDwk9wgydOTHutd9b6ZGdSME4ULng4pmu6ClvbM52NF2GKuHvOwuVnCnxTIRzp0X1xTk8Tyj7unwH6iuisNLsrs+U0S8j0pmpeDhCRLbcrkfLXY8PK10Ye0SdmYw8S3ZHGkxH6Iajl8RXhI/wCJYq/RTXpen6Bbx2cG+dF45XHSo9U0+0N0IY3RSqHJxXK1y6M2Suro82PiK9x/yDl/75NZs+s3U0wDwtEpPoRXpenWccomjYqzL0bFc/4xsooLJHyCytgYpWCxzra1JZSKVjWTPZqtjxTdMmRpaEeu2si0VJ9XtklwVNeh2ywzBItqhSMVLlYcYuWxx6eKbp2JXTkI7/LU6+JJ26aYuf8Adr0Oz0WxtYmURI8jcgGkj06K4nMSWaq31pcxagzz/wDt66/6B0f/AHzU0OuTk5bTose4ruZtDe3Pz2wAPA6c1Zt9Ciu4/INugdiMU3OyuUqTZxkerzyDH9lQ8/7NSfbbjr/ZMeP92u51ixh0y/S2ihCBY1yMe1dToum6fqWjPiJd6dTjmsXXOp4NqPMzxv8AteSL72lxf981Sm8SeW3Olx5/3a9Rg0iBvFEdq0QljL4K+tM17w/YQaj5bWixEk45qlW0MpYVxPI7nxMJEP8AxLY1PqErCk1KaSQkqVWvWJNHtzcyxvArJ0FULf4eya3diwt7ZkuJclFGCcetbJOTMPZtbi/CBi2uSt6wOf8Ax012Pwu/5GG9/wCun9az/CHhC78G+LWsrzd5htnOCORx7cVofDDjX70jrvqmuXcix7lOwyi55Azis3VbkRWcshfbgU/bIoE0zfOF4WuQ8QahPdI8UitCin161nKrZG1Gi5vUNAkjikm1K5cAHK7c03WvGoisn+xqN4PFcdcaswiMIbgGmaXay6nerDHyCck1lzKejPQqUIwVy7Z+NfEVxPEWtGaJmwSFPSuitfFc51BIWBVj1UV02nCOz09IjEqsg64FcldWtvZ6pcag7BpXB2rWf1eF7o49WGoakNS8RpbbArKcAjvWVqm218QiMZ2AAk1peFdBuZr9dYuyVjByN3ejxFDD50kijJz1rrqSSiXh03ULA1W3SD5X6DivOvFXjW20x7qLcxvfJMkadAfxra2Lt7/jXmnxZtHUWF2gYLho2I6eo/rXnwalOzPbxdOVKg5xPObu7mvbl57iRpHc5JY5qDNJRXefLN3FopKKBC5opKKAFpM0UUAGaM0UUAKDRmkooAKKKKAAHFLSUUALmjNJRQAVp6TrdxpNyroS8PRoiflYHrWZS0Aei+HvA13q1uGZ5kc9t2Kuah4ITTJlgnmuDIw/vV63Y6Y9kwdFABql4i0eSa5hnbDFhwN3SuNTuejyJHmr/D8i384zS+XjJ5rqfEcCWvwhEKElUdBk10f2OaXR5IVALBec1ieL4TF8M5Im6rKg/WtKU+ZmVWNjxeGzuLvXFEMUjcjlRXp8loy6am03iuFAOTxms3w7q+m6Q8c00amUetd/H458LXNmsUu1XJ5O2tG7uwoxSRz+h6E93ZNJK8/mZ2534wfpVyy8MmK4eS4ediemHya6DRdVsJ57iKB8xq/yMVyK2WllgYbrRZVboVUEV4tfHVKNRxsejTwcKsVK5w//AAiRe+EwMnlj1fmpr3wy8kJETuSf+ejkj+VdoPtbYKwIntilV7xCfMthIp44Gazjm9WLukjVZfTXU82sfC9/a3QdpLfYP9s/4V0cOjNMpErqQf7vNdI1rcu24WqLnsVFJGl4jlBAFPqAMV0Sz/EtWVkYvKaDd2csngyQyZkuZGj6gKCDUT+BHaVj9olCnpkV2qWk/VpmJ+tNlsDKuDI4PrurglmmIk7tnRHA0UrHGf8ACDFB/wAfUq/QAVVu/hxb6nbi3k1CZBuzuAUk/nXaDTEjP724LKPU80/ybRfuwBj6mk8zr9yvqFDscJdfCHQ7O0ku0lvGmijZo83C4LY44x+lcaiTxSohjkznsK9T8R3kVnbmR2Cqgycdq5Oz1OylmySGJ6HHevTwNSpWg5TdzmrUqdKSS0L/AIV0Nte1+1sbqSSHzDgP6DBJ4/Cum8cfDs6HYrf6dcTSxrw5PDIexOOx/Sl8NW0tn4t0W5kGIppCEPrlT/jXqOqalZLqMOjXqqUv4mC7ujEHG2vcik4pWPNqS5Z6Hjfw00m38QaubbVfOkRI3k2M5GSCBjPpyat69oy6N45ex0/ckIw4Bb7oIz19q6HQ9Bl8MfFCG2wzW1xHKYZD3XGcH3BFReNdPe++JNtaKxQXkcaEj07/AKVo6aa5PISqWnzHI6lDNfaszw77zaAC0SFv5VvaBqdvpllcW90Gt5yMhJEKkj2zXaar/augW9rYeFtJV4wpLybd2P8AEmi80m68R+FJf7dso7W/jRisi44wMg+30rmeDps6XjZtcp5v5OoR3cWsG3mhtHfidl+XBouNH1bXLe51eFGns7ZmBkDYzjrgdTXaeB9VTXNFl8N6jGHMcWFOOGT0+oqz4ydfDvg220fT0MYuW8ndnovVsn1NbRw1OErW1IliptWJPDvhRk8DT2d7ZwJdXIcgsAxOR8pJ7VzPhnS7jwv8RrKzv2jaSWNgvlvkfMpx/Kuk+Hr3Nx4c1C3uJXkdJDGNzbto2dBXmtpfR2Gs21wZGNzbzhm3HPAPP6ZrfZuLObV3O68WYPxDg4+Y2DZ/WuK+F/PiC8PbzP610Wrata6v8RUuLSUSwC2ZAw4BOw1znwu/5Dl7676xnHWxD0Vz1/WYp7jAgyCBwRXHazBqstlJa/ZtzH+IL/WtW81O+jkKrKQO1Qx3V7cxOzXbrjpS+qOWpjHMFDQ4RfB2rSXAVkO1u+DxXZ+HPDraUVaVcnqSBVVrvUGYgXsgxSLNqTNgXshNaLA6XHLM+bQ1tVtby+1OMx70t0PQd6jn0QTTLOQxdeAuOMVTVtWBwbuQD3qYT6lHgm4YgUvq77i+ttdDWmivZbEQQrsVRjGMVzuqadetFsFvIx+lP1DWdXWzc2cjNN2ArnJdf8cKeLRm/GsZ0GtGb0cXrdEx0i+xj7LJn/drlPiVZXFr4CvTLEqtuTiTAIGeoBroV1/xzn/kHZ/GvIvixrGr6h4gii1SZlljiwbcNkIM5H51z/V1F8x6NbMXUg4HnxooNFbHlBRRRSAO1Fbmk+DPEmu2n2nS9Dvr2DOPMihJUn61e/4Vf43/AOhW1P8A78GgDlaK6r/hV/jf/oVtT/78Gj/hV/jf/oVtT/78GgDlaK6r/hV/jf8A6FbU/wDvwaP+FX+N/wDoVtT/AO/BoA5Wiuq/4Vf43/6FbU/+/Bo/4Vf43/6FbU/+/BoA5Wiuq/4Vf43/AOhW1P8A78Gj/hV/jf8A6FbU/wDvwaAOVorqv+FX+N/+hW1P/vwaP+FX+N/+hW1P/vwaAOVorf1LwJ4p0eya71Hw/qFrbp96WSBgq/U9qwOlABS0lLQB9TRQaleNJDE5ZwefSqN/pmqR6hbRSSkM2cA1D4rm1/w9qJFuqiN+cg1Hplx4kv4lv/Kjcw8gua4EnY9W3U37jStQt7K4ZpOCnBxXL+K9w+Gz72yROmT+NGo+MvEM0UiPDGFxg4FVfEszz/Cx3cYYyoSPxrShHVnNWZ5xNbtd6/FFHko+BgfSvSdK+G9nfRqoRllxnk1wOjQT3Ws2625AkB4JOBXplvq2p6ZexWzPEWcYyrZxXZGLTOe+h0Fp4Rh8PaZJIjnzSQW3fxVsyFjbIVJAwMYrlNZl1e3hEs9wjA/wh619B8RLc6asWpQNCi/LHPjCt9a8HNsM01UXU9nAVbx5OxeF1LHwTmpo9VdOoBpt5aFRvUgrVCvntj2oxjJGsNab+5Q2rbv+WdZNKG5xTu2DpRRfbUXY/KoUUw3EjnlvyqleXltpYhW5SW5vLj/j3sLfmaX3P9xf9o1W0DXrfxDpd5ci3SxudPuXt7m2SXzioGMOO+CTj6it1hqso81jkliKMZcpp9TQziNGc9hUF7dCyiAnutPsbgni3vbhIpNvYkHOM/hUepSMmmJIVCCQZUqwZXHqpBwRSlhakNZIIYqnUlyxOU8Rym8glDAlT1+lYekzaV9qiQ28m7cAeasa9fKrJbqwLP8AMQDyB2rKg2xzwsAAd/Jr6bBL2dE8vFr2lVpdD16bVrefUPDttDEY/s9wh59DxWr8UoG36TOHMZDuu4dQcZFeUTa9PBqELqM+VgqfQg9a1fE3j+/8RRQpMiARElQi7RnGMmvWpVUopt7HFKg72R614O8QQeJbGMXYU6lYn5s9Tkbd4+ucGsLx5e/2X440fUVTf5MYdgO4DEH9K8s0zxVdaLcR3Vu7xXKZAZe4PY+ta+n+K7zXvFML3z+c7rs3P0A9MdKca1Ne8xewnc9Z16xvPE1paXnh7VzAuOQrkKwPPOOhFYOo+Gv7H8N3Vzruuzy3pQiNVuDtJ7AKeWzTk8JW0bl7TUbi13/MVhl2ilXwfYeeJbi6mupuxlk3UKvBLRkezdxPBs1j4e8EXOtNNG9xJkEFhkEcKg78nmrWn+JNN8VeGbmx194YLqMEkthMjqrrnv2wP61BJ4L0p5DK6qGPYNxn6VU1XwXBqEiN9pMSou3C0niabdy/ZMg+HnibTtGN7aX9wIo5HDpK+SM9MHHTisvX08NWWv213pZa9gWTzLoFspgtnaCQKi1Tw5H4atTPa5ujJ1Rua5PxNf3yaJJG1n5KyDkhcYFDxcebmSNPq7auegal4h0bXfFNgNKtjE8MchkOwJkbTjgVznwt/wCQ5ef75rjvhL/yMjjt5En8q7L4Wf8AIcuv98/zoUru5xTPQtRhZ5CQucVSCyIhAU4Nb1zhWbis93BNehCTtY8J07yZmGB1BbacUWxP2lcCr8jBoyPaqVsP9NWtG3YmMbSJruYiUgDBAp1o7SBjIOMd6kurMvJuVkPHrSxwSRoSzJjHQGuH3uY9d8vKVrAA34GARmuptoVVfuKfwrmNKUyaiqj1rf12afTtEmuLcbpVXIAqqz1RnR20NKS5tLFPMuTHGvqQMV4d8fl8GX/hz+14oVGtPIsMUsJxvHU7h0OBWnplj4g8YXha4kmjiJ6HIFZHx28OWvhv4d6fGsYklmuiPMK/dwvXNYStY3W5850UUViaBSjrSUDrQB+gvgi0gsvAWhW9vGsUSWMOFUYHMYJ/Uk1vYrI8J/8AImaN/wBeMH/ota8y+J2v/FHwkms69YTaSPD9oytErrul2navI9dxNAHslFeQ+BvEvxBmsbPxR4svdIi8Ly2Zu5HjXEiKUypP44zXZxfEvwhOJDDrlvKIrT7dJtJOyHIG8+nUUAdXRWFL4y8Pw+FE8SyapAujuAVuifkOW2j9eK1rS7hvrKG7tn8yCdBJG395SMg/lQBPRXL+JPiN4T8I3iWmt61b2lw4DCIkswHqQOlX08V6HL4ZfxDHqcEmlIhka5Vsoqjrn6UAbNFYNz408P2fheHxHcanDHpEwUpcnO1txwPzrjviF8YbLwZr3h6whe1nTUZUN2zsQbeBiuJPyLH8KAPT6MVDaXUN9Zw3VtIJYJkEkbr0ZSMg/lU1AEF7bQ3djPb3EaywyxsjowyGUjBBFfnRcxiK7ljXojlR+Br9HJP9W30NfnLff8hC4/66N/M0AQUtJS0AdlqPxG8Ram+66uzIR0yKki+JfiWG18mK8KpjGAtV9A8Jza9avOjqirkc+tJqvhK50uHeZEdf9ms+VG/PIjbxtrkikG5OD14r0jUZWm+DQlkJZmkjyfxrx8W8rZ2xscelevXo2/BeMMMYljzVRSWxEpN7mb4as40BmcYY4wfSvSNK8P6TfkTb1eUDd1rxu7uXimijhlIQ8cGul0azu/KWRNR2huSA/NW5G0OXls0dxq2kRm8VXJZWOVGaW40ea418W0rH7BahSqDgOSM0eFLnTrW7l/tG7EpT+82ea2NCkiu9R1DfKBAJzJvzwqAAk/kK8zMG5U1bc78G1Tk2uxZujBY6dJe6ldx2VonDSSHv2VR1Zj6CuUn8cadE15BaaPqlxe20fnGC6j8hRFjPmM38Ix0BGTXYeGILPxNqUnibUQJIINyaZbPgx20f/PUjoZG657DFZlgth44g8bW2mTQCS5lW1+1dd/yDnPoMGvJjTpU3Zq76+RcsXUl8LsirY6yutWtu3h7SZdVuZYEnmjaYRR2m7na79z7CotN1DUdcTUVuZD4QtdLlMNw8bLLLLJ3G9hhVGRjHXNTaP4Xfwx4U1LTr157yeO5WR/sB2yyIFGwgenHIq7Yb9Z8P6xDc6dbnULq5Ny2nXD5IiIAQN6HABoqThC/skvUydWpPSUjP0LSLvwx4z1zU7/Vn1Ox+wLcm6lA8xuOBn6DgDiqmkeFrh9ct/Eel6zB4Wur+Ix21vHCr70Y7vmz95icGrqi51bSvEGi3FxYW+sXVsgW1hf5YEHCqD34/nUPiGx8M3ev6P4g1DxLbWkehogaxV1b51wccHOc8UoTqKfNzWfpciytZl280208JeGbvVNV0pvE9/czPLfzmFWYE9wvZR6CuK0ydrDwhptmDxOj3xUfdj818qo9gF/Wugf4haNLd6ld6ZHrN7qWpxmNdP8tvL3EYBA7cd6yrewlXRrDRkAmnsrdYZGXkeZlmZc/7JbH4V0Jy9nJ1d20aYZL2ysM0zQYtV1Np5uVSJAB781rHwXbthgRkHOKp6fZX0N1HHh45WHKn2NdxY6fqGFWQpz2I5rvhCcqa5XoYVqyhVkjln8G20o3FthFKvhGEoFU5x1OK9Ye0ijt4URIi20bsinLFaxYDxop+lP2NRbsj6wmeSz+DLQ253Ph+xxV7w/8AD6We4Sa0zIVP3uir9TXrtrplvNGJZIkCHkfL1FYvirx9ovg+38jIefHyW8Q5/wDrD3NdFPDzk7CeIclaKH2PgrygJL6/YnHSP5R+ZrR/sLRIVDS7jj+JpG5/pXh+r/FLxPr9w0dixsozwFgGX/Fj/TFYL6brl+5lurmVnbkmWZiTXpxy/rIhRm92fSJtNAuE8sCJu2Efn9Kr3PhXT7hdttcTQP2xJn8cGvnRPD2pRnckyKfVZCDVuz1jxb4eG62vbpI1OdrN5qfkc1Ty9Paw+Wa2Z67feEtXst0iSLfRpyAow35f4VxXiySa60x4LuMYb5cEYwa1vC/xpVpUtdfhEZPHnxAlR7leo/Cu08SeFtM8d6OJ7O7WC5ZcxXMWGBHYMO4/WuOphnSeqNFXcdJo+fvhpEsHjK4iT7qRSKPyrqvhgfL1e7c9Ax/nWP4R0HUvDfxFu9N1WBorlInOf4ZBg4ZT3BrV+Hh23N7/ALx/nTitTjqtPVHqczR3BJEoUmqj2WW4uAKqq5ApGadVMgQso9BXoRdjgdJMsfYG73Ix9KZ/ZaZz9oXNIkxZMsNvtTLqc2toZyjMgPYVXOR7BEv9mLn/AI+RR/ZgI/4+BUVpdxXcQkjbg1PNN5UQfBIzS5wdEsaXZw2d2JZJwa3nvLF0KvIpU9Qa5Yy+agYcfWoZnwmTwKzkubc1prkR1c2o2NvaMbRlRwOMCvF/jvrenXngmCx1O8kOoiUy2yIOPQ7vbFdfKzOvykgV458cCzR6WWk6bsKV59zu/pWU4Wjc2jqzx+iiiuY0CgdaKB1oA/Qzwl/yJmi/9eMH/ota5L49f8kR8Rf7kX/o5K63wl/yJmi/9eMH/otat6rpNhrmmTadqdrHd2c4AkhkGVbBBGfxAoA8suP+TSF/7F5P/QBUvwb8D6A/wgsJzp0P2rV7GSO7uCuZJFcsCufTAHHtXpJ0DSj4fGhmxi/ssQi3+zY+TywMbcelPstNtdE0eOw0q1jgt7aMrDAnCr1wPzoA+VNN+3alp+nfBmcuJ7fxFIJz1H2ZPmJ/Msw/CvrWKGOCBIolCRxqFVR0AHAH5V5R8PvAuvN8TtZ8eeK7C0sL26jENtbW77wnADOT64UD8TXrdAHz34EfQIvjF8Q/+E2Nkuom6zbm/wAY8jc/3d3H3fL/AArD8IQyT/CD4rDS0kOhNNIbBcHGBknb7bdle++Ivh94V8V3SXOtaJa3twgAErrhsehI6itXT9F03SdJXTLCxgtrFFKCBEATB6jHfNAHzP4s8T6NP+yhoWlQ6hBLfkwxm3VwZFKMxbK9QBx+Yrpfi7b2EV38Kru6hgWM3cK3EsijBjHknDE/w4z1969Tj+FPgWOK5jXwvp4S5x5o8v72DkfTn0rW1rwnoPiLTIdO1bS7e9tICDFFIuQmBgY9OOKANO28g2sX2bZ5G0eX5eNu3tjHbFS1FaWsFjZw2ltGsUECCONF6KoGAB+FS0ANk/1bfQ1+ct9/yELj/ro38zX6NSf6tvoa/OW+/wCQhcf9dG/maAIKKKKAPafA9vHpmhSrKwPzGrWpiwu9Ldt+JF6CrieHre0hZLeQqhOcFs1n6joYjs2lRshSMgHrXnOvFvQ7lRZzVxpJS1Z41wMdcV1Gsgr8HDk8iVKDPanSDFLaPvAwDmpvEKgfCWUBdq+cmB+NddJt6mM42PObctd3cMK/M5PArt0iksNkRh/eMBWL4U0WNZUv3nRHTlA1dpFGt7drNc3cJKngAYqppvY0oyV7Mxri3azV5pbfDE+/Ndf4MuFn06+81MxPby70z1HlnikutKudcBVLyExjACgdqv6Vp39j6pNZSuPLkj2MR0AZSCa4MTpFN9z0KWvMl2KviK5l8J/s8W509ikk9vGrSd/3hyT+RxXIfAy7uLnSPE2mwMRM0AmjYdQ2CM13ehaxoU3ho+CfGMkNtcWaeQyXLbEuYgfkkRj1GMVjvP4X8LxT6N8O447jWb5dklyspdLePu7v0AFeYn7s6Li+Zu/l95yWd0ypN4jutfvbS60q8fTmsLJI9Sv2G5Q2MCIL/ExaqkOiWlwXnEevXV7Icy6h9pEEj/7ITkbQPXmtrw3oS3ggtLMPLYWrEo5XH2iU/enYe56egrsFig0KeKTUJNkjA+XGACWxWdXFxoP2dNXZ3Qw/MryevY84TwfBMp2eHJMKc+e184uXPfc44x7Yrb0zwLFDaC9Ok6LpyxDKmSBriVf9oljyc962z4sbV3trawIhneYbXAwAo6lvwqnqd40NpHqN/q4UtuFwkTDbKo+YJ/3yBjH941P1rEzVti3hIKyZqyWumw6a7T6zc3cwTcyNOY1cewFcfqOu6db6XHDpFu9s5b5wTnj2Nc7b6q+q3LzfZltoSPkjVi2B7k0t0BjpWkMPJu9WTZ7WHy+lGHOj0nwBbLrdvJezSHzrdtg78df6108wuYtYTy1DJjGK84+H+uSaXHdxowAdwcfhXeaZq0FzeM8mQ68g5617uHa5VFHyWOShXkjVuJboXyNtCjHPNadhYzajfCW4iC28XbP3m9PpVISfarhFVGJJwK1/EOrQeF/C893N92CPOB1Y+n4niutR5nZHHvojlPiX8Q18N2g07TirahKvHpEv94/0FeNWOlXOsTvfahLI3mHcWc5aQ+tSafaXfizxDcX143mbm82Uk8ZPRR7f0FdzHpsVpHm5xwOFB4FexCKoRt1OiKUUY0FvFbRiOKNUUdgKdJLHFy7qv1NVtbuTE6C2JjR8/Wuda4d7jyoopLiU/wAKAsa1Ub6serOl+32o/wCWy1LHdQS8JKrZ9DXKxXAkYqVKODgq3BFT5x3p8oWsaepaLb3ql41EU395R1+tL4Q8Z6l4I1YW9zvewZv3kWc4/wBpf8O9U7e/mtyBuLr6GrN/bQ61p5aPieMZXPUe1Jx5lyyDfRnvF3Y6d4q02DUbfypLhIibeZfRh0z6H0rxjwRFJbahqMUqGOSORlZSMFSG6VrfBnxXJa376BdSERtl4Aex/iX+v512viHw5FbeK/7VhASO/QLL6bx0P4j+VeRUg6U7HNONnYj0jT/tr5ckJ3rpbb+z1Q221WA61z17rmnaVZrawXKB+Nx75rmLjxNDDcyMl2vHSs51HeyOilhuZXPQ77Q4ZJEdFAQ9cdqrJfaQ1ydJdVLEd64Vfic5szbtMu/ON2McViT+KLIawly10obaec9DWbqNdSlhT0e68KCK8jexbbA3JA7VYOpaJbyJYSurP3z6150/xQkttIe0hbzJWHEg5xXIXOsTF/PMrb2OSc9DS9vY0jhGz3S90ZZLmMW3ET85HaoLm50LTrhbSeQPI3BB7V5l4f8AiTqFnaz28shlwMRsR92uVu9duX1t7qR2cufWtPbkfVLbnvN9oUMlmJLQh0bpivnn4+adqOn3eki4h22ro+yT1bPI/LFetfD3XdUurtIvma0P3twziuf/AGm7Wwl8K6bePn7bHOUjx/dI5zT9q2rHLVp8jPmE0UGipMwoHWigdaAPu648SQ+Evg5baxMxX7PpkPl4QtmQxKEBA7bsV57D8YNT139nzWdftrkW/iDTvLErRxEIm+YKu3PByoNejtF53wY8vZvLaHgLjOT9n4rw/S9SsLv9jnVbK3uI5LuzKi5jX70e65BXd9QDigD03w18b/Cs1romm6lqrHU7mCFZJjEREZio3Lv6Zya6vxh8QvD3gdbcazdsk1znyoIkMkjgdSFHavE/i1p1nZ/s3+CHt7eKJ0mtMMqgH5oHLc+5AJqf4mJdaZ+0Pp+p3msR6HaTacEtL+4t/OiRgCGXB4ByTz7igD23wl400Lxtpr3uh3guI4m2SIRteNvRlPIqx4o8T6Z4P0GXWNXmaGzhZVZlUsQWOBwPc15R8EbCxbxz4n1fTvED6wtwFS5eOzMEDSbshlPQ8bunrW5+0b/yRTU/+u1v/wCjVoA07T42eCL3xFb6PFqb+dcuI4pWiIidj0UP0zk4+taPi/4n+GPBN5FZ6teP9slXeLeCMySBf7xA6CvJPjFp9pYfDT4dm1tooTHc2yqyKAQDECefqM1R8Sm60X9pDX7vUPEMHh0XdqjWl5d2wmjkj2oCgzwPun8j60Ae0P8AFDwqPBDeLE1AzaSjiN5I0LNGxOMMvUHJH5ipb74j+GtO1TQ9PuL4ifXkR7IBSQ4cgKSe2Sa8m+Hng+w134dePLTTNVm1W21Yna5tDBH56hmDRg9Rnb09q8/0xrrxX4MvfEbxv5/grTrC2gJ7MlwWYj6IKAPqXTvGWj6r4u1Lw3aTPJqGmIHuF2HamcYG715rfryD4CQNq1r4l8azR7JfEOpyPHkciJCcD82I/CvX6AGyf6tvoa/OW+/5CFx/10b+Zr9GpP8AVt9DX5y33/IQuP8Aro38zQBBRRQBk4oA+vE8PXN2hkjiiCD1rJvNEur4NYQpErMeDnFeMwfFzxbEhjTUGwe2KiHxL8SrL5ovWDdc7a8pYOzuen7dWsel6v4E1e0jIeRAfZqg8T2z23wskhkIJWdAcfWvOLz4l+Jb0fvb9z9BXeatcy3PwY8+ZyztKhJr0oRtoctRprQ5JtTlsWht4Y1cNxkitWy1LUWmXGnll9dhrmLKcTavZBzgbq+kdCXSbTTEMskbDy88r3rdROVScXdHPeAbd9RvybiBoQvbGKt3827xLONuBsUfXBIrXfXbG1jzazKpfngViSX+ny6wtxcO43xbRtIAyCa87Mo2oN2PRwE5OtZ6hN4ek1x2hL2zwoC2y7txMi/TPI/CpG0HStHsY7WVUuork7Wis4xCjN6FVGT+JrO1fxgY4BDpgaCMqyyFjknPHaufttauPtNq0kjLb28gkZt20gdeo9a+dgsRNauyPdng0vfmrHXz3V6FNposcNosJEUkMb5aMkE/Me3A6VhajdwWEcGo63qcs0+0FIUOXQEdx2Nc9L4w1y5t7hbdILX7XI8jPEu0rk8Y9+Op9ahsPDst60tzIktzOEMzMykk4GeK6I4eMXd6fmdVKnJR1skXFj1DX7hbzSLUafZpE1ugJ5wxOT+OcUi6VpljJ5mq3hvpSu1Exu2kKBwv0459KzI/ENxHpkMAumt47h1BjUFGwT0zjH45rsLb/hHLXUmitYgjrEFkhlJ3tJkdCevHPFa1YSpu1jljiKL66GN5QvL5IdNtnWBVCqvl7csaW80i8inMM0LIykbgR61s2d0bO4ceTIQGzv6MK221r7VZmOSSLfsO2aRclD65rKVSatyo7vrnLTtT1OGtLOewvnRztY8gA12GlNcLco4ibnjpXJ6lGmmahbOr7/Pzl85BOetd/Z6ssAt0QgnivoMNZ0lI+JxE5VaspM7zRbdhqNqCTzGZD7e1cT8dNYKwWOlxt/rGMrj2Xgfqa6rwPqU2oa5fLNNv8uIbVx935q8x+M0hk8cxRk5UW6cemWOa9LCx5qiFSXvFbw+G0vS0ZCAZF3vn3pt34qWRv3+Tt6c9ai1KXyNOEScF1x+AFdN8J/BOg+JtHu7zVbZrqaObYAXIUDHoK76jjFc8jeTS1ZwV5q0d1Nvd8ADhR2rr/go0cvj27BCtm2ZlJHTkV6xF8N/CMIAXQrRsf3l3H9TWvp3h/SdIcvp+nW1q5GC0UYU49M1zVcVGUHGKM5VE1ZHEfEH4XQ6+H1TRwttqijLKOFn+vofevFC01vdSWl7E9vdRMVdHGCCK+s64zx74A0/xZYtPlLTUIVJjuemcdn9R79qjD4nl92ewoVOjPBDT4Jnt5RIh5Hb1qrbMxRkdgxRiu4dDU1epZHQ0I13/AGT4otdUtzja6zY/H5hX0fqrLqPhB5o+QYhMh7gDBz+Rr5j1InEf419KeD5vtvw8snlGd9oMg/7uP6Vw4yOikZVlomec3Hhy1u2Mkksm88nBqi3hKxdiPOmP410CGR9qopJPpWld+Fr+XS2mtWxNjO3FcvLHdmSqzjomcS3grTz/AMtJM0h8D6Y5yzSE/hWtI13bFYbmNo5s4wRW5YaFeTweYwPIzSUYD9rPuccPA+mjo0gqU+CdOZMeZJiupvbC5sQC8ZKt0NWrLRri4i3sOCMgUnTpjWIq23OHPgywhzseTDdcVWk8GWPmB98hOc81299YzWh+YEinWmjz3Kb2TCHpS9lAPbVHuyjo+qJoNitvbwKfVvWvK/j3q8urW2mSSSFYk3qsQ/vcfN+VeparpU1kC7KdleK/GRIvK01+fOJcdf4eO1RKnFaoiUm9zyiiiisyAoHWigdaAP0L8KAN4L0YEZBsYP8A0WtSReGtDgt7mCLSLFIbogzxrAoWXHI3DGDimeEv+RM0X/rxg/8ARa1r0AU7nR9NvLOKzubC2ntoiDHDJErImBgYBGBgUmpaPp2s2wt9Ssbe8hByEmjDgH2z0rxK0+K2oeJf2gI9GsdbNloFvKkccItiWu3wAyscZX5i3Poo9a6b4S+NdT1x/Gcuvagr2+k6lJFG7gKsUS7up9AB1oA9KsNNstLtFtbC0htIF5EcKBF/IU+9sbTUbVra9tobqBiCY5kDqccjg1wVj8c/AmoatFYRaq6maTyo5pIWWJ2zjAY8V0g8a6L/AMJwfCTXDrq4h88RMhAZMZyD0PH8jQBqXWk6dewQw3VjbXEUBDRJJEGCEDAIB6cVHqmg6Vrcax6pp1teqhyonjD7fpnpWdpvjbRNW8R6rolpcl7zSBm7ypCR/wDAun/6jXMH48eAhqn2L+1ZNvmeX9p8lvI3Zx9/pQB6DaWVtYWqW1pBHbwRjCxxKFVfoBUEGh6VbW1xbwabaRQXP+ujSFQsn+8Mc/jWX4j8c6B4VGmtq18II9TcpbyAbkPAOSR0GCOan8KeLNJ8Z6O2p6NO09oJnhDspXLL1xntzQBqWlla2FqltZ28VtAmdscSBVXJzwB71PRRQA2T/Vt9DX5y33/IQuP+ujfzNfo1J/q2+hr85b7/AJCFx/10b+ZoAgooooA9H8GeFopfEcS3kZMR7V7C/wAP/DLSNujOPQYFcRaeJLPStQja7hEeRwQO1egaXqdhr0XnWdwG9Qa4JylfQttxOQ8X+DdB0zQJri3Vt4BAHFZ2q4b4KjaMDzErpfiFGIPC8vzbiQa5jUTn4JjH/PZB+ta4dt7mfO2cDpGl3t5qURihYhT1xXremvcGAW7xyA7dua4vS9XttNgSNroxOw7Cu30nxtoSwiOe4YzD+Ir1r1aVTl1MpRbEFvdxyeS0DnZxnFZeqW0ttqKLNkZj3AH613mi6rY67MyWknmP34xVS9sbO91e3uJUlnKExsEGRj3rnzGreg7o9DKpqhiFOWxycVjfvAl5ax5WNvvEZH41oQ+Bry72S6xdQW8TPlIEUgN7+9d/DCkFstrptlkz8lZBwntx1rX0+y02G/t4tUujNqU3KJnhfb2r4+lUq15WgrH0GKzFVHeKOUOnaJ4as4rSWwVnmI2tMhUHPvXRaPpxtg7S2oiRlUQ+UN3HuT2rnvGOqWniHVIIX821tdPlKSlhhj7D/Guot9ctLuzhi0sPL5Z8rABATA7nHSoqUlSnvc5Kk5zinfV7mV/whGh6FeteR6TA8hJlErjcFPtnpXF6tf6ZqHxAge3REaGENNKq/LycDjHOMd/au3uNM1W8hZ7qNSSjqywlm5P3Aueh7msfRvBE+mW80eoKI7zUisCxoQfLiUZYk98/4V3U7tOpLsc3LBRLlw/h/VIVmSzvIsj78URwffFc5e6NFcan9jtpJEDAne644HJyO3Fem6tqVt4e0tCEG8AJGn4V5xf63Ekkks90jX138ud+Ai1z0Z80rvY0jeMXOOhzHiSIX8mmxWMDHyZZEZVX0C810+nQPdLErxNGyAckYzVdpw+qWcEcgV3LZI9OOf0rtrTwp9qVZI75ga+nw1ePs07Hj1KcpSbuWfAH7jXbyGRCjtEMEjrhua8/+NNs8HjO3nI+WS3AB/3WOf516ppHh2fTtZivHvGk2goV9Qe38q5f43aG15ocGpxLlrR8vj+43B/XFd+Hqp1k0XSi4S1PM9RlEpiwcgxAj8a7j4J67p+m22qWl7ew2zF1kQSsFyMc4zXmlpcme3jVvvRrs/Cia2gc7nGPxxXpVKanHkZ0SV1Zn0rN4+8KW7lZNesgR28zNR2vxC8MX+pQ2FpqsVxcTttRYwTk/WvmjbYrxtrQ8M39npfjTSr128u3hmUu3oPWuOWCSTdzL2S7n1ZnivFvir8QWu5ZPDOjTZQHbeTIev8A0zB9PX8q0/iN8ULaDTv7L8O3aXN5dLh54WyIVPof7x/SvIbeAQrydztyzetThsP9uYqcOrHRRLDGEUVL5blSwQkDuBSKAWAPTNdOPKgtewiC9e2K9Fs1bOI1E5ZFHUAmvpbw3AdM+HlshBJisxj/AL5z/WvnfQtNfxF4vtLOJSyPKC2OyA5Jr6T1m6i0vQljKg78IqdMjqf0rixstFEmrskYekWkOn2AublMsR8uadb+KY4rxw5+UdR7VxOueJ9cnl2QaepiBwpDVzs03iS5LsmnKWb/AGsV5VRzvoaQjTtqerXup6FfKt2xBeM5Hua5lPEdzD4nR43PkEE7O1efLpHi/qlngE5xup39keMzMJRa4IGPv1H7w2UKPc9lufFGkS6WdQmYDYOUJ5rzi98fXg1cXMMgSIH5V7Yrmn8N+KplKTRfIeqmTimN4Q150C+QvH+1R746caKZ6tpnjTSdYgM904jktx86sfvH2riNQ8f3Nx4kPlv5UEZ+VQcA4rFtPCGtxl90S5Pq9Qy+CdZa58wxxjn++Kd5ktUk7nrel+IrXxG0NrJjzivTsa4b9oLTNP0LwfE0ekLcNdsIxdu3+pI54HvzXaeA/DNrpUC3d2yNdDpz0rJ+P0MN78K7uTzUdoJo3UbunOOK1TdtTircrd4nyNRRRUmIUDrRQOtAH6GeEv8AkTNF/wCvGD/0Wta9ZHhL/kTNF/68YP8A0Wta9AHivg6KMftXeNxsX5bGEgYHB2w81zXgTUU0nwR8W72SwTUEh1CYtbOCVkBLDDY/h5yfYGvoWLTLGHUZb+KzgS8nAWSdYwJHAxgFup6D8qZb6PptolwltYW0K3TFpwkSqJSepbjnqetAHx/4v1H7d8NvD0reINOmLXCSppNharGtmCGyXbrnPGCe/tXsfxqX/hFvFfhL4jwRs6afcfZLwp1aJwSP0Lj8RXqEPg3w1b2sltFoOnLDIwd0+zrhiOhPFaF3pljf2X2O7tILi24/cyoGTjpweOKAPDfBPhvVLr4A+LdbhV21rxUtxdjH3mT5tqj6/OR/vVzS+LPBQ/ZfOg7rYa35Jh+xmP8Af/aPMzu6Z98+nFfTsFvDa28cFvEkMMahURBtVQOgAHSso+D/AA4dU/tE6HYG83bvO8hd2euc46+9AHgHjnSLgeCfhBpOtRsZWnSKeOTrtPl/Kf8AgJAr6QsbG1062FvZW0NtCp4jiQIo/AU280uw1CSCS8s4Ll7dt8TSxhjG3quehq1QAUUUUANk/wBW30NfnLff8hC4/wCujfzNfo1J/q2+hr85b7/kIXH/AF0b+ZoAgoHWiloA9Kuoru9Te6428cir3hHVX0fV4WaTbGTtdT71d1F0gtREZE3g561iS6jppdA+d6kZKjrXFqz1MTRjFe6z0v4lBW8K74zkOuc1y19x8EyD2mQ/rU/ibxbZap4eFnHnKoACR7VHqmB8F2x2mQVrTjY8vlOBsEGoa1bxNzk4Feip4P0mJ03xsXIznd0ry/T3lg1OOZM/IevpXZRa5czDduJYe9dOvQvSx6D4agg0C83WlozlzwxboMV0GlXdtYm5uZVOAQ20dc+1eVWniq/DCIEKUyBzU0Wt33lMZstEGG6sMYnKi0a0KcfaK7PYfEPihbDRLWXTw3mXi5VwOQPT61k+EIb+bWDqd9p897MDuiZmwsbepz1qr4P8VWkGnra3Vqtzaq2+J26qfTmuxXx1aSQt9mtCCvqRj9K+dhGUHeK1PZqU6kI8kY6dxy+EV1C+lv8AVJA08pztiG0D/GtexGlWVzHpMTorFS5GcnjHU+vNc5aXGpeL088agLGyV9rJEAS3tmp7zwJGsZl0m+mtL0uHaVm3iT2Oe1c3N796hyOP2ZOx1WoXemafaNLNPtVfmO1uTiuIg8UpPq8l0bf/AEgBo4BI3yRx5GST1JPHSnf8IfqX2aWe/wBSkvHU+YsKHCt/sn29qu6l4SsbqSBrKGC03qrXICksxwMKK9OUniY8tJaImEadN2m9zjdX1m61m88y5dCqHau0YVazNYawFlHaw2se0g+ZNIoJJ9q6jW/BV1pym7hxOEH3QCCPfFc7beGb3WJWfaS/VmbhRXJyqOjPTlOjyJ30Wxz+ntt12xKq2CSNxbPGBj6V6Ebue3ZTG5BHvXPX3hr+w59OkaTzJWudjY6D5M1t3JUAc17GHnekjy3H2k27F3/hJb9cHzefWu30+5tvFfhh4ZgshZfKnjPckf1ryaW5w5GRxWt4Z8SPouqB1w0UmFkX1Hr9a6qdXlY6uHdrxPOvEWiXXhHxDNYzBmjB3Rv2kTPB+vY1Qu2MkaMjZSvovxZ4U03xzoKlXAkwXgnUcqf89RXz7reg6p4W1BrS/gIBPDY+SQeoNfR0a0asfM51JSMyjAPWpQscv3HCt/dbigwSD+HOfSukHdESjYcrkH2q1b3ZDbZDkevpUIikP8DflThBtIaUhFHqaAuaOe4qpe3zrH5IkY+2eBTJr0t8kAJJ4z/hXo3w7+F1xfXMWq65EY4FO6O3cfMx9WHYe3espyjTXNIekdWbvwe8GSafaNrV7EUuLkARKwwUTr+Z/lXTeLfMl1O1BJ8teAM8ZPepfFHiu30ARafbENdOQGwf9WPf3NSarAbm2tZxggYJNeNUm5y5mcspczuUoNFaVQ6xjB9qjm0O8jnJSPKegFWmXUlRRBLEB7tUDp4g/hntwPd6ly1JsLFol7ydhHtVC607WRJsiiIU98VbB8Rgf6+0P/bSoZF8WM4MT2rD/fqXUtuPlZSk8NaqWDyBm46AYrITR9aa7dfs0gjHANdKP+ExHX7Mf+2lWY5fEUaDclru7/NWXt430NIwZydv4f1Oa9MM0UoX1rUbwOzpuaOXI/2jW7FNriyb2FsPfdVj7bq//Tv/AN9VopicTmNN8K3kNy3yy7PcmvFP2gG1DStetNM8+5SzntxK0TH5GcMRkfhivpeG91HeBIYAvfDV4D+0/LcXOp6Qz2QWGGNlS6WTcHzglSOxBz9c027mbVjwGig0VAgoHWigdaAP0M8Jf8iZov8A14wf+i1rXrI8Jf8AImaL/wBeMH/ota16AA9K898RfGPQPDnii+8PT21/calaRo4ht4d5lLAMFXHscmvQj0rxfRLcN+1z4jmePOzS49rEdCViHBoA7fwX8TNB8baLf6jZvLarpxIu47pdjQ8E5PtgH8jXOW/7QPhOe/iR4NRg06eXyY9SlgIt2bOOvpXBeHdFvtXvvjhpmnRsLi5nZYVAxvPmTnA+vT8a4+zk0XUPh7p3hvUdf8Ry3gkETaFBZg+XIGPIyOnP15oA+mP+E+0tfiKvg10nS/e2+1pIQPKdMZ4P4H8jWNpXxm8Nax4b1/WoPtC22hEC4DKNzAkgFfXJGK8/+M9nd+Cm8FeLbFJpbjTbV9MmLDLsDCQpbHfl/wATXEeIvDWoeGxpHhCwt2UeL9L0+OdlB4mWXLk/nQB9TeHdbh8R+HrHWLaKWKC9iE0aSjDBT0yK06r2FlDp2n29lbrthtoliQeiqAB+gqxQAUUUUANk/wBW30NfnLff8hC4/wCujfzNfo1J/q2+hr85b7/kIXH/AF0b+ZoAgpaSlzQB282h6lNuklleV+vpmsWRJ7aYJKpVuwPNegSSIIXQXMW5Ru+91rz+6uWm1SVj0B4rOyNeZ9Rk2r3JfYW4HGK9SvC0nwSZj1MyV49NzdHHrXsUxx8EiD/z2jrRIzu2YXhqzgk2JLbBzLwWJxiu8svCtlDIJBAhyPWvLHvZWvbe3t5Nm44yD0r07QvA3iPU4Vkj1W3YsBhd5yKpXEkWP+ESskuHlEH3znFb2k6Jp8VnIJViKXb7TG4PG0dc9q0fDPg3XtG1AG/eO5RwenOOKzNSvG0q/SCUclz5i4ztBPXFceMqctI6cNSlVqckdzAtbA6bquAd1pISuxh9xs8fga2YotG+0yrKJIuMbI5cZP0PP9Kh1K4064v57prgxW7Lu5HOf8is228TeFdPaRQJr4FgROnDe+PavIdeL1jFnvONb2aSdpI7jRjLp+nxW9rCVtXbe6uCW/Pjmuqt9QkmZX5BxgjjA/WvP9O+I2nXHlLHbtFCM7t/P0/Go08ewiMFrLdMP4h8o69/wrypKpKTvATwdeprynqUd9Cm1WZcdOtWI7m0t5i6BC5H3i4zXlk3xAtPIjMWnYlDYbPTbVc+P2aCNmtwW80l0xxsx0zXdhcVVoR5VTOd5TiJ62PSta1vCpHbgNIW5xzgd81iw31wPMLiOFJOqKhyPSuPX4gybIf9H2lHOUAypXsPrUk/j2G5vlZrZmhMXKnqr+o9q5606tWpzOFjphl1eEeXluXfE99BdaYYk3faLZ1mVmGN55BH4A1x1/r80MHy/vXA+lVpvElw9lcQTIJHc53Nzj1x6Vh6tP8AY7QvC27AyCa9nBL3OWSOStTqYaXvEkXiaS8ufJSNvNHVaty+IzpYD3MLR+hJqfwXHC2mPfNGrzSHd06VJ43nhl0hRIibu3FaOcVPlNFOUo8zPU/hR4o/tjSHIPyB8Yrsr610XxKk2m3aQzsv3opB831A/qK8i+CNwoiaEfXitvxyJLfXIp42KMxJDKcGvSoyvseLWdncr6/8DlLPLot4Yx1EM4Lj8GHI/HNcbc/DDxfZyFVsxMq/xRTLj9cV6DpvjzVbK1jEzrdYP/LUc4+orYT4mxCNTcaWxJHJSQY/Wu+GLqR0eolXstTx5fAPjCRto0ybn1lQf1ra0v4M+Ib50a9mhs0P3hkyP+nH616jZ/ES0v5QlvpsjN3y4GKbqHja7j3xxwQwP/CXJYj8K0eLqPZCeJXQi8OfDHQfDAF3MBcXCcme4I+X3A6LR4h8dxQRPZ6IBJJ0Nxj5V/3R3Pv0rkdUvtX1Q7r26kmRjlVBwo/CqFva3MTlQvLDHNYNyk+abuc1SrKRRuTNJK08jM7s+5mY5JOe9esaXO1/4QRjz8uBXDx6Lu0+R5SA4UnFdN4CuDLoLQE58rP86mbuEG7ampZaJ5kYd5Qv1NST+HXljZI7pV3DGayryy8+dlEkqAf3WxWedLi3FTeXCn/fNZ2uTztM0B4ElXJbVc/h/wDXrM1MXmguLWOfzy/INPXRI5B/yEJ8f75qveacmnoJYpmuG/2myRXn5heFK53YaV5ajINV1OLHmqxQ981aj1Oee5SPy8BjjOa543t8043xMEB7irFvqYFzsKEZr5qjUk5o9ScVyNnbXvhy9vbUxQ3vk7h1FVYfBeoRxhX1QsR3IrLhu2glWUyysOw3VeTWGZSTI/519ZzqEE2eLeTlYlTwbqH2kP8A2qQvTGK8G/aKtLa01zT4Rqi3NxHCQ8CHPlnOfmHYkGvc7WV5LxZHkkAzxzXzx8b7HW4PFN7eXlpbrYXUw8meNeWwOAT64604VYzXulSTW55QaKKKsgKB1ooHWgD9DPCX/ImaL/14wf8Aota16yPCX/ImaN/14wf+i1q3quqWei6Vc6lqE629paxmWWRuiqKALhqMQxCUyiNRIRgttGT+NfPnxI+PFlq3gK4HhqfU9LvjPG1vcPEYxMgb5trf0r0nWfinofguDQrbXpZ1l1GzE4lVNw+VATn3J6fWgDukhjjd2SNFZzliFAJ+vrUYsLNbo3ItYROesgjG78+teTeK/HdrrVl4E1e01XVNEg1TUSiQpF80+JFXZJzwD/I10fiP4weHvDPim78P3cV9LqNvCsyxQQlzLuwQq46nBz9AaAO7lgimTZLGsi5zhlBFI1vE7q7RIWT7pKgkfT0rh9A+Jmk+OfCWu3WjNcW91psMglhnTZJE2xip/MH8q474ffFi30X4P6NqXii+utQ1G/upYIY0XzJ5sPjgDsOPzoA9torjPFnxM0rwfFpsd7bXs+o6ku6DT7eLfOeOcjtjpU/gn4iaP46F7HYpc2t5YMFubS6j2SxZ6ZH4GgDrKKKKAGyf6tvoa/OW+/5CFx/10b+Zr9GpP9W30NfnLff8hC4/66N/M0AQUCilAyQPWgD0ZYJ5EZv7PYgrgHaa546bOuphZomiDsByMV79ZeLrNZ/IWwU7RnoDXC/Ee8gu9YsZoYhED1AHvXBDEKTsjulQ5VqRL8I1nWOUXQXcoOTXTXfhK8l8AyaDFcQecZFZXYttwPXjNbHh6UzaaSX3YbA9uBTdZ13+yHWMW/mu4yMtgV9DSw9BUY1artc4ZvlZ57Z/CnW4dRgmlvtPMaHLAM+f/Qa9h0RotIMPyglAAStcV/wmk5/5cEH/AAM06LxfPJKqfY0G44+8aObAreTIU3smeur4ygWT/VSFfQYryi+vl8QeLNSviDHC05wrHoBwP5Vek1mdI2byosAEn5jXn+oXc4U29m5EZJLuOrH/AArycwlh5pKi7n0OSwcJyqNG3qdxFdSeVGcxIccd6z47S2iA2RIAOnFc68V+xwlwyj8ae1lfOi7rhxjv615XJY+mWIX8h0LzRx9MfQUgnJ5ArHtIZYAfNZnyc1OzzMcLwKHE2Vd22NITt3NP8/joKyla4Bxmn75/UVPKWq5pefk9KlidJG27gp7ZrIElx6A09ZJRy2KOUr25fubd42O5cZ/WgeDNR1XT45Uu7YRTDIVi2R+QptvfyBfKePzY/TuPpV2LxhBoMC2v2d7hSS452kZ7GvQwCpe0tW0R4ub05VaalT3TJdF8Ia1o+VjvbR4z/AWbH8q5rxLZ6rLqJjvCsXlnIAbKkeoNd74d8VQa9I8aQNC6DOC2a5/x75P9rQCTqYc/rXp4vC4eNL21F3PnaNSak6dUu/Bm4ez8Uvbs5KshIr0r4hw5+yTjoAQa8X+H16th41hJbCP8nPvXuvjuJW0Lzjn91iuGi9bnJiFbY4KG6gSNhKcccU2a8t5oNiNlqx53jmYYbj2pqG3tzuBJNd3IlqeZNyasdT4VkEGp4YgA+vFSeIH8vVxI8nmI3TB6VzsV+pGUVuPSnSXTTY/dOSKozhzROhbVLaG2VC+WHaqa66BMDjIFc9KJCxPkPQjTYGLaTBOKq19zRuR0dzqtzcSD7O7bCMEVv/Dy8MWoXds/dRge+a4yFr23YPHbO3Haur+H4eTWpJbqB42IGCeKmaSiaQTZ6M5s0J847WrLvRpcZMrSnHoFrUvrW22iSTn6UyDT7GVAwXIPvXLzu3unRydWczP4i0iNGghjZmIxkqapPcxzIGjXAzXW6rZW1vpk7xRKZFQleOa8QvvEmsxXrqzBED7cbRXj42dSp7rO2hBWuj1L+zba7gUNcBWYc4xxRD4R04SiVr7c34VV0yy0+TTUvZo5A7KC538GoJ7rSPIY2scgcNtyXJpxw9OnDnZMqk5PlOni0TTlGDdA4rL8RWtrZWyvbMCe+K5i6vHgZWDsFb3otrg6g/kkse4ya462O5lyI6KeHs7mnYalE9swLfvFPFeb/H6B7jwppdyL6JAsz5tmbDPwPmHrivQItJFq7M79eQK8c+NOrWs2pWVlOnmNbwSBV242MxGDnvwKeWSk6luhOLSS0PHTRQaK+iPNN/wb4L1jx1r6aRosKyTlDI7u21I0HVmPpyPzr1zTP2VfEEl/ENS1mxhtdw80whmfb3AyMZpf2UQD4u109/sSf+jBX1PjFAENnaxWNlDawDbFAixoPRVGB+grhvjbpGoa38ItbtNNR5bjYkvloMl1RwzADvwM/hXf0YoA+UvHvjnw74h+AWj6BpNnM+oWAtxNH5BAtNo2sS2P4icD1zXY+OLOO8+LfwnhngE0PkAsrLleApGfxAr3JNMsY1cJZ26iQ5cCJRuPqeOama2haRHaJC8f3GKjK/T0oA8Z+PEWPEPw5WNMBdZXhRwPnjosLdZP2w9VkePcI9GVkYjocRDI/An869mkgimKmWJHKHKllBwfUUCCITmYRp5pGC+0biPTNAHg/geIx/Eb4wKqFUKuQAMDOJK8w8I6VqngzQPC/wATSrajYW17JbzWjJn7PGSV3LnuSWOexx619jC3hR3ZYo1aT75CgFvr60gtLf7P5Agj8n+5sG38ulAHhXxjufDmqeJPDGpz32p6Q01t5tnrtqu6FAckKw6g9P8AvqrPwK17WdS8W+IrK5u49b023RTHrIt/LeZ8j5S2AW4z1/u+9e0zWVpPbi3mtoZYR0jdAVH4U+2tLe0i8q2gjgjHO2NAo/IUATDpRRRQA2T/AFbfQ1+ct9/yELj/AK6N/M1+jUn+rb6Gvzlvv+Qhcf8AXRv5mgCClpKUUAe92FpKmoGQxttI64rH8aW5l1fTYRwXBr12eLSpNLkmgCqY1JGPavNtOsbrxH4mivbiMyW9mxUCvDpTipXZ7MouUTpvC0UkOmOsiFf3nGR1GBzWV4w/4/4Sf7prtrgqVhVYfJCrjHrV1fhifE3kX13fG1t9g2rGoZm5754FfU1nzYOnY8etF3aPG/pzXQeGbK0upGNyWVhwuBUvi7QY/Cnii50+MStb8NA8o5ZSB36HByM+1afw1FvqniuHTLqLfHIrPkHHQZrx4x1szlhpKxOdDt4pHSWV8SfdxWbP4NiCsXnEbH7oReteseMtFsLDQ5L20sR9oR0VcMQOT6dK83l1W/W2bzNPeaX+HaMkfgKp0I7nqUsZVoJqm7HATWxgupIi5JQ4zURILbS7V1beFddukkvH0W9VHHmbjCcY9awUs5JZD5cUkmCAdqlsenSs+RX2MJ5nim/iNbUfDcFnokd9ELqZmQMQMEfyrjhqMgPGmXpHuh/wr2VdXvNN8Pwpbaf9s+QfJ0Oa59vGOtbufBq/i9b+zh2OynjcQ18TPOm1R8/8g27X/tmf8KY+ozBSVsbnIGf9Wf8ACvTrDXvEWrXyWtr4KV5XzgeYAOPc8Ci41jxHaXSxXngVrcM4Tc545OOtL2cew3jcSnbmO6sPhH4YfSre6uFucvCsj5mIAyoJrxLS7qzuvEVzC+nTi1DusQwx4BwOfpX0z4q1GTRPBd7dRW5mlig2pEP4mPAFeIWWvapf+Yg0D+zyqE+ZnNZ14xjDRDpYuvKWsmYmq6hAt9FZ2MDRAHEnHSrWtabosdnBPGXmccuepFVby9NjDO93a5nm/j9ap6VqA03T53vrXd5oIXJ9a85N7nrKrPl1Zu+GZdLl1XOnpgrCd5Ax3rM8eIW1+2JRinkdQM96n8Cgf2jct5BQSguD6Cp/GmoG1v4YfL3CSLr+Ne/Fv6h8zyZyvibnF2VwbXxRZNENqGVcn8a+pfKtdU0wJM6FJFGea+an0u4mCXAgKkfMrVcbxZr1rbbBcSBUHBrz6cmjOrG7Pek8K6DCekZ+tSf8I/oCrkwxEetfOVh4u8V6zqX2a2uZcA8muqvPEviCysvsE1vIA/8Ay8Z6V1qqzn9meyLpGgQLuEUAB7nFKbDRAuRHB+GK8Zgn1ySyWOS8fnuasKupoMfb2+uKpTbB0z1wf8I/GMMtrn3IqXzNECbltYWHqBxXilzpd1LmU3jF+ua77wsq3Gg4mJdkyAaTkwUDqTqeixf8sYV9sUg13SYnDIsSnpkV5xqcW28IBJANZl7FKwXyiR61m5N6DUUj2bU9Ut/7NR0YNuIAPbmud1G7n01EKzOVn+7g8Vy+la8bWyW2vLf7UgOQpbGDXSjWtNuoI45dNG1BwN3SiO4NX0HLdXKWklxLMWUpyM5rz29eC7vpGYEgtmvSZNQ0ZLNle2Cx455PFcbLpun6lcM2nkRgnjFcOYbXR34OO9zorLXbJPD4tWB3Y9Ky4L21jl+6CCelVF0S4tGAZvMTFSQ2sFrKZn6/3a8aeIk48tzodGKdyxdzRzyodoCdqqQkJdNJG2APSqeqTqtxG4O1Xp2msIyyltwxnNcaT3Nb6WOp0DUIb3URHOcgdmrxz9pC+tpPFOn2FrDDtt4NxlX7xLHofYcY/Gu6srmNNcEav94E8V498YNRF34nhgw263iwSR6nPBr2sufv2sedi46XPPKKKK948099/ZQ/5G7Xf+vJP/Rgr2Lxd8XLTwp42i8MHR72/vZ7X7RCLYBjIxzhAPU7Tz2rx39lD/kbtd/68k/9GCvQ9UsLl/2stHvBaytbppDjzvLOwNtk43dM8/rQB0ngP4qWnjO+1XTrnTbnRdS0ob7i3uSPlXuc+3f61zs37QVkPO1G38Narc+HYJ/IfVUUeWDkDOPTms7SNDvb349/EaIQSwx3+lmCKdkKoWZEHDdDXmek6baaR4Um8L6/pni6TWVnaI6daMRbTgsCCOMf5FAH0Ne/E/TrTxj4b0RbeSeDxFCJrW9Rh5ZyCQMdfT86oaP8ZtH1fVPFNoLWaFfDkUs0kjMMTJGxViv4j9a5D4leFrvQfhb4M1XSbC5F94XuIJFtifNkVGxuQlRzhgo4964DxF4a1/QfBnhq6sNOuJb/AMR6ZcWV+VjJKmWcSjcAOOGI5oA+lPA/ikeNfCFnr6WUtlHd7ikcjAnaGK549cGsHxv8VbXwp4gtvD9jpV3rmtXEfmi0teqJzyx7dDXW+HNHi8P+GdO0iAAR2VukAx32qAT+JrxrxRc3Hw9/aLm8Zajpt5eaNqeni3Wa2iMhhcKgIwO/yfk1AG/e/Eu28a/B7xjd6fFdaXqWl2ksc8EvyyQPtOCCPofyrlfB/wAbz4a+HOgSaloerXtgiiC51U/c8wscgZ5bHr7VuvrereMfhJ461GTwuukQXNtMlkBERPdrtb5nXGc9PxJrnvEGl3h/Y606ySynNyqwkwiI7wfPJPy4zQB2HxE1jTf+E7+Hjtc6iPtt2Gt/ssgWKQFkI8wHqOR+tS658a7fSfGmq+F7Xw/qGpanYhSkdsN3nZVWP+6AG61y/jPT72XxD8G2S0ndbcw+cVjJEfEP3vToevpWYniyPwd+0z401K5028vbU20ccr2kfmPDlYsNj0JAH4igD1Dwd8WdF8WeHNV1Ro5tOk0cMb62nHzwgAnPuPlP4iuds/jys6Wmoz+EtVg0C8n8iLURh1znGSo5HSuf+HWlanqg+I3i+Tw7K1pru4Wumz/u2uV+csPbOcZ9Sa87j83TYbF/AjeJ9O15rgK+jzRNJAhyc/MRgjp1Hc0AfX7ENCxByCOD+FfnNff8hC4/66N/M1+ikHnfYE+0BRN5Y3hem7HOPxr8677/AJCFx/10b+ZoAgoooFAH0a9zPYWf2aZiGYbWBrc0m/j0ywjW3jXDjJOOtc/40ITVo4g+7cQtaUNtcJZRCNA20c5OK+bxMVf3T3qL01N37c2oASOoBX5eBXqXhi4juPD1rsOfLXy29iK8j08MLY7uu7tXXeBNVeHxHPpTEsk8HnL/ALJUgH9DX1lO6wFJPzPIr/xJHR+NPCVt4t0RrVyI7mM74Jscq3p9D3rzvwDo8WkfEOC2lR1vIo5A4PT7pzXoOueK08P+KNNs74BLC/jZRMV+5KGGMn0IP8q0JdCtZPEdvraKFuERo3P99SOPxrmt1OblTdyLxXDHcaMIpQSjTxggd/mqHUte8P8AhIJHdbbTK7lEcJPH4CrXiePzNCmbcVMbJIMezCotZ0jQtTMMmsxwv5akKJX2jHfvzTLMi8+JvhiO1Pn3MwSRcACJskHisf4S6nptwNX06yQiKK4M0HmD5zG3TJ9QRUfjnV/COi+ELiLT7bTpb5o/Ltk8jeRk4LZI7DJ57gV5p8P/ABAdD8Z2FwxKwSt5EuP7rcfocGs27MwlK0kemeKby38L6pN5sY8mU+YuemD1/Wud/wCFj6MOTGp+mK7z4ieDj4usbSKNtkiSbS3H3D1z9K59/hv4JuNC1PwZp32f+24bdZZJ35uI2b7jk9gSOg4wfem1c74VIxWpteCdat9bsbnUbGBT5brApGM5OM8ewOa0PFniCy07UtH0q4YGW/uAFUjsCBn8yKzvhP4VvPC3w8srDV4o1vhLJPKMD5GLHHPfA7+leJ6t4pm8dftOaamnuJbSyvoraHYc7o4iWdx7ZDn6etPoRe8rnvPxA8SWvh7S4FuiMXMhUA9DgZNecXXiqx1O1IszGknQY71xX7SXiaSX4iW+lwyIyafaruAzkO53EH8Nv51zPw6dNRuZvtE7R+WhZdvqK58Qm4s6cO46I6m6ttV1W9MIVG8s4zjiqWox6hqEw09oVDR8ZA61qC6utGtLjUhc79x+7mm/ZtSuLN9bil2kjO3cOleYtD1klaxa8KXNymqmwuI1TyYDggY71X8bQS3OqWyrtCpHuJP1p3gxru91i5v7h8gRmPHqc0/xptW8hfzdreX9315r6GnpgPmeTOyrmzBrOnXXh9NOhVDcIBuOOelcxeWIJVduaq+F9Ws7nVntI4FWUISz9zV3VdSZHaG2Tc/dvSvMuW0dJ4Sax0a6WeWOI7hgrgZro/EcsXimx+y2tqIMEEMVAryzTvPjufPmlaRh0UnOK7Sw1i5njyg27eOtVcxaIbzTLnToVRjuY8DFXbPSWltw8h5NPeeW7lQSHJzW3bRbIwPatoMRgjTAlztkVzD3IrQt9Sg0mP7PBxGefm61pcLnccLWfqemWN/aPtcJKBkEDrTkriZxXiDxpp+n6ltnR8tyCOlT2Ximxu7QyJbuY2/irz7xZpN/PflDA8nlkgNjqKh0uHXLWy+zQ28nl88YNVy6ENndS+O9FspiGhl3Dv2q1b/EfSmAIglIPfFeeTaNqVwf3unsfwq1pOj3MYkiazfefugqeTQ1ZCPVH8Q2N1A0YBG5M8+9R+F7/E8ieUTGrcEDtWHovhfVtQt3DW5hlxtUe1FkNV0PUjZOpDnsTXLWhzx1PRwktbM9Gn1uxtHAlU7j0FY0l3ZXc7nOM5IGa5e9nuHvl+1cNxxnNSxqq3avkgDrXkSwt3oewqC5bs057a3uXWOZ9qjoc0SWbxrtsW8wtxnrWBq96ZLxo4pCAvAxXQeC5WiQmcsee/PFTHCu5hVioRui3pPhWeC7F3PkyY/CvG/jXZXdv4phklKeQ0eIwowR65r6UW/hK5JKgeor5p+NiX0njVryeRZLOYbbYrwAB1GPXnrXrYbDunLmPFr1VKPKea0UUV6Jwnvv7KH/ACN2u/8AXkn/AKMFfU2K+Wf2UP8Akbtd/wCvJP8A0YK+k/EeqTaL4dvdRt7Ge/mt49628Ay7npx/P8KANKk2KWDFRuHGcc18/fADxDczab4h8UeIrvU5FVGkmvbiTNsFU7iEHZhk59sV0C/tCWogTVJfCurxeHZJfLXUyo2dcZ2+lAHseKMVwfjb4s6N4JXQprqKW6tNZDNHPCQQqgKQcd87hit3wX4nfxf4bTVn0y50zzJHRYLlcPhTgMR79aAN+msiuMMAwPYjNclN8QbSL4qQ+B/scxupbQ3YnyNgGCcY654o0X4g2mtePde8LR2c0c+ioHkmZhtkzjoPxoA67AFLivGE/aKtLrQ5dU0/wrqt5b2jMLt0xst1HQlunPXHYV1+qfFbw/pfw1tfGkjStY3ir9niA/eSOcjZj1BU5+hoA7b8a47R/h9FpXxP1zxh9uaVtXhWFrcpwmNnOe/3P1ryLxj8UL3xH4q8EWyafq3h64/tJGkgnygniZkAOR94dRj3r0fxP8YLbRvFFzoGk6Ff+IL6xTzbwWY4gXrye556UAekYHHbFIIkDlgoDHvjmuAb4waJJ8K7jxxZwz3FrbMsUttwsiSFlUqfpuB+lWvAfxLt/H19dpY6Ve29nBDHIl3MuEmZvvKvrg8ZoA7V/wDVt9DX5y33/IQuP+ujfzNfo1J/q2+hr85b7/kIXH/XRv5mgCCiijFAHsuqTTXfiOBZnJ2uDXobziOyT5vlIrzfV7qKGWOUn96ZQoIrslcXemxKzEfL2r5+orWZ7sddjZ0uQSQMR03YrS8MyPH8T9KCsQJEkRgO42E4/MCsfQwgtpEUk7Xwc/SnPrP/AAj3i3T9T8g3HkBsxhsZypXr+NfVSaWBpM8evpOR1Pxr+ay0Ve/nyHP4Cul8D+IBqFjHp8she5giDAnuvSvLvGvjC48YQaaq2L232YFpBnILnHT2471Xifa8Vwl1Pbuq7WMbFTj04rg9ormEdWe4eJZFj8PXe4gEqAAe5yKp6tob6/Z2EiyrGyKC+4Z4IHT3rzb+3raWNFkuJ5Cgx87E/wA610+IZtbVIluyFRdoJQE1akmbcjRs6p8LNM1hY/td5cBk4zEFUH8wa8S1TTJNI1i4sZ4zHJBIV2kgnGeP0xXZ+JvHmsXrR/2fqlxEhXDeXhAfyrhJmklnaWV2kkc7mZjkk+pNRM46q12PoO28VwWPw2OvXZH+iW26RR3ZRgL+Jx+dfKHhv4ha3onxTbxjOJZ5LmZjeRA/6yNjyg+gxj6CvWtc0rVdb8ErYae7bZApZM8EjoTXnFt8E/Gc6bsRL9WxVpnTFaHv3jv4p6PYfC2XWdJvo7ifUIWjskVvn3kYJI6jbnnNfOHwZg12z+Ilpq2kaLcau1iGaeGLAOxgVPzNwDzxWo/wO8ajosR/4FXs3wJ8Nan4K0vVNO1u2hie4nWeOdckuNuCrH2PI/3jTGfOfxLsPE6eNL7UfE2mT2F1qMjTqj8rtJwApyQQBgVp/DqW3CNauh85zyfY17h8dfC+s+OP7KsdFgjaKzLyyTMcZZgAFHtgZrzvw38ONY8GXT3+rxxGNl2DBzg1lWXus2ov30Lq9lbLqMFlHcAQnlwTxSXtz9maHTLeceVIQpOfWrggsGnnnuiwLHjjgVU0ex0ydJ5ZpyWGQmSOK8k95pNG/oGlJpGqmKG4EqSw72A9c1z/AMRreR9WspIMmQRkED0zUngieR/Fl7G7OVWIiPd6ZFaXiq+t7PV4mlG52hwoI96+hh/uHzPHqK9c4DRWbTdXd3YRPKpQkj1rrrdbOOE5uUdj3zXm3iTUHmvHcHZg/wAJrCGo3S9LmUf8CrgiroiU7Ox7KojL/IwP0rpNGUC2Y+pryLwZe3E0t15szOBHkZPQ16v4ckaTTCzHJFKxVzUtwWvAPQ10UXCiuOg1yytb8rO5GD17Vvp4k0rb/r8j6irjoDTZozKGUg1VCbTwM5ql/wAJVpktwsMbOWarSXcTSDDZrW5LiybEfVokJ9wKkSVIxhYY8f7oqMkNkigqQMnpTuQkTi9wf9RH/wB8iiPUtsufIiyP9gVV3qe+KaWUnKkH6U9wWpsprtwgAUIv0UCsjXbJNZZLmRhHNH0amhzTbyYpZt61FRWRtT92RxWs2zw6wu+XfkgCtaCyVoQ27BNVY4jJJLLIRJMfujqBUlgJICTcE5JzjPSvMVSztY9l1W42TMy50l/7SYeaNrHiuusbaS0tl8u5j3Y9K5ifV1/tqRY41IQ4wa3bTVkETPIihVXOAKnmOKrVlJWRrrrKGLyL1S/+0vFeS/F/RLCPRhqMc+1xKAkZySxPXnsMV6HNqTahbB4rdQvY4xmuB+L946+F7a3iNnPHK+ZWjky0bDtitqFWo5pW0PIle92eJ0UUV6ZB77+yh/yN2u/9eSf+jBX1BeAmynAGT5bfyr5a/ZUuYYvG2sQPIqyzWIKKTy22QZx+dfVXWgD59+GfhfU9Y/Ze13Qo4Jbe+upZ/KjlUoWICEDn1xj8axrvxs998DIvh1D4b1X/AISIxR2Jg+zEICsgO/P4fma+m8VXSe1kvpYUkia5hVTIoI3KGzjP1waAPBvGPha90yf4PaTcW73bafKkVyVQuqkGLOT6cHr6V9AihsAZJxigEFQQQQe4oA8K8e3M/gz9onSvF17p17c6RLpxtmktYjIVbDDGB9R+dHwplvtT+NPjnWLnS7zT4r62WSJLiMq20kbc9skYOK9zOxyV+ViOo64p2KAPn34ZaZdQfs0eM7eSymjuJhfYjaMh3/cgDA6msTU/DOsXf7NHgq7t9OmuH0W8kubmzKEO0fnSc7evp+Br6exSYoA+b/HXi7/hYfjDwLeaRoOpx2dlqKebcT2xXDFkJQewAyT0qlrukr4Q+L3im78RN4jtLPVpDc2d1pGcS5JOxsemce2Pevp1UVRhQAPQU140f7yhsc8jNAHzfceGVtP2avEsum6Pqtn/AGlcxTJb3jeZK4EifOFA4B5/Kvc/Alv9l+Hnh2DyvJKadbhk27cHy1zkeuc1uLJG7siurMvUA5I+tSYoAbJ/q2+hr85b7/kIXH/XRv5mv0ak/wBW30NfnLff8hC4/wCujfzNAEFLSUtAHoOuXShbYAgsZQ3WvTtFgE2kwPI20lema8Kkkkfy8sSARjNd9od/qkNtHEr5RgMbua82vCPKexhrykep6dbpbxybJN4d9x9uKw/FEhS6jPtWnoJdrNi5y27n8qy/FxAuIM91r2qv+40jz8TF+0kkZK6tdKNqtULalcTOVc5qeLTy+C0gUGlm0xYcMJFOeK8rlSM1Qq9BsNw6jJPNMllL5B71ZSyIXl0/GoprYIwAcHPpWisi1RrdRI5NsQXPQVA33jir0dgzDmRBVa8hFuR8wOarQzrUppansPggE6bCf9kCu4QED1HpXl/gHVV1K3uLeBZkayKpIWTCsSOx712Est2IyIyS3bNaxVydUjos88YoL+wrk9Pjv47ppLiQkHsK1jO54yauwXNRpcDtWbrGn2utWTW12AUPI9jULSue5/OoGJCnLEAVEo3RUZWdzzHxlocWjW7wLF5yN0kPFeVQbbTUflY7CcEV7f4utLzUYCAQ8a9B3FcHHomivIyTzCKZexOK8+VOx7dFuS1NDw1d2dxqhWG3EciQnLevNZPj6zN1q9sQ+zEXXHvUvhMoviy5iiOYo4SAR35o8d6jb2V3biRGZymRj0zXt0o/7D8zzqt4120ebaxpXlTLuk37jjpQfCsDJlZd3FWr6/iupsiJwvvUyapbQQDEMpYD0rz9jPd6lrwzpKWDz4YnchByK623upoUS1gbbuFcjpmryyysTCyKRjkV0sFu19PCEfy/kySTWbZ20oqTJZNME1wUni3ydetIugbVbdEFB6HdUzaZchyy3at/wKrK6NNIo3365PbfSTOqVNIgXTvsgidFAIHJBrQ0czi/Uux2+5pkWjyR3sKNdCQN2DZq5d+HZg2+GUhsdAa2irnLW90uajqctpcblf8Ad+lWrHX4LiMhyBiuQnW/gcho3kA68ZqpHLI93tWNkz1FU1Y5dDvJr+xljKGbGe9NsZbONikc28t61y62V2RnypMH2q7plrcLfRkxuB3JFMjY6zAFV9TYLYknsasY+UZrM16R1sAqoW3HqKGropaalOwjid3mUc96zbjUXneWJVCyKxx7ir0Vylhb7NhZmHNcfLdN/wAJFI6kgbTxXBKn7x6FKV4Nsmspli1iR5sYJGc12DWNsLcSxTCSNxjaK86ui8kjMMkn0ro/BIurq5kjYkwqv8VHs7Mhao7NYUj0eMRrgDFeT/GjT9Ps1tp4Y9lzO3zY6HA5P1r2S5jEdhtAwBXlfxWt1k0W5uZoSwBXynIztPTj0rohGzOSpC8WzxKiiiuo4izYajeaVexXlhdS2tzEcpLE5VlP1Fer/DL4zeMoviBo9nqWtXGpWN9dR2ssNwQ3DsFBB6ggkGvH66DwD/yUnw1/2FLX/wBGrQB9yeOLjVbXwJrU+iqzanHZyNbhBlt+OCB3PpXzf8P7O013VYLnRvGV1pnimP7LJINQmbFxJ8/nR7T94fdx9a+l/Fn9tf8ACJ6ifDrRrq6wlrXzACpcc4wfXkfjXzXrun678Q9RS2XwVe2PiYmy829MQiSBkDiRyR2YlSP92gD1T45/8JnH4O1O50fUbOz0eG03XQ2n7Q53YIVuwwRVWDxNe+G/2UrbW7eZvtsWmRrHKxyQ7uEDc9xuz+Fdd8UNNvb/AOEWuafaxS3t3JZ7FSNcvI2V6D1ODXOQeDNQ139mSDwvJA1tqT6airFKNpEqMHVT6ZKgfjQB5vqelX/w28H+CfH1lrepT6hfzQnUI57gvHMsqbyuD7Ar+Oa+ns5HFfNd5a+K/iF4a8G+BZ/Cuo6b/ZU0X2+9uE2xBI12ZU98qSfrivpTFAHkfiH4weILLUdZOj+DprrStEZhc3dzJ5O8LncUB+8ODV3X/jPb6Z8JNK8c2emtcQ6hMsP2eR9pjPzhuR1wUIry690DxFq2p+LbfxJ4Y13WtbnllGnSCQiziTB2t1xgcEDvwOtWtX8K+ILn9lrw/osWi3zana6kWltvJPmKu+U5x6YYc+9AHdwfGXVrXxpo+ma94Tm0rTddkCWNy8uXIJAUsvbqMjtmrvi74r32neOD4R8L+HpNf1SGLzrpRJsWJSAcZ9cEfmKofF/QdU1TxX8P5tP0+e6istQDztEhIiXdHy3oOD+VZWqW+vfDv47ax4ph8O3uvaXrtssebJdzxOAnB/FPyPtQAz4IaxNrnxZ+IF7LDcWvmyRMbac/NCd7gqR6g5Fe7V4t8HNL8QQ/E3xvrGuaLPpf9pvHNGrr8vLMcBuhIBGfevaaAGyf6tvoa/OW+/5CFx/10b+Zr9GpP9W30NfnLff8hC4/66N/M0AQYpaBRQB2Vloss8aeYCoU5rs7W3lWOIL/AADg1mf25Dn/AFGPapk8Soox5J/OvMqXnofQ04xhsz0zQwq6cCGLHdyT64qt4o0O91BraS2QMoXB5qLwXfDU9GklVCu2Yrg/QVkax49ex1O4s/LY+Q5Tr6V7tZWwNNHlzjz1pWGjw3rn93j61Ovh/VsAPGPxNZkfxDmlkWNIHd3IVVHJJPQV6hoHgzxRqcMdxfiLTYnXdtkJaQfVe1eYlcpxcN2cUvhvUWXnAH1preHNQUcKG/GvTLvwxFptwqXOrK4YZAGFNRy2mi2kBluLtFjAzl5gBRyMXtH0Z5dJoGssf3aqP+BYqFvDGtyEbkVvq1dP4g+JXhDR8w2MH9q3Cj/lkcID7sf6Vy0fxkjWXMnhu32eizMDVqJLjKfc9Q8PXH9i6JGtxgMB81aI8Xaf/ExB+leXP8a9LMG1PDjF/R5Rtrk9T+KGtX0hNtDZ2EfZYoQT+JNM0hRutj30eK9P3E72P4Uf8JZp3J3P+VeA6b8TNXtJgb23tNRh7pJHtP4EV2tl8UvBs0AN7o01tL3VV3j8CDRqDpJdD0OTxdp6jKs5P0rM1HxxbG1YRbt/qRXJN8TPApcr/ZV1tPGQmP61saPc+BfFAVLG7Kz/APPF3KP+R60mpMcIwi7yTMS88QX11AxW4cA9s1xWoWc9xdecWJbPWvXZPh1auP3F/Mqkc5UNXOax4A1mzRpLJor9AM7VO1/yPBrllCd9T2aeKw1kkYXgeze31yV2zhoiP1pfHqRnUbdnAJEf9ad4GvTda5PFtKskRyD2weai+IFzHFqturjOYs/rXsK6wPzPNqOEsVfpY5kLCwH7oVMY7YJxCM1UN/EOiUn9or/dNeXcUoq+hcUKqnauK6LSblbdFleJZECkc9q5L+00XgpmpU1orH5YVsfWjcumrM6y08U2COYXtlY57ip5/FenIwH2RAR7Vwy3kIk37DmnNfQO2WjJ/Glexq3c7vTfFuk3mrQo6eTt6lVrtRrHh/Gfthz9K8QgvrSGYP5B/A1eGv2o4+zyfnWkZ2MKkbnrjan4fbcTcE/UViazqmiCynuLfas0IymF+9Xn51+0I/495PzqF9YtGQr5EnPqatzMfYmroXxJu73Vxaz2oSEHBbNehrr2mA/64jPtXj9tfWltP5i2/NXzr9sTkwOT9aOdB7Gx6efEWmvKI1lJJ9RVubULSOEebhlY15KuvwBs+Qw/GrB8VqRtMRIHqannZaoo9C1GLTipkNwQWHQDOK5C4h0xZ2dXZm9cVlv4qV+sR6etVjr0ROfIP51DmaRpra5evJGwDZwg4654zV3SPEeoaWpWPT05HOD1rD/t9BysOD9akTxR5Yx5AP41k5u5pyQSsb2qeIdc1aDyIYzbD1Brz7x3qWsR20Om3kxeCQeYSeSSO2a6s+MCY9v2fH0Nef8Ajm9kvtXhkePYPJBX3FbUruWpy4hRjDQ5c0UGiuo8wK6DwD/yUnw1/wBhS1/9GrXP10HgH/kpPhr/ALClr/6NWgD9A8ZqFLSCO6luUiVZpgqyOBywXO0H6ZP51znxF8b23w/8GXOu3ERnZCIoYQceZI3QZ7Dgk+wrzqf4pePvCP8AZOreNNBsYtC1OVYy1q58223DI3A98ZOPagD26kx7157e/EG+g+OemeC4oIHsLywa7M3O/IWQjHbHyD86ZpnxE1C9+Knirwy9tAtro1n9ohkGdznCnB9vmoA9FxS1438MPih40+IV3YTjw/bw6Qkskd9eBsDO3KqgJ5xxn616V4w1mbw94M1bWLeNZJrG1knRG6EqM4NAGzj3NGPc14DcfGfx/D4FsfG3/COaeuhErHNukPmSNuKllHZc8D3rrvHfxYn0ZfDun6BaQXGreIY1mg+1SbIoYyAdzn8T+RoA9RxSY+teO+Hvi1r95d+IPDmp2NgviTTrF7y1a2l8y3uQqg4yO/I/yKytV+PmpW3wx8Oa/Z6fbTalqUtwtzDztjSH75HfoUP40Ae74pa86sviLfav8YbXwvp1tC+mDS11C5nOS6b1yoHb+JPzNei0ANk/1bfQ1+ct9/yELj/ro38zX6NSf6tvoa/OW+/5CFx/10b+ZoAgpaSloA1RrU2egp41mY+lZOD3pRWfIjo9tPqe/wDwjm8/wncMeouiP/HRXmHjfVpYPG2rRIowtww5r0b4Lc+Drtu5uz/6CteUePP+R91j/r5avVrRvhYJmcajTckGi+L7rRddstTjggme0mWYRyrlWx2NfXHhP4zeEPGOkK0l3/Z8zjZNbXXy7T3AboR75r4mrs/BUqta3MWPmDBj9K8uVoK6OmhD6zUUJM+mr74SeAfEEjTWt7cQu/zbre/LfoxNY9z+zdokw/ca7qK/74WQf0ryVWKfcYqfVTir0Ou6rbA+Tqd3H/uzN/jWXtV2PTeV1F8MjuZ/2ZuP9G8T4/66Wv8Ag1UZP2aNWz+68RWTD/agcf1rBj8beJ4vua7fD6yk1Zj+Ivi2Pprtyf8Aewf5ij2kRPA4hbSRfP7NfiHPGuaYR/uSUn/DNniL/oN6Z/3xJ/hUA+KHjBf+Y1IfrGn+FL/wtLxj/wBBl/8Av0n+FP2kBfU8T3Q26/Z3160QPLrOnbScZVJDiok+A1/x5mv2oH+zAx/rRcfEfxZcjEusSEDtsUf0qnJ4z8RyDnWLkf7pA/pS9pAf1PE90a8XwGQL++19mP8AsW4x+prRt/gXpERDSapqDEd0Cp+vNcXN4i8RyDjXr36eYaxrrWNXkYrcajduf9qZv8aaqRJlhKy3Z7fpfhLw94YxKuqXgdOrXGotj8Vzj9Kr+JPit4X8PWbSi7OoTjhYbYbtx926Ae9eEvI8hJdi5PcnNYHiNiFgUHg5NWpKTsctXC+zi5tnoPwz16bXfH2o3c6pG9xE8rKi4AJboKg+Ll89rr9oiAEGDPP1rN+C3Pi66PpbH+Yqf40f8jLZAA82/wDWvU5V9Ut5nn+0fPc4saxNnkCnf2xJn7q1lnK/eBH1FIDnpzXlcqNPay7mr/bD/wB1acusSf3QKyTkdQR9aVUeT7qlsegocUP20u5rDVpCfuinDVJM/dFZqZUYZSD708dc1HKivbS7mgNVkH8Ipf7Uk67RVClwaOVDVWRc/tab0FH9rTei1RIpKOVD9rIvf2vN6CmnV5vQVRpDRyh7aRe/tef0FNOtTj+FapHgVGapRD20jR/tq47BRR/bVx6LWdjNGDT5UL2zL/8AbNxntR/bE/tVDFGKXKg9tIvnWZ/ao9RvWvdNR5UVnWTar9wMdKpHpWtJb6UvgeOfz3OpSXDAxlCAAMYwehGD+dVGNmZzqOSsznaKKK1MAroPAP8AyUnw1/2FLX/0atc/Wz4OvINO8c6Fe3LiOC21C3lkY/wqsikn8hSA+z/jD4HufH/w8uNKsZFS9ilS5tw5wrOuRtJ7ZDH8cV514g074i/FLTtH8Lar4XGh2lvPHLf3ryhlfYMfKB65Jx6177HIk0ayRsrowyrKcgj1Bp1AHjXj7wv4m0f4taD428M6N/bUNnZmyltRIEYDDLnJ9n/SoPA/hXxivxP8W+Idf0lbMavp5WIRyB0DHbiMHqSAME+te2d6CKAPNvgT4Z1fwn8Nl03WrNrO7+1yyeWxBO07cHj6V1Pj7TrrV/h7run2MRmurqyliijBxuYrgCte0v7O/WRrO6huBG2xzE4ba3ocdDVqgDxHU/A3iKf9lu08LR6a7azGkYa23LkYmLHnOOnPWq/j34aazeW/gzXbXRotZm0axjtL3SpX2mRQo6H1BJ/SvdcVFc3MFlbvcXMyQQxjLSSMFVR7k0AeT/C/wpex+K7rWrvwPpvhiySExW0YJe5YtjOTnG3Ga5bwr8Htdg8Z+IrDU7Yp4fjtr+HTHYghjcYXIGcg7R+lfQcE0VzCk0MiyxSDcrochh6g080AeO/AjwP4g8O/2vqvim1a31K5WC0iDuGPkxIAOhPXgf8AAa9jpBS5oAbJ/q2+hr85b7/kIXH/AF0b+Zr9EtSvrbTdNuLy7mSC3gjaSSRzgKAMkmvzquZBLdSyDo7lh+JzQBHTlUswAGSeBTaUdaAOx1TwwsDYSaNs9gealsPhjr+owrNBaSCNuhKmthrJ77WrWNCMeauQT2zX1LodjHaeH7RNi5CVCZvNWdjx7wB4YvPCOgSWN9jzZZjNx2BAH9K8Y+IFhMnjfU5ApKyTswOK+pPFX/IVQYx8grxnxNpst5rF9IkAkRZOSa9qUObDwRyuXLc8ZKsp5GK6fwS+Lq5TPVAcfjWxbeEhqVyZFhxH/sitCDwqdFuGu0UhGGwg8V5tejaLO3AVEq8SyaSlPakryT7MKKKKACiilFIBKKXBoxQAo6VR1FRtRu+cVeKsoUkEBuhI61R1I/Kg9zVozqfCUKx9bsbq8aI28EkoXOSq5xWvXo/gQW0Hh9nkt1maSViSw6Y44rWMlHVni41/urHG/B3T7u08U3TXFvJEptiAWXGTuFeh33hSy8Q+Nop78ExwW4wOxO6tW2uLVrvy4YFjfbk4HatLTZI01hvMi3gRgk4969KpWTwDku58+9JHJeKvBGk3Oh3Jt7Qo8SllIUdq4/4b+BIbzdd36qNpxtbvXut9dabdWLW8fBbgjFc74b+zWWoXFs9upjQ8EivnHjJJWQrnK/EHwDpA8OmaxtyJ0BOFHXimeA/DWl6f4VWe9twbmQAgOuSfoK9O1I6ZfWciRj59vC471n+D20+C5Y38arcqxRFP3Rz8vXp8vPpndWlKrKfu3Kjqzk5fhAni65SZLOaztxndIAE3ZHBGeo9e49Knsv2atMiG+/1u6YgnKIi9PXNe6I3yjHalIDKc816K0RotDxgfs/eFllGy4vWXHVjuP9KuJ8APDTLnzJMD+9F/9lXqyxgNggVMABQlcbZ49N+zz4ZkJ23Fwv8AurtH8zXOX37PFrK8g0/UJFdTgIc9fckV9CFR2qvLEGb0oafQEz5V1v4CeLNKhea3SO9iBx8vDdMk4ycD64+lec6npd9o90bbUbSa0mHVJUKn/wCvX3cshQbXAx65ryr4z6HpesaNJb7Ue+A/dEHlX/h/M/pnNFw3PlncDxSMBmuxT4a344LcexqX/hWF5jJmI/GmpR7hys4c8DNXLLSb/UYjJbwM6jjIGa6d/hxcxjmZq63wToj6W32aSRipOfrWc6sYIOU81HhfWD/y6v8A98mlPhfWM4+yv/3ya+jBouRkFsewrB1nTprO7hAmdfOJ2jHXFZfWFa5cKfM9Dw1vDOrr1tnH/AabqWmahZaFGtyzGGOQsiFT8meDz74Br6FttGWa3QyO+4jpivNfi3Je6XBBYIV+y3Cln4GQQePpTpYj2kuVGcrLRHktFFFdpmFFFA60Aatr4p1+yt1gtdb1GCFOFjjuXVR9ADU6+NfFCsGXxFqoI7/a5P8AGvRfhZ8Brn4heHjrl3qg06yeRo4VSPe8m04LdcAZyPwNd4v7Junbhu8T3RXPOLdc/wA6AO++BXirU/FvwvtrzVpjcXcE8ls0zfekC4IJ98Nj8Kxrn4qeLNc8c6vpXgrw7b6nY6FJ5d3JNLsaVgSCqdgcqwH0r0Pwd4R07wR4XttD0tX+z2+SXc5eRicsx9ya8o0vR/HHwz8feJV0Tw2Ne07xBc/aoJxMEELksfn9hvOfoMUAZHwY8YWvhP4WeNPEt7E+yDU2kEGcMzsqhU+uSBWra/G7xNpUujan4n0nTI9D1iRUVrS5DTWwboXXPpzVHwt8JfEl78IfGHh3V7YWWpX+ofarZnYbJGUKQeOikgiqOj+BdYv30rR5fhXp1lLAVS+1K7lLxuo4LKoPU4J+tAHpHjjxt4u0/wAUpo3hvRrQQrCJpNR1KXyrck87VOeTXIaj8RZviJ+zz4ynvLOO1vdP/wBGmET7o3+ZSGU+nWneNPCWvz/GafVL3wrL4r0WW1SOxg8/ZFbuAPvAn1DZ+tZvh34eeK9P+E/xC0S40QxX2pTrJaRRMuyUbhwhz0GO+OMUAeu/Cz/klHhn/sHxf+g1va7fvpfh7UdQjQO9pbSzqp6EqhbH6Vl/D7TrvSPh3oWn30JgurazjiljJyVYDkcVvzwR3NvJBKgeKRSjqejAjBFAHwJqPxC8XanfS3dz4j1IyyncQlwyKPYAHAFVv+Ez8T/9DFqv/gXJ/jX0VqH7KWiz30ktjr93a27MSsTRK+weme9YHiX9lqXTdAur3SdeN3c28bSCCaEL5gAzgEHg0AeF3viPW9StzBfavf3UJ5KTXDup/Ams2lNJQAUoODmkoFAHpehSLfeNrfcSFGGxn3r6f0/U4orKGOSQEBQMV8w+F5oLHXhcuMkLgA138vjxywCrgAYogroqtJ8+h6L4pkSbUY3jOVMY6fWvNfFEtzpccslu6j7Q+DkZ610GiaudZsWnbPyOU/Qf41j6tNDqesRWEg2xo/zHHPBr25aUIM5J7HZ/Dzw0n/CKJJKi+bIOQRWX4/0NbTw7NcCMoUkX+ddtpN7YR2iwW9wqlBjBNUPG3+n+DdQhVo5G8osOfTmvLxUtHY68E0qsX5ng+MijFKOlAyWCgEknAA714/U+78wxSceor1Xw18ONK0rTItZ8aTiJJceVZkkZz0BA5Y/7IrrdH1r4f+IbltDtLC3STBQRS2wj3Y7A9c1uqXc8ypmMYu0U2l1PHfCfg3UfF93JFYvCiQ4813bG0H26mu1sfhToepi5s7LxOLjVLbiREUbVPTp168V1HhPwtH4Q+Jl9a2xb7Hd2XmwgnO3DjK/hmuO8C+YnxwvI0zjzbkPjuNx61Tgo9Dnnip1HKVOVklc5a18CeIL3VbqxtrFpHtJPKlfICKfqfbmm+LfCF94Qu7aG8limW5j3pJEeDjqP1FesXtyXg+IZtpSGRQAyHGD5XNeJXepX+qpax3U0k4tohDCmPuIOwA/nUSjFI6cNXq1pXdkl/kFnqU9kQu1J4P4oJhuQ+v0+opfEulWk+mxaxo5f7KPluLdzl7Z/r3U9jWt4b8Eat4oiluLQQxWsLbZJpn2hT3461pXPhtfCfjuy0hr2PUbHWrQozKuAQc47nuODRGL6orEVoJ2i9ex5bXrngPT/AD/CNu7OoBduMe9eV39o1hqFxasctBIyZ9cHFel+F7lrLw9axtlRt3YHvXNiZOETzsZ70EdBNpZstYSZSGRoiOPXNQ/2u+n60yhN4eEZH40W9+tzcGMMSQueayr+e3j8URpcOVRoB0+tenBc+W28zxWvfszbbXIQd62rbqydO8SzDWrkyRgRlvu45rJuvEmm6frM9tNbXz2sEaSS3kab44t5IXfjkDg81m2OpW0+vXDRzpJFIcq6tkEV4f1UTgd+/iS2jLSRwsHAzWNpPiRdS8RRQ6jatPC8hUKmFPI4PuQRwPese5voYblo924sO3Ssi3nD3b7SuVbPPOMHNJUpUpJiWjPpDTZ4JUIsb7fsABikHzIfcHkfiKstPfxOd6RuMcBWxz+Ncxa3F3Y20NxJ+7Vo1IaVTLDjGeHHzoPZsitOLWw4zJaykAZLW7CdcHp935s/hXrrY1ZdjvL7zcvp8/1UcVOb27/6B9wR+H+NV4fEWmB/JkvEjlA+44Ib8scVNJrdkvP2mPHqTVWESS3t1lRFZycjJ38Y+tNNzeElWgRD/Cd4IP8AhWcfEel3ExRL6Fn7KCcn9Khl1yKMFlgunCEA5iMYH4vtGPxobsFi9cOyxM93dxxqv3tvb8e1eZX5stQ1+9uIA7xI3lqz5yTjLH6cjHtW5qs0upXTywwqxQHjeZUjI+vyKfwY+3esHSNRsY7XF60jzuS0jE7iWPXmuWtVsjemkndl6z0S2uoC7SCP61FLo1nCx3X0TY7Cp/7S0ny2VZZRkdKwLlrI3e8TSFRzjNcqqNvQuPvM1W0CKZCyrkHoc1nnTHtLoYQjaeuK1IfHWjWNukLhyVHpW9HeeGNUsoblvEEFu0yBjHtDFCex96VSnKQShLYZp+v6etssdztWReueKx/Ed9ZX+vaILdl2JI5fHpgU+78K+Fr+6Mq+MFQ/3ViH+NOtvAmhRXMc0fi0OUz96Een1rJYept+pNFShO7T6mna6jpsSlWZB3zXhHx3IufENpeQkm3MXloQwwSOTx17969uk8H+H1+/4px/2yH+Nch4n+EvhPxHfxzy+PfICJsVPsysOvX7wrsw1H2UuZnO6Ut7M+ZjRW94z0Ow8OeK73S9N1WLV7SAgJdxgAPkAnoSODx17Vg16hmFFFFID7V/Z3/5Ifov+/cf+j3r06vMf2ef+SH6L/v3H/o965iDx/8AEfx3ea/qHglNPg0nRpmgiinTdJdsozgehIwfxFAHutGK8l8WfFPX9A+Hegzvov2XxVrkwtI7Ob7sUmcFvccrgf7Q9KoL428e+A/Gmhad43m0/UdN12TyFntU2G3kyBj3GWH4Z9KAPaMc0uK8X1Pxv4+1T4v+IvBnhltOjSytkmiluU/1Q2xkn/aJL4Hpmucsfip8Tdd8A6rrVnHpVr/wjrOt9I6EtcEckKvQYHX1oA941vxDpHhy2in1fUIbGKaQRRtKcBnPQD3rSAFeD/ETx1Jq/wAG/B/iOTTLKWXUr2LfDcR+YiNhgSv4qcfWtzxr468YWfxjsPBvhtLJhfWBlVrheI3+fLk9cALnHegD12ivI/h78QfEjeMvEvhbxk9rNcaLD9p+02ybQyDBPH0IIrnNO+JPxN8ReHNX8b6Tb6ZHoFn53l2cgzKyIuS4Pcr198EUAe/1W1H/AJBd1/1yf/0E1y/wo8S6h4w+GWla5qhjN5dCXzDGu1fllZRgfRRXUaj/AMgy6/65P/6CaAPznf75+pptK/32+ppKAClUDcMnApBSg4oA7a2l/wBLVs4FbkU1qWbzJgDWroXg+01HVFgcsF+tdRq3wv0az0+WZJZC6ej1MJWR1ToS5ki54OFv/YW+3IZGkPI9cCucvdVsbbxPeNPLt2My/Q10HgmyWw0AxKxZfNYjJzisRPBlrrvjG8+0SELJKxPOK9evPkw0GYqi5ScX0MdPEawzF47knPvWi/jadrJ4POysilDz68Vu6v8ACrSLPS5biGVy6DI+auHHhqNGLbzweOa8upiLqzNaODk3dAe2K7n4X6Nb3muXGr34H2LSYvPbd0LdvyxmuGI/Su50K4+y/B/xGY+HluI4iR1wcVwwWup9TiW/Z2j1sjuvh1q3/CbeK9X1m+iDta7Es1bkQIc5wPU4GTXn2hWU9z8YFjgUlotRdjjsoY5NdX8BZP8AS9ZT1SNv1NaUF/pOneKNdg8PWf2W8hMkmo6rd/MtuMknYvfnoOK3fvWZ5Dl7GpUgl0Oll1a2k+LUdoJF/wBF0x2lYnhSXUgH04Ga5B7/AEXwbq2qanpc51fWNVnZISo/cwljwpfp16803RPB1rF43069nv21yx1q3kl82ZSpZwA2SBwRjsa1LbXItX8N+KrS50+2tbXRrgx24hTAG05Bx65A/OqZy2Ufh1VlczvD3g3XoE1Gw1DXraxvtXBmeONRJI/rnPbml8P+E9S8LaVpUmn28Et5dXpF/cygYit1J4GemcVva5YfZvHen+KbyVbfTbDTzvlZgNzHouO/WuM0f4gjXba60fUfD0urI87zQrE+3ALEgN0xj1pOxrF1akW47dTpJjBc+G/G15pqr9iuGIiePo7KgDEY7Z715VpljqA+I+kJe3BnaGESg7siOMKcKPQcj863/EOp+JINGuGa4i0yydY1SwthgJG2QBu/njrWGufCfhu61G9aQ6rqK+Tbo5+ZI8dfb1/Kk3c2jTcabv1OP164W88RahPHyslw5XHfnFd5a6J4zWwhSPwnM6CMbWN3EMjHXGeK82hyZo+CTuH86+uIVbyI8g52jPHtXi5jinQ5bRvceIhdKJ4tp2h+NbLUXuX8IzSKybAovYRj9aoeIvCfjrWtSiurfwvJbeWmzDXkRJ59jXvm0/3T+VL5beh/KuRZ9WVL2KgrHnvDxvds8p+FHhPxFpGs63c+I9NFvHd28MMYaRJA+1mJBxn1HWneLPgrYX0r3/hmZdHvjlmhxm3lP0/h+or1MgjqMUledLMa3tfax08uhqqS5bHyjqdnr+g6qum63bPZXDttjdv9VL7q/Q1rReB/E0aPNFE6hlJz+Fe4ePNb8J6ToEsfix7aW1lU4tXXfJKf9heuffjHrXkPw78YXN74tvLDSvtkHhbynaGO9fzTCwxhRJ2B/u84/WvpcHiHi4XlG35GE4pOx71oTsfD2n7uv2eMH6hQKlm0+ynO6S0hZic7tuDn1yKo+FXZ/Cmnls7hFg/maTxHqM+m6ck1uQHMgUkjPGDW86qppuWyKp0nUlyx3LI0eAMWE10M9hcNj8s1F/Zqo2FubkD08yuUPi3VSOJI/wDviiPxFrE8qxxtGzMcABOtcbzKm3oeh/ZVZK7sdY2lwyY3z3Z+lyw/rSrpVirl2to5HbgtJ8xI989a4+/8eNpIe33pqF6OCEG2KI+hbufpWx4R1271rRJLq8EYl81lAQYAHGBXZCspmFXL61Kn7WS0NHW5fI0O9KgDZA5AA/2TXgeladr2qyhIWbOB0r23xdMbfwnqMwbBEBOfxArgfCN3bW2pMz3sC+5amoqb1M6dKMoNs57UvDHibT4PPkkfArLxrMlvtDMG/vV6t4i1ezudJeP+0rVj6Bq4D7VbJwbyD/vqm4KOyNsPRg92c1Jo2ryPl2Y/jXQaVYXOn6aBcpy7MQx7jj+VWku7bGftsH/fVR6ldTalor2lpcwu0bB1Yc4PbJHY4qKqvA9Ggo06qtqSIvmTLHtY7uAVGee368UyXbCrs/AjBLcelQtdmws47i8kWN1A3sgIAPt7VMds8WeGSQfgQa853R7S1KdlqlrfyOlu25kAJBGKXUbtbWFVJAafdGpPQfKaLHSrPTfNa3Ta0hyzE5OPT6VT1k2Unhm+umm3ARu0Tu3RyNuB/nvWkLOasY1bqk27XPGmJJJPUmm0ppK94+CYUUUDmgD7V/Z4H/Fj9F/37j/0e9cnY+CfiX8PrjxBo/g+3sLvS9Xnaa3u5ZdklqWGM49QMevQVt/s36/pt18JrTS47uL7ZYTTLNCWAYbpGcHHoQ3X2Neuh1YZUgj2OaAPJ/GPwv8AEOv/AA/0BBrIvfFWhTi7jup+Fmkzkr7DIXB/2fes9vCHjz4heNdAv/GVlYaTpehS/aBDby72uJMg/gCVH4Zr2rFGKAPNvD/grWNO+PniTxXcRxDS9RskhgYSAuWHlZyvb7jVz/hn4Z+I9L+F3jnQrmGBb3Wpp3tVEwKkMuBk9q9owKXFAHhmufCvxNf/AAU8I+GoIbc6lpV0s1wpmAUKC54Pf7wrqtQ8FaxcftB6X4ujjiOk22nNbSOZAHDlXH3f+BCvSMUYoA8v0rwFqdv8aPFniLUI4hourWX2dGWQFz8qBsr24Bry2zg8R+GPhv4l0PRfEmgXnhVVnJvfOBnQMnMYTrubgfUmvqLFcNefBrwFeao+oTeHbczSMXcKWVGb1Kg4oAqfASGSD4IeH1kUqWSVwD6GZyD+RFd5qP8AyDLr/rk//oJp1ulraW8dvAIoYolCJGmFCgdAB2rL8U6/puheGb++1C8hghigcks4BY7TgAdyemKAPz4f77fU0lK3LE+tJQAUopKUUAe1eHPiFoWm6j580hAK46V0GqfFnwzcaZNDFKzPIQfu18+Mh6cmnRwMxHFQtDudeTlzH0l4MvodR8MxXNu26NpHA49GrEj8eaHoXi68W8Y7o5GVgFzzV74ZxiLwHaKBjEkn/oRrzHxXpkM/jPVXZTua5avVxdlhaZjTm+eT7np+p/Frwzc6ZNBHM5ZxgfLXHf8ACZaGfvTN+VcTJoGWwFIoHhwnvivEfKzpp1509jsVljnHmxHMb8qfaum8MXYn0vVtAdgv9oxBod3TzUOQPxHFchpkZh0yCJuSi4/WrasVYMCQQcgg4IrK9mfSqPtKaueq/AptmvatEwIPkLkehDVu6TDp9x4y8a6HdhDJfyK4jZtvmLt5GfrXnPhDxzJ4Uvb+/wDsgu7u6jWNcnYvByWOOprK1jWNT8R6xLrU0O2diAzWyEBcdOnfFaxqJRR508JOpWk3omkey6PN9l8aadBq0trDdLG9vYadaPvW3Tbkux9SBj8a4Xx74qWG41Dw3pdl9ktzeNJdSbvnnk3ZP0Fcp4d12Xw94jg1fyGup4QxCuSNxKkcnr3p14mseKdZuNTTTJpJ7p/McW8DbQenH5U3UutBUsHyVLzelvxPQfiJqWlS6vpf2m5iniSwdWjU+ZskwNpKjv1riW8VGzukfRLP7K4TyQQNxI3FhhfXJ9zRH4OmtiJNc1Ky0ePqRLIHmP0jXJzVyPxJovhtCvhywa6vBx/aF8oyD6pH2/Gk3d3ZtCEYR5Ie8aVhpiaPCniTxrPJNKfntdPdsvMexYdhXm/ibX7rxLr9xqN2QGdjsjX7sa9lFX7+/vNUu3u765kuJ36u5yf/AK1c2/8ArD9aXNfRDdFxfNLca7GNC6ymJlGQ+cbT68VWPibxEPu+Nbs/9vMtGpbzp8qpncRgVzDWFwigsuAaFTjJao8vGy95I7rw7N4w8Tai9lY+M7rzUj8w77mUDGcVq6hovj/TblYZfGFw5ZdwKXUuMfjVD4NRPD4rumIx/opH/jwr0DxQzf2pG23IEX9a7amGoxwrqqKv6HkucubyF+EOt3+kaj4jHirX3lgtbaCUSXNwzIgZn6bu/Haq/jD49z3kz6Z4JtXkkbK/bJUyfqi9vqa8v8W24vtbNwsuYyioVXrkZ/xrW0G3ENmI4YVgz1bHJ/GvDeDoyq+2mr+XQ29tJRsjkvEEeqNeNeavdvdXk5y7OxY/iagg1rV7eIRwXMsUY6KgwK6bXNKkm1SFj86ZGcVpReH4WiBCY49K7vaxjojFVHc91+Dl7Nf/AAp0iadi8n7xWJ68ORXTa3ph1WyWASeXhw2cZrk/g22zwK9qBhbW7kjA+uG/rXcXN1BaQiS5mjhTON0jBRn6msasFUTT6nZSqOm1NbnKf8IU4/5fV/74rmfE10PD4bTLObdeTLmaYDBjQ9FHoT/KvSG1KzaKV47qBxEoZiJBhQehJzxXkV5pGqalf3V4/wBnd3YyOVuEIUZwO/ToK4HhIw1gtT6PLcSsRUviJpJfiZNnZz3tzHbWsTSSuflUV6z4W0eXRNF+zTuryM5c7egzjisnwXY2OjWUtxd3Vqt5I21v3ynYOwznjNdZDcQXUXm280c0ZJAeNgwOPcV0U6ThqyM2zOOIl7ClblRyPxbu5LT4Y6q8JIdkSMY/2mAr5gRdU27vPkH0NfSHxruHi+HrwoMtcXMUf82/pXi1npk0turuhUeld9JpK7PmpSa0Rx9xeX8RxJcyH6mqpvrkn/XN+ddLrunxAbckPjpXOf2bP12GumMVLYyVSS2YC9uMczN+db3hDUWg1h5JbhwFiJCjnecjjH0zWLFpkjNhvl+tbnhzTvseu28srMyHKYQc8jH9azqwXK0zpw9aSqxdz3nwb4T0/wAW218Lx5x9nRX2RKGLZ7YPWuil+HttpSaojRHUEWEPDIHCNBweo79O1WdF0u08IadcKl+lxcSWsRnhZWQbT02uoPPX34roPtl5qWp6vppt7WJ4rNAJEdmBDg4zkZ4rmp0IKKUlqd9fG1ZVJOnLQ42X4faZEktot5f3epRwiR44IQUBYZUHPTP1rxfxxbrbaDcWmzyvJUsIwP4g4Bzj05r6deG8juljSKzttRvLU+bdqzuAqYH3TjJ54r54+NWl2XhmBbAXv2q7uIo5FcjDAMTuGO2cA81LoqM4uKHTxkqlKpGo76HiRpKU0ld54YUUUUAPjmlhbdFI8bdMqxBrvfg/4p1fSfipoKQX9x5V5eR2s8RkJWRHYKQR7ZyPcV5/XUfDP/kqvhb/ALCtt/6NWgD69+MXju++H3gX+1NOtkmuprhLZGkBKRbgTvbH+7j6kVz/AMO/Gvi3V/FcNndaroviTSJ4TI93YERvbPgkKyE5PQDp3rrPibo/iPWfCoh8NSWjXSShpLa7jVo7mPuhyOD0Nea+EPhhr7fFbTPE0nhyx8I2VgrGaK0uC/2liCMbew5/IUAah8cePfHfjHXrDwO+nWGm6FL9nae7TebiQEjA9BlT+GPWrPh/41yS/C3Xtd1qxWPVvD0ptbmCM4SSUnamPQFuD6YNU4/Cfj74deMfEF34O0+x1jSddm+0CO4l2NbyEk/iAWP4YqTw/wDBW7Pwq8RaNrl3GNZ8RTfa55I+UikDbkHvhsk/WgDJu/H3xU8O+ErHx1q6aVc6LcmOSSwiTbJHFJ907vcEfmK3/HvxN8Qad4q8HWPhaG2uovEUJkVJxjJbG07uwG7J+lc7feEfit4l8F2PgHUrDTLLTLfyoptSWbczxR/d+X14H5Cus8RfDvU5fiL4Bv8ASoY20rw7H5MzPIAyqAAMDvwKAK3gvxx4xtvi5P4G8YNY3Uj2n2qC4tE2AcA4+mM/lUn7R3iHUdA+F4Gm3MltJe3aW7yRttYJtZiAe2doH0q7J4J1lv2ioPF4ii/shNN+zF/MG7fgjG3r3rnv2p/+SZ2H/YST/wBFvQB8pHUb0nJvJ/8Av43+NRy3VxMoEs8kgHZnJqKigAooooAKkgfZOjEA4IOCKjooA6G0i2Sfv4cKfUVpRaPLe3KJAgAbpitnVrSF3OMKFGan8H+ZdzzsjbViwA1cqnc9BxSPSvBlm+n+Fre3f7yu/T/erhdc0S5m8W3c42+W8xY5PNeh+HJRNoqOG3De4z9DXN3qOdfuJG4TzsV7GP8A90ps5aS99k9vpmmTwrmMh1HPy02XSrINgQgj6VrXz21hcRwRrl39Kr3TCW6UIAu1ckV87d31Op7XOP1G1FpfyRJ93gj6Gq1aWuiM6grx9HQH9azcVq1qfSYWXNRiwp8c8sD74ZXjb1Rip/So6Km50mnD4i1mAYj1W6X/ALaZplxrur3YxcareSj0M7Y/LNZ9FVzMjki+gvGSe570ZpKKm5astgZsKfpWIeSa2JeInPoKx8YOauJzV3sW9LsP7Sv0tsfeBP5Vt3Hw9jliVnmdMnjBxmoPBsIl17dux5cZb69q9Fi1C0uz9kuIgpXo1S5tSseFikpSOX8FeHI9C16Yh2Zmhxye2a7C8gjnADKrH3rJ0xCniicA5URHB9ea07i8gtLwecu4MvAr1Kkn/Z7fmeTJWkcJrXhuMeIoV2EQuAzbR3zXUSWmiW0CoEbKjpiqWravv1qIRRAKBjFV7jzpruSQLhG6e1fO+1k3YuklLSRz17/pHieG2gQ+XuGfpXoNtolj9lCyBvMHHArz25a5sfFUUqLleM16Na65FLCrNbZY9Tmoq30ZnJWdkdJ8NwkEOr2SLgRXIk/76X/7GtDx3Z3N94ejitYHndbhHKom44Gc8d6zfh5fx3Ws6yoj2Owjbr1AyP6127Gu+lL3UzVw56fKeaXFjfqmvxjTrpvttrGIm8kIuVAyCBwPpVdrGea40rYoEUqCC6BVIyAsgb5gD3AHPfFd74kJ/wCEb1Dr/wAe7j9K8IEcZj+7zt/pTnX5Hsehl+QfXYuXPax3UOjX0mnzQNYysHvkk2mFcFN553dSMdq6XwhZT2Gm3UM0DQZupGRSMfLxgj2rS0P/AJAFj/1wT+VXh94Cqc+dHnLB+wqOzvY8++LzCXS9Ms8Ama5L/wDfK/8A2VYdn4dthZoXlUMRyCa0fi3dbNR0eJQNyebJz6cD+lcLNfzuc+e34U1dqyOhQUnqw8VeGYonEykMo7qay9P0yKVdmOCM1eu9QneyaMyblI6mksbiKC3UhvmAxXpYSoo6SMK1NJ+6U59AXHm44B9Kkt1itF3ogaRASvHerv8AaDSRtGwGDU+n6cZRv27s9KnG1YdDGDcZJnd+EPixLb+HVEumxz30MQtxKG25A+6GHfGa6W28e+HrC2luLS3vBeSW0cHlyKNvyDC5OfQ14nepPYQ6lPEGiyUTDDGGzhj/APXovbOaysftcV2yNCoZicEN/wDrrx1Xmj6l4GjJKXc9m1L4saLu8+0guJLq2hKFy4jRc4zkcnGRXzr8TdYXV7m3upHae6uAZHnc8so4A/n+laeuq00tnbW4S2a9AllYnG4+mf6VzXjqJba6tLZACsMZUMw+dhxyT6Zzj05relKU5ptnJiqVOhRaijkzSUppK7zwgooooAK3fBGpW+jePtA1K7bZbWmoQTSt/dVZASfyrCozQB+jlte2t5bpPbXEU0LjKvG4ZWHqCKk3p/fH51+c0d/dxIEjupkUdAshAFP/ALTv/wDn9uf+/rf40AfotvT+8v50eYn98fmK/On+07//AJ/bn/v63+NH9p3/APz+3P8A39b/ABoA/RbzE/vL+dG9P7y/nX50/wBp3/8Az+3P/f1v8aP7Tv8A/n9uf+/rf40Afot5if3l/OvBP2p9d08+EdL0dLmKS+e9E5iVgWVFRgSR25YCvmT+07//AJ/bj/v63+NV5JZJnLyOzsepY5NADaKKKACiiigAoopaAPStU8tlYBs1veAtHaaxupbYMxzyvc/SuUubpJ5QOi12nhrxhpfh22VYnO/+PiuGPQ9CUlc7bRLZ7LSUgZCjBmYg9eTWff2STaskLnZ5j7xWvY6zD4gtF1GAYSTIwPUcVh6r4m0g60kcjhJbQGNv96vdx/8AudM5qfxs1r/RnOrgsMgYw2PaqGpWQs45pA2TsNMPxD02OPZLNuI71k6t460m5spFifLspHNfPbnQ37tjAlkEttbtnJ2n+dQk1Vsr+O6QRIeUGatHrVt6n0GB/gISiiipO4KKKKACiiigCO5OLZ/pWRmtS9OLU+9Zferictbc6rwLErX9yzHACACuogg36gTnaM9TXC6BqKafLIZGKh8c120eqaVcQo/2soe4xUSj71zwsQ1zs0LFQuvuAQcREZ/Gqnie4htbiJpOSV4xUui3drdauywPvKx9T6VneL9A1bWdXi/s9dyRxfMM9817cIqWCs+55ctZGDdX8T6nGwbHA61vJPH5YLyKOPWuQ1TwjrmnETXKYB4yGzUmm+HvEOqhxBlgnvXkKjGMrlKnJai6peI2ugRtuArqLOYfZ0KsMY5rnm+HviMy7zbgse+agl0rXrJvs8rNGRxgGoqUk2XyOWx2fg3V7u38aXf9mYmmNsS0PUSKpBP416Na+PNNk+S8iltJBwwI3DP868c8Dafe2njaymaEyGRjHw+xhkdVbsa9rlsdJ1RRb6lCGu+/nRiKQ/l1+orKUJLWLO+h7KCUK8fmid9b0LUbVomvoHjlUqys23IPasgeG/BxGAlrjp/r/wD69LL8O9GkyUa4jB9JOBVVvhtpwPy3dz+YqW59UjupSw9Nfu6skbv9o6TYwLEl7bRxRqFUeYDgDgVn3XjHTLeXZA5u5eyxj+tQw/D7SEYFhPJjnBfipJLOx0iRItNgtlnYY4UySg9sD+pOKP3j2sjB/VYu7bl+B5b8R7+4v9dge6UQzJDxED9xWORn3rk4pgobdn2rrtX8Da34g16/1CJGQNMyENJuOV+Ukn3xWfN8MtejgaRjgKMnDV3U48sUjzaj55txVjnWkJBGetKjbcUsfhm/kuREZmB3betdNH8J9XktxKbpsEZHNaJg6cupzbzYPBrqNN1KOK0TkZxXNTeFb23uXiaZ9ynHWtDSPBmoandi3S4dTjOc1hWj7R2G8PLexsSXdoIxCxUJMzYVjkNnk5/GuZvYdOs7lo1Wd/s53CNnZkXPbHp9TXsugfCCK+8NwJeXhS7t5CMlAwIzkE+/JrH8S/CnWdBvzdaTBJrVvdgeaseFkjcex6qa5fYzie5SxlFwjBvU4LTNPk8Yalp2lT28Je7k2QSxyY2MBkg+nArA+NWmHw94yi8PIS9tp9tH5cjD5pGdQ7kn/eJr3L4SfDTVdI1ltc1yBbTZuNraNgurNxvbHAIHAHvXi3x0kuLjx1e3DSCW3e6l8tscgDaMZ9BtrsoU+VXZ5mOxDqy5Y7I8vzSUtJXWeUFFFFIAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKfDGZZkjXqxAFAHqEPhuCS4jQk/OwXrXoll8ItIlskmkkAZlyQSa4G28W6Ml1C7GTCMCeK9Bi+K/hdYVXfcZVcEAda5Ixdz16qp3XKXvD2mRaRpIsoTmOOR8H6tXnev8Ah+C48R307E5eYk816H4e1G31bSFvLUsYpZHxuGD96vP9f8SaVaeIL6CZn8yOUhsV7mOT+q0zmwyj7WXMbvhb4aaZrFm0twxBAyCWNVfFXw90zRSohbJb3q34d+J3h3TtJ+zzSShyMZAqj4p+IWgapJEYJZSFHORXi8rsbrk5/IwItIisSzx/Q1IetMTX9NvyYLdnMr8jd7U81jJWPdwtuTQSiiipOsKKKKACiiigCtfnEAHqazav6icRp9azxVxOOs/eO4+H/h2x1syteqWCtjGcVteLvBWj6Zp6TWgYOWx941ynhTx9o3heOW3vFlaXOTtXpV7XfijoeqWgjjSfOc8pWttDxakouZY8EWyQa+5XPMJHX3r0CxuFg1CUlgD5Y4PfmvOfAWtWepa5KlsH3JCWO4Y4zWD8XtVvtP8AEdmtrdSQhrfJCNjPNexTX+x/M4KjSq3R6Z4yuBPYKwIzv7GsXQNcuNKdlRhtc85xXhb+IdUkGJL6Zx6Fs1EdZ1Bj/wAfcn515bi2zZ11ycp9QP41aNNwkUkDoAK5HUdVfU7wzOQpJrwz+19Q73cv50o1jUB/y9SfnUumTRr+zlc9zs76azu4bmCZFkgcSLu6ZB6H2Nen6L4u0rxIj2t4kFvcDB8uV1ZZP90n0PbrXx9/bOof8/Un/fVIdXvyObqQj60lSNa2IjU1tqfbP9kQrta3mu4FXPywzttP1BzmnvYySKVNzdYP91sEfjivi6HxRrsQAj1i9QDoFmYAfrUreM/Eh4OuX+P+u7f41PsZHNzo+wm0mGOLbcS3c6Z3ZuJ2OD9eKxNU8WaRoCm3sliuJ8ndFAyqo/3j/wDrNfJ8niLV51Ky6ndyKeoeZmH5E1D/AGxfAY+1SAexqlQY+ZH0dp3i826yrJewp5sjSHaOAWJJ/U03UPG37souoROrcEV84nUrojm4k/76pjX1y3/LeT/vqq9m77iVSzuj2uC/s/tiO92n393WvRY/EWlizjH9rwqoTBBNfJv225/57v8A99U/+0LrHNxJ+dUoWOiWK5krnt+p6lpzalKy38RBPUGrfhvXNNttWDyalEi7eua8Ea7nYf65vzpn2qb/AJ6EVKhrc1+vXjy2PrZfiJaaUGmtNZtX9Y35Vqcvx4so0Akt7SRx1K3BAP4YOK+RvtUx/wCWhxSfaJf79aNX2ORVIN+8rn1Drfxwlv4jDYz2unqRgspLufoSAB+VefXeoaHqyNbajfQGKU/PJJ8xXPVvXNeP/aJf71IZWPU1PK+5t7eCi4qJr3/he8ige909TqGniQxieEbsEf3l6j8aw9jAE44HWt/wvrx0PUzcFmClCpx3zXdN428E3umxW1/osbtGwYFI9vP4dau5ycl1dHk8cTysFjRnY9lGTUt3ZXFjKIrqFoZCoYKwwcHoa9CufEfgz+231S306VZiBsUcIp9cU7V/HWj63HtvLJHIXaG2fMB9aLjVK63PNMGgDJr0WHxb4biji36NBNNGnlB5E429hgcZHr1qumq+CiySSaOSyjGAzAHnOSKLi9mzhDG4xlSM8jI603ac4xzXp+s+P9J1G3a2XS7cQMgjK+UAQo6AHrWHHr3h6G28kaJbkAfeYEt9c0rj9k+5xzROqB2Rgp6Ejg06W2mg2ebE8YcblLLjcPUV3l7450nUtMg0670mNrOAqVSP5CMdgeopLjx3YXS2qHSYHFqoSEOu7aAKdzNROBMbKcFSD6EU5YJHjZ1jdlXqwUkCu/vPHkOoW5ivdDsrpdu1WeLDL9CMGktviAlhZG2g0m0WEjGzy+P/AK9LmNVTXc4P7JP9nM4hfyg23fjjPpURUjrXfP8AESN7B7OXSLVoXbcRsxg4xmsrV/EmmaukKyaJBC0K7A8JKMR7+pqjNx7HK45qSGB55VjjUszHAAra0vV9O0e7E8emR3rAEYuzuX/vkVqJ8QbqEMtvp9lArKUIjiAyp6j6UrjUL7s5Sezlt53hdQWQ4O07h+YqIqQcYwfSussPEdjDex3h0O3kuYj8ibisP4qKl1nXLLWNQe7fQLaNz02SNj8fWi4OBxwQlwoBLE4wBWjp0F3Za3EhtpFuY3H7t05B9wa3R4kli2fZtI06BkUAMkQ3cDrmprnxzfNNNdGxtlvbhQktyAdzAdPofeglI5GSN42w2a3dHt4pEHmDOR3qjfQATYzzWjpaFFXnisnLsdkI+9qe4+Akjg8H2yKMDzH4/wCBGvDPH2R471jk/wDHy1e3+CT/AMUna/8AXR//AEI14f49Bbx5rH/Xy39K93FL/ZqbOR/HI50MfU05CzOBzzU0dozJuwantrUiccdK8cSvc1tGtUh1G2l5yG6fhXaVytqoSeFum1gf1rqveuWqj6XLJXg0JRRRWJ6wUUUUAFFFFAFHUT9wVRq5qBzKg9BVQ9K0icNV6spyW1t5rSSx72Y5NTQ2ttKPkhGKiSRpG3ou4Ka3tKtnuXA8sgY64q6r5Y3PE5eaTZt/Dy1jt9cnZY9pMOM/jWL8YbRrnxLYhev2f+tdl4TsTbas7HvER+tY3xEsZbvxVZeWuQLfn869OnU/2Dm8zhrLlqWPILmwktlyQTUUFrLcEhFziu+1LSxHbFHXk8cio9P8Nrbw/aC689BXmLERaMOY4p9OmTG5DirsejO0e4AnjNdYbCO5BXKkj3pDZvDE2Y22gdcVPt0K5wNxEYZinpUYz0rUu9Pubi6d44HZc9QKdB4dvpjkRMPbFdcWpFFe202a4TcAcU2506WBl3A4NdNZ2s2nqizRFSR0IrRGmHUwykKvHBIr0VhrxuZ8+tjk4tEMkO8P26VXn0ieNC4GQK6a10iWG8aO4YlVPAXvVy60wyRMsaMB6msvq0jXnjY8/wBpzjBJFIQRwRXaaZpKQs4ZFZs96NW0IPbtII9pAzkDFEsNJK5mprY4vFGDW94c8Pya3qDwR9Y+SPWuluPh1eurbLWRNoJ3EcGuWzLvY88FNJqe5tnt7p4mGGUkVEVI6ilYExoNGaXHNG2gYZqSOCSUfKpNR4z0rofDt0isYXVfxFDdh21Mn+zbsjiI0o0y7H/LJq7iSBWHQCo22quMVm52NlTOMGmzFsMpU1MNJIXLNW7dgHGOKdb2gnwGNQ5mkafMznl0x3kwhyPpV6PS1hUmX0rpE0zy1+Vf0qOTTjJwQannudUcMca1s8tyyxLnnikOn3CnDIRXRXNi1g4mjGR39qs29s+o2xbZyPSu6jT59jgrxcGcmbGTH3TTIka3uFZ14BrrTpDgYKEH3qleaPIVPyZrWWHaRzc2hYs3tLtR+7HHWtNNE0+4QFZNp9MVW8J6fi7McwwK71vD0Ztw64GemO9ebU9x2FzHF/8ACHQyZKEGsLUfDJhuNofaDXoU2izBDgMB9apNpBdD5gIYDjNSpu5Cqann50NQP9b+lMOibekma6KaHY7IcZBqB1wKvnO+EObU5p7Z7eQd6kWYouWXIq9cpmTmiO1zIuV3AnpVQfMxSViTw5EL/V0iZMq2eK6mbw7Fub/RQao6dbm0uFlhiZXHQ4rp7ebWVQsI0IYfxLXoQopow5jzG6GGIOS1T6czRNlj8vpWimnfaLl8oOtW4tAcsQq8V5CmjvcmmereA2E3g+0cdDI//oRrkdQ8MW2oa9q9xOAXa5cjNdp4HtjZeFLeEnlXkP8A48ao31i4lvH5XzZmI+le1mEmsHTOej8cmzg28JQhtokwveqGpaJDpo3Id3HWu2h0C4uQEclVHes3XtBnFuLeBCzg9q+ajX96zZ0+zUlojkbeJnxgZ5rpF+6KZpWgXUMZWVCp7EipniaF2jcYZTjBrf2inoj1MujyNoZRRRSPYCiiigQUUUUDM29Obk+wFVX+6asXh/0pqrlWkyiKWYg8DmtYnn1XqyDRRJcSmFFGM16LpdqY7ZQ8Sow6muQ8OWQSzac/K+c5Ndnayfao1Uyg/StKkVUjY8eEmjV0VGXV3z08uqutxpJ4xg8w4UW3P51o6MUW+aNXBYIcj0qjrMIl8YQK33WtwD+dddSPJlrXmcleLnV0KurWGnPsWQ5GRVfUtNsP7P8A3Unl7QMYpdetFgnjC5xuB61Dr0fk6E0iHnjgV8wuZ2ONwaJLPRbCKFZFwxxyTVkWVrNA4wp5xio9PjV9KR93JHIrC0y/nbW54Hy0IYge1WoTbNIUpSehpra2kGYkhUAdwOtaFtb2/l7lRd1Zck2y4uECllx8p9KfoLvNBIJiQQ3FaRdRPQHTkivdacup6v5OfunHHatifwl9gsmuDICVXK81kxxzprUzRbiN3atW4vbo27+arHC96+3wb5qSbPPqOSZQ0jQ4NUmee5nMJTjAFJrOmpbxkWsjSL05qlY6jKbh8KRzjArXumnOnvIIiMDNdvukLmtqZ3h/QLaRmN5OyE+gpni7So7CyZ4JmlQjv2qWwvnVQ0iH8Kg8RXZuNEudqkADvWdRLlCLdzH+Es8Y1m7TZulKnbx7164l5qIlMEttlCpyR0ryv4PanY6br0pvUUbwQGboM19HWjW9xbB1kjMbDjpXgzep37niFh8PLfW/EupTCI5UAhCOM0av8LSdNnYWqoY0LAr14FeqRa3ptl4klsFjCt/e9c1rXF5ZTWdwpKsNhyPwqClE+VfAfg7+39ceGbOyI8jHWu/vfhgsqSQx2aoQPvqKXwZ4i03RfHeqxSxhIZXAVz0WvarHULG8hEkc8ckfU45qG9QcWfNHhD4dSal4kuraZcx2zFSCOtdZd/DbyopPJtQkgHDKK7/w/qGmDxjqEVtFsJkJZu2a624v9Ot4ma6njjiOc7u9A0ranzVBpd1mYclon2HNV57Z1Yqeoruvtenz6xei1dfKLtj3NYU1gZbt2ByGPpW0YJrU7I7HHXUbo4BrptG0EsYppnCq2DjNJd6HIxyFzV3TLO4jmiLyfKnY96U6S3RtT3N2a0tYI8MpxjqOtZU/9nqDhpCf92uju1klVfKiJ2jrisyc3eNpgUe+2uGeh6tOxiWtpa6j9pU8hBxkYp3hHTJplmkjjDIrkYqc295B58pTCEckLgUzwxrDaX56EFg5PAruwU3c87MYpxNa9trZplR1CufQVQuNPhTqQRVy6uQQJzbPKndQefzrOuLqzmTcLGYY/wBo16jlfQ8FJ7FGO2KXQMa4GeorroA2xAzMEA4rk0u5IJlVomWNiMAntXYW955looWEnaADivHx0Yp3QKLGXEU7qSjgr2BNYsq3CTBZNpz71rzyW7gl7dw31rMeCB7lWWJi3Xqa4VsKcGtRlvotsuttFKok3gHn3rC8Y6Wul6iqxrtRxnAroZ7pf7ZR4m5GKk1zRbjVnSWRSwxgEVEHdnpUHeJ5bMP3g967LwbplrfRSSz4JjBIp03gmfkeWw+tamh6JNo9q+8H5sjpW17PQ1cbhPqcVu4SK0j+XjOOtIPEtzGMLbpitGHTrG5xukUSHqM9KnfwnY4DPdqBXdBztoczjFHnaXf2W8IwCPeuht7wPEMKuSK9Jk/ZuDuXOunP/XOrEf7PTRrtGutj/rnXn+xeh1+2i9zK8KEt4eiLHJ3v/wChVYnvbYyNHIPuNg1fHho+EgNI+0m48o7/ADCMZ3c1tWvwyXVLWO++3FPPG/bt6Zr1s0pzlgqUYnPRnFVG3sckus2MZ8oYHuaw5L1LrUm2sNor0O5+CqXEu8amVP8AuU21+CS27lv7UZif9ivllgqlrncsRTXU4J5Ci5Vd2K1/DV54auZZrTxJZpJHNjy58cxEZ7jmu0T4S7Bt/tAkf7lVpfgwjyq66kybTnhK1pUasHewp14P4WQt8J/COrL5mmaxJFnnCyBwPbB5qlcfAovk2muKw9Hi/wADWvP8IHlQhdVaM+oUioovg7dxLiPxFcp67WYZ/WvRheXxRI+uVY7TOek+BmtKf3eo2jj3VhVdvgn4hBwLi0P4mu8HgDxKqhV8baiAowAGNH/CA+Jv+h31H/vs1pyRK/tCsvtI4Rfgn4gLYa4tlHqM1Zj+COoD/X6jFGK7WLwF4iSVWfxlqEig8qXODT5PhzPMMPq85A9STUNJPRD/ALQrP7R5zqPwt0TQ7lP7T1Jrl352rIFA/KlutE0qx0e4OnWaRARN+8xlm49TzXej4WL5od9RdyPVc1dn+HnnWMtv9tP7xCmdnSmldbWOWWInJ3bPF/DOkQX+gOrDBHepnsbb7M8kDspjz09q9P0b4UDSNNe2/tEu0nfZVf8A4U8wjdF1RwrEkjb603F20NKdaK3Z5z4USQ6tJIzEhoyOfrV/WEz4itm4B8vGfxrq7rwD/wAIpEt0Lvzg58vBXGO9SWPgX/hKFF6LwwGE7MBc57131KblgLeYOtD23N0OD1wBJ4w+CeMVV1NQ+kEv93ivUL34PfbWRm1VgV/2KLn4OC4082p1RgD/ABbK8OFBroYTnFu6PNbeFYdOWQE7SKxdFt0l1i4DYHzGvZovhCY7Jbc6oxC9DsrOX4GbLszrq7gk54St1TfYqFRRPPHEAkuVHVRTtGt45rZ3Vujc16HL8EXkmkkXWXQuAD8lS6V8Fm0wyf8AE3Zw/YpQoNdA9qjzizid9RuHjPQ1cvYJmsJpJmUDb/DXpFj8IktLiSQ6kzh+SNmKsX3wrS6tHhW+Me4dQtetQrckbHFON3c8M0dkMrbFBbPANb94bkaVN5oVBt6LXdWXwOFlJvXVmZs/8862rv4WJdWJt/t5BIxu210/WI9yOQ8YsERoFIwSfWovEEappcw+Xp0Fer2/wTWAY/tVmx/sUzUPgel7EU/tVlz1+SrliIuNrkqFmeAeHUia9fKqp6CvUdD1NrOyMc05IBwvNblr+zzFayFhrDNn/pnWpF8E9ihTrD7Qc/cry5PU01ucLqN9CniITs/C4OfWt6x1aK+gm8twTtPSujm+DCXEm6TU2PGPuVPYfCGOwEnlaiw3rjOyoNEz5+S3jn8U3K7cbn5Neu+HLJbHSAiuSMc1etfgOkGotdtq7MWOcbK6my+Hf2O3aL7ezAjH3aoSep5FoE4HjS8jH981peP1P9kIwcggngd67Sw+DyWOuSagNTZ/MOSuyrevfC3+24UjOoNGFPPy5zUK9xyeh86+G3j/ALQZZ5CqFjmu3H9kogPmnBHHNdSn7O0aOxXW3AY5/wBXTj+z8/RdfcD/AK51upWNozsrHGM9irkiYkGqd9d232iH7MeB973rvh+z7IOuvOf+2dOP7P57a4+f+udEpG8ayRy8XiGNIVX5AfeorjXI2XOYya61f2f3HXXXP/bOkb9n9j01t/8Av3XLKFzpji4o88utf82KWEhQrjHHasTTb2G1vfNcKwDZwa9aP7PJbrrj/wDfum/8M6D/AKDrf9+q1o+4c9evGorHHv4usgu3yYx7Bapt4g0xg+Y1Bb0HArvD+zop/wCY4w/7ZUf8M5r/ANBxuP8AplXb7VHDY8x1XUre+kgEK7dmBwMZro9O1iOztthRWJHeuuH7POMY1xhj/plUv/CgJe/iBj/2zrir/vCbHKtr1o64eBPrioG1i1SUOkK8AjGK7H/hQEmeNfcf9sqVfgFMpz/wkD/9+q5o0miXc8tmlT+0xMOBnPNdAnibZEqAoQPWuwl/Z/klOX19zj/plUZ/Z5J/5jrf9+qXsdbnVRmo7nIv4pTvszUUmvpPCy/LgiuxP7O2euuv/wB+6cn7O4UY/t1/+/da+zOt4iFtDxe51ieG8kMbYGeCKcniW5BAZmYfWvZx+zpB/FrLMf8ArnTh+ztbj/mLn/v1XTGXKjgm1J3R5r/a2of8/wDc/wDf1v8AGk/tbUP+f+5/7+t/jVOisC7HofhmeWfQ4pJpHkcs2Wc5PX3qC80W/uLyWWLV54UdshAWwvt1rD0TxMNLs/s0sBlQElSpwRnrWl/wm1v/AM+cn/fQr34VcPVpRhUexlZp6D/+Ef1P/oOT/m3+NH/CP6n/ANByf82/xpn/AAm1v/z5yf8AfQo/4Te3/wCfOT/voVPs8F3H7w//AIR/U/8AoOT/AJt/jR/wj+p/9Byf82/xpn/CbW//AD5yf99Cmv43i2/u7Jyf9pxS5MF3D3iX/hH9S/6Dk/5t/jR/wj+pf9Byf82/xqr/AMJu3/PgP+/n/wBak/4Tdv8AnwH/AH8/+tStgu47SLf/AAj+p/8AQcn/ADb/ABo/4R/U/wDoOz/m3+NUZPG0xA8uzjX13MTTf+E0u/8An1t/zalbBB7xof8ACP6n/wBByf8A76b/ABo/4R/Uv+g5P+bf41n/APCaXf8Az7W/5mj/AITS7/59rf8AM0f7EFpGh/wj+pf9Byf82/xo/wCEf1L/AKDk/wCbf41n/wDCaXf/AD7W/wCZo/4TS7/59rf8zStggtI0P+Ef1L/oOT/m3+NH/CP6n/0HJ/zb/Gs//hNLv/n2t/zNH/CaXn/Prb/madsEHvG/pWl3dlcvJc6jLdqVwFYnAPryax/Ft7dWt/CsFxNEpjyQjlQefaoD40u8f8e1v+bViX2oT6jcme4YMx4GBgAe1RiK1FUfZ0gUXe7Hf2tqH/P9c/8Af1v8aP7W1D/n/uf+/rf41UpK8kuxc/tXUf8An/uf+/rf40n9q6j/AM/9z/39b/GqlFILFz+1dR/5/wC5/wC/rf40f2rqP/P/AHP/AH9b/GqnFHFIC1/auo/8/wDc/wDf1v8AGj+1dQ/5/wC5/wC/rf41V4o4qrisW/7W1H/n/uf+/rf40f2tqP8Az/3P/f1v8aqcUUBZFv8AtXUf+f8Auf8Av63+NH9raj/z/wBz/wB/W/xqpxRxRcehb/tXUP8An/uf+/rf40n9q6h/z/3P/f1v8aq0cUBoW/7V1H/n/uf+/rf40f2tqP8Az/3X/f1v8aqcUUBoWv7V1H/n/uf+/rf40o1XUf8An/uf+/rf41U4o4oCyLn9q6j/AM/9z/39b/GkOq6j/wA/9z/39b/GqmaOKA0LX9q6j/z/ANz/AN/W/wAaX+1dR/5/7r/v63+NVOKOKALf9q6j/wA/9z/39b/Gj+1tR/5/7n/v63+NVOKOKALf9raj/wA/9z/39b/Gj+1dR/5/7n/v63+NVOKOKLhoWv7V1D/n/uf+/rf40v8Aauof8/8Ac/8Af1v8aqcUcUAW/wC1tR/5/wC5/wC/rf40f2rqH/P9c/8Af1v8aqcUcetFwLf9q6h/z/3P/f1v8aP7W1H/AJ/7r/v83+NVOKKQFv8AtbUf+f8Auv8Av63+NJ/auo/8/wDc/wDf1v8AGqvFHFMC1/auof8AP/c/9/W/xpf7W1D/AJ/7n/v63+NVOKOKALf9raj/AM/9z/39b/Gj+1dQ/wCf+5/7+t/jVTijigC3/auo/wDP/c/9/W/xo/tbUf8An/uf+/rf41U4o4oDQbRSUVIDqKbRTAWikoouAtFJRQAtFJRSAdRTaKAHUU2igB1FNooAdRTaKAHUU2igBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigD//Z' } },
    ]
  },
  {
    theme:'theme-mc', num:'03', name:'Millcreek',
    model:{ name:'Jordan Reyes', role:'Featured Model',
      bio:'Millcreek native and part-time trail runner, shot on location at Millcreek Canyon.',
      media:null },
    ads:[
      { name:'Millcreek Botanical Florals', tag:'Florist',
        blurb:'Weekly flower subscriptions and same-day arrangements for the whole valley.',
        cta:'Order this week\'s bouquet', link:'#', media:null },
      { name:'The Copper Whisk Bakery', tag:'Bakery & Cafe',
        blurb:'Sourdough, laminated pastries, and a cardamom bun locals line up for.',
        cta:'See today\'s menu', link:'#', media:null },
      { name:'Canyon Trailhead Outfitters', tag:'Outdoor Gear',
        blurb:'Rentals and gear for every Millcreek Canyon trailhead, fitted on the spot.',
        cta:'Gear up for the trail', link:'#', media:null },
    ]
  },
  {
    theme:'theme-ch', num:'04', name:'Cottonwood Heights',
    model:{ name:'Sienna Cole', role:'Featured Model',
      bio:'Sienna splits her time between modeling and coaching youth ski teams at Big Cottonwood.',
      media:null },
    ads:[
      { name:'Butterfield Nail Studio', tag:'Nail Salon',
        blurb:'Custom nail art and gel sets, booked online in under a minute.',
        cta:'Book your appointment', link:'#', media:null },
      { name:'Big Cottonwood Coffee Co.', tag:'Coffee Shop',
        blurb:'A canyon-mouth coffee stop with drive-thru and a dog-friendly patio.',
        cta:'Find us on the way up', link:'#', media:null },
      { name:'Alpine Ridge Realty', tag:'Real Estate',
        blurb:'Foothill and canyon-adjacent listings from agents who actually live here.',
        cta:'View new listings', link:'#', media:null },
    ]
  },
  {
    theme:'theme-sandy', num:'05', name:'Sandy',
    model:{ name:'Marcus Bell', role:'Featured Model',
      bio:'Marcus is a Sandy-based fitness model and personal trainer, repping the south valley.',
      media:null },
    ads:[
      { name:'Sandy Station Barbershop', tag:'Barbershop',
        blurb:'Classic cuts and hot towel shaves, walk-ins welcome most weekdays.',
        cta:'Check today\'s wait', link:'#', media:null },
      { name:'Willow & Rye Bistro', tag:'Restaurant',
        blurb:'Farm-to-table plates and a rotating whiskey flight, minutes from Sandy Station.',
        cta:'Reserve a table', link:'#', media:null },
      { name:'Foothill Yoga Collective', tag:'Yoga Studio',
        blurb:'Sunrise flow, restorative, and hot yoga classes for every level.',
        cta:'Try your first class free', link:'#', media:null },
    ]
  },
  {
    theme:'theme-draper', num:'06', name:'Draper',
    model:{ name:'Talia Fenwick', role:'Featured Model',
      bio:'Talia is a Draper-raised creative and this month\'s spotlight face for the south valley.',
      media:null },
    ads:[
      { name:'Draper Peak Dental Studio', tag:'Dental Care',
        blurb:'Modern, comfort-first dentistry with evening and weekend appointments.',
        cta:'Book a cleaning', link:'#', media:null },
      { name:'The Oak & Ember Grill', tag:'Restaurant',
        blurb:'Wood-fired steaks and a patio with views toward Corner Canyon.',
        cta:'See tonight\'s specials', link:'#', media:null },
      { name:'SouthPointe Boutique', tag:'Fashion Boutique',
        blurb:'Curated women\'s fashion with new arrivals dropping every Friday.',
        cta:'Shop new arrivals', link:'#', media:null },
    ]
  },
];

function mediaBlock(media, placeholderText, extraClass){
  const cls = 'media-box' + (extraClass ? ' '+extraClass : '');
  if(!media || !media.url){
    return `<div class="${cls} placeholder"><span>${placeholderText}</span></div>`;
  }
  if(media.type === 'video'){
    return `<div class="${cls}"><video src="${media.url}" autoplay muted loop playsinline></video></div>`;
  }
  return `<div class="${cls}"><img src="${media.url}" alt=""></div>`;
}

function standardAdHtml(a){
  return `
    <div class="ad-card">
      ${mediaBlock(a.media, '[ '+a.name.toUpperCase()+' PHOTO / GIF / VIDEO ]', 'ad-media')}
      <div class="biz-name">${a.name}</div>
      <div class="biz-tag">${a.tag}</div>
      <div class="biz-blurb">${a.blurb}</div>
      <div class="biz-cta"><a href="${a.link}" target="_blank" rel="noopener">${a.cta}</a></div>
    </div>
  `;
}

/* The "storefront" layout: an immersive, full-bleed ad made to feel like
   walking into the business — arched name banner, scattered product art,
   a price burst, a torn-paper promo note, and a sticker CTA button.
   Swap in a real photo of the store by filling in the ad's "media" field
   (see the CITIES list above) and it replaces the illustrated shelf art. */
function storefrontAdHtml(a){
  const hasPhoto = a.media && a.media.url;
  const bg = hasPhoto
    ? `<img class="sf-bg" src="${a.media.url}" alt="">`
    : `
      <div class="sf-product cup" style="left:8%; top:8%; width:60px; height:78px; background:linear-gradient(160deg,#8B1E2E,#5C1420); transform:rotate(-4deg);">FOUNTAIN<br>DRINK</div>
      <div class="sf-product bag" style="left:6%; top:52%; width:66px; height:88px; background:linear-gradient(160deg,#FF9A3D,#E8511C); transform:rotate(-3deg);">CHIPS</div>
      <div class="sf-product cup" style="right:10%; top:16%; width:50px; height:68px; background:linear-gradient(160deg,#6C4AB6,#3F2A75); transform:rotate(5deg);">SLURPEE</div>
      <div class="sf-product cup" style="right:26%; top:56%; width:44px; height:58px; background:linear-gradient(160deg,#3FDDE0,#1E8A8D); transform:rotate(-6deg);">ICED<br>DRINK</div>
    `;
  return `
    <div class="storefront-ad ${hasPhoto ? 'has-photo' : ''}">
      ${bg}
      <div class="sf-banner">
        <span class="chev">&lt;</span><span class="biz-title">${a.name}</span><span class="chev">&gt;</span>
        <span class="sf-loc">${a.loc || a.tag}</span>
      </div>
      <div class="sf-stage">
        ${a.badge ? `<div class="sf-badge-new" style="left:10%; top:46%;">${a.badge}</div>` : ''}
        ${a.price ? `<div class="sf-price" style="left:8%; top:66%;"><span class="amt">${a.price}</span>${a.discount ? `<span class="pct">${a.discount}</span>` : ''}</div>` : ''}
        ${a.promoLines ? `<div class="sf-note" style="right:6%; top:10%;">${a.promoLines.join('<br>')}</div>` : ''}
      </div>
      <div class="sf-blurb">${a.blurb}</div>
      <div class="sf-footer">
        <a class="sf-cta" href="${a.link}" target="_blank" rel="noopener">${a.cta}</a>
        <div class="sf-next" onclick="nextPage()" title="Next page">→</div>
      </div>
    </div>
  `;
}

function cityPage(c){
  const total = CITIES.length;
  const adsHtml = c.ads.map(a => a.style === 'storefront' ? storefrontAdHtml(a) : standardAdHtml(a)).join('');
  return {
    id:'city-'+c.num,
    cls:'city-page '+c.theme,
    html:`
      <div class="city-band"><span class="cname">${c.name}</span><span class="cnum">${c.num} / ${String(total).padStart(2,'0')}</span></div>
      <div class="stamp">Local Spotlight</div>
      <div class="section-label">Featured Face</div>
      <div class="spotlight-card">
        ${mediaBlock(c.model.media, '[ MODEL PHOTO ]', 'spotlight-photo')}
        <div class="spotlight-info">
          <p class="name">${c.model.name}</p>
          <p class="role">${c.model.role}</p>
          <p class="bio">${c.model.bio}</p>
        </div>
      </div>
      <div class="section-label">This Month's Businesses</div>
      ${adsHtml}
      <div class="footer-note">Sample ad — reserve this spot for your business</div>
    `
  };
}


/* ========================================================================
   SPOTLIGHT EDITOR — full customization for all pages
   Saves your magazine data in this browser for now. The next phase can
   replace localStorage with an online database without changing the editor.
   ======================================================================== */
const STORAGE_KEY = 'spotlightMagazineFullV2';
const DEFAULT_MAGAZINE = {
  cover: {
    eyebrow: 'Wasatch Front · Digital Edition',
    mainText: 'The ',
    highlight: 'Spotlight',
    subtitle: 'Salt Lake City → Draper',
    issueTag: 'Issue 01 · August 2026',
    coverPhotoUrl: null,
  },
  cities: cloneData(DEFAULT_CITIES),
  backCover: {
    heading: 'Want your business<br>in the next issue?',
    description: 'Every issue reaches locals scrolling Instagram — no printing, no mailers, just one link people actually tap. New cities added every month.',
    ctaText: 'DM ',
    handle: '@yourhandle',
    ctaEnd: '<br>to reserve your spot'
  }
};

function cloneData(x){ return JSON.parse(JSON.stringify(x)); }
function getMagazine(){
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if(saved) return JSON.parse(saved);
    const oldCities = localStorage.getItem('spotlightMagazineCitiesV1');
    if(oldCities) {
      const mag = cloneData(DEFAULT_MAGAZINE);
      mag.cities = JSON.parse(oldCities);
      return mag;
    }
    return cloneData(DEFAULT_MAGAZINE);
  } catch(e) { return cloneData(DEFAULT_MAGAZINE); }
}
const MAGAZINE = getMagazine();
const CITIES = MAGAZINE.cities;
function saveMagazine(){
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MAGAZINE));
    setTimeout(() => {
      renderPageContent();
      render();
      location.reload();
    }, 100);
  } catch(e) {
    console.error('Failed to save:', e);
    alert('Error saving changes');
  }
}

const editorCss = document.createElement('style');
editorCss.textContent = `
  #editorToggle{position:fixed;top:16px;right:16px;z-index:9999;border:0;border-radius:999px;padding:11px 16px;background:#FFD23F;color:#14121A;font-weight:800;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.35)}
  #editorPanel{position:fixed;inset:0;z-index:9998;background:rgba(20,18,26,.96);display:none;overflow:auto;padding:24px 14px 50px;color:#F5F1E8;font-family:'Space Grotesk',sans-serif}
  #editorPanel.open{display:block}
  .editor-inner{width:min(1000px,100%);margin:auto}
  .editor-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:18px}
  .editor-head h2{margin:0;font-family:'Anton',sans-serif;font-size:30px;text-transform:uppercase}
  .editor-actions{display:flex;gap:8px;flex-wrap:wrap}
  .ed-btn{border:0;border-radius:8px;padding:10px 14px;font-weight:800;cursor:pointer;font-size:12px}
  .ed-primary{background:#FF4D6D;color:white}.ed-light{background:#F5F1E8;color:#14121A}.ed-danger{background:#b8001f;color:#fff}.ed-secondary{background:#6C4AB6;color:white}
  .editor-card{background:#f5f1e8;color:#14121A;border-radius:14px;padding:18px;margin:12px 0;border-left:5px solid #FF4D6D}
  .editor-card h3{margin:0 0 14px;font-family:'Anton',sans-serif;text-transform:uppercase;font-size:22px}
  .editor-card h4{margin:12px 0 10px;font-family:'Anton',sans-serif;font-size:16px;text-transform:uppercase}
  .ed-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
  .ed-col-2{grid-template-columns:repeat(2,1fr)}.ed-col-3{grid-template-columns:repeat(3,1fr)}.ed-col-full{grid-template-columns:1fr}
  .ed-field{display:flex;flex-direction:column}
  .ed-field label{display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px;color:#3a3540}
  .ed-field input[type=color]{width:60px;height:40px;border:none;border-radius:6px;cursor:pointer}
  .ed-field input,.ed-field textarea,.ed-field select{border:2px solid #ddd;border-radius:7px;padding:10px;font:inherit;background:white;color:#14121A;flex:1}
  .ed-field input:focus,.ed-field textarea:focus,.ed-field select:focus{outline:none;border-color:#FF4D6D;box-shadow:0 0 0 3px rgba(255,77,109,0.1)}
  .ed-field textarea{min-height:75px;resize:vertical;font-family:monospace;font-size:12px}
  .ed-field.full{grid-column:1/-1}
  .ed-field.inline{display:flex;flex-direction:row;gap:8px;align-items:flex-end}.ed-field.inline label{flex:0 0 120px;margin:0}.ed-field.inline input{flex:1}
  .ad-editor{border:2px solid #ddd;border-radius:10px;padding:12px;margin:12px 0}.ad-editor h4{margin:0 0 10px}
  .remove-ad{float:right}.editor-note{font-size:12px;opacity:.75;margin:6px 0 18px}
  .editor-tabs{display:flex;gap:6px;margin-bottom:18px;flex-wrap:wrap}
  .editor-tab{border:none;background:#f5f1e8;color:#14121A;padding:10px 16px;border-radius:8px;cursor:pointer;font-weight:700;font-size:12px;text-transform:uppercase;transition:all 0.2s}
  .editor-tab.active{background:#FF4D6D;color:white}.editor-tab:hover{background:#FFD23F;color:#14121A}
  .color-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}
  .color-swatch{width:100%;aspect-ratio:1;border-radius:8px;cursor:pointer;border:3px solid transparent;transition:all 0.2s}
  .color-swatch:hover{transform:scale(1.1)}
  .color-swatch.selected{border-color:#14121A}
  .preview-box{background:white;border:2px solid #ddd;border-radius:10px;padding:16px;margin-top:12px;color:#14121A;font-size:14px;line-height:1.5;max-height:200px;overflow:auto}
`;
document.head.appendChild(editorCss);

const editorToggle = document.createElement('button');
editorToggle.id='editorToggle'; editorToggle.textContent='EDIT MAGAZINE';
document.body.appendChild(editorToggle);

const editorPanel=document.createElement('div');
editorPanel.id='editorPanel';
editorPanel.innerHTML=`<div class="editor-inner">
  <div class="editor-head"><div><h2>SpotLIGHT Editor</h2><div class="editor-note">Full customization — edit cover, cities, back cover, colors, text, and more. Changes save to browser.</div></div><div class="editor-actions"><button class="ed-btn ed-primary" id="saveMagazine">SAVE & PREVIEW</button><button class="ed-btn ed-light" id="closeEditor">CLOSE</button></div></div>
  <div class="editor-tabs" id="editorTabs"></div>
  <div id="editorContent"></div>
</div>`;
document.body.appendChild(editorPanel);

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
let activeTab = 'cover';
function renderEditor(){
  const tabs = document.getElementById('editorTabs');
  const root = document.getElementById('editorContent');
  const tabList = ['cover', ...MAGAZINE.cities.map((c,i)=>'city-'+i), 'back'];
  const tabLabels = ['COVER', ...MAGAZINE.cities.map(c=>c.name.toUpperCase()), 'BACK COVER'];
  
  tabs.innerHTML = tabList.map((t,i)=>`<button class="editor-tab ${t===activeTab?'active':''}" data-tab="${t}">${tabLabels[i]}</button>`).join('');
  tabs.querySelectorAll('.editor-tab').forEach(btn=>btn.onclick=()=>{activeTab=btn.dataset.tab;renderEditor();});
  
  if(activeTab==='cover'){
    const c = MAGAZINE.cover;
    root.innerHTML = `
      <div class="editor-card">
        <h3>Front Cover</h3>
        <div class="ed-grid ed-col-2">
          <div class="ed-field full"><label>Eyebrow / Issue Tag</label><input data-cover="eyebrow" value="${esc(c.eyebrow)}"></div>
          <div class="ed-field"><label>Main Text</label><input data-cover="mainText" value="${esc(c.mainText)}"></div>
          <div class="ed-field"><label>Highlight Word</label><input data-cover="highlight" value="${esc(c.highlight)}"></div>
          <div class="ed-field full"><label>Subtitle</label><input data-cover="subtitle" value="${esc(c.subtitle)}"></div>
          <div class="ed-field full"><label>Issue Line (e.g. "Issue 01 · August 2026")</label><input data-cover="issueTag" value="${esc(c.issueTag)}"></div>
          <div class="ed-field full"><label>Cover Photo URL</label><input data-cover="coverPhotoUrl" placeholder="https://.../photo.jpg" value="${esc(c.coverPhotoUrl||'')}"></div>
        </div>
      </div>
    `;
  } else if(activeTab==='back'){
    const b = MAGAZINE.backCover;
    root.innerHTML = `
      <div class="editor-card">
        <h3>Back Cover</h3>
        <div class="ed-grid ed-col-2">
          <div class="ed-field full"><label>Main Heading</label><textarea data-back="heading">${esc(b.heading)}</textarea></div>
          <div class="ed-field full"><label>Description Text</label><textarea data-back="description">${esc(b.description)}</textarea></div>
          <div class="ed-field"><label>CTA Text Start</label><input data-back="ctaText" value="${esc(b.ctaText)}"></div>
          <div class="ed-field"><label>Handle/Username</label><input data-back="handle" value="${esc(b.handle)}"></div>
          <div class="ed-field full"><label>CTA Text End (HTML allowed)</label><input data-back="ctaEnd" value="${esc(b.ctaEnd)}"></div>
        </div>
      </div>
    `;
  } else if(activeTab.startsWith('city-')){
    const ci = +activeTab.split('-')[1];
    const c = MAGAZINE.cities[ci];
    const total = MAGAZINE.cities.length;
    const adsHtml = (c.ads||[]).map((a,ai)=>`
      <div class="ad-editor" data-ai="${ai}"><h4>Business ${ai+1}<button class="ed-btn ed-danger remove-ad" data-ci="${ci}" data-ai="${ai}" style="padding:6px 9px;font-size:11px">REMOVE</button></h4>
        <div class="ed-grid ed-col-2">
          <div class="ed-field"><label>Business Name</label><input data-ad="name" value="${esc(a.name)}"></div>
          <div class="ed-field"><label>Category / Tag</label><input data-ad="tag" value="${esc(a.tag)}"></div>
          <div class="ed-field full"><label>Description</label><textarea data-ad="blurb">${esc(a.blurb)}</textarea></div>
          <div class="ed-field"><label>Button Text</label><input data-ad="cta" value="${esc(a.cta)}"></div>
          <div class="ed-field"><label>Link/Website</label><input data-ad="link" value="${esc(a.link)}" placeholder="https://..."></div>
          <div class="ed-field full"><label>Photo/GIF URL</label><input data-ad-media="url" value="${esc(a.media?.url||'')}" placeholder="https://.../image.jpg"></div>
        </div>
      </div>`).join('');
    root.innerHTML = `
      <div class="editor-card">
        <h3>${esc(c.name)} <button class="ed-btn ed-danger remove-city" data-ci="${ci}" style="float:right;padding:7px 10px;font-size:11px">DELETE CITY</button></h3>
        <div class="ed-grid ed-col-3">
          <div class="ed-field"><label>City Name</label><input data-key="name" value="${esc(c.name)}"></div>
          <div class="ed-field"><label>City Number</label><input data-key="num" value="${esc(c.num)}"></div>
          <div class="ed-field"><label>Theme</label><select data-key="theme"><option value="theme-slc">Purple</option><option value="theme-wj">Green</option><option value="theme-mc">Coral</option><option value="theme-ch">Teal</option><option value="theme-sandy">Gold</option><option value="theme-draper">Violet</option></select></div>
        </div>
        <h4 style="margin-top:18px">Featured Person</h4>
        <div class="ed-grid ed-col-2">
          <div class="ed-field"><label>Name</label><input data-model="name" value="${esc(c.model?.name)}"></div>
          <div class="ed-field"><label>Role</label><input data-model="role" value="${esc(c.model?.role)}"></div>
          <div class="ed-field full"><label>Bio</label><textarea data-model="bio">${esc(c.model?.bio)}</textarea></div>
          <div class="ed-field full"><label>Photo URL</label><input data-model-media="url" value="${esc(c.model?.media?.url||'')}" placeholder="https://.../photo.jpg"></div>
        </div>
        <h4 style="margin-top:18px">Businesses (${c.ads.length})</h4>
        <div class="ads">${adsHtml}</div>
        <button class="ed-btn ed-secondary add-ad" data-ci="${ci}">+ ADD BUSINESS</button>
      </div>
    `;
    const sel = root.querySelector('select[data-key="theme"]'); if(sel) sel.value=c.theme||'theme-slc';
  }
}

function bindEditor(){
  document.getElementById('saveMagazine').onclick=()=>{
    if(activeTab==='cover'){
      document.querySelectorAll('[data-cover]').forEach(el=>{
        MAGAZINE.cover[el.dataset.cover] = el.value || null;
      });
    } else if(activeTab==='back'){
      document.querySelectorAll('[data-back]').forEach(el=>{
        MAGAZINE.backCover[el.dataset.back] = el.value;
      });
    } else if(activeTab.startsWith('city-')){
      const ci = +activeTab.split('-')[1];
      const c = MAGAZINE.cities[ci];
      document.querySelectorAll('[data-key]').forEach(el=>c[el.dataset.key]=el.value);
      c.model=c.model||{}; document.querySelectorAll('[data-model]').forEach(el=>c.model[el.dataset.model]=el.value);
      const mediaUrl=document.querySelector('[data-model-media]')?.value.trim(); c.model.media=mediaUrl?{type:'image',url:mediaUrl}:null;
      document.querySelectorAll('.ad-editor[data-ai]').forEach(adEl=>{const ai=+adEl.dataset.ai,a=c.ads[ai]; if(!a)return; adEl.querySelectorAll('[data-ad]').forEach(el=>a[el.dataset.ad]=el.value); const u=adEl.querySelector('[data-ad-media]')?.value.trim(); a.media=u?{type:u.toLowerCase().endsWith('.gif')?'gif':'image',url:u}:null;});
    }
    saveMagazine();
  };
  document.getElementById('closeEditor').onclick=()=>{ editorPanel.classList.remove('open'); };
  
  document.querySelectorAll('.remove-city').forEach(b=>b.onclick=()=>{if(confirm('Delete this city page?')){MAGAZINE.cities.splice(+b.dataset.ci,1);MAGAZINE.cities.forEach((c,i)=>c.num=String(i+1).padStart(2,'0'));renderEditor();bindEditor();}});
  document.querySelectorAll('.add-ad').forEach(b=>b.onclick=()=>{const c=MAGAZINE.cities[+b.dataset.ci];c.ads=c.ads||[];c.ads.push({name:'New Business',tag:'Local Business',blurb:'Tell readers what makes this business special.',cta:'Visit Website',link:'#',media:null});renderEditor();bindEditor();});
  document.querySelectorAll('.remove-ad').forEach(b=>b.onclick=()=>{MAGAZINE.cities[+b.dataset.ci].ads.splice(+b.dataset.ai,1);renderEditor();bindEditor();});
  
  // Add new city button
  const addCityBtn = document.querySelector('#editorContent .ed-btn.ed-primary:last-of-type');
  if(!document.querySelector('#addCityBtn')){
    const btn = document.createElement('button');
    btn.id = 'addCityBtn';
    btn.className = 'ed-btn ed-primary';
    btn.style.marginTop = '18px';
    btn.textContent = '+ ADD NEW CITY';
    btn.onclick = ()=>{MAGAZINE.cities.push({theme:'theme-slc',num:String(MAGAZINE.cities.length+1).padStart(2,'0'),name:'New City',model:{name:'New Creator',role:'Featured Creator',bio:'Add a local story here.',media:null},ads:[]});activeTab='city-'+(MAGAZINE.cities.length-1);renderEditor();bindEditor();};
    document.getElementById('editorContent').appendChild(btn);
  }
}
editorToggle.onclick=()=>{editorPanel.classList.add('open');renderEditor();bindEditor();};

const PAGES = [
  {
    id:'cover',
    cls:'cover',
    html:()=>`
      <div class="top-tag">${MAGAZINE.cover.issueTag}</div>
      <div class="title">${MAGAZINE.cover.mainText}<br>${MAGAZINE.cover.highlight}<span class="hi">.</span></div>
      <div class="sub">${MAGAZINE.cover.subtitle}</div>
      ${mediaBlock(MAGAZINE.cover.coverPhotoUrl ? {type:'image',url:MAGAZINE.cover.coverPhotoUrl} : null, '[ COVER MODEL PHOTO ]<br>Your name / brand here', 'cover-photo')}
      <div class="flip-hint">Tap or swipe to flip →</div>
    `
  },
  ...MAGAZINE.cities.map(cityPage),
  {
    id:'back',
    cls:'back-cover',
    html:()=>`
      <h2>${MAGAZINE.backCover.heading}</h2>
      <p>${MAGAZINE.backCover.description}</p>
      <div class="cta-box">DM <span class="handle">${MAGAZINE.backCover.handle}</span>${MAGAZINE.backCover.ctaEnd}</div>
    `
  },
];

const total = PAGES.length;
let current = 0;
const bookEl = document.getElementById('book');
const dotsEl = document.getElementById('dots');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageCountEl = document.getElementById('pageCount');

function renderPageContent() {
  bookEl.innerHTML = '';
  dotsEl.innerHTML = '';
  PAGES.forEach((p, idx) => {
    const pageEl = document.createElement('div');
    pageEl.className = 'page';
    pageEl.id = 'page-'+idx;
    const html = typeof p.html === 'function' ? p.html() : p.html;
    pageEl.innerHTML = `
      <div class="face front ${p.cls}"><div class="sheet">${html}</div></div>
      <div class="face back"><div class="mark">Spotlight</div></div>
    `;
    bookEl.appendChild(pageEl);

    const dot = document.createElement('button');
    dot.className = 'dot';
    dot.title = p.id;
    dot.onclick = () => { current = idx; render(); };
    dotsEl.appendChild(dot);
  });
}
renderPageContent();

function render(){
  PAGES.forEach((p, idx) => {
    const el = document.getElementById('page-'+idx);
    const flipped = idx < current;
    el.classList.toggle('flipped', flipped);
    el.style.zIndex = flipped ? (idx + 1) : (total - idx + 1);
  });
  [...dotsEl.children].forEach((d, idx) => d.classList.toggle('active', idx === current));
  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === total - 1;
  pageCountEl.textContent = `Page ${current+1} of ${total}`;
}
function nextPage(){ if(current < total - 1){ current++; render(); } }
function prevPage(){ if(current > 0){ current--; render(); } }

let touchStartX = null;
window.addEventListener('DOMContentLoaded', () => {
  const bookWrap = document.querySelector('.book-wrap');
  if(bookWrap) {
    bookWrap.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; });
    bookWrap.addEventListener('touchend', e => {
      if(touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if(dx < -40) nextPage();
      if(dx > 40) prevPage();
      touchStartX = null;
    });
  }
  render();
});
document.addEventListener('keydown', e => {
  if(e.key === 'ArrowRight') nextPage();
  if(e.key === 'ArrowLeft') prevPage();
});
</script>
</body>
</html>
