import { makeAutoObservable} from "mobx";
import { v4 as uuidv4 } from 'uuid';

export class AlertStore {
    // These must have a default value here to be observable
    alerts = [];

    constructor (rootStore) {
        makeAutoObservable(this);
        // Consider making remove not observed
        this.alerts = [];
        this.rootStore = rootStore;
    }

    add(type, body) {
        const alert = {"id": uuidv4(), "type": type, "body": body}
        this.alerts.push(alert);
        return alert;
    }

    remove(uuid) {
        this.alerts = this.alerts.filter((alert) => alert.uuid !== uuid);
    }
}