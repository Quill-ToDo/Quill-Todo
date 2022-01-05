import { makeAutoObservable, observable} from "mobx";
import { v4 as uuidv4 } from 'uuid';

export class AlertStore {
    // These must have a default value here to be observable
    alerts = [];
    // Supports types: "failure" - Red, errors/danger/alert, "notice" - Grey, neutral, "success" - Green, nice!

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