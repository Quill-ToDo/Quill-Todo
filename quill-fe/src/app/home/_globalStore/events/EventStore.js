import { makeAutoObservable } from "mobx"
import { Interval } from "luxon";

export class EventStore {
    // Fields go here **Important:** Use setter methods to change any values, even internally. They may have side-effects.
    rootStore;
    taskStore;

    /**
     * An object to represent the timeline of tasks across Quill. Might try and store this in the browser cache, who knows. Don't feel like it needs to be DB.
     * Current intention is to use this single class across all widgets. 
     * 
     * **Important:** Use setter methods to change any values, even internally. They may have side-effects.
     * 
     * @param {rootStore} rootStore The store which holds other stores.
     */
    constructor (rootStore, taskStore) {
        makeAutoObservable(this, {proxy: false});
        // Assign this.var to values here
        // Should populate the days in the timeline based on the tasks in taskstore. This should be caches if possible.
        this.rootStore = rootStore;
        this.taskStore = taskStore;
        this.loadTaskDays(taskStore.tasks);
        this.daysAsList = [];
        this._loadedInIntervals = []; 
    };

    /**
     * Load in days elements to this calendar based on start and end dates. 
     * @param {*} startDate 
     * @param {*} endDate 
     */
    loadTaskDays = (tasks) => {
        // Load tasks in
        if (!tasks.at(0)) { return } 
        let minDay = tasks.at(0).start.startOf("day");
        let maxDay = tasks.at(0).end.endOf("day");
        for (let task in tasks) {
            // Load in one day from 12:00:00 am - 11:59:59 pm. Store as an interval.
            // this.daysAsList.add(new Day(this,  new Interval.fromDateTimes(currentDayStart, currentDayStart.endOf("day"))))
            // currentDayStart.plus({ days: 1 });
        }
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
