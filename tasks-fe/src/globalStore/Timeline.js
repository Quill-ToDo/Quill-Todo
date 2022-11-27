import { makeAutoObservable } from "mobx"
import { DateTime, Interval } from "luxon";

import { addAlert, ERROR_ALERT, NOTICE_ALERT } from "../static/js/alertEvent";
import { Day } from "./Day";

export class Timeline {
    // Fields go here **Important:** Use setter methods to change any values, even internally. They may have side-effects.
    rootStore;
    // Currently loaded in days in different formats.
    _daysAsMap;
    _daysAsList;
    _loadedInIntervals;

    /**
     * An object to represent the timeline of tasks across Quill. Might try and store this in the browser cache, who knows. Don't feel like it needs to be DB.
     * 
     * **Important:** Use setter methods to change any values, even internally. They may have side-effects.
     * 
     * @param {rootStore} rootStore The store which holds other stores.
     */
    constructor (rootStore) {
        makeAutoObservable(this, {proxy: false});
        // Assign this.var to values here
        // Should populate the days in the timeline based on the tasks in taskstore. This should be caches if possible.
        this.rootStore = rootStore;
        // this.daysAsMap = new Map();
        this.daysAsList = [];
        this._loadedInIntervals = []; 
    };

    /**
     * Load in days to this calendar based on start and end dates. 
     * @param {*} startDate 
     * @param {*} endDate 
     */
    loadTaskDays = (startDate, endDate) => {
        const intervalToAdd = new Interval.fromDateTimes(startDate.startOf("day"), endDate.endOf("day"));
        if (this._loadedInIntervals.some((loadedInInterval) => loadedInInterval.engulfs(intervalToAdd) )) {
            return;
        }

        const needToLoad = intervalToAdd.difference(...this._loadedInIntervals);

        // Load tasks in
        let currentDayStart = startDate.startOf("day");
        while (currentDayStart < needToLoad.end) {
            // Load in one day from 12:00:00 am - 11:59:59 pm. Store as an interval.
            this.daysAsList.add(new Day(this,  new Interval.fromDateTimes(currentDayStart, currentDayStart.endOf("day"))))
            currentDayStart.plus({ days: 1 });
        }

        // Add this interval
        this._loadedInIntervals.push(intervalToAdd);
        this._loadedInIntervals = Interval.merge(this._loadedInIntervals);
        this._loadedInIntervals.sort();
    };

    
    unloadTaskDays (intervalToRemove) {
        // Remove task days within this interval
        this.daysAsList = this.daysAsList.filter((day) => !intervalToRemove.engulfs(day));

        // Remove this interval
        this._loadedInIntervals.push(intervalToRemove);
        this._loadedInIntervals = Interval.xor(this._loadedInIntervals);
        this._loadedInIntervals.sort();
    };
    
    getDaysInInterval = (requestedInterval) => {};
    
    /**
     * Update the array of intervals which represents the days that have already been loaded into the timeline.
     * @param {*} intervalToAdd
     */
    addInterval (intervalToAdd) {

    }
};
