import {
    rest
} from 'msw'
import {
    DateTime
} from "luxon";
import {
    setupServer
} from 'msw/node'
import { v4 as uuidv4 } from 'uuid';

interface PassedTask {
        title: string,
        due?: DateTime,
        id?: string,
        complete?: boolean,
        completed_at?: DateTime | null;
        start?: DateTime,
        description?: string,
        created_at?: DateTime,
        updated_at?: DateTime,
}

interface Task {
        id: string,
        title: string,
        complete: boolean,
        completed_at: DateTime | null;
        start: DateTime,
        due: DateTime,
        description: string,
        created_at: DateTime,
        updated_at: DateTime,
}

function DuplicateIdException (id) {
    this.message = `id ${id} already exists as a fake task`;
    this.name = "DuplicateIdException"; 
}

/**
 * Sets up handling for a MSW mock server to intercept REST calls complete with dummy data.
 * 
 *  - Default dummy tasks are provided upon initialization. By default, they are generated relative to a 
 *      random static date. This date may be overwritten on initialization.
 *  - Methods to change the dummy tasks as well as update the MSW server being used are nested
 *      under the `setup` module. 
 * - Methods to mock successful REST calls are provided under `mocks` attribute. To add a new mock, use 
 *      `setup.addMock` or `setup.addTemporaryMock`.
 */
export default class MockTaskApiHandler {
    // List of tasks in "DB"
    tasks: Task[] = [];
    // This base "current" date to base computations of off
    date: DateTime = null;
    defaultStart: DateTime = null;
    defaultDue: DateTime = null;
    // The MSW server
    server = null;
    // API_URL = "/api/tasks/";
    API_URL: string = "*/api/tasks/";
    // THIS IS BAD! ^^^ Should be using it without the wildcard

    /**
     *  Initialize a handler with an optional date or task override values. 
     * @param {*} overrides Optional overrides. Takes properties `date` (to make tasks relative to) 
     * and `tasks` (to add to DB relative to `dateOverride`)
     */
    constructor({
        date=DateTime.utc(2069, 6, 6, 6, 4, 2, 0), 
        tasks=[],
    }: {
        date?: DateTime, 
        tasks?:PassedTask[],
    }={}) {
        this.date = date;
        this.defaultStart = date.startOf("day");
        this.defaultDue = date.endOf("day");

        // If you change these hard-coded tasks, please just add to them or make sure you don't break a lot of
        // tests by removing any.
        if (tasks) {
            tasks.forEach((task) => {this.setup.addTask(task)});        }
        else {
            this.setup.initTasks();
        }

        this.server = setupServer(...this.mocks);
    }

