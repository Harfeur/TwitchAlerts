const {Client} = require("pg");

class Database extends Client {

    constructor(url) {
        super({
            connectionString: url,
        });
        this.connect();

        this.debug = process.env.NODE_ENV !== "production";
    }

    async addNewGuild(guild_id) {
        if (this.debug) return;
        return await this.query("INSERT INTO guilds(guild_id) VALUES ($1) ON CONFLICT DO NOTHING", [guild_id]);
    }

    async setGuildLanguage(guild_id, language) {
        if (this.debug) return;
        await this.addNewGuild(guild_id);
        return await this.query("UPDATE guilds SET guild_language=$1 WHERE guild_id=$2", [language, guild_id]);
    }

    async deleteGuild(guild_id) {
        if (this.debug) return;
        const alerts = await this.listAlertsByGuild(guild_id);
        for (const alert of alerts) {
            await this.deleteAlert(guild_id, alert.streamer_id);
        }
        return await this.query("DELETE FROM guilds WHERE guild_id=$1", [guild_id]);
    }

    async listAllAlerts() {
        return (await this.query("SELECT * FROM streamers JOIN alerts USING(streamer_id) JOIN guilds USING(guild_id)")).rows;
    }

    async listAllStreamers() {
        return (await this.query("SELECT * FROM streamers")).rows;
    }

    async listAlertsByGuild(guild_id) {
        return (await this.query("SELECT * FROM streamers JOIN alerts USING(streamer_id) JOIN guilds USING(guild_id) WHERE guild_id=$1", [guild_id])).rows;
    }
    async countAlertsByGuild(guild_id) {
        return (await this.query("SELECT COUNT(streamer_id) AS count FROM alerts WHERE guild_id=$1", [guild_id])).rows[0].count;
    }

    async listAlertsByStreamer(streamer) {
        return (await this.query("SELECT * FROM streamers JOIN alerts USING(streamer_id) JOIN guilds USING(guild_id) WHERE streamer_id=$1", [streamer])).rows;
    }

    async addStreamer(streamer) {
        return await this.query("INSERT INTO streamers(streamer_id) VALUES ($1) ON CONFLICT DO NOTHING", [streamer]);
    }

    async removeStreamerIfEmpty(streamer) {
        const q = await this.listAlertsByStreamer(streamer);
        if (q.length === 0) await this.query("DELETE FROM streamers WHERE streamer_id=$1", [streamer]);
    }

    async addAlert(guild_id, streamer, channel, start, end, display_game, display_viewers) {
        if (this.debug) return;
        await this.addNewGuild(guild_id);
        await this.addStreamer(streamer);
        await this.query("INSERT INTO alerts(guild_id, streamer_id, alert_channel, alert_start, alert_end, alert_pref_display_game, alert_pref_display_viewers) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [guild_id, streamer, channel, start, end, display_game, display_viewers]);
    }
    async editAlert(guild_id, oldStreamer, newStreamer, start, end, display_game, display_viewers) {
        if (this.debug) return;
        if (oldStreamer !== newStreamer) await this.addStreamer(newStreamer);
        await this.query("UPDATE alerts SET alert_start=$1, alert_end=$2, streamer_id=$3, alert_pref_display_game=$4, alert_pref_display_viewers=$5 WHERE streamer_id=$6 AND guild_id=$7",
            [start, end, newStreamer, display_game, display_viewers, oldStreamer, guild_id]);
        if (oldStreamer !== newStreamer) {
            await this.removeStreamerIfEmpty(oldStreamer);
        }
    }
    async moveAlert(guild_id, streamer, channel) {
        if (this.debug) return;
        return await this.query("UPDATE alerts SET alert_channel=$1 WHERE streamer_id=$2 AND guild_id=$3",
            [channel, streamer, guild_id]);
    }
    async deleteAlert(guild_id, streamer) {
        if (this.debug) return;
        await this.query("DELETE FROM alerts WHERE guild_id=$1 AND streamer_id=$2", [guild_id, streamer]);
        await this.removeStreamerIfEmpty(streamer);
    }
    async setAlertMessage(guild_id, streamer, message) {
        if (this.debug) return;
        return await this.query("UPDATE alerts SET alert_message=$1 WHERE streamer_id=$2 AND guild_id=$3",
            [message, streamer, guild_id]);
    }
    async removeAlertMessage(guild_id, streamer) {
        if (this.debug) return;
        return await this.query("UPDATE alerts SET alert_message=NULL WHERE streamer_id=$1 AND guild_id=$2",
            [streamer, guild_id]);
    }

    async getAlert(guild_id, streamer) {
        return (await this.query("SELECT * FROM streamers JOIN alerts USING(streamer_id) JOIN guilds USING(guild_id) WHERE guild_id=$1 AND streamer_id=$2", [guild_id, streamer])).rows;
    }

    async deleteFromID(id) {
        if (this.debug) return;
        return await this.query("DELETE FROM alerts WHERE guild_id=$1 OR alert_channel=$1", [id]);
    }
}

module.exports = Database;