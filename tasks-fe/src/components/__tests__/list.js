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

import { defaultServer } from '../../API/mockHandlers';
import App from "../../App";


const baseDate = DateTime.utc(2021, 6, 6, 6);
const server = defaultServer(baseDate);
const luxonNow = Settings.now;

const showRoles = async () => {
    await screen.findByText("Overdue incomplete");
    logRoles(screen.getByRole("region", {name: "Task list"}));
}

beforeAll(() => {
    // Start mock API
    server.listen();
    // Set constant time for DateTime.now()
    const millis = baseDate.toMillis();
    Settings.now = () => millis;
})

afterAll(() => {
    Settings.now = luxonNow;
    server.close();
})

it("should load tasks in the list", async () => {
    render(<App />);
    expect(screen.getByRole("region", {name: "Task list"}))
    .toContainElement(await screen.findByLabelText("Overdue incomplete"));
})

it("should show a loading message before tasks are loaded", () => {
    render(<App />);
    expect(screen.getByRole("region", {name: "Task list"}))
    .toHaveTextContent(/loading/i);
})

it("should show completed task's title with a line-through", async () => {
    render(<App />);
    const title = await screen.findByText("Overdue complete");
    // expect(window.getComputedStyle(title).getPropertyValue('text-decoration') === "line-through").toBeTruthy();
    expect(title).toHaveStyle("text-decoration: line-through")
})

it("should show uncompleted task's title without a line-through", async () => {
    render(<App />);
    const title = await screen.findByText("Overdue incomplete");
    expect(title).not.toHaveStyle("text-decoration: line-through")
})

it("should show completed task's check boxes as filled", async () => {
    render(<App />);
    const taskName = "Overdue complete";
    const checkbox = await screen.findByRole("checkbox", {name: taskName});
    expect(checkbox).toBeChecked();
})

it("should show uncompleted task's check boxes as unfilled", async () => {
    render(<App />);
    const checkbox = await screen.findByRole("checkbox", {name: "Overdue incomplete"});
    expect(checkbox).not.toBeChecked();
})

it("should show tasks as completed after clicking on its check box", async () => {
    render(<App />);
    const box = await screen.findByRole("checkbox", {name: "Overdue incomplete"});
    userEvent.click(box);
    expect(box).toBeChecked();
    userEvent.click(box);
})

it("should show completed tasks as incomplete after clicking on its check box", async () => {
    render(<App />);
    const box = await screen.findByRole("checkbox", {name: "Overdue complete"});
    userEvent.click(box);
    expect(box).not.toBeChecked();
    userEvent.click(box);
})

const ensureTasksInSection = (tasks, section) => {
    tasks.forEach((taskName) => {
        const locations = screen.getAllByText(taskName);
        locations.forEach((loc) => {
            expect(section).toContainElement(loc);
        })
    });
}

it("should show overdue tasks in the overdue section", async () => {
    // As defined in defaultServer
    const overdueTaskNames = ["Overdue incomplete", "Overdue complete", "No start"];
    render(<App />);
    const section = await screen.findByRole("region", {name: "Overdue"});
    ensureTasksInSection(overdueTaskNames, section)

})

it("should show upcoming tasks in the upcoming section", async () => {
    const upcomingTaskNames = ["Upcoming", "Upcoming span"];
    render(<App />);
    const section = await screen.findByRole("region", {name: "Upcoming"});
    ensureTasksInSection(upcomingTaskNames, section)
})

it("should show tasks due that day in the due today section", async () => {
    const todayDue = ["Due today", "Due today span"];
    render(<App />);
    const today = await screen.findByRole("region", {name: "Today"});
    const dueToday = await within(today).findByRole("region", {name: "Due"});
    ensureTasksInSection(todayDue, dueToday)
})

it("should show in-progress tasks in the work on today section", async () => {
    const workTaskNames = ["Work on today", "Due tomorrow"];
    render(<App />);
    const today = await screen.findByRole("region", {name: "Today"});
    const workToday = await within(today).findByRole("region", {name: "Work"});
    ensureTasksInSection(workTaskNames, workToday)
})

it("should be able to toggle sections opened and closed", async () => {
    render(<App />);
    const overdueSection = await screen.findByRole("region", {name: "Overdue"});
    const task = await within(overdueSection).findByText("Overdue incomplete");
    const toggleBtn = within(overdueSection).getByRole("button", {name: "Collapse overdue tasks"});
    userEvent.click(toggleBtn);
    await waitFor(() => {
        expect(task).not.toBeVisible();
    })
    userEvent.click(toggleBtn);
    await waitFor(() => {
        expect(task).toBeVisible();
    })
})

// TODO
it.todo("should add a task and find the same task in the calendar")
