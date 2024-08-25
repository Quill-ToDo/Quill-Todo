import { MockTaskApiHandler, PassedTask } from "./MockTaskApiHandler";
import { DateTime } from "luxon";
import { TaskApi } from "@/store/tasks/TaskApi"
import { MOCK_SERVER_HANDLER } from "@/testing/jest.setup";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

describe("should init with", () => {
    const defaultBaseDate = DateTime.utc(2069, 6, 6, 6, 4, 2, 0);
    const defaultStart = defaultBaseDate.set({hour:0, minute: 0, second:0,  millisecond:0});
    const newDateOverride = DateTime.utc(2022, 5, 22, 10, 30);
    const defaultStartOverride = newDateOverride.set({hour:0, minute: 0, second:0,  millisecond:0});

    describe.each([
        {title: "Overdue incomplete", complete: false, start: defaultBaseDate.minus({months: 1}), due: defaultBaseDate.minus({days: 7}), description: "Task description"},
        {title: "Overdue complete", complete: true, start: defaultBaseDate.minus({months: 1}), due: defaultBaseDate.minus({weeks: 3}), description: ""},
        {title: "No start", complete: false, start: defaultStart, due: defaultBaseDate.minus({weeks: 3}), description: ""},
        {title: "Work on today", complete: false, start: defaultBaseDate.minus({months: 2}), due: defaultBaseDate.plus({months: 2}), description: "A long project"},
        {title: "Upcoming", complete: false, start: defaultBaseDate.plus({months: 2}), due: defaultBaseDate.plus({months: 2}), description: ""},
        {title: "Upcoming span", complete: true, start: defaultBaseDate.plus({weeks: 2}), due: defaultBaseDate.plus({weeks: 4}), description: ""},
        {title: "Due today", complete: true, start: defaultBaseDate, due: defaultBaseDate.plus({hours: 2}), description: "Omg!"},
        {title: "Due today span", complete: false, start: defaultBaseDate.minus({weeks: 1}), due: defaultBaseDate.plus({hours: 3}), description: ""},
        {title: "Due tomorrow", complete: true, start: defaultBaseDate.minus({days: 3}), due: defaultBaseDate.plus({days: 1}), description: ""},
    ])('task "$title"\'s', (t) => {
        it("details populated", ()=>{
            const handler = new MockTaskApiHandler();
            const dbTask = handler.tasks.find((task) => t.title === task.title);
            expect(dbTask).toBeDefined();
            if (dbTask) {
                expect(dbTask.complete).toEqual(t.complete);
                expect(dbTask.start).toEqual(t.start);
                expect(dbTask.due).toEqual(t.due);
                expect(dbTask.description).toEqual(t.description);
            }
        });
    });

    describe.each([
        {title: "Overdue incomplete", complete: false, start: newDateOverride.minus({months: 1}), due: newDateOverride.minus({days: 7}), description: "Task description"},
        {title: "Overdue complete", complete: true, start: newDateOverride.minus({months: 1}), due: newDateOverride.minus({weeks: 3}), description: ""},
        {title: "No start", complete: false, start: defaultStartOverride, due: newDateOverride.minus({weeks: 3}), description: ""},
        {title: "Work on today", complete: false, start: newDateOverride.minus({months: 2}), due: newDateOverride.plus({months: 2}), description: "A long project"},
        {title: "Upcoming", complete: false, start: newDateOverride.plus({months: 2}), due: newDateOverride.plus({months: 2}), description: ""},
        {title: "Upcoming span", complete: true, start: newDateOverride.plus({weeks: 2}), due: newDateOverride.plus({weeks: 4}), description: ""},
        {title: "Due today", complete: true, start: newDateOverride, due: newDateOverride.plus({hours: 2}), description: "Omg!"},
        {title: "Due today span", complete: false, start: newDateOverride.minus({weeks: 1}), due: newDateOverride.plus({hours: 3}), description: ""},
        {title: "Due tomorrow", complete: true, start: newDateOverride.minus({days: 3}), due: newDateOverride.plus({days: 1}), description: ""},
    ])('task "$title"\'s', (t) => {
        it("details populated with a date override", ()=>{
            const handler = new MockTaskApiHandler({date: newDateOverride});
            const dbTask = handler.tasks.find((task) => task.title === t.title);
            expect(dbTask).toBeDefined();
            if (dbTask) {
                expect(dbTask.complete).toEqual(t.complete);
                expect(dbTask.start).toEqual(t.start);
                expect(dbTask.due).toEqual(t.due);
                expect(dbTask.description).toEqual(t.description);
            }
        });
    });

    it("task overrides", () => {
        const handler1 = new MockTaskApiHandler({tasks: []});
        expect(handler1.tasks).toEqual([]);
        const handler2 = new MockTaskApiHandler({tasks: [
            {
                title: "Wash pupper",
                complete: false,
            }
        ]});
        expect(handler2.tasks[0].title).toEqual("Wash pupper");
        expect(handler2.tasks.length).toEqual(1);
    })
})

it("should set tasks properly", () => {
    MOCK_SERVER_HANDLER.setup.setTasks([]);
    expect(MOCK_SERVER_HANDLER.tasks).toEqual([]);
    MOCK_SERVER_HANDLER.setup.setTasks([
        {
            title: "Bing bong",
            complete: true,
            id: "1",
        }
    ]);
    expect(MOCK_SERVER_HANDLER.tasks[0].title).toEqual("Bing bong");
    expect(MOCK_SERVER_HANDLER.tasks.length).toEqual(1);
})

it("should not add tasks with duplicate ids", () => {
    const dupeId = "ding dong";
    MOCK_SERVER_HANDLER.setup.addTask(
        {
            title: "Bing bong",
            id: dupeId,
        });

    expect(() => {
        MOCK_SERVER_HANDLER.setup.addTask({
                title: "BONG",
                id: dupeId,
            });
    }).toThrow("already exists");
})


it("should set a new server", () => {
    const server1 = MOCK_SERVER_HANDLER.server;
    const mock = http.get("/", () => new HttpResponse(null, { status: 200 }));
    const server2 = setupServer(mock);
    MOCK_SERVER_HANDLER.setup.setServer(server2);
    expect(MOCK_SERVER_HANDLER.server).not.toBe(server1);
})


describe("should intercept network call", () => {
    const api = new TaskApi();

    it("fetch", async () => {
        const res = await api.fetchTasks();
        MOCK_SERVER_HANDLER.tasks.forEach(task => {
            expect(res.data.find((resTask) => resTask.title === task.title)).toBeDefined();
        })
    })

    it("detail", async () => {
        const id = MOCK_SERVER_HANDLER.tasks[0].id;
        const res = await api.detail(id);
        expect(MOCK_SERVER_HANDLER.tasks[0].title).toEqual(res.data.title);
    })

    it("post", async () => {
        const task: PassedTask = { title: "bing bong" };
        const res = await api.createTask(task);
        expect(res.status === 201)
        expect(MOCK_SERVER_HANDLER.tasks.some(task => task.title === res.data.title)).toBeTruthy();
    })
    
    it("delete", async () => {
        const id = MOCK_SERVER_HANDLER.tasks[0].id;
        const title = MOCK_SERVER_HANDLER.tasks[0].title;
        await api.deleteTask(id);
        expect(MOCK_SERVER_HANDLER.tasks.find(t => t.title === title)).toBeUndefined();
    })

    it("should return updated task data with overrides", async () =>{
        if (MOCK_SERVER_HANDLER.server) {
            MOCK_SERVER_HANDLER.setup.setTasks([]);
        }
        const res = await api.fetchTasks();
        expect(res.data).toEqual([]);
    })
});