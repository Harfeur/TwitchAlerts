$(document).ready(function() {
    $.get('/servers').done(data => {
        data.active.forEach(server => {
            let serverImage = $("<img class='rounded mb-3 fit-cover' width='150' height='150'>").attr("src", server.icon);
            let serverLink = $("<a>").attr("href", `/dashboard/${server.id}`).append(serverImage);

            let serverName = $("<h5 class='fw-bold mb-0'>").append($("<strong>").text(server.name));

            let serverAlerts = $("<p class='text-muted mb-2'>").text(`${server.alerts} alerte${server.alerts >= 2 ? "s" : ""}`);

            let element = $("<div class='col mb-4'>").append(
                $("<div class='text-center'>").append([serverLink, serverName, serverAlerts])
            );
            $("#active").append(element);
        });

        data.inactive.forEach(server => {
            let serverImage = $("<img class='rounded mb-3 fit-cover' width='150' height='150' style='filter: grayscale(100%);'>")
                .attr("src", server.icon);
            let serverLink = $("<a target='_blank'>").attr("href", server.invite).append(serverImage);

            let serverName = $("<h5 class='fw-bold mb-0'>").append($("<strong>").text(server.name));

            let element = $("<div class='col mb-4'>").append(
                $("<div class='text-center'>").append([serverLink, serverName])
            );
            $("#inactive").append(element);
        });

        $(".loading").hide();
    }).fail(error => {
        $(".loading").text(`Erreur : ${error}`)
    })
});