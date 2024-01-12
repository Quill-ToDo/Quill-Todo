import { v4 as uuidv4 } from 'uuid';

export const SUCCESS_ALERT = "success";
export const NOTICE_ALERT = "notice";
export const ERROR_ALERT = "failure";

/**
 * Render an alert on the screen. Use sparingly as too many alerts can be annoying for users, but can be helpful for testing.
 * Ex: 
 * `addAlert(document.querySelector("#left-menu button[title='Log out']"), NOTICE_ALERT, "We haven't implemented users or logging out.")`
 * 
 * @param {Element} target The target element the event originates from. Can use something like `document.getElementById("id")` to target the element. 
 * @param {String} type The type of alert. Supported types (all exported from this file):
 *      - `NOTICE_ALERT`: Grey, neutral, has "Notice:" header, disappears after a bit
 *      - `SUCCESS_ALERT`: Green, has "Success" header, disappears after a bit
 *      - `ERROR_ALERT`: Red, errors/danger/alert, has "Error:" header, requires immediate user attention and must be manually closed. **Use sparingly!**
 * @param {String} body The content of the alert.
 */
export const addAlert = (target, type, body) => {
    if (target === null) {
        throw new TypeError("Target element for alert bubble cannot be null.");
    }
    const alert = new CustomEvent("alert", {
        detail: {"id": "alert-"+uuidv4(), "type": type, "body": body},
        bubbles: true,
        cancelable: true,
        composed: false
    });
    target.dispatchEvent(alert);
}