"use strict";

document.addEventListener('DOMContentLoaded', function () {
    initHandlers();
});

function initHandlers() {
    handleAlerts();

    // $(document).on("click", function (e) {
    document.addEventListener('click', function (e) {
        if (e.target) {
            let target = e.target;

            collapseSectionHandler(target);
            // completeTaskHandler(target);
            // showPopupHandler(target, e);
        }
    });
}

function collapseSectionHandler(target) {
    // Collapse sections on click 
    // var toggle_section = $(target).parents(".expandable-section-header");
    var toggle_section = target.parents(".expandable-section-header");
    if (toggle_section.length) {
        // var section = $(toggle_section.siblings(".section-collapsible"));
        var section = toggle_section.siblings(".section-collapsible");
        section.toggle(150, "swing");
        var symbol = toggle_section.children(".expand-symbol");
        var rotation = symbol.css("rotate");
        if (rotation == "45deg") {
            symbol.css("rotate", "-135deg");
        } else {
            symbol.css("rotate", "45deg");
        }
    };
}

function renderList() {
    // TODO call this on startup, don't have tasks there to start with
    return new Promise(function (resolve, reject) {
        $.get({
            url: '/tasks/list',
            dataType: "json"
        }).done(data => {
            $("#list-wrapper").html(data.html);
            resolve();
        }).fail(err => {
            reject("Could not render list - " + err);
        });
    });
}

// Alerts 
function handleAlerts() {
    // TODO Add back
    // delete alert on exit click
    // $(".alert-pop-up img").on("click", function () {
    //     $(this).parent().remove()
    // })
}