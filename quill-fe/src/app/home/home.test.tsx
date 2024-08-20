import {
    render,
    screen
} from '@testing-library/react';
import { logRoles } from '@testing-library/react';
import { DateTime, Settings } from 'luxon';
import MockTaskApiHandler from "../../../__testing__/TestingAPI/MockTaskApiHandler";
import Home from "../page"

// await screen.findByText("Overdue incomplete");
// logRoles(screen.getByTestId("home"));


const baseDate = DateTime.utc(2021, 6, 6, 6);
const mockServerHandler = new MockTaskApiHandler({date: baseDate});
const luxonNow = Settings.now;

beforeAll(() => {
    // Start mock API
    mockServerHandler.server.listen();
    // Set constant time for DateTime.now()
    const millis = baseDate.toMillis();
    Settings.now = () => millis;
})

beforeEach(() => {
    mockServerHandler.server.resetHandlers();
    mockServerHandler.setup.initTasks();
      // IntersectionObserver isn't available in test environment
    const mockIntersectionObserver = jest.fn();
    mockIntersectionObserver.mockReturnValue({
        observe: () => null,
        unobserve: () => null,
        disconnect: () => null
    });
    window.IntersectionObserver = mockIntersectionObserver;
})

afterAll(() => {
    Settings.now = luxonNow;
    mockServerHandler.server.close();
})

it("should render the app without crashing", () => {
    render(<Home />);
})

it.todo("should now allow not signed out users to access the home page")
it.todo("should redirect users to home after sign in")
it.todo("Should render the calendar component")