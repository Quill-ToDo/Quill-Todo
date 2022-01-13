import MockTaskApiHandler from "./MockTaskApiHandler";
import { DateTime } from "luxon";
import { setupServer } from 'msw/node'
import { rest } from "msw";
import axios from "axios";

describe("should init with", () => {
    const defaultBaseDate = DateTime.utc(2069, 6, 6, 6, 4, 2, 0);
    const newDateOverride = DateTime.utc(2022, 5, 22, 10, 30);

    describe.each([
        ["Overdue incomplete", false, defaultBaseDate.minus({months: 1}), defaultBaseDate.minus({days: 7}), "Task description"],
        ["Overdue complete", true, defaultBaseDate.minus({months: 1}), defaultBaseDate.minus({weeks: 3}), ""],
        ["No start", false, null, defaultBaseDate.minus({weeks: 3}), ""],
        ["Work on today", false, defaultBaseDate.minus({months: 2}), defaultBaseDate.plus({months: 2}), "A long project"],
        ["Upcoming", false, null, defaultBaseDate.plus({months: 2}), ""],
        ["Upcoming span", true, defaultBaseDate.plus({weeks: 2}), defaultBaseDate.plus({weeks: 4}), ""],
        ["Due today", true, null, defaultBaseDate.plus({hours: 2}), "Omg!"],
        ["Due today span", false, defaultBaseDate.minus({weeks: 1}), defaultBaseDate.plus({hours: 3}), ""],
        ["Due tomorrow", true, defaultBaseDate.minus({days: 3}), defaultBaseDate.plus({days: 1}), ""],
    ])('task "%"\'s', (tName, complete, start, due, description) => {
        it("details populated", ()=>{
            const handler = new MockTaskApiHandler();
            const task = handler.tasks.find((task) => task.title === tName);
            expect(task).toBeDefined();
            expect(task.complete).toEqual(complete);
            expect(task.start).toEqual(start);
            expect(task.due).toEqual(due);
            expect(task.description).toEqual(description);
        });
    });

    describe.each([
        ["Overdue incomplete", false, newDateOverride.minus({months: 1}), newDateOverride.minus({days: 7}), "Task description"],
        ["Overdue complete", true, newDateOverride.minus({months: 1}), newDateOverride.minus({weeks: 3}), ""],
        ["No start", false, null, newDateOverride.minus({weeks: 3}), ""],
        ["Work on today", false, newDateOverride.minus({months: 2}), newDateOverride.plus({months: 2}), "A long project"],
        ["Upcoming", false, null, newDateOverride.plus({months: 2}), ""],
        ["Upcoming span", true, newDateOverride.plus({weeks: 2}), newDateOverride.plus({weeks: 4}), ""],
        ["Due today", true, null, newDateOverride.plus({hours: 2}), "Omg!"],
        ["Due today span", false, newDateOverride.minus({weeks: 1}), newDateOverride.plus({hours: 3}), ""],
        ["Due tomorrow", true, newDateOverride.minus({days: 3}), newDateOverride.plus({days: 1}), ""],
    ])('task "%"\'s', (tName, complete, start, due, description) => {
        it("details populated with a date override", ()=>{
            const handler = new MockTaskApiHandler({date: newDateOverride});
            const task = handler.tasks.find((task) => task.title === tName);
            expect(task).toBeDefined();
            expect(task.complete).toEqual(complete);
            expect(task.start).toEqual(start);
            expect(task.due).toEqual(due);
            expect(task.description).toEqual(description);
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
            pk: 1
        }
    ]);
    expect(handler.tasks[0].title).toEqual("Bing bong");
    expect(handler.tasks.length).toEqual(1);
})

it("should not add tasks with duplicate pks", () => {
    const handler = new MockTaskApiHandler();
    handler.setup.addTask(
        {
            title: "Bing bong",
            complete: true,
            pk: 1
        });

    expect(() => {
        handler.setup.addTask({
                title: "BONG",
                complete: true,
                pk: 1
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
    const API_URL = "http://localhost:8000/api/tasks/";

    it("fetch", async () => {
        const handler = new MockTaskApiHandler();
        handler.server.listen();
        const res = await axios.get(API_URL);
        handler.server.close();
        handler.tasks.forEach(task => {
            expect(res.data.find((resTask) => resTask.title === task.title)).toBeDefined();
        })
    })

    it("detail", async () => {
        const handler = new MockTaskApiHandler();
        handler.server.listen();
        const pk = handler.tasks[0].pk;
        const res = await axios.get(API_URL+pk);
        handler.server.close();
        expect(handler.tasks[0].title).toEqual(res.data.title);
    })
    
    it("delete", async () => {
        const handler = new MockTaskApiHandler();
        handler.server.listen();
        const pk = handler.tasks[0].pk;
        const title = handler.tasks[0].title;
        await axios.delete(API_URL+pk);
        handler.server.close();
        expect(handler.tasks.find(t => t.title === title)).toBeUndefined();
    })
});