import { makeAutoObservable, runInAction} from "mobx";
// import { Task } from "./Task";
import { DateTime } from "luxon";
import { Day } from "./Day";
import { addAlert, ERROR_ALERT, SUCCESS_ALERT } from '../static/js/alertEvent';

export class DayStore {
    rootStore;
    // These must have a default value here to be observable
    // Map from Luxor DateTime (day part) to Day object
    days = [];
    // isLoaded = false;

    /**
     * The store which holds object representations of day objects which hold Timestamp objects.
     * 
     * @param {*} rootStore The store that holds this instance.
     */
    constructor (rootStore) {
        makeAutoObservable(this, {
            rootStore: false,
            // isLoaded: true
        }, {proxy: false})
        this.rootStore = rootStore;
        this.days = [];
        // this.isLoaded = false;
        this.addDayObjects(DateTime.now().startOf('month'), DateTime.now().endOf('month'));
        this.addTasksToDays();
    }

    /**
     * Process (create or update) Day objects between the given two Luxor DateTime objects.
     */
    addDayObjects (startDateTime, endDateTime) {
        // Loop through every day between startDateTime and endDateTime
        var loopDate = new DateTime(startDateTime);
        while (loopDate <= endDateTime) {
            if (!this.days.some(day => day.is(loopDate))) {
                this.days.push(new Day(this, loopDate));
            }
            loopDate.plus({days: 1});
        }
    }
}