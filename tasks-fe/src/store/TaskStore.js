import { makeAutoObservable, runInAction} from "mobx";
import { Task } from "./Task";

export class TaskStore {
    API;
    // userStore
    tasks;
    // Task to show details for
    focusedTask;
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

    // createTask (taskData) {
    //     // Create on server, get pk
    //     // let task = new Task(this, pk);
    //     // task.updateFromJson(json);
    //     // this.tasks[pk] = task;
    // }
}