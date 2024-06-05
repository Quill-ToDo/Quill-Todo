import axios from "axios";
import { API_URL } from "@/util/constants"

export class TaskApi {
    url;
    
    constructor (url=null) {
        this.url = url ? url : API_URL;
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