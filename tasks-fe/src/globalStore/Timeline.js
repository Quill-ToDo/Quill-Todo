import { makeAutoObservable } from "mobx"
import { DateTime, Interval } from "luxon";

import { addAlert, ERROR_ALERT, NOTICE_ALERT } from "../static/js/alertEvent";
import { Day } from "./Day"

export class Timeline {
    // Fields go here **Important:** Use setter methods to change any values, even internally. They may have side-effects.
    rootStore;
    // Maps interval of the start of the day to the end of the day to actual Day object, so that client can provide a datetime
    // and get back the day object it falls within.
    _days;
    // All intervals for which tasks have been loaded into the timeline
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
        // Should populate the days in the timeline based on the tasks in taskstore. This should be cached if possible.
        this.rootStore = rootStore;
        this._days = new Map();
        this._loadedInIntervals = []; 
    };

    /** Given a date in DateTime format, return a day object representing one Day and all the tasks on that day
    */
    getDayFromDateTime (date) {
        const dayKey = Day.getKeyFromDateTime(date);
        if (!(dayKey in this._days)) {
            console.error("Day was not in timeline!! Need to retry :(");
        }
        return this._days.get(dayKey);
    }

    /**
     * Given a datetime object, store in a map in a common key format.
     * @param {*} map 
     * @param {*} dayObject 
     */
    setInMapGivenDay (map, dayObject) {
        if (dayObject === null || dayObject === undefined) {
            console.log("Setting null DateTime object in map :(");
        }
        else {
            map.set(dayObject.key, dayObject);
        }
    }

    /**
     * Given an interval, return all intersecting Day objects in a map of Interval to Day objects. 
     * @param {Interval} requestedInterval An interval to get Day objects for
     * @returns {Map<Interval, Day>} daysOfInterest All Day objects that intersected with requestedInterval
     */
    getDaysInInterval (requestedInterval) {
        this._loadTaskDays(requestedInterval);
        const daysOfInterest = new Map();
        this.traverseDays(requestedInterval.start, requestedInterval.end, (day) => {
            this.setInMapGivenDay(daysOfInterest, day)
        });
        return daysOfInterest;
    };

    /**
     * Return string representatioin of the timeline in a somewhat legible way
     */
    print () {
        let str = "TIMELINE:\n";
        if (this._days.size === 0) {
            str += " <Empty>";
        }
        else {
            this.traverseDays(this._loadedInIntervals[0].start, this._loadedInIntervals[0].end,
                (day) => {
                    str += day.dateInterval.start.toString()+"\n";
                }
            )
        }
        return str;
    }

    /**
     * Traverse through days in startDay and endDay, calling callback with each Day object. 
     * @param {*} startDay 
     * @param {*} endDay 
     * @param {*} callback 
     */
    traverseDays (startDay, endDay, callback) {
        if (startDay >= endDay) {
            console.error("Could not traverse timeline because startDay", startDay, "was greater or equal to endDay", endDay);
        }
        let traversalDay = startDay.startOf("day");
        let count = 0;
        while (traversalDay <= endDay.endOf("day") && count < 1000) {
            if (callback.length !== 1) {
                callback();
            }
            else {
                callback(this.getDayFromDateTime(traversalDay));
            }
            traversalDay = traversalDay.plus({days: 1})
            count++;
        }
        if (count >= 1000) {
            console.error("Traversed more than 1000 days in Timeline.traverseDays");
        }
    }

    /**
     * Check if tasks have been loaded in to days Map for this interval. If they haven't, load them in
     * @param {*} requestedInterval 
     */
    _loadTaskDays (requestedInterval) {
        const unloadedIntervals = requestedInterval.difference(this._loadedInIntervals);

        if (unloadedIntervals.length === 0) {
            return;
        };
        let currentDay = unloadedIntervals[0].start;
        
        unloadedIntervals.forEach((interval) => {
            let count = 0;
            while (currentDay < interval.end && count < 5000) {
                this.setInMapGivenDay(this._days, new Day(this, currentDay));
                currentDay = currentDay.plus({ days: 1 });
                count++;
            }
            if (count > 5000){
                console.error("Tried to load more than 5000 days in _loadTaskDays");
            }
            // Add this interval
            this._loadedInIntervals.push(interval);
        })
        this._loadedInIntervals = Interval.merge(this._loadedInIntervals);
        this._loadedInIntervals.sort();
    }

    _unloadTaskDays (intervalToRemove) {
        // Remove task days within this interval
        this.daysAsList = this.daysAsList.filter((day) => !intervalToRemove.engulfs(day));

        // Remove this interval
        this._loadedInIntervals.push(intervalToRemove);
        this._loadedInIntervals = Interval.xor(this._loadedInIntervals);
        this._loadedInIntervals.sort();
    };
};
