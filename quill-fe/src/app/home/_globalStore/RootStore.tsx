import { TaskApi } from "./tasks/TaskApi";
import TaskStore from "./tasks/TaskStore";
import { configure } from "mobx"

configure({
    useProxies: "never"
})

export default class RootStore {
    taskStore : TaskStore;
    
    constructor () {
        this.taskStore = new TaskStore({rootStore: this, API: new TaskApi()});
    };
}