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

function collapseSectionHandler(target, duration = 500) {
    // Collapse/expand sections on click 
    var expand_section = parent_with_class(target, "expandable-section-header");
    if (expand_section) {
        var section = next_sibling_with_class(expand_section, "section-collapsible");
        toggleSection(section, duration);
        // Flip karat(?)
        var symbol = child_with_class(expand_section, "expand-symbol");
        var rotation = symbol.style.rotate;
        symbol.style.transition = `rotate ${duration}ms ease-in-out 0s`;
        if (rotation === "45deg" || rotation === "") {
            symbol.style.rotate = "-135deg";
        } else {
            symbol.style.rotate = "45deg";
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

function toggleSection(target, duration) {
    var transition = `transform ${duration}ms ease-out 0s`;
    target.style.transition = transition;
    new Promise((resolve) => {
        if (target.style.transition == transition) {
            console.log("transition set");
            resolve();
        }

    }).then(() => {
        if (target.style.display === "none") {
            // Unhide
            target.style.display = "block";
            target.style.transform = "scaleY(.01)";
            setTimeout(() => {
                target.style.transform = "scaleY(1)";
            }, duration / 100)
        } else {
            // Hide
            target.style.transform = "scaleY(.01)";
            setTimeout(() => {
                target.style.display = "none";
            }, duration)
        }
    });

}


function child_with_class(target, className) {
    for (let i in target.children) {
        let child = target.children.item(i);
        if (child.classList.contains(className)) {
            return child;
        }
    }
}

function parent_with_class(target, className) {
    if (target.parentElement.classList.contains(className)) {
        return target.parentElement;
    }
}

function next_sibling_with_class(target, className) {
    if (target.nextElementSibling.classList.contains(className)) {
        return target.nextElementSibling;
    }
}

// Alerts 
function handleAlerts() {
    // TODO Add back
    // delete alert on exit click
    // $(".alert-pop-up img").on("click", function () {
    //     $(this).parent().remove()
    // })
}