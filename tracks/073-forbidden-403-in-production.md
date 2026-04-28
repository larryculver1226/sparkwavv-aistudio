# Track 073 - Forbidden 403 in Production

## 1. Plan

**Goal:** Fix the 403 Forbidden error occurring when accessing `https://sparkwavv.ai/favicon.ico`. 

**Findings so far:**
* I have investigated `server.ts` for static file serving, CORS, and Helmet.
* **Static File Middleware:** `express.static` is currently set to serve `__dirname` instead of explicitly pointing to a `public` or `assets` folder. Also, there is currently no `favicon.ico` existing in the `/public/` directory, which causes the request to fall through to the wildcard `app.get('*')` catch-all route instead of simply returning the icon. 
* **CORS & Helmet:** You are not currently using the `cors` or `helmet` middleware in `server.ts`. The `Referrer Policy: strict-origin-when-cross-origin` seen in the screenshot is the default Google Frontend (Load Balancer / Cloud Run) behavior. The 403 is likely happening because either the Google Frontend or framework is strictly rejecting the wildcard HTML route fallback for an `.ico` image request.

**Proposed Implementation Steps:**
1. **Add a proper `favicon.ico`** to the `public/` directory (I can generate or place an empty/basic one to prevent missing file errors).
2. **Update Static File Serving:** Ensure `express.static` correctly and safely serves the `public/` files in development and the `dist/` files in production, instead of just dumping `__dirname`.
3. **Add explicit `favicon.ico` route fallback:** Add a lightweight `app.get('/favicon.ico', (req, res) => res.status(204).end());` to prevent falling through to the React App's `index.html` fallback if the file isn't found.
4. **(Optional pending your approval) Add `cors` or `helmet`**: If you explicitly want to open up CORS or manage the `Referrer-Policy` headers properly across the app, I can also add standard `head` securing packages.

Please review this plan. Say **Approved** or **Proceed** and I will implement these fixes!
