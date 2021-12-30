const taskStateChange = new CustomEvent("taskStateChange", {
    detail: {},
    bubbles: true,
    cancelable: true,
    composed: false,
});

export {taskStateChange}