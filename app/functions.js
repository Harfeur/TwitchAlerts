const DiscordOauth2 = require("discord-oauth2");

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';


/**
 * @param {DiscordOauth2} oauth Discord Bot
 * @param {Map} cookies Liste des utilisateurs connectés et leurs cookies
 * @return {checkToken, makeid}
 */
module.exports = function (oauth, cookies) {

    async function checkToken(cookie) {
        if (!cookies.has(cookie)) return false;
        let data = cookies.get(cookie)
        if (data.expires_in * 1000 + data.time <= Date.now() + 60000) {
            let res;
            try {
                res = await oauth.tokenRequest({
                    refreshToken: data.refreshToken,
                    grantType: "refresh_token"
                });
            } catch (err) {
                console.error(err);
                return false;
            }
            cookies.set(cookie, {
                ...data,
                ...res,
                time: Date.now()
            });
            data = cookies.get(cookie);
        }
        if (data.timeGuilds + 60000 <= Date.now()) { // Refresh guilds
             try {
                let guilds = await oauth.getUserGuilds(data.access_token);
                cookies.set(cookie, {
                    ...data,
                    guilds: guilds,
                    timeGuilds: Date.now()
                });
            } catch (err) {
                console.error(err);
                return false;
            }
        }
        return true;
    }

    //random id
    function makeid(length) {
        let result = '';
        const charactersLength = CHARS.length;
        for (let i = 0; i < length; i++) {
            result += CHARS.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    return {checkToken, makeid};
}