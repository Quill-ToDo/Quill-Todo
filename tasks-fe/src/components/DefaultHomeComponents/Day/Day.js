import { makeAutoObservable, reaction } from "mobx"
import { v4 } from "uuid";
import { DateTime, Interval } from "luxon";
import { 
    DATE_FORMAT, 
    TIME_FORMAT, 
    DATE_TIME_FORMAT,
    END_OF_DAY,
} from "../constants";

import { addAlert, ERROR_ALERT, NOTICE_ALERT } from "../static/js/alertEvent";

export class Day {
    // DayStore
    store = null;
    // Luxor Interval from hour 0-24
    interval = null;
    tasksToday = [];

// USE SETTERS TO CHANGE VALUES, EVEN IN THIS FILE. 

    /**
     * An object to represent one day. This object does not have a DB model. 
     * 
     * **Important:** Use setter methods to change any values, even internally. They may have side-effects.
     * 
     * @param {DayStore} store The store this Day resides in.
     * @param {DateTime} dateTime The Luxon DateTime of this day, at hour 0.
     * @param {uuid} id V4 UUID id of the day. If one is not passed in, one is generated upon init.
     */
    constructor (store, dateTime, id = v4()) {
        makeAutoObservable(this, {
            id: false,
            store: false,
            date: true,
            tasksToday: true,
        }, {proxy: false});
        this.store = store;
        this.id = id;
        this.interval = Interval.fromDateTimes(dateTime.startOf('day'), dateTime.endOf('day'));
        this.tasksToday = [];
    }

    is (dateTime) {
        this.interval.contains(dateTime);
    }

    /**
     * Get the string part of the date
     */
        get dateString () {
            // TODO: Move logic from Task.js to here
            return this.interval.toString();
        }
}