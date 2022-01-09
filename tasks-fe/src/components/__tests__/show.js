import {
    render,
    screen,
    within
} from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import { DateTime, Settings } from 'luxon';

import MockTaskApiHandler from '../../API/MockTakApiHandler';
import App from "../../App";


const baseDate = DateTime.utc(2021, 6, 6, 6);
const mockServerHandler = new MockTaskApiHandler(baseDate);
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

it("should be able to close show via clicking off show", async () => {
    render(<App />);
    const list = await screen.findByRole("region", {name: "Task list"});
    const listTask = await within(list).findByText( "Overdue complete");
    userEvent.click(listTask);
    await screen.findByRole("dialog", {name: "Task Details"});
    userEvent.click(screen.getByTestId("show-filter"));
    expect(screen.queryByRole("dialog", {name: "Task Details"})).toBeNull();
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