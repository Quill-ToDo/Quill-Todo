import {
    render,
    screen,
    within,
    waitForElementToBeRemoved,
    configure,
    logRoles,
    pointer
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    rest
} from 'msw'
import { act } from 'react-dom/test-utils';
import MockTaskApiHandler from '../../API/MockTaskApiHandler';
import App from '../../App';
import { addAlert, ERROR_ALERT, NOTICE_ALERT } from '../../static/js/alertEvent';

var handler;
// logRoles(await screen.findByRole("log", {name: "Alerts"}));
const slideOutTimeout = 15000;
// Can only set these outside of the funcitons below
configure({ asyncUtilTimeout: slideOutTimeout });
jest.setTimeout(slideOutTimeout); 

beforeAll(() => {
    handler = new MockTaskApiHandler();
    handler.server.listen();
})

afterAll(() => {
    handler.server.close();
})

beforeEach(() => {
    jest.useFakeTimers();
})

// Running all pending timers and switching to real timers using Jest
afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
})

// const wrapper = await screen.findByRole("log", {name: "Alerts"});

it("should render failure alerts that require dismissal", async () => {
    jest.useFakeTimers();
    render(<App />);
    await act(async ()=>addAlert(await screen.findByRole('menubar'), ERROR_ALERT, "Test fail"));
    await screen.findByRole("alertdialog", {name: "Error:"});
    const p = new Promise((r) => {setTimeout(r, slideOutTimeout-5000)});
    // Have to run all after this line, can't await on line 52 for some reason.
    jest.runAllTimers();
    await p;
    screen.getByRole("alertdialog", {name: "Error:"})
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
})

it.skip("should render notice and success alerts that slide out", async() => {
    jest.useFakeTimers();
    render(<App />);
    const user = userEvent.setup();
    await act(async () => addAlert(await screen.findByRole('menubar'), NOTICE_ALERT, "Test notice"));
    const notice = await screen.findByRole("listitem", {name: "Notice:"});
    await act(() => user.unhover(notice));
    let t = act(async () => {new Promise((r) => setTimeout(r, slideOutTimeout-5000))});
    jest.runAllTimers();
    await t;
    // let r = waitForElementToBeRemoved(() => screen.queryByRole("listitem", {name: "Notice:"}))
    // jest.runAllTimers();
    // await r;
    expect(notice).not.toBeInTheDocument();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
})

it("should remove error alerts from the DOM after they are exited", async () => {
    render(<App />);
    const user = userEvent.setup();
    
    // Test closing error alerts
    await act (async () => {
        addAlert(await screen.findByRole('menubar'), ERROR_ALERT, "Test fail");   
    })
    const alert = await screen.findByRole("alertdialog", {name: "Error:"});
    const close = screen.getByRole("button", {name: "Close"})
    expect(close).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(alert).not.toBeInTheDocument();
})

it("should remove notice alerts from the DOM after they are exited", async () => {
    render(<App />);
    const user = userEvent.setup();
    await act(async () => {
        addAlert(await screen.findByRole('menubar'), NOTICE_ALERT, "Test notice")    
    })
    const notice = await screen.findByRole("listitem", {name: "Notice:"});
    const nClose = within(notice).getByRole("button", {name: "Close"});
    // User.click did not work, had to use base pointer method
    user.pointer({keys: '[MouseLeft]', target: nClose})
    expect(notice).not.toBeInTheDocument();
})

it("should handle failure to update task", async () => {
    handler.server.use(
        rest.patch(handler.API_URL+":id", (req, res, ctx) => {
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
        rest.delete(handler.API_URL+":id", (req, res, ctx) => {
            return res.once(
                ctx.status(500),
                ctx.json({message: "Server error"})
            )
        })
    );
    render(<App />);
    const user = userEvent.setup()
    const t = await screen.findByText("Overdue incomplete");
    await act(() => user.click(t));
    const del = await screen.findByRole("button", {name: "Delete task"});
    await act(() => user.click(del));
    await screen.findByRole("alertdialog", {name: "Error:"});
    const close = screen.getByRole("button", {name: "Close"})
    expect(close).toHaveFocus();
    // Task should still be in the list, not deleted
    await screen.findByText("Overdue incomplete");
})

it.skip("should handle failure to load tasks", async () => {
    handler.server.use(
        rest.get(handler.API_URL, (req, res, ctx) => {
            return res.once(
                ctx.status(500),
                ctx.json({message: "Server error"})
            )
        })
    );
    render(<App />);
    await act(async () => {
        // Runs when you use real timers. When you switch to fake it crashes, wonder if it's getting stuck when you continaully call loadtasks
        // jest.useRealTimers();
        await new Promise((r) => setTimeout(r, 3000));
        await jest.runOnlyPendingTimers();
    })
    await screen.findByRole("alertdialog", {name: "Error:"});
    const close = screen.getByRole("button", {name: "Close"})
    expect(close).toHaveFocus();
})
