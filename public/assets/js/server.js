function createAlert(alert, data) {
    let row;

    let streamerIcon = $(`<img class='rounded' width='50' height='50' src='${alert.icon}' alt='Streamer icon'>`);
    let streamerName = $("<span style='margin: 1em;' translate='no'>").text(alert.name);
    let streamer = $("<td data-i18n-label='colStreamer'>").attr("data-label", $("#row-streamer").text()).append([streamerIcon, streamerName]);

    let discordHashtag = $('<svg class="channelIcon" width="24" height="24" viewBox="0 0 24 24">\n' +
        '    <path fill="currentColor" fill-rule="evenodd" d="M5.88657 21C5.57547 21 5.3399 20.7189 5.39427 20.4126L6.00001 17H2.59511C2.28449 17 2.04905 16.7198 2.10259 16.4138L2.27759 15.4138C2.31946 15.1746 2.52722 15 2.77011 15H6.35001L7.41001 9H4.00511C3.69449 9 3.45905 8.71977 3.51259 8.41381L3.68759 7.41381C3.72946 7.17456 3.93722 7 4.18011 7H7.76001L8.39677 3.41262C8.43914 3.17391 8.64664 3 8.88907 3H9.87344C10.1845 3 10.4201 3.28107 10.3657 3.58738L9.76001 7H15.76L16.3968 3.41262C16.4391 3.17391 16.6466 3 16.8891 3H17.8734C18.1845 3 18.4201 3.28107 18.3657 3.58738L17.76 7H21.1649C21.4755 7 21.711 7.28023 21.6574 7.58619L21.4824 8.58619C21.4406 8.82544 21.2328 9 20.9899 9H17.41L16.35 15H19.7549C20.0655 15 20.301 15.2802 20.2474 15.5862L20.0724 16.5862C20.0306 16.8254 19.8228 17 19.5799 17H16L15.3632 20.5874C15.3209 20.8261 15.1134 21 14.8709 21H13.8866C13.5755 21 13.3399 20.7189 13.3943 20.4126L14 17H8.00001L7.36325 20.5874C7.32088 20.8261 7.11337 21 6.87094 21H5.88657ZM9.41045 9L8.35045 15H14.3504L15.4104 9H9.41045Z"></path>\n' +
        '</svg>');
    let channelName = $("<span translate='no'>").text(alert.channel_name);
    let channelLink = $("<a class='channelMention'>").attr("href", `https://discord.com/channels/${data.guild_id}/${alert.channel_id}`)
        .append([discordHashtag, channelName]);
    let channel = $("<td data-i18n-label='colChannel'>").attr("data-label", $("#row-channel").text()).append(channelLink);

    let start = $("<td data-i18n-label='colStart' translate='no'>").attr("data-label", $("#row-start").text()).text(alert.start);
    let end = $("<td data-i18n-label='colEnd' translate='no'>").attr("data-label", $("#row-end").text()).text(alert.end);

    let editButton = $("<button class='btn btn-primary btn-sm modal-edit-btn' type='button' data-bs-toggle='modal' data-bs-target='#modal-edit' data-i18n='editButton'>")
        .text("Modifier")
        .on("click", () => {
            $("#streamer-edit").val(alert.name);
            $("#start-edit").val(alert.start);
            $("#end-edit").val(alert.end);
            $("#form-edit").on("submit", function (e) {
                e.preventDefault();
                $("#form-edit [type='submit']").attr("disabled", "");

                $.post("/edit", {
                    guild_id: data.guild_id,
                    streamer_id: alert.id,
                    streamer_name: $("#streamer-edit").val(),
                    start: $("#start-edit").val(),
                    end: $("#end-edit").val()
                }).done((res) => {
                    // Update variables
                    alert.name = res.display_name;
                    alert.start = $("#start-edit").val();
                    alert.end = $("#end-edit").val();
                    alert.id = res.id;

                    // Update alerts list
                    streamerName.text(alert.name);
                    streamerIcon.attr("src", res.profile_image_url);
                    start.text(alert.start);
                    end.text(alert.end);

                    // Reset and close modal
                    $("#modal-edit").modal('toggle');
                    $("#form-edit").trigger("reset").off("submit");
                    $("#form-edit [type='submit']").removeAttr("disabled");
                }).fail(err => {
                    let alertMsg = $("<span>");
                    let alert = $("<div class='alert alert-danger alert-dismissible' role='alert'>")
                        .append($("<button class='btn-close' type='button' data-bs-dismiss='alert' aria-label='Close'>"))
                        .append(alertMsg);
                    switch (err.status) {
                        case 400:
                            alertMsg.text("Paramètres manquants");
                            break;
                        case 401:
                            alertMsg.text("Permissions insuffisantes");
                            break;
                        case 406:
                            alertMsg.text("Streameur ou streameuse inconnu(e)");
                            break;
                        case 409:
                            alertMsg.text("Une alerte existe déjà pour ce streameur ou cette streameuse");
                            break;
                        default:
                            alertMsg.text("Erreur interne du serveur");
                            break;
                    }
                    $("#form-edit .modal-body").prepend(alert);
                    $("#form-edit [type='submit']").removeAttr("disabled");
                });
            });
        });
    let moveButton = $("<a class='dropdown-item modal-move-btn' href='#' data-bs-toggle='modal' data-bs-target='#modal-move' data-i18n='moveButton'>")
        .text("Déplacer")
        .on("click", () => {
            $("#form-move").on("submit", function (e) {
                e.preventDefault();
                $("#form-move [type='submit']").attr("disabled", "");

                $.post("/move", {
                    guild_id: data.guild_id,
                    streamer_id: alert.id,
                    channel: $("#channel-move").val()
                }).done((res) => {
                    // Update variables
                    alert.channel_id = res.channel_id;
                    alert.channel_name = res.channel_name;

                    // Update alerts list
                    channelName.text(alert.channel_name);
                    channelLink.attr("href", `https://discord.com/channels/${data.guild_id}/${alert.channel_id}`);

                    // Reset and close modal
                    $("#modal-move").modal('toggle');
                    $("#form-move").trigger("reset").off("submit");
                    $("#form-move [type='submit']").removeAttr("disabled");
                }).fail(err => {
                    let alertMsg = $("<span>");
                    let alert = $("<div class='alert alert-danger alert-dismissible' role='alert'>")
                        .append($("<button class='btn-close' type='button' data-bs-dismiss='alert' aria-label='Close'>"))
                        .append(alertMsg);
                    switch (err.status) {
                        case 400:
                            alertMsg.text("Paramètres manquants");
                            break;
                        case 401:
                            alertMsg.text("Permissions insuffisantes");
                            break;
                        case 404:
                            alertMsg.text("Canal texte non trouvé");
                            break;
                        default:
                            alertMsg.text("Erreur interne du serveur");
                            break;
                    }
                    $("#form-move .modal-body").prepend(alert);
                    $("#form-move [type='submit']").removeAttr("disabled");
                });
            });
        });
    let duplicateButton = $("<a class='dropdown-item modal-duplicate-btn' href='#' data-bs-toggle='modal' data-bs-target='#modal-duplicate' data-i18n='duplicateButton'>")
        .text("Dupliquer")
        .on("click", () => {
            $("#streamer-duplicate").val(alert.name);
            $("#start-duplicate").val(alert.start);
            $("#end-duplicate").val(alert.end);
            $("#channel-duplicate").val(alert.channel_id);
            $("#form-duplicate").on("submit", function (e) {
                e.preventDefault();
                $("#form-duplicate [type='submit']").attr("disabled", "");

                $.post("/create", {
                    guild_id: data.guild_id,
                    streamer_name: $("#streamer-duplicate").val(),
                    start: $("#start-duplicate").val(),
                    end: $("#end-duplicate").val(),
                    channel: $("#channel-duplicate").val()
                }).done((res) => {
                    // Update alerts list
                    createAlert(res.alert, res);
                    translatePage();

                    // Reset and close modal
                    $("#modal-duplicate").modal('toggle');
                    $("#form-duplicate").trigger("reset").off("submit");
                    $("#form-duplicate [type='submit']").removeAttr("disabled");
                }).fail(err => {
                    let alertMsg = $("<span>");
                    let alert = $("<div class='alert alert-danger alert-dismissible' role='alert'>")
                        .append($("<button class='btn-close' type='button' data-bs-dismiss='alert' aria-label='Close'>"))
                        .append(alertMsg);
                    switch (err.status) {
                        case 400:
                            alertMsg.text("Paramètres manquants");
                            break;
                        case 401:
                            alertMsg.text("Permissions insuffisantes");
                            break;
                        case 404:
                            alertMsg.text("Canal texte non trouvé");
                            break;
                        case 406:
                            alertMsg.text("Streameur ou streameuse inconnu(e)");
                            break;
                        case 409:
                            alertMsg.text("Une alerte existe déjà pour ce streameur ou cette streameuse");
                            break;
                        default:
                            alertMsg.text("Erreur interne du serveur");
                            break;
                    }
                    $("#form-duplicate .modal-body").prepend(alert);
                    $("#form-duplicate [type='submit']").removeAttr("disabled");
                });
            });
        });
    let deleteButton = $("<a class='dropdown-item modal-delete-btn' href='#' data-bs-toggle='modal' data-bs-target='#modal-delete' data-i18n='deleteButton'>")
        .text("Supprimer")
        .on("click", () => {
            $("#form-delete").on("submit", function (e) {
                e.preventDefault();
                $("#form-delete [type='submit']").attr("disabled", "");

                $.post("/delete", {
                    guild_id: data.guild_id,
                    streamer_id: alert.id
                }).done(() => {
                    // Update alerts list
                    row.remove();

                    // Reset and close modal
                    $("#modal-delete").modal('toggle');
                    $("#form-delete").trigger("reset").off("submit");
                    $("#form-delete [type='submit']").removeAttr("disabled");
                }).fail(err => {
                    let alertMsg = $("<span>");
                    let alert = $("<div class='alert alert-danger alert-dismissible' role='alert'>")
                        .append($("<button class='btn-close' type='button' data-bs-dismiss='alert' aria-label='Close'>"))
                        .append(alertMsg);
                    switch (err.status) {
                        case 400:
                            alertMsg.text("Paramètres manquants");
                            break;
                        case 401:
                            alertMsg.text("Permissions insuffisantes");
                            break;
                        default:
                            alertMsg.text("Erreur interne du serveur");
                            break;
                    }
                    $("#form-delete .modal-body").prepend(alert);
                    $("#form-delete [type='submit']").removeAttr("disabled");
                });
            });
        });
    let menuButton = $("<button class='btn btn-primary dropdown-toggle dropdown-toggle-split' data-bs-toggle='dropdown' aria-expanded='false' type='button'>")
        .append($("<div class='dropdown-menu'>")
            .append([moveButton, duplicateButton, $("<hr class='dropdown-divider'>"), deleteButton])
        );
    let actions = $("<td data-i18n-label='colActions'>").attr("data-label", $("#row-actions").text()).append(
        $("<div class='btn-group'>").append([editButton, menuButton])
    );

    row = $("<tr>").append([streamer, channel, start, end, actions]);
    $("#alerts").prepend(row);
}

