# Dueflow frontend

React 18 + Vite + Tailwind CSS + Redux Toolkit **RTK Query**, for the Dueflow MSME
payables agent (45-day / Sec. 43B(h) compliance).

```bash
npm install
npm run dev        # http://localhost:5173  (proxies /api -> http://localhost:5000)
npm run build
```

## Structure

```
src/
  app/            store.js                      Redux store
  services/       api.js                        base RTK Query API + auth header + 401 -> logout
                  crudService.js                generic list/get/create/update/delete (matches crudController)
                  authService.js                login
                  approvalService.js            approval gate: POST approval -> PUT plan status -> audit log
                  index.js
  features/auth/  authSlice.js                  token + user, persisted
  config/         resources.jsx                 columns/fields for all 16 backend resources
                  navigation.js                 sidebar
  components/     ui/ common/ layout/           Button, Modal, DataTable, ResourcePage, AppLayout ...
  pages/          auth/ dashboard/ agent/ plans/
  utils/          format.js                     INR, dates
```

Adding a table to the UI is one entry in `config/resources.jsx` plus a nav item.

## Pages
- **Dashboard** – outstanding, at-risk (urgent/overdue) amount, watch list, plans awaiting approval, recent runs.
- **Agent run detail** – step-by-step trace (stage, tool, reasoning, input/output, retries), cancel run.
- **Payment plan detail** – items with the agent's reasoning, budget used, and the **human approval gate**
  (approve / request changes / reject; every decision is also written to the audit log).
- Generic list + create/edit/delete pages for every other resource, role-aware (admin / approver / viewer).

## Backend assumptions (please check)
1. **No login route was in the files shared.** `authService.js` assumes
   `POST /api/auth/login -> { token, user: { id, name, email, role, org_id } }`. Change it there if yours differs.
2. The API has no filter by `run_id` / `plan_id`, so detail pages fetch the newest 100 rows and filter in the browser;
   likewise the dashboard summarises the newest 100 invoices. Letting `getAll` accept `where` filters on model
   fields would remove both limits.
3. The CRUD API only stores records; it does not start the Python agent. "Start run" creates an `agent_runs` row.
