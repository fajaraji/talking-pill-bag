# CodeBuddy CLI session: T15-hooks-order-fix

- Started: 2026-10-15 17:13:48
- Model: glm-5.3
- Command: codebuddy -p -y --model glm-5.3 --max-turns 100 --output-format json

## Prompt

Read .codebuddy/rules/project.md. Focused fix: React Rules of Hooks violation introduced by the hydration fix in commit ab187f9.

Problem (seen in the browser): "React has detected a change in the order of Hooks called by TodayPage" (app/today/page.tsx line ~254), the same in FamilyPage (app/family/page.tsx) and JoinPageInner (app/join/page.tsx). The pages do `if (!isHydrated) return <loading markup>` BEFORE later useEffect/useCallback/useMemo calls, so the number of hooks changes between renders. In production this can crash the page; it already breaks /join, so a senior phone never finishes joining.

Fix for EVERY page and component under app/ (/, /today, /family, /join, /bp, /questions, /summary, /add and any component they render):
- Split each page into an outer component and an inner component: the outer calls only useStore() and returns <LoadingShell /> (app/loading-shell.tsx) while !isHydrated, otherwise returns <PageInner />. All other hooks live in the inner component, before any conditional return.
- Search the code for any other `return` placed before hook calls and fix it the same way.
- In lib/store.tsx, do not read localStorage during render (const token = getDeviceToken() at the top of StoreProvider): keep the token/role in state that is set inside the initial useEffect, so the server and the first client render match.

Verify: npm run typecheck, npm test, npm run build. Then start the dev server on port 3001 and, with curl or a small node script, request /, /today, /family, /join, /bp, /questions, /summary and check each returns 200; stop the dev server afterwards. Commit: "fix: keep hook order stable by splitting pages into loading shell and inner component". Do not touch .env.local.


## Result


## Stats

- Duration: 5.1 min
- Turns: 
- Is error: 
- Session id: 
- Cost/usage:   total_cost_usd=
