# Using Playwright Test for VS Code

Quick steps to get Playwright Test integrated into VS Code for this project.

1. Install the Playwright Test extension for VS Code
   - Open the Extensions pane (Cmd+Shift+X) and install: ms-playwright.playwright

2. Recommended workspace extensions
   - The repository recommends Playwright extension via `.vscode/extensions.json`.

3. Run or Debug a test file
   - Open any test file under `tests/`.
   - Use the Run Code Lens provided by the extension, or use the Run / Debug panel.
   - Alternatively use the debug configuration "Run Playwright Test (current file)" from the Run and Debug UI.

4. Debugging with PWDEBUG
   - Use the debug configuration "Debug Playwright Test (current file)" which sets `PWDEBUG=1` and runs the test in headed mode; you'll be able to interact with the browser.
   - You can also use `npm run test:debug` to run `PWDEBUG=1 npx playwright test` from the terminal.

5. Using the MCP server (optional)
   - Start the local server: `npm run mcp-server`.
   - Trigger tests remotely via POST to `http://localhost:3001/run` with JSON `{ "spec":"tests/02_course_consume_and_certificate.spec.ts", "headed": true }`.

6. Open Playwright traces
   - When a test produces a trace (trace.zip), open it with:

```bash
npx playwright show-trace path/to/trace.zip
```

Notes
- The repo already contains `playwright.config.ts`; the VS Code extension will pick up configuration automatically.
- If you prefer skipping onboarding, regenerate an up-to-date `auth.json` via `npm run save-auth` and the `tests/02_*.spec.ts` will use it if present.
