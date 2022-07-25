import {
    render,
    screen,
    within
} from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import { logRoles } from '@testing-library/react';
import { DateTime, Settings } from 'luxon';
import MockTaskApiHandler from '../../API/MockTaskApiHandler';

// await screen.findByText("Overdue incomplete");
// logRoles(screen.getByTestId("home"));

import App from "../../App";
import { DATE_FORMAT, TIME_FORMAT } from '../../constants';

const baseDate = DateTime.utc(2021, 6, 6, 6);
const mockServerHandler = new MockTaskApiHandler({date: baseDate});
const luxonNow = Settings.now;

beforeAll(() => {
    // Start mock API
    mockServerHandler.server.listen();
    // Set constant time for DateTime.now()
    const millis = baseDate.toMillis();
    Settings.now = () => millis;
})

beforeEach(() => {
    mockServerHandler.server.resetHandlers();
    mockServerHandler.setup.initTasks();
})

afterAll(() => {
    Settings.now = luxonNow;
    mockServerHandler.server.close();
})

it("should show a task-creation popup when users click the add button", async () => {
    await render(<App />);
    expect(screen.getByRole("region", {name:"Task list"})).toBeInTheDocument();
    const user = userEvent.setup();
    const addBtn = await screen.findByRole('menuitem', {name: "Add task"});
    await user.click(addBtn);
    // logRoles(screen.getByTestId("home"))
    // await screen.findByRole("region", {name: "New Task"})
})

const getNewTaskPopup = async (user) => {
    render(<App />);
    const addBtn = await screen.findByRole('menuitem', {name: "Add task"});
    await user.click(addBtn);
    const popup =  await screen.findByRole("region", {name: "New Task"});
    return popup;
}

const selectors = {
    title: (popup) => within(popup).getByRole("textbox", {name: "Title", exact: false}),
    desc: (popup) => within(popup).getByLabelText("Description", {name: "Start Date", exact: false}),
    startDate: (popup) => within(popup).getByRole("textbox", {name: "Start Date", exact: false}),
    startTime: (popup) => within(popup).getByRole("textbox", {name: "Start Time", exact: false}),
    dueDate: (popup) => within(popup).getByRole("textbox", {name: "Due Date", exact: false}),
    dueTime: (popup) => within(popup).getByRole("textbox", {name: "Due Time", exact: false}),
    dueTimepicker: (popup) => within(popup).getByRole("button", {name: "Choose Due time", exact: false})
}

const submitPopup = async (user, popup) => {
    const submit = await within(popup).findByRole("button", {name:"Add task"});
    await user.click(submit);
    expect(popup).not.toBeInTheDocument();
    expect(screen.queryByRole("alertdialog", {name:"Error:"})).toBeNull();
}

describe("should allow the user to create a new task", () => {
    const clearInputCode = `{Shift>}A{/Shift}{Clear}`;

    it("with only a title specified", async () => {
        const user = userEvent.setup();
        const popup = await getNewTaskPopup(user);
        const t = "My task";
        await user.type(selectors.title(popup), t);
        await submitPopup(user, popup);
        await within(await screen.findByRole("region", {name: "Task list"})).findByText(t);
    })

    it("with a valid description", async () => {
        const user = userEvent.setup();
        const popup = await getNewTaskPopup(user);
        const t = "desc";
        const d = "This is my task! Hopefully it has a description."
        await user.type(selectors.title(popup), t);
        await user.type(selectors.desc(popup), d);
        await submitPopup(user, popup); 
        const task = await within(await screen.findByRole("region", {name: "Task list"})).findByText(t);
        user.click(task);
        await screen.findByText(d);
    })
    
    it("with a valid due date specified", async () => {
        const t = "due date!!";
        const user = userEvent.setup();
        const popup = await getNewTaskPopup(user);
        await user.type(selectors.title(popup), t);
        const ddInput = selectors.dueDate(popup);
        user.clear(ddInput);
        await user.type(ddInput, `${baseDate.plus({days: 1}).toFormat(DATE_FORMAT)}`);
        await submitPopup(user, popup);
        await within(await screen.findByRole("region", {name: "Task list"})).findByText(t);
    })

    it("with a valid due time typed in", async () => {
        const user = userEvent.setup();
        const t = "due time!!";
        const popup = await getNewTaskPopup(user);
        await user.type(selectors.title(popup), t);
        const timeBox = selectors.dueTime(popup);
        user.clear(timeBox);
        await user.type(timeBox, `${baseDate.plus({hours: 1}).toFormat(TIME_FORMAT)}`);
        await submitPopup(user, popup);
        await screen.findByText(t);
    })

    it.only("with a valid due time chosen from the timepicker", async () => {
        const user = userEvent.setup();
        const popup = await getNewTaskPopup(user);
        user.click(selectors.dueTimepicker(popup));
        user.click(await screen.findByRole("section", {name: "Increment Hour"}));
    })

    it("with a valid start date specified", async () => {
        const t = "start date!!";
        const user = userEvent.setup();
        const popup = await getNewTaskPopup(user);
        await user.type(selectors.title(popup), t);
        const input = selectors.startDate(popup);
        user.clear(input);
        await user.type(input, `${baseDate.minus({weeks: 1}).toFormat(DATE_FORMAT)}`);
        await submitPopup(user, popup);
        await within(await screen.findByRole("region", {name: "Task list"})).findByText(t);
    })

    it("with a valid start time specified", async () => {
        const user = userEvent.setup();
        const t = "start time!!";
        const popup = await getNewTaskPopup(user);
        await user.type(selectors.title(popup), t);
        const timeBox = selectors.startTime(popup);
        user.clear(timeBox);
        await user.type(timeBox, `${baseDate.minus({hours: 1}).toFormat(TIME_FORMAT)}`);
        await submitPopup(user, popup);
        await screen.findByText(t);
    })

    it.skip("with a valid start time chosen from the timepicker", async () => {
        const user = userEvent.setup();
        const popup = await getNewTaskPopup(user);
    })
})

describe("should not allow the user to create a new task", () => {
    it.todo("with a start after due date")
    it.todo("with a ill-formed start date")
    it.todo("with a ill-formed due date")
    it.todo("with a title too long")
    it.todo("with a description too long")
})