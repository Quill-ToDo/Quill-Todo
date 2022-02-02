import axios from "axios";

const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000/api/',
    timeout: 5000,
    headers: {
        'Authorization': "JWT " + localStorage.getItem('access_token'),
        'Content-Type': 'application/json',
        'accept': 'application/json'
    }
});

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
}