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
import { DATE_FORMAT } from '../../constants';
// import { keyboard } from '@testing-library/user-event/dist/types/setup/directApi';

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

const title = "title";
const desc = "description";
const startDate = "start date";
const startTime = "start date";
const dueDate = "start date";
const dueTime = "start date";
const selectors = {
    title: (popup) => within(popup).getByRole("textbox", {name: "Title", exact: false}),
    desc: (popup) => within(popup).getByLabelText("Description", {name: "Start Date", exact: false}),
    startDate: (popup) => within(popup).getByRole("textbox", {name: "Start Date", exact: false}),
    startTime: (popup) => within(popup).getByRole("textbox", {name: "Start Tate", exact: false}),
    dueDate: (popup) => within(popup).getByRole("textbox", {name: "Due Date", exact: false}),
    dueTime: (popup) => within(popup).getByRole("textbox", {name: "Due Time", exact: false})
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
        await user.type(selectors[title](popup), "Task title");
        await submitPopup(user, popup);
        await within(await screen.findByRole("region", {name: "Task list"})).findByText("Task title");
    })
    
    it.skip("with a valid due date specified", async () => {
        const t = "due date!!";
        const user = userEvent.setup();
        const popup = await getNewTaskPopup(user);
        await user.type(selectors[title](popup), t);
        const ddInput = selectors[dueDate](popup);
        user.click(ddInput);
        // clear and keyboard user-event methods arent working
        // keyboard("{Shift>}A{/Shift}");
        await user.type(ddInput, `${baseDate.plus({days: 1}).toFormat(DATE_FORMAT)}`);
        await submitPopup(user, popup);
        await within(await screen.findByRole("region", {name: "Task list"})).findByText(t);
    })

    it.skip("with a valid due time typed in", async () => {
        const user = userEvent.setup();
        const popup = await getNewTaskPopup(user);
        await typeInPopup(user, popup, {title: "Task title"});
        await submitPopup(user, popup);
        await screen.findByText("Task title");
    })

    it.skip("with a valid due time chosen from the timepicker", async () => {
        const user = userEvent.setup();
        const popup = await getNewTaskPopup(user);
        await typeInPopup(user, popup, {title: "Task title"});
        await submitPopup(user, popup);
        await screen.findByText("Task title");
    })

    it.skip("with a valid start and date specified", async () => {
        const user = userEvent.setup();
        const popup = await getNewTaskPopup(user);
        await typeInPopup(user, popup, {title: "Task title"});
        await submitPopup(user, popup);
        // const list = await screen.findByRole("region", {name: "Task list"});
        await screen.findByText("Task title");
    })
})

describe("should not allow the user to create a new task", () => {
    it.todo("with a start after due date")
    it.todo("with a ill-formed start date")
    it.todo("with a ill-formed due date")
    it.todo("with a title too long")
    it.todo("with a description too long")
})