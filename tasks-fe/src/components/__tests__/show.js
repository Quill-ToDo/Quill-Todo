import {
    render,
    screen,
    within,
    waitForElementToBeRemoved
} from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import { DateTime, Settings } from 'luxon';

import MockTaskApiHandler from '../../API/MockTaskApiHandler';
import App from "../../App";

const baseDate = DateTime.utc(2021, 1, 9, 7);
const mockServerHandler = new MockTaskApiHandler({date: baseDate});
const luxonNow = Settings.now;

// await screen.findByText("Overdue incomplete");
// logRoles(screen.getByRole("region", {name: "Task list"}));

beforeAll(() => {
    // Start mock API
    mockServerHandler.server.listen();
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

it("should be able to open and close task details", async () => {
    render(<App />);
    const list = await screen.findByRole("region", {name: "Task list"});
    const listTask = await within(list).findByText( "Overdue complete");
    userEvent.click(listTask);
    expect(await screen.findByRole("dialog", {name: "Task Details"})).toBeInTheDocument();
    userEvent.click(screen.getByRole("button", {name: "Close"}));
    expect(screen.queryByRole("dialog", {name: "Task Details"})).toBeNull();
});

it("should display task details on show", async () => {
    render(<App />);
    const list = await screen.findByRole("region", {name: "Task list"});
    const listTask = await within(list).findByText( "Overdue incomplete");
    userEvent.click(listTask);
    const show = await screen.findByRole("dialog", {name: "Task Details"});
    expect(show).toBeInTheDocument();
    within(show).getByText("Task description");
    within(show).getByText("Due");
    within(show).getByText("Start");
    const due = baseDate.minus({days: 7}).setZone(DateTime.local().zoneName);
    const start = baseDate.minus({month: 1}).setZone(DateTime.local().zoneName);
    // Validate that the dates are right
    within(show).getByText(due.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY));
    within(show).getByText(start.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY));
    within(show).getAllByText(due.toLocaleString(DateTime.TIME_SIMPLE));
    within(show).getAllByText(start.toLocaleString(DateTime.TIME_SIMPLE));
});

it("should be able to close show via clicking off show", async () => {
    render(<App />);
    const list = await screen.findByRole("region", {name: "Task list"});
    const listTask = await within(list).findByText( "Overdue complete");
    userEvent.click(listTask);
    await screen.findByRole("dialog", {name: "Task Details"});
    userEvent.click(screen.getByTestId("show-filter"));
    expect(screen.queryByRole("dialog", {name: "Task Details"})).toBeNull();
});

it.skip("should be able to close show via escape button", async () => {
    // Cannot figure out how to make this work when ran with other tests. It works alone
    const taskName = "Overdue incomplete";
    const user = userEvent.setup();
    render(<App />);
    const list = await screen.findByRole("region", {name: "Task list"});
    const listTask = await within(list).findByText(taskName);
    userEvent.click(listTask);
    const show = await screen.findByRole("dialog", {name: "Task Details"});
    user.keyboard('[Escape]');
    // expect(screen.queryByRole("dialog", {name: "Task Details"})).toBeNull();

    await waitForElementToBeRemoved(() => screen.queryByRole("dialog", {name: "Task Details"}));
}); 

it.skip("should not close show via any other buttons", async () => {
    render(<App />);
    const list = await screen.findByRole("region", {name: "Task list"});
    const listTask = await within(list).findByText( "Overdue complete");
    userEvent.click(listTask);
    userEvent.keyboard('k');
    screen.getByRole("dialog", {name: "Task Details"});
});

it("should be able to mark tasks as complete from show and have it update in list", async () => {
    render(<App />);
    const taskName = "Overdue incomplete";
    const list = await screen.findByRole("region", {name: "Task list"});
    const listTask = await within(list).findByText(taskName);
    userEvent.click(listTask);
    const show = await screen.findByRole("dialog", {name: "Task Details"});
    userEvent.click(within(show).getByRole("checkbox", {name: taskName}));
    expect(within(list).getByRole("checkbox", {name: taskName})).toBeChecked();
});

it("should be able to delete a task", async () => {
    const taskName = "Delete me!";
    mockServerHandler.setup.addTask({
        title: taskName,
        due: mockServerHandler.date
    });
    render(<App />);
    const list = await screen.findByRole("region", {name: "Task list"});
    const listTask = await within(list).findByText(taskName);
    userEvent.click(listTask);
    const show = await screen.findByRole("dialog", {name: "Task Details"});
    userEvent.click(within(show).getByRole("button", {name: "Delete task"}));
    expect(screen.queryByRole("dialog", {name: "Task Details"})).toBeNull();
    expect(within(list).queryByText(taskName)).toBeNull();
});

it("should be able to edit a task", async () => {
    // TODO Will need to change this once it's implemented
    const taskName = "Overdue incomplete"
    render(<App />);
    const list = await screen.findByRole("region", {name: "Task list"});
    const listTask = await within(list).findByText(taskName);
    userEvent.click(listTask);
    const show = await screen.findByRole("dialog", {name: "Task Details"});
    userEvent.click(within(show).getByRole("button", {name: "Edit task"}));
    await screen.findByText(/\\*not implemented*/);
});