$(() => {
    $.get('/alerts', {
        server: window.location.pathname.split("/")[2]
    }).done(data => {
        $("#guild_icon").attr("src", data.icon);
        $("#guild_name").html($("<strong>").text(data.guild_name));

        $("#create-button").on('click', function () {
            $("#form-create").on("submit", function (e) {
                e.preventDefault();
                $("#form-create [type='submit']").attr("disabled", "");

                $.post("/create", {
                    guild_id: data.guild_id,
                    streamer_name: $("#streamer-create").val(),
                    start: $("#start-create").val(),
                    end: $("#end-create").val(),
                    channel: $("#channel-create").val()
                }).done((res) => {
                    // Update alerts list
                    createAlert(res.alert, res);
                    translatePage();

                    // Reset and close modal
                    $("#modal-create").modal('toggle');
                    $("#form-create").trigger("reset").off("submit");
                    $("#form-create [type='submit']").removeAttr("disabled");
                }).fail(err => {
                    let alertMsg = $("<span>");
                    let alert = $("<div class='alert alert-danger alert-dismissible' role='alert'>")
                        .append($("<button class='btn-close' type='button' data-bs-dismiss='alert' aria-label='Close'>"))
                        .append(alertMsg);
                    switch (err.status) {
                        case 400:
                            alertMsg.text("Paramètres manquants");
                            break;
                        case 401:
                            alertMsg.text("Permissions insuffisantes");
                            break;
                        case 404:
                            alertMsg.text("Canal texte non trouvé");
                            break;
                        case 406:
                            alertMsg.text("Streameur ou streameuse inconnu(e)");
                            break;
                        case 409:
                            alertMsg.text("Une alerte existe déjà pour ce streameur ou cette streameuse");
                            break;
                        default:
                            alertMsg.text("Erreur interne du serveur");
                            break;
                    }
                    $("#form-create .modal-body").prepend(alert);
                    $("#form-create [type='submit']").removeAttr("disabled");
                });
            });
        });

        data.alerts.forEach(alert => createAlert(alert, data));

        $(".loading").hide();
        $(".content").show();
        translatePage();

        // Reset modal when leaving
        $(".modal").on("hidden.bs.modal", () => {
            $("form").off("submit").trigger("reset");
        })
    }).fail(error => {
        $(".loading").text(`Erreur : ${error}`)
    })
});