import {
    render,
    screen,
    within,
    waitForElementToBeRemoved,
    configure
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    rest
} from 'msw'
import MockTaskApiHandler from '../../API/MockTaskApiHandler';
import App from '../../App';
import { useAlertStore } from '../../store/StoreContext';

var handler;
// logRoles(await screen.findByRole("log", {name: "Alerts"}));
const slideOutTimeout = 15000;
jest.setTimeout(slideOutTimeout); 

beforeAll(() => {
    configure({ asyncUtilTimeout: slideOutTimeout });
    handler = new MockTaskApiHandler();
    handler.server.listen();
})

afterAll(() => {
    handler.server.close();
})

// const wrapper = await screen.findByRole("log", {name: "Alerts"});

it("should render failure alerts that require dismissal", async () => {
    render(<App />);
    const alertStore = useAlertStore();
    alertStore.add("failure", "Test fail")
    const notice = await screen.findByRole("alertdialog", {name: "Error:"});
    await new Promise((r) => {setTimeout(r, slideOutTimeout-5000)})
    screen.getByRole("alertdialog", {name: "Error:"})
})

it.skip("should render notice and success alerts that slide out", async() => {
    render(<App />);
    const alertStore = useAlertStore();
    const user = userEvent.setup();
    alertStore.add("notice", "Test notice")
    const notice = await screen.findByRole("listitem", {name: "Notice:"});
    user.unhover(notice);
    // await new Promise((r) => setTimeout(r, 20000));
    await waitForElementToBeRemoved(() => screen.queryByRole("listitem", {name: "Notice:"}));
    // expect(screen.queryByRole("listitem", {name: "Notice:"})).toBeNull();
    // expect(notice).not.toBeInTheDocument();
    // await waitFor(() => {
    //     expect(screen.queryByRole("listitem", {name: "Notice:"})).not.toBeInTheDocument()
    // })
    // configure({ asyncUtilTimeout: defaultTestingLibraryTimeout });
})

it("should remove alerts from the DOM after they are exited", async () => {
    render(<App />);
    const user = userEvent.setup();
    const alertStore = useAlertStore();
    alertStore.add("failure", "Test fail")
    const alert = await screen.findByRole("alertdialog", {name: "Error:"});
    const close = screen.getByRole("button", {name: "Close"})
    expect(close).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(alert).not.toBeInTheDocument();
    alertStore.add("notice", "Test notice")
    const notice = await screen.findByRole("listitem", {name: "Notice:"});
    const nClose = within(notice).getByRole("button", {name: "Close"})
    await user.click(nClose)
    expect(notice).not.toBeInTheDocument();
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

it("should handle failure to delete task", async () => {
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
