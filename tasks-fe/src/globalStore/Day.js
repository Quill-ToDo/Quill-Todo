import { makeAutoObservable } from "mobx"
import { DateTime, Interval } from "luxon";

import { addAlert, ERROR_ALERT, NOTICE_ALERT } from "../static/js/alertEvent";

export class Day {
    // Fields go here **Important:** Use setter methods to change any values, even internally. They may have side-effects.
    calendar;
    dateInterval;
    _taskSet;

    /**
     * An object to represent the timeline of tasks across Quill. Might try and store this in the browser cache, who knows. Don't feel like it needs to be DB.
     * 
     * **Important:** Use setter methods to change any values, even internally. They may have side-effects.
     * 
     * @param {rootStore} calendar The store which holds other stores.
     * @param {uuid} id V4 UUID id of the task. If one is not passed in, one is generated upon init.
     */
    constructor (calendar, dateInterval) {
        makeAutoObservable(this, {proxy: false});
        // Assign this.var to values here
        this.calendar = calendar;
        this.dateInterval = dateInterval;
        this.tasks = new Set();
        this.setTasks();
    }

    get tasks() {
        return this._taskSet;
    };

    setTasks() {

    };

    // get orderedTasks() {
    //     return this._taskSet
    // }

    addTaskToDay(task) {
        this._taskSet.add(task);
    };

    removeTaskFromDay(task) {
        this._taskSet.remove(task);
        if (this._taskSet.size === 0)  {
            this.store.timeline.removeTasks(this.dateInterval);
        }
    };

    hasTask(task) {
        return this._taskSet.has(task);
    };
};
