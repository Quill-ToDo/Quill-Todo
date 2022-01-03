import { makeAutoObservable, observable, runInAction} from "mobx";
import { Task } from "./Task";

// export const CreateTaskStore = (API) => {
//     return makeAutoObservable({
//         API: API,
//         tasks: {},
//         isLoaded: false,
//         // Fetch all tasks from server
//         loadTasks () {
//             this.isLoaded = false;
//             this.API.fetchTasks().then(fetchedTasks => {
//                 runInAction(() => {
//                     fetchedTasks.data.forEach(json => this.updateTaskFromServer(json));
//                     this.isLoaded = true;
//                 });
//             })
//         },
//         // Update a todo with into from a server and guarantee it only exists once
//         updateTaskFromServer (taskJson) {
//             let task;
//             if (taskJson.pk in this.tasks) {
//                 task = this.tasks[taskJson.pk];
//             }
//             else {
//                 // Does not yet exist in store
//                 task = new Task(this, taskJson.pk);
//                 this.tasks[taskJson.pk] = task;
//             }
            
//             task.updateFromJson(taskJson);
//         }
//     }, {API:false})
// };

export class TaskStore {
    API;
    // userStore
    tasks = {};
    isLoaded = false;

    constructor (API) {
        makeAutoObservable(this, {
            API: false
        })

        this.API = API;
        this.tasks = {};
        this.loadTasks();
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
        let task;
        if (taskJson.pk in this.tasks) {
            task = this.tasks[taskJson.pk];
        }
        else {
            // Does not yet exist in store
            task = new Task(this, taskJson.pk);
            this.tasks[taskJson.pk] = task;
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