    /**
     * **NOT NETWORK CALLS:** Set up/change this DB however you'd like after 
     * instantiation. 
     */
    setup = {
        handler: this,

        initTasks() {
            this.handler.tasks = [];
            const tasks: PassedTask[] = [{
                    title: "Overdue incomplete",
                    complete: false,
                    start: this.handler.date.minus({
                        months: 1
                    }),
                    due: this.handler.date.minus({
                        days: 7
                    }),
                    description: "Task description"
                },
                {
                    title: "Overdue complete",
                    complete: true,
                    start: this.handler.date.minus({
                        months: 1
                    }),
                    due: this.handler.date.minus({
                        weeks: 3
                    }),
                    created_at: this.handler.date.minus({
                        months: 2
                    }),
                    updated_at: this.handler.date.minus({
                        months: 1
                    })
                },
                {
                    title: "No start",
                    complete: false,
                    start: this.handler.defaultStart,
                    due: this.handler.date.minus({
                        weeks: 3
                    }),
                    created_at: this.handler.date.minus({
                        months: 2
                    }),
                    updated_at: this.handler.date.minus({
                        months: 1
                    }).plus({
                        days: 1
                    }),
                },
                {
                    title: "Work on today",
                    complete: false,
                    start: this.handler.date.minus({
                        months: 2
                    }),
                    due: this.handler.date.plus({
                        months: 2
                    }),
                    description: "A long project",
                    created_at: this.handler.date.minus({
                        months: 2
                    })
                },
                {
                    title: "Upcoming",
                    complete: false,
                    start: this.handler.date.plus({
                        months: 2
                    }),
                    due: this.handler.date.plus({
                        months: 2
                    }),
                    created_at: this.handler.date.minus({
                        months: 2
                    }),
                    updated_at: this.handler.date.minus({
                        months: 1
                    }).plus({
                        days: 1
                    }),
                },
                {
                    title: "Upcoming span",
                    complete: true,
                    completed_at: this.handler.date.minus({
                        days: 2
                    }),
                    start: this.handler.date.plus({
                        weeks: 2
                    }),
                    due: this.handler.date.plus({
                        weeks: 4
                    }),
                    created_at: this.handler.date.minus({
                        months: 2
                    }),
                    updated_at: this.handler.date.minus({
                        months: 1
                    }).plus({
                        days: 1
                    }),
                },
                {
                    title: "Due today",
                    complete: true,
                    start: this.handler.date,
                    due: this.handler.date.plus({
                        hours: 2
                    }),
                    description: "Omg!",
                    created_at: this.handler.date.minus({
                        months: 2
                    }),
                    updated_at: this.handler.date.minus({
                        months: 1
                    }).plus({
                        days: 1
                    }),
                },
                {
                    title: "Due today span",
                    complete: false,
                    start: this.handler.date.minus({
                        weeks: 1
                    }),
                    due: this.handler.date.plus({
                        hours: 3
                    }),
                    created_at: this.handler.date.minus({
                        months: 2
                    }),
                    updated_at: this.handler.date.minus({
                        months: 1
                    }).plus({
                        days: 1
                    }),
                },
                {
                    title: "Due tomorrow",
                    complete: true,
                    start: this.handler.date.minus({
                        days: 3
                    }),
                    due: this.handler.date.plus({
                        days: 1
                    }),
                    created_at: this.handler.date.minus({
                        months: 2
                    }),
                    updated_at: this.handler.date.minus({
                        months: 1
                    }).plus({
                        days: 1
                    }),
                }];
            tasks.forEach((taskData) => {
                this.addTask(taskData);
            })
        },

        /**
         * Set the tasks for this object if you would like to override them.
         * 
         * @param {[Object]} tasks 
         */
        setTasks(tasks: PassedTask[]) {
            this.handler.tasks = [];
            tasks.forEach((task) => {this.addTask(task)});
        },

        /**
         * Add one task to the mock DB. For any of the DateTime fields, use offsets from `this.date` as seen in the
         * constructor. No validations are run.
         * 
         */
        addTask(task: PassedTask) {
            let idToUse;
            if (!task.id) {
                idToUse = uuidv4();    
            } 
            else {
                if (this.handler.tasks.find(t => t.id === task.id)) {
                    throw new DuplicateIdException(task.id);
                }
                idToUse = task.id;
            }
            var newTask: Task = {
                // Required
                title: task.title,
                due: task.due ? task.due : this.handler.defaultDue,
                // Optional
                id: idToUse,
                start: task.start ? task.start : this.handler.defaultStart,
                description: task.description ? task.description : "",
                complete: task.complete ? task.complete : false,
                completed_at: task.completed_at ? task.completed_at : (task.complete ? DateTime.fromISO(task.due).minus({days: 3}) :  null),
                created_at: task.created_at ? task.created_at : DateTime.fromISO(task.due).minus({weeks: 1}),
                updated_at: task.updated_at ? task.updated_at : DateTime.fromISO(task.due).minus({days: 2}),
            };
            this.handler.tasks.push(newTask);
        },

        /**
         * Set the server that will be used to intercept REST calls.
         * @param {MswServer} server 
         */
        setServer(server) {
            this.handler.server = server;
        },

        // addMock() {
        //     this.server=const server = setupServer(...mockHandler.mocks);
        // }
    }

    mocks = [
        rest.get(this.API_URL, (req, res, ctx) => {
            // Only works with full url or regex for some reason... You aren't supposed to use wildcard though
            // https://mswjs.io/docs/basics/request-matching
            return res(
                ctx.status(200),
                ctx.json(this.tasks)
                );
        }),
        rest.post(this.API_URL, (req, res, ctx) => {
            this.setup.addTask(req.body);
            return res(
                ctx.status(201),
                ctx.json(req)
            )
        }),
        rest.patch(this.API_URL + ":id", (req, res, ctx) => {
            // I'm not going to bother with validations. If there is a
            // test that requires an error that test should write a handler
            // for that particular situation and make it a one-time thing
            // https://mswjs.io/docs/api/response/once
            // I don't even know that I need to do this but It's simple so I will
            this.tasks.forEach((task, i) => {
                if (task.id === req.params.id) {
                    this.tasks.splice(i, 1, req.body);
                }
            }) 
            return res(
                ctx.status(200),
                ctx.json(req)
            )
        }),
        rest.get(this.API_URL + ":id", (req, res, ctx) => {
            const task = this.tasks.find((t) => t.id === req.params.id);
            return res(
                ctx.status(200),
                ctx.json(task)
            )
        }),
        rest.delete(this.API_URL + ":id", (req, res, ctx) => {
            this.tasks.forEach((task, i) => {
                if (task.id === req.params.id) {
                    this.tasks.splice(i, 1);
                }
            }) 
            return res(
                ctx.status(204)
            )
        })
    ]
}