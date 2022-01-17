import axios from "axios";

export class TaskApi {
    url;
    
    constructor (url=null) {
        this.url = url ? url : "http://localhost:8000/api/tasks/";
    }

    async fetchTasks() {
        return axios.get(this.url);
    }

    async detail(pk) {
        return axios.get(this.url + pk);
    }

    async updateTask(pk, data) {
        return axios.patch(this.url + pk, data);
    }
    
    async deleteTask(pk) {
        return axios.delete(this.url + pk);
    }

    async createTask(taskData) {
        return axios.post(this.url, JSON.stringify(taskData));
    }
}