import axios from "axios";

const API_URL = "http://localhost:8000/api/tasks/";

export class TaskApi {
    constructor () {
        this.url = API_URL;
    }

    async fetchTasks() {
        return axios.get(this.url)
        .then((res) => {return res;})
        .catch((e) => {
            console.log("Could not fetch tasks.");
            console.log(e);
            return e;
        })
    }

    async toggleComplete(pk) {
        return axios.put(this.url + pk + "/toggle-complete")
            .then((res) => {
                return res;
            }).catch((e) => {
                console.log("Could not toggle task completion")
                console.log(e)
                return e;
            })
    }
    
    async deleteTask(pk) {
        return axios.delete(this.url + pk).then((res) => {
            return res;
            // TODO add to alert
        }).catch((e) => {
            console.log("Could not delete task.");
            console.log(e);
            return e;
        })
    }
}