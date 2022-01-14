import {
    render,
    screen,
    within,
    waitForElementToBeRemoved,
    logRoles
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    rest
} from 'msw'
import MockTaskApiHandler from '../../API/MockTaskApiHandler';
import App from '../../App';

var handler;

beforeAll(() => {
    handler = new MockTaskApiHandler();
    handler.server.listen();
})

afterAll(() => {
    handler.server.close();
})

// const wrapper = await screen.findByRole("log", {name: "Alerts"});

it.todo("should render failure alerts that require dismissal")
it.todo("should render success alerts that slide out")
it.todo("should render notice alerts that slide out")

it("should remove alerts from the DOM after they are exited", async () => {
    handler.server.use(
        rest.patch(handler.API_URL+":pk", (req, res, ctx) => {
            return res.once(
                ctx.status(500),
                ctx.json({message: "Server error"})
            )
        })
    );
    render(<App />);
    const user = userEvent.setup();
    const box = await screen.findByRole("checkbox", {name:"Overdue incomplete"});
    await user.click(box);
    expect(box).toBeChecked();
    const alert = await screen.findByRole("alertdialog", {name: "Error:"});
    const close = screen.getByRole("button", {name: "Close"})
    expect(close).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(alert).not.toBeInTheDocument();
})

it.skip("should remove alerts from the DOM after they slide out", async () => {

})

it("should handle failure to update task", async () => {
    handler.server.use(
        rest.patch(handler.API_URL+":pk", (req, res, ctx) => {
            return res.once(
                ctx.status(500),
                ctx.json({message: "Server error"})
            )
        })
    );
    render(<App />);
    const user = userEvent.setup();
    const box = await screen.findByRole("checkbox", {name:"Overdue incomplete"});
    await user.click(box);
    expect(box).toBeChecked();
    await screen.findByRole("alertdialog", {name: "Error:"});
    const close = screen.getByRole("button", {name: "Close"})
    expect(close).toHaveFocus();
    // Should revert changes
    expect(await screen.findByRole("checkbox", {name:"Overdue incomplete"})).not.toBeChecked();
})

it.only("should handle failure to delete task", async () => {
    handler.server.use(
        rest.delete(handler.API_URL+":pk", (req, res, ctx) => {
            return res.once(
                ctx.status(500),
                ctx.json({message: "Server error"})
            )
        })
    );
    render(<App />);
    const user = userEvent.setup()
    const t = await screen.findByText("Overdue incomplete");
    await user.click(t);
    const del = await screen.findByRole("button", {name: "Delete task"});
    await user.click(del);
    expect(screen.queryByText("Overdue incomplete")).toBeNull();
    await screen.findByRole("alertdialog", {name: "Error:"});
    const close = screen.getByRole("button", {name: "Close"})
    expect(close).toHaveFocus();
    // Should add test back to list
    await screen.findByText("Overdue incomplete");
})

it("should handle failure to load tasks", async () => {
    handler.server.use(
        rest.get(handler.API_URL, (req, res, ctx) => {
            return res.once(
                ctx.status(500),
                ctx.json({message: "Server error"})
            )
        })
    );
    render(<App />);
    await screen.findByRole("alertdialog", {name: "Error:"});
    const close = screen.getByRole("button", {name: "Close"})
    expect(close).toHaveFocus();
})
