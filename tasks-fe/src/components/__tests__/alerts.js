import {
    render,
    screen,
    within,
    waitForElementToBeRemoved,
    logRoles
} from '@testing-library/react';
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

it.todo("should render failure alerts that require dismissal")
it.todo("should render success alerts that slide out")
it.todo("should render notice alerts that slide out")
it.todo("should remove alerts from the DOM after they are exited")
it.todo("should remove alerts from the DOM after they slide out")
it.todo("should render a failure alert on failure to update task")
it.todo("should render a failure alert on failure to delete task")

it("should render a failure alert on failure to load tasks", async () => {
    handler.server.use(
        rest.get(handler.API_URL, (req, res, ctx) => {
            return res.once(
                ctx.status(500),
                ctx.json({message: "Server error"})
            )
        })
    );
    render(<App />);
    logRoles(screen.getByRole("region", {name: "Task list"}));
    await screen.findByRole("dialog", {name:"Failure:"});
})



// class RootStore {
//     constructor () {
//         // this.userStore
//         this.api = new TaskApi();
//         this.taskStore = new TaskStore(this, this.api);
//         this.alertStore = new AlertStore(this);
//     }
// }

// var rootStore;
// var handler;

// beforeAll(() => {
//     rootStore = new RootStore();
//     handler = new MockTaskApiHandler();
//     handler.server.listen();
// })

// afterAll(() => {
//     handler.server.close();
// })


// it("should add a failure alert if tasks could not be loaded", async () => {
    // handler.server.use(
    //     rest.get(handler.API_URL, (req, res, ctx) => {
    //         return res.once(
    //             ctx.status(500),
    //             ctx.json({message: "Server error"})
    //         )
    //     })
    // );
//     expect(rootStore.alertStore.alerts).toHaveLength(0);
//     await rootStore.taskStore.loadTasks();
//     expect(rootStore.alertStore.alerts.find((alert) => alert.type === "failure"))
//     .toBeDefined();
// })

// it.only("should add a failure alert if tasks could not be updated", async () => {
//     handler.server.use(
//         rest.get(handler.API_URL + ":pk", (req, res, ctx) => {
//             return res.once(
//                 ctx.status(500),
//                 ctx.json({message: "Server error"})
//             )
//         })
//     );
//     expect(rootStore.alertStore.alerts).toHaveLength(0);
//     await rootStore.taskStore.tasks[0].saveHandler();
//     expect(rootStore.alertStore.alerts.find((alert) => alert.type === "failure"))
//     .toBeDefined();
// })

// it.todo("should add a failure alert if task could not be deleted")