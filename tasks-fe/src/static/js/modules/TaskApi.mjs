import axios from "axios";

const API_URL = "http://localhost:8000/api/tasks/";

function dispatchChange(pk, callingObj) {
    const taskStateChange = new CustomEvent("taskStateChange", {
        detail: {
            "pk": pk
        },
        bubbles: true,
        cancelable: true,
        composed: false,
    });
    callingObj.dispatchEvent(taskStateChange);
}

async function toggleComplete(pk, callingObj) {
    return axios.put(API_URL + pk + "/toggle-complete")
        .then(() => {
            dispatchChange(pk, callingObj);
        }).catch((e) => {
            console.log("Could not toggle task completion")
            console.log(e)
        })
}

async function del(pk, callingObj) {
    return axios.delete(API_URL + pk).then(() => {
        dispatchChange(pk, callingObj);
        // TODO add to alert
    }).catch((e) => {
        console.log("Could not delete task.")
        console.log(e)
    })
}

export {
    toggleComplete,
    del,
    API_URL
}