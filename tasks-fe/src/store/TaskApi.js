import axios from "axios";

const API_URL = "http://localhost:8000/api/tasks/";

export class TaskApi {
    constructor () {
        this.url = API_URL;
    }

    async fetchTasks() {
        return axios.get(this.url);
    }

    async updateTask(pk, data) {
        return axios.patch(this.url + pk, data);
    }
    
    async deleteTask(pk) {
        return axios.delete(this.url + pk);
    }
}