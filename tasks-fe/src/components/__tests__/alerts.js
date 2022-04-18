import {
    render,
    screen,
    within,
    waitForElementToBeRemoved,
    configure,
    logRoles
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
jest.setTimeout(slideOutTimeout); 

beforeAll(() => {
    configure({ asyncUtilTimeout: slideOutTimeout });
    handler = new MockTaskApiHandler();
    handler.server.listen();
})

afterAll(() => {
    handler.server.close();
})

beforeEach(() => {
    jest.useFakeTimers()
})

// Running all pending timers and switching to real timers using Jest
afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
})

// const wrapper = await screen.findByRole("log", {name: "Alerts"});

it("should render failure alerts that require dismissal", async () => {
    render(<App />);
    addAlert(await screen.findByRole('menubar'), ERROR_ALERT, "Test fail");
    await screen.findByRole("alertdialog", {name: "Error:"});
    await new Promise((r) => {setTimeout(r, slideOutTimeout-5000)})
    screen.getByRole("alertdialog", {name: "Error:"})
})

it.only("should render notice and success alerts that slide out", async() => {
    render(<App />);
    const user = userEvent.setup();
    await act(async () => addAlert(await screen.findByRole('menubar'), NOTICE_ALERT, "Test notice"));
    const notice = await screen.findByRole("listitem", {name: "Notice:"});
    await act(() => user.unhover(notice));
    await new Promise((r) => setTimeout(r, 7000));
    await waitForElementToBeRemoved(() => screen.queryByRole("listitem", {name: "Notice:"}))
    // await waitForElementToBeRemoved(() => screen.queryByRole("listitem", {name: "Notice:"}));
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
    // Test closing error alerts
    await act (async () => {
        addAlert(await screen.findByRole('menubar'), ERROR_ALERT, "Test fail");   

    })
    const alert = await screen.findByRole("alertdialog", {name: "Error:"});
    const close = screen.getByRole("button", {name: "Close"})
    expect(close).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(alert).not.toBeInTheDocument();
    // Test closing notice alerts
    await act(async () => {
        addAlert(await screen.findByRole('menubar'), NOTICE_ALERT, "Test notice")    
    })
    const notice = await screen.findByRole("listitem", {name: "Notice:"});
    const nClose = within(notice).getByRole("button", {name: "Close"})
    await act (async () => {
        await user.click(nClose)
    })
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
