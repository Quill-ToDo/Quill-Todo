import axios from "axios";

export class TaskApi {
    url;
    
    constructor (url=null) {
        this.url = url ? url : "http://localhost:8000/api/tasks/";
    }

    async fetchTasks() {
        return axios.get(this.url);
    }

    async detail(id) {
        return axios.get(this.url + id);
    }

    async updateTask(id, data) {
        return axios.patch(this.url + id, data);
    }
    
    async deleteTask(id) {
        return axios.delete(this.url + id);
    }

    async createTask(taskData) {
        return axios.post(this.url, taskData);
    }
}