import {
    render,
    screen,
    waitForElementToBeRemoved,
    within,
    configure,
    waitFor
} from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import { logRoles } from '@testing-library/react';
import { DateTime, Settings } from 'luxon';
import MockTaskApiHandler from '../../API/MockTaskApiHandler';

// await screen.findByText("Overdue incomplete");
// logRoles(screen.getByTestId("home"));

import App from "../../App"
import Home from '../Home';

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

it("should render the app without crashing", () => {
    render(<App />);
})

it.todo("should now allow not signed out users to access the home page")
it.todo("should redirect users to home after sign in")
it.todo("Should render the calendar component")


it("should render the list component", () => {
    render(<App />);
    // render(<Home />);
    expect(screen.getByRole("region", {name:"Task list"})).toBeInTheDocument();
})

//  Task addition

it.only("should show a task-creation popup when users click the add button", async () => {
    await render(<App />);
    expect(screen.getByRole("region", {name:"Task list"})).toBeInTheDocument();
    const user = userEvent.setup();
    const addBtn = await screen.findByRole('menuitem', {name: "Add task"});
    await user.click(addBtn);
    // logRoles(screen.getByTestId("home"))
    // await screen.findByRole("region", {name: "New Task"})
})

describe("should allow the user to create a new task", () => {
    const getNewTaskPopup = async (user) => {
        render(<App />);
        const addBtn = await screen.findByRole('menuitem', {name: "Add task"});
        await user.click(addBtn);
        const popup =  await screen.findByRole("region", {name: "New Task"});
        return popup;
    }

    const typeInPopup = async (user, popup, {title=null}) => {
        if (title) {
            // logRoles(popup)
            const title = await within(popup).findByRole("textbox", {name: "Title", exact: false});
            // const desc = await within(popup).findByLabelText("Description", {exact: false});
            await user.type(title, "Task title");
            expect(title).toHaveValue("Task title");
        }
    }

    const submitPopup = async (user, popup) => {
        const submit = await within(popup).findByRole("button", {name:"Add task"});
        // await user.click(submit);
        await user.pointer({keys: '[MouseLeft]', target: submit});
        expect(popup).not.toBeInTheDocument();
        mockServerHandler.server.printHandlers()
        expect(screen.queryByRole("alertdialog", {name:"Error:"})).toBeNull();
    }

    it("with a title", async () => {
        const user = userEvent.setup();
        const popup = await getNewTaskPopup(user);
        await typeInPopup(user, popup, {title: "Task title"});
        await submitPopup(user, popup);
        // const list = await screen.findByRole("region", {name: "Task list"});
        await screen.findByText("Task title");
    })
    
    it.todo("without a title")
    it.todo("without a due date")
    it.todo("start after due date")
    it.todo("with a ill-formed start date")
    it.todo("with a ill-formed due date")
})
