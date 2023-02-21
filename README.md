# Twitch Alerts

I am NOT affiliated with Twitch.

## How to use  ?

For the regular user, you can [add the bot to your server](https://discord.com/oauth2/authorize?client_id=748846588163784794&scope=bot%20applications.commands&permissions=478208).

### I want to host the bot

You are allowed to host the bot and make changes, but you need to respect the license : You can't use the bot as a commercial purpose (you can't make money using the bot).

To host the bot, you can download all the files, run `npm install`, and add the following variables to the environment:
```
DATABASE_URL = Link to the database (I use PostgreSQL database)
DISCORD_CLIENT_ID = ID of your Discord application
DISCORD_CLIENT_SECRET = Client secret of your Discord application
DISCORD_REDIRECT_URI = Redirect URL : it is normally https://yoururl.com/connect
PORT = Port of the web server
TWITCH_BOT_CLIENT_ID = ID of your Twitch application
TWITCH_BOT_CLIENT_SECRET = Client secret of your Twitch application
TWITCHBOT = Bot secret of your Discord application
URL = URL of your server (with port if different from default)
```

You can then run the bot with `node index.js` and (optionally) the webserver with `node web.js`.

## License

Inspired from GuideBot (see LICENSE)

<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License</a>.
