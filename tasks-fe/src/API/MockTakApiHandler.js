import {
    rest
} from 'msw'
import {
    DateTime
} from "luxon";
import {
    setupServer
} from 'msw/node'

const API_URL = "/api/tasks/";
const BAD_WILDCARD = "*/api/tasks/";

export default class MockTaskApiHandler {
    // Default API mock methods to use, populated with some default data.
    // You can also update the tasks in this DB using the methods prefixed with setup

    // List of tasks in "DB"
    tasks = [];
    // This base "current" date to base computations of off
    date = "";
    server = null;

    constructor(dateOverride = null, taskOverrides = null) {
        this.date = dateOverride ? dateOverride : DateTime.utc(2069, 6, 6, 6, 4, 2, 0);
        this.tasks = taskOverrides ? taskOverrides : [{
                "pk": 0,
                "title": "Overdue incomplete",
                "complete": false,
                "completed_at": null,
                "start": this.date.minus({
                    months: 1
                }),
                "due": this.date.minus({
                    days: 7
                }),
                "description": "Delta is cheaper. I have a card with them too",
                "created_at": this.date.minus({
                    weeks: 3
                }),
                "updated_at": this.date,
            },
            {
                "pk": 1,
                "title": "Overdue complete",
                "complete": true,
                "completed_at": null,
                "start": this.date.minus({
                    months: 1
                }),
                "due": this.date.minus({
                    weeks: 3
                }),
                "description": "",
                "created_at": this.date.minus({
                    months: 2
                }),
                "updated_at": this.date.minus({
                    months: 1
                }).plus({
                    days: 1
                }),
            },
            {
                "pk": 2,
                "title": "No start",
                "complete": false,
                "completed_at": null,
                "start": null,
                "due": this.date.minus({
                    weeks: 3
                }),
                "description": "",
                "created_at": this.date.minus({
                    months: 2
                }),
                "updated_at": this.date.minus({
                    months: 1
                }).plus({
                    days: 1
                }),
            },
            {
                "pk": 3,
                "title": "Work on today",
                "complete": false,
                "completed_at": null,
                "start": this.date.minus({
                    months: 2
                }),
                "due": this.date.plus({
                    months: 2
                }),
                "description": "A long project",
                "created_at": this.date.minus({
                    months: 2
                }),
                "updated_at": this.date.minus({
                    months: 1
                }).plus({
                    days: 1
                }),
            },
            {
                "pk": 4,
                "title": "Upcoming",
                "complete": false,
                "completed_at": null,
                "start": "",
                "due": this.date.plus({
                    months: 2
                }),
                "description": "",
                "created_at": this.date.minus({
                    months: 2
                }),
                "updated_at": this.date.minus({
                    months: 1
                }).plus({
                    days: 1
                }),
            },
            {
                "pk": 5,
                "title": "Upcoming span",
                "complete": true,
                "completed_at": null,
                "start": this.date.plus({
                    weeks: 2
                }),
                "due": this.date.plus({
                    weeks: 4
                }),
                "description": "",
                "created_at": this.date.minus({
                    months: 2
                }),
                "updated_at": this.date.minus({
                    months: 1
                }).plus({
                    days: 1
                }),
            },
            {
                "pk": 6,
                "title": "Due today",
                "complete": true,
                "completed_at": null,
                "start": null,
                "due": this.date.plus({
                    hours: 2
                }),
                "description": "Omg!",
                "created_at": this.date.minus({
                    months: 2
                }),
                "updated_at": this.date.minus({
                    months: 1
                }).plus({
                    days: 1
                }),
            },
            {
                "pk": 7,
                "title": "Due today span",
                "complete": false,
                "completed_at": null,
                "start": this.date.minus({
                    weeks: 1
                }),
                "due": this.date.plus({
                    hours: 3
                }),
                "description": "Omg!",
                "created_at": this.date.minus({
                    months: 2
                }),
                "updated_at": this.date.minus({
                    months: 1
                }).plus({
                    days: 1
                }),
            },
            {
                "pk": 8,
                "title": "Due tomorrow",
                "complete": true,
                "completed_at": null,
                "start": this.date.minus({
                    days: 3
                }),
                "due": this.date.plus({
                    days: 1
                }),
                "description": "Omg!",
                "created_at": this.date.minus({
                    months: 2
                }),
                "updated_at": this.date.minus({
                    months: 1
                }).plus({
                    days: 1
                }),
            },
        ];
        this.server = setupServer(...this.mocks);
    }

    // NOT NETWORK CALLS: Set up/change this DB however you'd like after 
    // initialization. 
    setup = {
        handler: this,
        // Set the tasks of this object if you want to override them
        setTasks(tasks) {
            this.handler.tasks = tasks;
        },

        // Add one task to this "DB"
        addTask(task) {
            this.handler.tasks.push(task);
        },

        // Add a server that will use the mocks in this module
        setServer(server) {
            this.handler.server = server;
        },

        // addMock() {
        //     this.server=const server = setupServer(...mockHandler.mocks);
        // }
    }

    mocks = [
        rest.get(BAD_WILDCARD, (req, res, ctx) => {
            // Only works with full url or regex for some reason... You aren't supposed to use wildcard though
            // https://mswjs.io/docs/basics/request-matching
            return res(
                ctx.status(200),
                ctx.json(this.tasks)
                );
        }),
        rest.patch(BAD_WILDCARD + ":pk", (req, res, ctx) => {
            // I'm not going to bother with validations. If there is a
            // test that requires an error that test should write a handler
            // for that particular situation and make it a one-time thing
            // https://mswjs.io/docs/api/response/once
            // I don't even know that I need to do this but It's simple so I will
            this.tasks.forEach((task, i) => {
                if (task.pk === req.headers.pk) {
                    this.tasks.splice(i, 1, req.body);
                }
            }) 
            return res(
                ctx.status(200),
                ctx.json(req)
            )
        }),
        // rest.delete(API_URL + ":pk")
    ]
}