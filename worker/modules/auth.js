const data = require("../data.json")


const {
	waitAndTypeX,
	waitAndClickX } = require('../core/page-utils')

async function login(ctx, payload = {}) {
    const page = ctx?.page;

    if (!page) 
        return { 
            ok: false, 
            reason: 'ctx.page is missing',
            data: {
                "isAuthorized": false
            }
        };

    try {
        let currentService = payload.model;

        let timeWait = 45000;

        await ctx.page.goto(data.loginUrls[currentService]);
        await waitAndTypeX(page, data.xpaths.auth.loginLabel[currentService], payload.username);
        await waitAndTypeX(page, data.xpaths.auth.passwordLabel[currentService], payload.password);

        const navPromise = page.waitForNavigation({ waitUntil: 'networkidle2', timeout: timeWait })
            .then(() => 'nav')
            .catch(() => 'nav_timeout');

        const badPromise = ctx.page.waitForXPath(data.xpaths.auth.incorrectPassMessage[currentService], {timeout: timeWait})
            .then(() => 'bad')
            .catch(() => 'bad_timeout');

        const clickOk = await waitAndClickX(page, data.xpaths.auth.authButton[currentService]);
        if (!clickOk) 
            return { ok: false, reason: 'click failed' };

        const winner = await Promise.race([navPromise, badPromise]);

        if (winner === 'bad') {
            return {
                ok: false,
                reason: "incorrect password or account don't reggered"
            }
        }

        // DeepSeek (SPA) often does not trigger a full navigation after login.
        // Treat a navigation timeout as SUCCESS only if we actually reached the chat UI.
        const chatInputXPath =
            data?.xpaths?.chat?.inputLabel?.[currentService] ||
            '//textarea';
        try {
            await ctx.page.waitForXPath(chatInputXPath, { timeout: timeWait });
        } catch {
            return {
                ok: false,
                reason: 'login did not reach chat UI (input not found)'
            };
        }

        return {
            ok: true,
            data: {
                "isAuthorized": true
            }
        }
    } catch (er) {
        return {
            ok: false,
            reason: 'catched error when tried login',
            data: {
                "moreInformation": er
            }
        }
    };
}

async function register(ctx, payload) {
    const page = ctx?.page;

    if (!page) 
        return { ok: false, reason: 'ctx.page is missing' };

    try {
        let currentService = payload.model;

        await ctx.page.goto(data.registerUrls[currentService]);

        await waitAndTypeX(page, data.xpaths.register.emailLabel[currentService], payload.username);
        await waitAndTypeX(page, data.xpaths.register.passwordLabel[currentService], payload.password);
        await waitAndTypeX(page, data.xpaths.register.confirmPasswordLabel[currentService], payload.password);
        await waitAndClickX(page, data.xpaths.register.sendCodeButton[currentService]);

        let code = "123123";
        //let code = await getCodeByAPI(..., payload.emailApiKey, ...);
        await waitAndTypeX(page, data.xpaths.register.codeLabel[currentService], code);
        await waitAndClickX(page, data.xpaths.register.signUpButton[currentService]);

        // тут логика для получения ошибки о том что такая учетка уже создана или возвращение ok = true

        /*const navPromise = page.waitForNavigation({ waitUntil: 'networkidle2', timeout: timeWait })
            .then(() => 'nav')
            .catch(() => 'nav_timeout');

        const badPromise = ctx.page.waitForXPath(data.xpaths.incorrectPassMessage[currentService], {timeout: timeWait})
            .then(() => 'bad')
            .catch(() => 'bad_timeout');

        const clickOk = await waitAndClickX(page, data.xpaths.authButton[currentService]);
        if (!clickOk) 
            return { ok: false, reason: 'click failed' };

        const winner = await Promise.race([navPromise, badPromise]);

        if (winner === 'bad') {
            return {
                ok: false,
                reason: "incorrect password or account don't reggered"
            }
        }*/

        return {
            ok: true
        }
    } catch (er) {
        return {
            ok: false
        }
    };
}

module.exports = {
    login,
    register
};