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
    render(<Home />);
    expect(screen.getByRole("region", {name:"Task list"})).toBeInTheDocument();
})

//  Task addition

it("should should a task-creation popup when users click the add button", async () => {
    render(<App />);
    const user = userEvent.setup();
    const addBtn = await screen.findByRole('menuitem', {name: "Add task"});
    await user.click(addBtn);
    await screen.findByRole("region", {name: "New Task"})
})

it.only("should allow the user to create a new task", async () => {
    render(<App />);
    const user = userEvent.setup();
    const addBtn = await screen.findByRole('menuitem', {name: "Add task"});
    await user.click(addBtn);
    const popup = await screen.findByRole("region", {name: "New Task"});
    await screen.findByText("Overdue incomplete");
    logRoles(popup);
    const title = await within(popup).findByRole("textbox", {name: "Title", exact: false});
    // const desc = await within(popup).findByLabelText("Description", {exact: false});
    // // await user.click(title);
    // expect(title).toHaveFocus();
    await user.type(title, "Task title");
    expect(title).toHaveTextContent("Task title");

})

it.todo("should show error message if the user tries to create task without title")
it.todo("should show error message if the user tries to create task without due date")
it.todo("should show error message if the user tries to create task with start after due date")
it.todo("should show error message if the user tries to create task with a ill-formed start date")
it.todo("should show error message if the user tries to create task with a ill-formed due date")