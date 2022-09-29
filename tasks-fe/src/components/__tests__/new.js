import {
    render,
    screen,
    logRoles,
    within
} from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import { DateTime, Settings } from 'luxon';
import MockTaskApiHandler from '../../API/MockTaskApiHandler';

// await screen.findByText("Overdue incomplete");
// logRoles(screen.getByTestId("home"));

import App from "../../App";
import { DATE_FORMAT, MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH, NO_TITLE, taskCreationErrors, TIME_FORMAT } from '../../constants';
import { act } from 'react-dom/test-utils';

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
    desc: (popup) => within(popup).getByRole("textbox", {name: "Description", exact: false}),
    startDate: (popup) => within(popup).getByRole("textbox", {name: "Start Date", exact: false}),
    startTime: (popup) => within(popup).getByRole("textbox", {name: "Start Time", exact: false}),
    dueDate: (popup) => within(popup).getByRole("textbox", {name: "Due Date", exact: false}),
    dueTime: (popup) => within(popup).getByRole("textbox", {name: "Due Time", exact: false}),
    dueTimepicker: (popup) => within(popup).getByRole("button", {name: "Choose Due time", exact: false})
}

const submitPopup = async (user, popup) => {
    const submit = await within(popup).findByRole("button", {name:"Add task"});
    await user.click(submit);
}

const expectValidSubmission = async (popup, taskName) => {
    expect(popup).not.toBeInTheDocument();
    expect(screen.queryByRole("alertdialog", {name:"Error:"})).toBeNull();
    await within(await screen.findByRole("region", {name: "Task list"})).findByText(taskName);
}

describe("should allow the user to create a new task", () => {
    it("with only a title specified", async () => {
        const user = userEvent.setup();
        const popup = await getNewTaskPopup(user);
        const t = "My task";
        await user.type(selectors.title(popup), t);
        await submitPopup(user, popup);
        expectValidSubmission(popup, t);
    })

    it("with a valid description", async () => {
        const user = userEvent.setup();
        const popup = await getNewTaskPopup(user);
        const t = "desc";
        const d = "This is my task! Hopefully it has a description."
        await user.type(selectors.title(popup), t);
        await user.type(selectors.desc(popup), d);
        await submitPopup(user, popup); 
        expectValidSubmission(popup, t);
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
        expectValidSubmission(popup, t);
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
        expectValidSubmission(popup, t);
    })

    it.todo("with a valid due time chosen from the timepicker")
    // Going to wait until I get an accessible timepicker.
    // const user = userEvent.setup();
    // const popup = await getNewTaskPopup(user);
    // user.click(selectors.dueTimepicker(popup));
    // logRoles(screen.getByTestId("home"));
    // user.click(await screen.findByRole("statictext", {name: "Increment Hour"}));

    it("with a valid start date specified", async () => {
        const t = "start date!!";
        const user = userEvent.setup();
        const popup = await getNewTaskPopup(user);
        await user.type(selectors.title(popup), t);
        const input = selectors.startDate(popup);
        user.clear(input);
        await user.type(input, `${baseDate.minus({weeks: 1}).toFormat(DATE_FORMAT)}`);
        await submitPopup(user, popup);
        expectValidSubmission(popup, t);
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
        expectValidSubmission(popup, t);
    })

    it.todo("with a valid start time chosen from the timepicker")
})

describe("should not allow the user to create a new task", () => {
    it("without a title", async () => {
        const user = userEvent.setup();
        const popup = await getNewTaskPopup(user);
        const sdInput = selectors.startDate(popup);
        await submitPopup(user, popup);
        expect(popup).toBeInTheDocument();
        await within(popup).findByText(taskCreationErrors.NO_TITLE);
    })

    it("with a start date after due date", async () => {
        const t = "invalid start";
        const user = userEvent.setup();
        const popup = await getNewTaskPopup(user);
        await user.type(selectors.title(popup), t);
        const sdInput = selectors.startDate(popup);
        user.clear(sdInput);
        await user.type(sdInput, `${baseDate.plus({days: 2}).toFormat(DATE_FORMAT)}`);
        await submitPopup(user, popup);
        expect(popup).toBeInTheDocument();
        await within(popup).findByText(taskCreationErrors.START_DATE_AFTER_DUE);
    })

    it("with a start time after due time", async () => {
        const t = "invalid start";
        const user = userEvent.setup();
        const popup = await getNewTaskPopup(user);
        await user.type(selectors.title(popup), t);
        const stInput = selectors.startTime(popup);
        const dtInput = selectors.dueTime(popup);
        user.clear(dtInput);
        await user.type(dtInput, `${baseDate.plus({hours: 3}).toFormat(TIME_FORMAT)}`);
        user.clear(stInput);
        await user.type(stInput, `${baseDate.plus({hours: 4}).toFormat(TIME_FORMAT)}`);
        await submitPopup(user, popup);
        expect(popup).toBeInTheDocument();
        await within(popup).findByText(taskCreationErrors.START_TIME_AFTER_DUE);
    })

    it("with a ill-formed start date", async () => {
        const t = "invalid format";
        const user = userEvent.setup();
        const popup = await getNewTaskPopup(user);
        await user.type(selectors.title(popup), t);
        const sdInput = selectors.startDate(popup);
        await user.type(sdInput, `bing bong`);
        await submitPopup(user, popup);
        expect(popup).toBeInTheDocument();
        await within(popup).findByText(taskCreationErrors.INVALID_DATE_FORMAT);
    })

    it("with a ill-formed due date", async () => {
        const t = "invalid format";
        const user = userEvent.setup();
        const popup = await getNewTaskPopup(user);
        await user.type(selectors.title(popup), t);
        const ddInput = selectors.startDate(popup);
        await user.type(ddInput, `bing bong`);
        await submitPopup(user, popup);
        expect(popup).toBeInTheDocument();
        await within(popup).findByText(taskCreationErrors.INVALID_DATE_FORMAT);
    })

    it("with a title too long", async () => {
        let t = "Too long!Too long!Too long!Too long!Too long!";
        while (t.length <= MAX_TITLE_LENGTH) {
            t += t;
        }
        const user = userEvent.setup();
        const popup = await getNewTaskPopup(user);
        await user.type(selectors.title(popup), t);
        await submitPopup(user, popup);
        expect(popup).toBeInTheDocument();
        await within(popup).findByText(taskCreationErrors.TITLE_TOO_LONG(t));
    })

    it.skip("with a description too long", async () => {
        // This is timing out. :(
        jest.useFakeTimers({setTimeout: 10000})
        await jest.setTimeout(10000);
        let t = "Desc too long!";
        let d = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        while (d.length <= MAX_DESCRIPTION_LENGTH) {
            d += d;
        }
        const user = userEvent.setup();
        const popup = await getNewTaskPopup(user);
        await user.type(selectors.title(popup), t);
        await user.type(selectors.desc(popup), d);
        await act(() => selectors.desc(popup).textContent = d);
        // await submitPopup(user, popup);
        expect(popup).toBeInTheDocument();
        await within(popup).findByText(taskCreationErrors.DESCRIPTION_TOO_LONG(t));
        await jest.setTimeout(5000);
    })
})