import { v4 as v4uuid } from 'uuid';

export const dispatchAlert = (target, type, body) => {
    const alert = new CustomEvent("alert", {
        detail: {"id": v4uuid(), "type": type, "body": body},
        bubbles: true,
        cancelable: true,
        composed: false
    });
    target.dispatchEvent(alert);
}