export default class RootStore {
    taskStore
    constructor () {
        // this.userStore
        this.taskStore = new TaskStore(this, new TaskApi());
        this.timeline = new Timeline(this, this.taskStore);
    }
}