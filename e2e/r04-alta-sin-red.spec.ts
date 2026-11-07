/**
 * R-04 · Alta de persona sin red (TRL 5.16 / 6.26).
 * No debe perderse el formulario ni acabar en chrome-error://.
 * Los POST deben quedar en cola IndexedDB para reenviar al volver la red.
 *
 * Requiere: npx playwright install && npm run test:e2e
 */
import { test, expect } from "@playwright/test";

const OFFLINE_MSG =
  /No hay conexión|siguen aquí|se enviarán solos|sin señal/i;

const EXPERT_USER = {
  id: "exp-e2e",
  name: "Experto E2E",
  email: "exp-e2e@nara.test",
  role: "Experto",
  roleId: "experto",
  terr: "Salento",
  org: "Consiente",
  contact: "",
  status: "Activo",
  href: "/experto",
  nk: "exp-e2e",
};

test.describe("R-04 alta sin red", () => {
  test("sin red: conserva formulario, encola y no cae en chrome-error", async ({
    page,
    context,
  }) => {
    // Playwright evalúa rutas en orden inverso: las específicas van al final.
    await page.route("**/api/**", async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      if (url.includes("/api/auth/me")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true, user: EXPERT_USER }),
        });
        return;
      }
      if (url.includes("/api/app-state")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true, slices: {} }),
        });
        return;
      }
      if (url.includes("/api/people")) {
        if (method === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ ok: true, people: [], total: 0 }),
          });
          return;
        }
        await route.abort("failed");
        return;
      }
      if (url.includes("/api/worklists")) {
        if (method === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ ok: true, items: [] }),
          });
          return;
        }
        await route.abort("failed");
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    // proxy.ts solo exige cookie firmada (3 segmentos); /api/auth/me aporta el usuario.
    await context.addCookies([
      {
        name: "nara_sid",
        value: "e2e.session.token",
        url: "http://127.0.0.1:3004/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    await page.goto("/experto");
    await expect(page).toHaveURL(/\/experto/);
    // Cerrar drawer TEO si abrió solo (tapa el formulario).
    const teoClose = page.getByRole("dialog").filter({ hasText: /^TEO|Sin señal/ }).getByRole("button").first();
    if (await teoClose.isVisible().catch(() => false)) {
      await teoClose.click().catch(() => undefined);
    }
    await page.getByRole("button", { name: /Nueva persona/i }).click();
    const modal = page.getByRole("dialog").filter({ hasText: "Nueva persona" });
    await expect(modal).toBeVisible();
    await modal.getByLabel(/^Nombre$/i).fill("Ana");
    await modal.getByLabel(/Apellido/i).fill("Prueba");
    await modal.getByLabel(/Fecha de nacimiento/i).fill("1990-05-15");
    await modal.getByLabel(/Vereda|barrio|Lugar/i).fill("Vereda Cocora");

    await context.setOffline(true);

    await modal
      .getByRole("button", { name: /Agregar y empezar visita|Guardar|Continuar|Evaluar/i })
      .click();

    await expect(page).not.toHaveURL(/chrome-error:/);
    expect(page.url()).not.toMatch(/chrome-error/);

    const body = await page.locator("body").innerText();
    expect(body).toMatch(OFFLINE_MSG);
    await expect(page.getByLabel(/Nombre/i).first()).toHaveValue(/Ana/i);

    const queued = await page.evaluate(async () => {
      return new Promise<{ count: number; kinds: string[] }>((resolve, reject) => {
        const req = indexedDB.open("nara-offline-v1", 1);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains("queue")) {
            resolve({ count: 0, kinds: [] });
            return;
          }
          const tx = db.transaction("queue", "readonly");
          const getAll = tx.objectStore("queue").getAll();
          getAll.onsuccess = () => {
            const rows = (getAll.result || []) as { kind?: string }[];
            resolve({
              count: rows.length,
              kinds: rows.map((r) => String(r.kind || "")),
            });
          };
          getAll.onerror = () => reject(getAll.error);
        };
      });
    });
    expect(queued.count).toBeGreaterThan(0);
    expect(queued.kinds).toContain("people");
  });
});
