import { makeAutoObservable} from "mobx";
import { v4 as uuidv4 } from 'uuid';

export class AlertStore {
    // These must have a default value here to be observable
    alerts = [];
    // Supported types: 
    // ERROR_ALERT from constants - Red, errors/danger/alert, must be manually exited out of
    // NOTICE_ALERT from constants - Grey, neutral, disappears after a bit
    // SUCCESS_ALERT from constants - Green, nice!, disappears after a bit

    constructor (rootStore) {
        makeAutoObservable(this, {remove: false, proxy: false});
        // Consider making remove not observed
        this.alerts = [];
        this.rootStore = rootStore;
    }

    add(type, body) {
        console.log("adding alert")
        const alert = {"id": uuidv4(), "type": type, "body": body}
        this.alerts.push(alert);
        console.log(this.alerts)
        return alert;
    }

    remove(id) {
        this.alerts = this.alerts.filter((alert) => "alert-"+alert.id !== id)
    }
}