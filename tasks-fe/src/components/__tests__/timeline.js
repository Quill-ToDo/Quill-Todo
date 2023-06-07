import { DateTime, Interval, Settings } from 'luxon';
import MockTaskApiHandler from '../../API/MockTaskApiHandler';
import { Timeline } from '../../globalStore/Timeline.js';
import { TaskStore } from '../../globalStore/TaskStore.js';
import { TaskApi } from '../../API/TaskApi.js';
import { RootStore } from '../../globalStore/StoreContext';


const baseDate = DateTime.utc(2023, 1, 1, 12);
const mockServerHandler = new MockTaskApiHandler({date: baseDate});
const luxonNow = Settings.now;

// await screen.findByText("Overdue incomplete");
// logRoles(screen.getByRole("region", {name: "Task list"}));


beforeAll(() => {
    // Start mock API
    // mockServerHandler.server.listen();
    // Set constant time for DateTime.now()
    const millis = baseDate.toMillis();
    Settings.now = () => millis;
});

beforeEach(() => {
    mockServerHandler.server.resetHandlers();
    mockServerHandler.setup.initTasks();
})

afterAll(() => {
    Settings.now = luxonNow;
    mockServerHandler.server.close();
});

// it("should show a task-creation popup when users click the add button", async () => {
//     await render(<App />);
//     expect(screen.getByRole("region", {name:"Task list"})).toBeInTheDocument();
//     const user = userEvent.setup();
//     const addBtn = await screen.findByRole('menuitem', {name: "Add task"});
//     await user.click(addBtn);
//     // logRoles(screen.getByTestId("home"))
//     // await screen.findByRole("region", {name: "New Task"})
// })

const getTimeline = () => {
    return new RootStore().timeline;
};

describe("getDaysInInterval", () => {
    const days = []; 
    for (let day = 1; day < 18; day++) {
        days.push(DateTime.utc(2023, 1, day));
    }
    //   01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 
    //   t4 t4 t4    t1 t1 t1 t1    t2 t2 t2 t2 
    //   t5 t5 t5                         t3 t3 t3 t3  
    const tasks = [
        {
            title: "T1",
            start: days[5],
            due: days[8],
        },
        {
            title: "T2",
            start: days[10],
            due: days[13],
        },
        {
            title: "T3",
            start: days[12],
            due: days[15],
        },
        {
            title: "T4",
            start: days[1],
            due: days[3],
        },
        {
            title: "T5",
            start: days[1],
            due: days[3],
        },
    ]
    it("should return a timeline object with 1 task in the requested interval", () => {

        // Not recognizing intervals as being in Timeline map. if they are there... Might want to change map keys from interval to something easier and make
        // a different defualt function that mapes intervals / datetimes to strings fo keys 
        const timeline = getTimeline();
        const timelineDays = timeline.getDaysInInterval(Interval.fromDateTimes(days[4], days[9]));
        console.log(timelineDays);
        console.log("timeline:", timeline.print());
        const firstTitle = timelineDays.values().next().value.name;
        // expect title to be T1
        expect(firstTitle).toBe("T1");
    });
    it.todo("should return a timeline object with 1 task when the interval spans its start date");
    it.todo("should return a timeline object with 1 task when the interval spans its end date");
    it.todo("should return a timeline object with 2 completely overlapping tasks in the requested interval");
    it.todo("should return a timeline object with 2 completely overlapping tasks when the interval spans their end dates");
    it.todo("should return a timeline object with 2 partially overlapping tasks in the requested interval");
    it.todo("should return a timeline object with 2 partially overlapping tasks when the interval spans ones beginning and ones end");
})


it.todo("should return a list of day objects with references to the tasks that occur on that day");
it.todo("should correctly track the intervals of days that have been loaded into the calendar");