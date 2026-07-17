# View this app on your Android phone (quickest way)

This runs the app from your computer and opens it on your phone's browser
over the same WiFi — no app store, no deployment, no build step.

## 1. Find your computer's local IP address

**Mac:**
```bash
ipconfig getifaddr en0
```
(If that's blank, try `en1` instead of `en0`.)

**Windows (Command Prompt):**
```bash
ipconfig
```
Look for "IPv4 Address" under your active WiFi adapter (something like `192.168.1.23`).

**Linux:**
```bash
hostname -I
```

You'll get something like `192.168.1.23`. That's **your computer's IP** —
write it down.

## 2. Serve the frontend

From the `frontend/` folder:

```bash
cd carwash-app/frontend
npx serve -l 8080
```

(No `serve` installed? `npx` will offer to install it automatically — say yes.
Alternative if you have Python: `python3 -m http.server 8080`.)

## 3. (Optional but recommended) Start the backend too

If you want signup/login/booking to actually work, also start the backend
in a second terminal — see `backend/README.md`. As long as it's running on
the same computer, the phone will reach it automatically at
`http://<your-computer-IP>:5000` (the app now auto-detects this — see the
note below).

If you skip this step, the app still works for browsing — it just falls
back to sample data and shows "Can't reach the server" if you try to log in
or book. That's expected until the backend's running.

## 4. Open it on your phone

- Make sure your **phone is on the same WiFi network** as your computer.
- Open your phone's browser and go to:
  ```
  http://<your-computer-IP>:8080
  ```
  e.g. `http://192.168.1.23:8080`

## 5. (Optional) Make it feel like an app

In Chrome on Android:
1. Open the site above.
2. Tap the **⋮** menu → **Add to Home screen**.
3. It'll now launch full-screen from an icon on your home screen, like an app.

---

**Note on what changed:** `frontend/js/auth.js` now auto-detects the API
host from whatever URL you're viewing the page from, instead of always
calling `localhost:5000`. That's what makes step 3 work — "localhost" on
your phone would otherwise mean the phone itself, not your computer.

**Troubleshooting:** if the phone can't connect at all, it's almost always
a firewall blocking the port on your computer, or the phone being on a
different WiFi network (e.g. one device on 5GHz guest WiFi, the other on
the main network). Turning off "AP/client isolation" on your router or
temporarily allowing the port through your firewall usually fixes it.
