import MockTaskApiHandler from "./MockTaskApiHandler";
import { DateTime } from "luxon";
import { setupServer } from 'msw/node'
import { rest } from "msw";
import { TaskApi } from "./TaskApi"

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
            expect(dbTask.complete).toEqual(t.complete);
            expect(dbTask.start).toEqual(t.start);
            expect(dbTask.due).toEqual(t.due);
            expect(dbTask.description).toEqual(t.description);
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
            expect(dbTask.complete).toEqual(t.complete);
            expect(dbTask.start).toEqual(t.start);
            expect(dbTask.due).toEqual(t.due);
            expect(dbTask.description).toEqual(t.description);
        });
    });

    it("task overrides", () => {
        const handler1 = new MockTaskApiHandler({tasks: []});
        expect(handler1.tasks).toEqual([]);
        const handler2 = new MockTaskApiHandler({tasks: [
            {
                title: "Wash pupper",
                complete: false
            }
        ]});
        expect(handler2.tasks[0].title).toEqual("Wash pupper");
        expect(handler2.tasks.length).toEqual(1);
    })
})

it("should set tasks properly", () => {
    const handler = new MockTaskApiHandler();
    handler.setup.setTasks([]);
    expect(handler.tasks).toEqual([]);
    handler.setup.setTasks([
        {
            title: "Bing bong",
            complete: true,
            id: 1
        }
    ]);
    expect(handler.tasks[0].title).toEqual("Bing bong");
    expect(handler.tasks.length).toEqual(1);
})

it("should not add tasks with duplicate ids", () => {
    const handler = new MockTaskApiHandler();
    handler.setup.addTask(
        {
            title: "Bing bong",
            complete: true,
            id: 1
        });

    expect(() => {
        handler.setup.addTask({
                title: "BONG",
                complete: true,
                id: 1
            });
    }).toThrow("already exists");
})


it("should set a new server", () => {
    const handler = new MockTaskApiHandler();
    const server1 = handler.server;
    const mock = () => {
        rest.get("/", (req, res, ctx) => {
            return rest(ctx.status(200))
        })
    }
    const server2 = setupServer(mock);
    handler.setup.setServer(server2);
    expect(server1).not.toBe(handler.server);
})


describe("should intercept network call", () => {
    const api = new TaskApi();

    it("fetch", async () => {
        const handler = new MockTaskApiHandler();
        handler.server.listen();
        const res = await api.fetchTasks();
        handler.server.close();
        handler.tasks.forEach(task => {
            expect(res.data.find((resTask) => resTask.title === task.title)).toBeDefined();
        })
    })

    it("detail", async () => {
        const handler = new MockTaskApiHandler();
        handler.server.listen();
        const id = handler.tasks[0].id;
        const res = await api.detail(id);
        handler.server.close();
        expect(handler.tasks[0].title).toEqual(res.data.title);
    })
    
    it("delete", async () => {
        const handler = new MockTaskApiHandler();
        handler.server.listen();
        const id = handler.tasks[0].id;
        const title = handler.tasks[0].title;
        await api.deleteTask(id);
        handler.server.close();
        expect(handler.tasks.find(t => t.title === title)).toBeUndefined();
    })
});