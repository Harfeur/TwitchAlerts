const {Client} = require("pg");

class Database extends Client {

    constructor(url) {
        super({
            connectionString: url,
            ssl: {
                rejectUnauthorized: false
            }
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
        await this.query("DELETE FROM alerts WHERE guild_id=$1", [guild_id]);
        return await this.query("DELETE FROM guilds WHERE guild_id=$1", [guild_id]);
    }

    async listAllAlerts() {
        if (this.debug) return;
        return (await this.query("SELECT * FROM alerts JOIN guilds USING(guild_id)")).rows;
    }

    async listAlertsByGuild(guild_id) {
        if (this.debug) return;
        return (await this.query("SELECT * FROM alerts JOIN guilds USING(guild_id) WHERE guild_id=$1", [guild_id])).rows;
    }
    async countAlertsByGuild(guild_id) {
        if (this.debug) return;
        return (await this.query("SELECT COUNT(alert_streamer) AS count FROM alerts WHERE guild_id=$1", [guild_id])).rows[0].count;
    }

    async listAlertsByStreamer(streamer) {
        if (this.debug) return;
        return (await this.query("SELECT * FROM alerts JOIN guilds USING(guild_id) WHERE alert_streamer=$1", [streamer])).rows;
    }

    async addAlert(guild_id, streamer, channel, start, end) {
        if (this.debug) return;
        await this.addNewGuild(guild_id);
        return await this.query("INSERT INTO alerts(guild_id, alert_streamer, alert_channel, alert_start, alert_end) VALUES ($1, $2, $3, $4, $5)",
            [guild_id, streamer, channel, start, end]);
    }
    async editAlert(guild_id, oldStreamer, newStreamer, start, end) {
        if (this.debug) return;
        return await this.query("UPDATE alerts SET alert_start=$1, alert_end=$2, alert_streamer=$3 WHERE alert_streamer=$4 AND guild_id=$5",
            [start, end, newStreamer, oldStreamer, guild_id]);
    }
    async moveAlert(guild_id, streamer, channel) {
        if (this.debug) return;
        return await this.query("UPDATE alerts SET alert_channel=$1, WHERE alert_streamer=$2 AND guild_id=$3",
            [channel, streamer, guild_id]);
    }
    async deleteAlert(guild_id, streamer) {
        if (this.debug) return;
        return await this.query("DELETE FROM alerts WHERE guild_id=$1 AND alert_streamer=$2", [guild_id, streamer]);
    }
    async streamOnline(streamer) {
        if (this.debug) return;
        return await this.query("UPDATE alerts SET alert_live=true WHERE alert_streamer=$1", [streamer]);
    }
    async streamOffline(streamer) {
        if (this.debug) return;
        return await this.query("UPDATE alerts SET alert_live=false WHERE alert_streamer=$1", [streamer]);
    }
    async setAlertMessage(guild_id, streamer, message) {
        if (this.debug) return;
        return await this.query("UPDATE alerts SET alert_message=$1 WHERE alert_streamer=$2 AND guild_id=$3",
            [message, streamer, guild_id]);
    }
    async removeAlertMessage(guild_id, streamer) {
        if (this.debug) return;
        return await this.query("UPDATE alerts SET alert_message='0' WHERE alert_streamer=$1 AND guild_id=$2",
            [streamer, guild_id]);
    }

    async getAlert(guild_id, streamer) {
        if (this.debug) return;
        return (await this.query("SELECT * FROM alerts JOIN guilds USING(guild_id) WHERE guild_id=$1 AND alert_streamer=$2", [guild_id, streamer])).rows;
    }
}

module.exports = Database;