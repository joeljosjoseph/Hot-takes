import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

const APP = "http://localhost:3000";
const contexts: BrowserContext[] = [];

test.afterEach(async () => {
    await Promise.all(contexts.splice(0).map((c) => c.close()));
});

// ---------- helpers ----------

// A new context is a new browser profile, so each player gets their own identity.
// reducedMotion switches off the results animation, which keeps tests fast and stable.
async function newPlayer(browser: Browser): Promise<Page> {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    contexts.push(context);
    const page = await context.newPage();
    await page.goto(APP);
    return page;
}

async function createRoom(host: Page, name: string): Promise<string> {
    await host.getByLabel("Your name").fill(name);
    await host.getByRole("button", { name: "Create a room" }).click();
    const label = await host.locator('[aria-label^="Room code "]').getAttribute("aria-label");
    return label!.slice(-4);
}

async function joinRoom(page: Page, name: string, code: string) {
    await page.getByLabel("Your name").fill(name);
    await page.getByLabel("Room code").fill(code);
    await page.getByRole("button", { name: "Join", exact: true }).click();
    await expect(page.getByText(/Waiting for the host to start/)).toBeVisible();
}

// No assertion after submitting or voting: the last person's click moves the
// whole room on, so any "Submitted" message can vanish before we could check it.
async function answer(page: Page, name: string) {
    await page.getByPlaceholder("Your answer").fill(`${name}'s answer`);
    await page.getByRole("button", { name: "Submit answer" }).click();
}

async function vote(page: Page, forName: string) {
    await page.getByRole("button", { name: `${forName}'s answer`, exact: true }).click();
}

// ---------- tests ----------

test("three players play a full game, from lobby to winner", async ({ browser }) => {
    test.setTimeout(90_000);

    const ann = await newPlayer(browser);
    const code = await createRoom(ann, "Ann");
    const bob = await newPlayer(browser);
    const cy = await newPlayer(browser);
    await joinRoom(bob, "Bob", code);
    await joinRoom(cy, "Cy", code);
    const players = [ann, bob, cy];

    // The lobby updates live for everyone
    for (const page of players) {
        await expect(page.getByRole("heading", { name: "Players (3)" })).toBeVisible();
    }

    await ann.getByRole("button", { name: "Start game" }).click();

    // Each round: Bob's answer gets two votes, Ann's gets one, Cy's gets none
    for (let round = 1; round <= 3; round++) {
        if (round > 1) await ann.getByRole("button", { name: "Next round" }).click();

        for (const page of players) {
            await expect(page.getByText(`Round ${round} of 3`)).toBeVisible();
        }

        await answer(ann, "Ann");
        await answer(bob, "Bob");
        await answer(cy, "Cy");

        for (const page of players) {
            await expect(page.getByText(/Vote for your favourite/)).toBeVisible();
        }

        await vote(ann, "Bob");
        await vote(bob, "Ann");
        await vote(cy, "Bob");

        await expect(ann.getByRole("heading", { name: `Results` })).toBeVisible();
        await expect(ann.getByText(`Round ${round} of 3`)).toBeVisible();
        await expect(ann.getByText("Bob got 2 votes")).toBeVisible();
        await expect(ann.getByText("Ann got 1 vote")).toBeVisible();
        await expect(ann.getByText("Cy got 0 votes")).toBeVisible();

        // Scores accumulate: 100 points per vote
        const board = ann.getByRole("list", { name: "Scoreboard" }).getByRole("listitem");
        await expect(board).toHaveCount(3);
        await expect(board.nth(0)).toContainText("Bob");
        await expect(board.nth(0)).toContainText(String(200 * round));
        await expect(board.nth(1)).toContainText("Ann");
        await expect(board.nth(1)).toContainText(String(100 * round));
    }

    // The last round's button says "Show final scores"
    await ann.getByRole("button", { name: "Show final scores" }).click();
    for (const page of players) {
        await expect(page.getByRole("heading", { name: "Bob wins" })).toBeVisible();
    }
    await expect(ann.getByText("600 points")).toBeVisible();

    // Play again returns everyone to the lobby
    await ann.getByRole("button", { name: "Play again" }).click();
    for (const page of players) {
        await expect(page.getByText("Share this code with your friends")).toBeVisible();
    }
    await expect(ann.getByRole("heading", { name: "Players (3)" })).toBeVisible();
});

test("only the host can start, and only with two players", async ({ browser }) => {
    const host = await newPlayer(browser);
    const code = await createRoom(host, "Ann");
    const start = host.getByRole("button", { name: "Start game" });
    await expect(start).toBeDisabled();

    const bob = await newPlayer(browser);
    await joinRoom(bob, "Bob", code);
    await expect(start).toBeEnabled();
    await expect(bob.getByRole("button", { name: "Start game" })).toHaveCount(0);
});

test("shows an error for a room code that doesn't exist", async ({ browser }) => {
    const page = await newPlayer(browser);
    await page.getByLabel("Your name").fill("Zed");
    await page.getByLabel("Room code").fill("ZZZZ");
    await page.getByRole("button", { name: "Join", exact: true }).click();
    // Not getByRole("alert"): Next.js has its own hidden role="alert" element
    await expect(page.getByText("Room not found")).toBeVisible();
});