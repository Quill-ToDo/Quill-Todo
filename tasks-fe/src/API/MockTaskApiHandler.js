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

const API_URL = "/api/tasks/";
const BAD_WILDCARD = "*/api/tasks/";

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
    tasks = [];
    // This base "current" date to base computations of off
    date = "";
    // The MSW server
    server = null;

    /**
     * Initialize a handler with an optional date or task override values. 
     * @param {DateTime} dateOverride Optional date to make tasks relative to.
     * @param {[object]} taskOverrides Optional tasks to add to DB relative to `dateOverride`. 
     */
    constructor(dateOverride = null, taskOverrides = null) {
        this.date = dateOverride ? dateOverride : DateTime.utc(2069, 6, 6, 6, 4, 2, 0);
        // If you change these hard-coded tasks, please just add to them or make sure you don't break a lot of
        // tests by removing any.
        this.tasks = taskOverrides ? taskOverrides : [{
                pk: 0,
                title: "Overdue incomplete",
                complete: false,
                completed_at: null,
                start: this.date.minus({
                    months: 1
                }),
                due: this.date.minus({
                    days: 7
                }),
                description: "Task description",
                created_at: this.date.minus({
                    weeks: 3
                }),
                updated_at: this.date,
            },
            {
                pk: 1,
                title: "Overdue complete",
                complete: true,
                completed_at: null,
                start: this.date.minus({
                    months: 1
                }),
                due: this.date.minus({
                    weeks: 3
                }),
                description: "",
                created_at: this.date.minus({
                    months: 2
                }),
                updated_at: this.date.minus({
                    months: 1
                }).plus({
                    days: 1
                }),
            },
            {
                pk: 2,
                title: "No start",
                complete: false,
                completed_at: null,
                start: null,
                due: this.date.minus({
                    weeks: 3
                }),
                description: "",
                created_at: this.date.minus({
                    months: 2
                }),
                updated_at: this.date.minus({
                    months: 1
                }).plus({
                    days: 1
                }),
            },
            {
                pk: 3,
                title: "Work on today",
                complete: false,
                completed_at: null,
                start: this.date.minus({
                    months: 2
                }),
                due: this.date.plus({
                    months: 2
                }),
                description: "A long project",
                created_at: this.date.minus({
                    months: 2
                }),
                updated_at: this.date.minus({
                    months: 1
                }).plus({
                    days: 1
                }),
            },
            {
                pk: 4,
                title: "Upcoming",
                complete: false,
                completed_at: null,
                start: "",
                due: this.date.plus({
                    months: 2
                }),
                description: "",
                created_at: this.date.minus({
                    months: 2
                }),
                updated_at: this.date.minus({
                    months: 1
                }).plus({
                    days: 1
                }),
            },
            {
                pk: 5,
                title: "Upcoming span",
                complete: true,
                completed_at: null,
                start: this.date.plus({
                    weeks: 2
                }),
                due: this.date.plus({
                    weeks: 4
                }),
                description: "",
                created_at: this.date.minus({
                    months: 2
                }),
                updated_at: this.date.minus({
                    months: 1
                }).plus({
                    days: 1
                }),
            },
            {
                pk: 6,
                title: "Due today",
                complete: true,
                completed_at: null,
                start: null,
                due: this.date.plus({
                    hours: 2
                }),
                description: "Omg!",
                created_at: this.date.minus({
                    months: 2
                }),
                updated_at: this.date.minus({
                    months: 1
                }).plus({
                    days: 1
                }),
            },
            {
                pk: 7,
                title: "Due today span",
                complete: false,
                completed_at: null,
                start: this.date.minus({
                    weeks: 1
                }),
                due: this.date.plus({
                    hours: 3
                }),
                description: "Omg!",
                created_at: this.date.minus({
                    months: 2
                }),
                updated_at: this.date.minus({
                    months: 1
                }).plus({
                    days: 1
                }),
            },
            {
                pk: 8,
                title: "Due tomorrow",
                complete: true,
                completed_at: null,
                start: this.date.minus({
                    days: 3
                }),
                due: this.date.plus({
                    days: 1
                }),
                description: "Omg!",
                created_at: this.date.minus({
                    months: 2
                }),
                updated_at: this.date.minus({
                    months: 1
                }).plus({
                    days: 1
                }),
            },
        ];
        this.server = setupServer(...this.mocks);
    }

    /**
     * **NOT NETWORK CALLS:** Set up/change this DB however you'd like after 
     * initialization. 
     */
    setup = {
        handler: this,
        /**
         * Set the tasks for this object if you would like to override them.
         * 
         *  **Task format:** 
         *   
         * {
         * 
         *       "pk": {int/omit field to be auto assigned},
         *       "title": {str},
         *       "complete": {bool},
         *       "completed_at": {null/DateTime depending on the value of complete},
         *       "start": {DateTime/omit field for null},
         *       "due": {DateTime},
         *       "description": {str},
         *       "created_at":  {DateTime/omit field to be auto assigned},
         *       "updated_at": {Datetime/omit field to be auto assigned},
         * 
         *   }
         * @param {[Object]} tasks 
         */
        setTasks(tasks) {
            this.handler.tasks = tasks;
        },

        getTasks() {
            return this.handler.tasks;
        },

        /**
         * Add one task to the mock DB. For any of the DateTime fields, use offsets from `this.date` as seen in the
         * constructor. No validations are run.
         * 
         * **Task format:** 
         *   
         * {
         * 
         *       title: {str},
         *       due: {DateTime},
         *       pk: {int/omit field to be auto assigned},
         *       start: {DateTime/omit field for null},
         *       complete: {bool/omitted for false},
         *       completed_at: {null/DateTime depending on the value of complete or omitted to be auto assigned},
         *       description: {str/omit for ""},
         *       created_at: {DateTime/omit field to be auto assigned},
         *       updated_at: {Datetime/omit field to be auto assigned},
         * 
         *   }
         * @param {object} task The task to add. Formatted as: 
         */
        addTask(task) {
            var newTask = {};
            // Required
            newTask.title = task.title;
            newTask.due = task.due;
            // Optional
            if (task.pk === undefined) {
                newTask.pk = uuidv4();    
            } 
            else {
                newTask.pk = task.pk;
            }
            if (task.description === undefined) {
                newTask.description = "";
            }
            else {
                newTask.description = task.description;
            }
            if (task.complete === undefined) {
                newTask.complete = false;
            }
            else {
                newTask.complete = task.complete;
            }
            if (task.completed_at === undefined) {
                if (newTask.complete) {
                    newTask.completed_at = DateTime.fromISO(newTask.due).minus({days: 3});
                }
                else {
                    newTask.completed_at = null;
                }
            }
            if (task.start === undefined) {
                newTask.start = null;
            }
            else {
                newTask.start = task.start;
            }
            if (task.created_at === undefined) {
                newTask.created_at = DateTime.fromISO(newTask.due).minus({weeks: 1});
            }
            else {
                newTask.created_at = task.created_at;
            }
            if (task.updated_at === undefined) {
                newTask.updated_at = DateTime.fromISO(newTask.due).minus({days: 2});
            }
            else {
                newTask.updated_at = task.updated_at;
            }

            this.handler.tasks.push(task);
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
        rest.delete(BAD_WILDCARD + ":pk", (req, res, ctx) => {
            this.tasks.forEach((task, i) => {
                if (task.pk === req.headers.pk) {
                    this.tasks.splice(i, 1);
                }
            }) 
            return res(
                ctx.status(204)
            )
        })
    ]
}