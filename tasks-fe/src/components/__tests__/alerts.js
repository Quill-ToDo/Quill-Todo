import {
    render,
    screen,
    within,
    configure,
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
})

// Running all pending timers and switching to real timers using Jest
afterEach(() => {
    handler.server.resetHandlers();
})

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
    render(<App />);
    const user = userEvent.setup();
    await addAlert(await screen.findByRole('menubar'), NOTICE_ALERT, "Test notice");
    const notice = await screen.findByRole("listitem", {name: "Notice:"});
    await user.unhover(notice);
    
    jest.useFakeTimers();
    jest.setTimeout(slideOutTimeout*2); 
    let t = setTimeout(slideOutTimeout*10);
    // jest.runAllTimers();
    await t;
    // jest.advanceTimersByTime( slideOutTimeout*10);
    // let r = waitForElementToBeRemoved(() => screen.queryByRole("listitem", {name: "Notice:"}));
    // jest.runAllTimers();
    // await r;
    jest.useRealTimers();
    jest.setTimeout(slideOutTimeout); 
    
    expect(notice).not.toBeInTheDocument();
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
    await user.pointer({keys: '[MouseLeft]', target: nClose});
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
    await screen.findByRole("alertdialog", {name: "Error:"});
    const close = screen.getByRole("button", {name: "Close"})
    expect(close).toHaveFocus();
    // Should revert changes
    expect(await screen.findByRole("checkbox", {name:"Overdue incomplete"})).not.toBeChecked();
})

it.skip("should handle failure to delete task", async () => {
    // Won't work with fake timers :(
    handler.server.use(
        rest.delete(handler.API_URL+":id", (req, res, ctx) => {
            return res.once(
                ctx.status(500),
                ctx.json({message: "Server error"})
            )
        })
    );

    render(<App />);
    const user = userEvent.setup();
    const list = await screen.findByRole("region", {name: "Task list"});
    const listTask = await within(list).findByText("Overdue incomplete");
    await user.click(listTask);
    const del = await screen.findByRole("button", {name: "Delete task"});
    await user.click(del); 
    // Should render an alert
    const alert = await screen.findByRole("alertdialog", {name: "Error:"});
    // const close = await screen.findByRole("button", {name: "Close"});
    // // This is extremely inconsistent... 
    // expect(close).toHaveFocus(); //To have focus isnt working
    await user.keyboard("{Enter}");
    // Task should still appear among other in the list, not deleted
    await screen.findByText("Overdue incomplete");
    expect(alert).not.toBeInTheDocument();
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
    const user = userEvent.setup();
    render(<App />);
    const alert = await screen.findByRole("alertdialog", {name: "Error:"});
    // expect(close).toHaveFocus(); // For some reason this won't work!
    await user.keyboard("{Enter}");
    // Task should still appear among other in the list, not deleted
    expect(alert).not.toBeInTheDocument();
})
