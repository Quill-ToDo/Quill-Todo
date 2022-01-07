import { defaultServer } from '../../API/mockHandlers';
import {
    render,
    screen,
    within,
} from '@testing-library/react';
import App from "../../App"
import { rest } from 'msw'

const server = defaultServer();

beforeAll(() => {
    server.listen();
})

afterAll(() => {
    server.close();
})

it("should load tasks in the list", async () => {
    render(<App />);
    expect(screen.getByRole("region", {name: "Task list"}))
    .toContainElement(await screen.findByRole("button", {name: "Overdue incomplete"}));
})

it("should show a loading message before tasks are loaded", () => {
    render(<App />);
    expect(screen.getByRole("region", {name: "Task list"}))
    .toHaveTextContent(/loading/i);
})

it("should show completed task's check boxes as filled", async () => {
    render(<App />);
    const checkbox = await screen.findByRole("checkbox", {name: "Overdue complete"});
    console.log(checkbox.ariaChecked)
    expect(checkbox).toBeChecked()
    // expect(checkbox)

})

it.todo("should show completed task's title with a line-through")
it.todo("should show uncompleted task's check boxes as unfilled")
it.todo("should show completed task's title without a line-through")
it.todo("should show tasks as completed after clicking on its check box")
it.todo("should update tasks as completed in the server after clicking its check box")
it.todo("should show completed tasks as incomplete after clicking on its check box")
it.todo("should update completed tasks as incomplete in the server after clicking on its check box")
it.todo("should add a task and find the same task in the calendar")
it.todo("should show overdue tasks in the overdue section")
it.todo("should show upcoming tasks in the upcoming section")
it.todo("should show tasks due that day in the due today section")
it.todo("should show in-progress tasks in the work on today section")
