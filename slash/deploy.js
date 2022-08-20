exports.run = async (client, interaction) => {

    const [globalCmds, guildCmds] = client.container.slashcmds.partition(c => !c.conf.guildOnly);

    await interaction.deferReply();

    await interaction.editReply("Deploying commands");

    await client.guilds.cache.get(interaction.guild.id)?.commands.set(guildCmds.map(c => c.commandData));

    await client.application?.commands.set(globalCmds.map(c => c.commandData)).catch(e => console.log(e));

    await interaction.editReply("All commands deployed!");
};

exports.commandData = {
    name: "deploy",
    description: "Deploy the created commands.",
    options: [],
    dm_permission: false,
    default_member_permissions: "8"
};

exports.conf = {
    guildOnly: true
};