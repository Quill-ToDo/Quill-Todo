import { makeAutoObservable} from "mobx";
import { v4 as uuidv4 } from 'uuid';

export class AlertStore {
    // These must have a default value here to be observable
    alerts = [];
    // Supported types: 
    // "failure" - Red, errors/danger/alert, must be manually exited out of
    // "notice" - Grey, neutral, disappears after a bit
    // "success" - Green, nice!, disappears after a bit

    constructor (rootStore) {
        makeAutoObservable(this, {proxy: false});
        // Consider making remove not observed
        this.alerts = [];
        this.rootStore = rootStore;
    }

    add(type, body) {
        const alert = {"id": uuidv4(), "type": type, "body": body}
        this.alerts.push(alert);
        return alert;
    }

    remove(id) {
        this.alerts = this.alerts.filter((alert) => "alert-"+alert.id !== id)
    }
}