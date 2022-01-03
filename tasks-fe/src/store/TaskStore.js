import { makeAutoObservable, runInAction} from "mobx";
import { Task } from "./Task";
import { DateTime } from "luxon";

export class TaskStore {
    API;
    // userStore
    // These must have a default value here to be observable
    tasks = [];
    // Task to show details for
    focusedTask = null;
    isLoaded = false;

    constructor (API) {
        makeAutoObservable(this, {
            API: false
        })

        this.API = API;
        this.tasks = [];
        this.loadTasks();
        this.focusedTask = null;
    }

    // Fetch all tasks from server
    loadTasks () {
        this.isLoaded = false;
        this.API.fetchTasks().then(fetchedTasks => {
            runInAction(() => {
                fetchedTasks.data.forEach(json => this.updateTaskFromServer(json));
                this.isLoaded = true;
            });
        })
    }

    // Update a todo with into from a server and guarantee it only exists once
    updateTaskFromServer (taskJson) {
        let task = this.tasks.find(t => t.pk === taskJson.pk)
        if (!task) {
            // Does not yet exist in store
            task = new Task(this, taskJson.pk);
            this.tasks.push(task);
        }
        task.updateFromJson(taskJson);
    } 

    get byStatus() {
        const now = DateTime.now();
        return {
            "overdue": this.tasks.filter(task => DateTime.fromISO(task.due) <= now),
            "todayDue": this.tasks.filter(task => (now.set({hour: 0, minute: 0, second: 0}) < DateTime.fromISO(task.due)) && (DateTime.fromISO(task.due) < now)),
            "todayWork": this.tasks.filter(task => (task.start && DateTime.fromISO(task.start) <= now) && (now <= DateTime.fromISO(task.due))),
            "upcoming": this.tasks.filter(task => (!task.start || now <= DateTime.fromISO(task.start) ) && (now <= DateTime.fromISO(task.due)))
        }
    }

    // get selectedTask() {
    //     return this.focusedTask;
    // }

    setFocus (task) {
        this.focusedTask = task;
        console.log("in store " + this.focusedTask.pk)
    }

    removeFocus () {
        this.focusedTask = null;
    }

    // createTask (taskData) {
    //     // Create on server, get pk
    //     // let task = new Task(this, pk);
    //     // task.updateFromJson(json);
    //     // this.tasks[pk] = task;
    // }
}