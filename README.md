# Goldthrifts Store

A catalogue website for Goldthrifts Store. Shoppers browse the clothes, open an item and tap
**Chat on WhatsApp to buy**. There is no cart and no online payment. Everything is agreed on WhatsApp.

The shop owner updates the clothes from an admin page at `/admin` on their phone or laptop.
No code, no files, no redeploying.

---

## Part 1 — For the shop owner: adding and updating clothes

Go to **https://YOUR-SITE.netlify.app/admin** (the person who set the site up will give you the exact link) and log in with your GitHub account.

### Add a new item
1. Tap **Products** on the left, then **New product**.
2. Fill in the form: name, price, who it's for, category, condition, sizes, a one-line description, a full description.
3. Under **Photos** tap **Add photo** and pick photos from your phone or computer. The first photo is the main one.
4. Leave **Show in New arrivals** on so it appears under the New arrivals tab.
5. Tap **Publish**. The site updates by itself in about a minute.

### Mark an item as sold
Open the item, switch **Sold out** on, tap **Publish**. It stays on the site, greyed out, with a Sold out label. Turn it off again if it comes back in stock.

### Put an item on sale
Open the item, type the original price into **Old price**, and put the new lower price in **Price**. Publish. The item shows the old price crossed out and a Sale label.

### Remove an item completely
Open the item and tap **Delete entry** at the top. Confirm. Publish is automatic.

### Change your WhatsApp number, social links or the words on the home page
Tap **Shop settings** on the left. You can change the hero photos and text, the intro, the two promo cards, the WhatsApp number, Instagram, TikTok and the footer note. Publish when done.

### Tips
- Portrait photos (taller than wide) look best. Take them against a plain wall in daylight.
- Keep names short: "Camel wrap coat", not "Beautiful camel coloured wrap coat for ladies".
- The one-line description is what shoppers see on the shop page. Put the fabric or the best thing about it there.
- If the site does not update after two minutes, refresh the page. If it still hasn't, message the person who set it up.

---

## Part 2 — One-time setup (the technical person)

This takes about 15 minutes. You need a free [GitHub](https://github.com) account and a free [Netlify](https://netlify.com) account.

### 1. Put the site on GitHub
Create a new repository on GitHub called `goldthrifts-store` (public or private, both work), then in this folder:

```bash
git init
git add .
git commit -m "Goldthrifts store"
git branch -M main
git remote add origin https://github.com/Olajr0452/goldthrifts-store.git
git push -u origin main
```

### 2. Connect it to Netlify
1. In Netlify click **Add new site → Import an existing project → GitHub** and choose the repo.
2. Build command: `node scripts/build.js`. Publish directory: `.` (a dot). These are already in `netlify.toml`, so Netlify should fill them in for you.
3. Click **Deploy**. When it finishes, rename the site under **Site configuration → Site details → Change site name**, for example `goldthrifts`. Your shop is now live at `https://goldthrifts.netlify.app`.

### 3. Turn on the admin login (GitHub OAuth)
The admin page logs in with GitHub. Netlify handles the handshake, you only need to register an OAuth app once.

1. On GitHub go to **Settings → Developer settings → OAuth Apps → New OAuth App**.
   - Application name: `Goldthrifts admin`
   - Homepage URL: `https://goldthrifts.netlify.app` (your site URL)
   - Authorization callback URL: `https://api.netlify.com/auth/done`
   - Click **Register application**, then **Generate a new client secret**. Keep this tab open.
2. In Netlify go to **Site configuration → Access & security → OAuth → Install provider → GitHub**, paste the Client ID and Client secret, save.
3. Open `admin/config.yml` in this folder and change `Olajr0452/goldthrifts-store` to your real `username/repo`. Also change the two `goldthrifts.netlify.app` lines to your real site URL. Commit and push:

```bash
git add admin/config.yml && git commit -m "Point admin at the repo" && git push
```

4. Visit `https://goldthrifts.netlify.app/admin`, click **Login with GitHub**, approve. You should see the products list.

### 4. Give the shop owner access
1. The owner creates a free GitHub account (just email and password) if they don't have one.
2. On the repo go to **Settings → Collaborators → Add people** and add their GitHub username. They accept the invite by email.
3. Send them the admin link. They log in with GitHub and follow Part 1 above.

### 5. Replace the placeholder clothes
The 18 items in the shop are placeholders with stock photos. Delete them from the admin page as real stock goes in, or delete the files in `content/products/` and the photos in `images/products/` and push.

### Custom domain (optional)
In Netlify: **Domain management → Add a domain**. Follow the prompts, then update `site_url` and `display_url` in `admin/config.yml`.

---

## Part 3 — How it's built

Plain HTML, CSS and JavaScript. No framework, no build tool beyond one tiny script.

```
index.html            Home page (hero, promos, product grid with filters and search)
product.html          Product detail page with the WhatsApp button
css/style.css         Styles
js/app.js             Loads the data and renders both pages
content/settings.json Shop name, WhatsApp number, socials, home page copy  (edited from /admin)
content/products/     One JSON file per product                            (edited from /admin)
data/products.json    Generated list of all products (do not edit by hand)
scripts/build.js      Builds data/products.json from content/products/ — Netlify runs this on every deploy
images/products/      Product photos uploaded from /admin
images/site/          Logo, hero and promo photos
admin/                The admin panel (Decap CMS) and its form definitions
netlify.toml          Netlify build settings
```

### WhatsApp message
The button opens `https://wa.me/<number>?text=...` with a pre-filled message like:

> Hi Goldthrifts! I'm interested in *Camel wrap coat* (₦35,000), size M. Is it still available?
> https://goldthrifts.netlify.app/product.html?id=camel-wrap-coat

The number comes from Shop settings, so it can be changed from the admin page without touching code.

### Running it on your computer
Any static server works, for example:

```bash
python3 -m http.server 8765
```

then open http://localhost:8765. If you change product files by hand, run `node scripts/build.js` first.

To test the admin page locally without GitHub, uncomment `local_backend: true` in `admin/config.yml`, run `npx decap-server` in one terminal and the static server in another, then open http://localhost:8765/admin.

### Saved items
The heart icon saves items in the shopper's own browser only. It is a convenience, not an account.

### Photo credits
Placeholder photos are from Unsplash and are free to use. Replace them with your own.
