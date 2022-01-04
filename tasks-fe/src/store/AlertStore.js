import { makeAutoObservable} from "mobx";
import { v4 as uuidv4 } from 'uuid';

export class AlertStore {
    // These must have a default value here to be observable
    alerts = [];

    constructor () {
        makeAutoObservable(this);
        this.alerts = [];
    }

    addAlert(type, body) {
        const alert = {"id": uuidv4(), "type": type, "body": body}
        this.alerts.push(alert);
        return alert;
    }

    removeAlert(uuid) {
        this.alerts = this.alerts.filter((alert) => alert.uuid !== uuid);
    }
}