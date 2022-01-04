export const dispatchAlert = (target, type, body) => {
    const alert = new CustomEvent("alert", {
        detail: {"type": type, "body": body},
        bubbles: true,
        cancelable: true,
        composed: false
    });
    target.dispatchEvent(alert);
}