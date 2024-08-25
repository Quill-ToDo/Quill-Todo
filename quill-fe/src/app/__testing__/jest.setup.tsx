import '@testing-library/jest-dom';
import { DateTime, Settings } from 'luxon';
import { MockTaskApiHandler } from '@/testing/TestingAPI/MockTaskApiHandler';
import RootStore from "@/store/RootStore";
import TaskStore from '@/store//tasks/TaskStore';
import userEvent from '@testing-library/user-event';

export const BASE_DATE = DateTime.local({year: 2024, month: 8, day: 23, hour: 6});
export const MOCK_SERVER_HANDLER = new MockTaskApiHandler({date: BASE_DATE});
const luxonNow = Settings.now;
export let testRoot: RootStore;
export let testTaskStore: TaskStore;
export let testUser: any;

beforeAll(() => {
    // Start mock API
    MOCK_SERVER_HANDLER.server && MOCK_SERVER_HANDLER.server.listen();
    // Set constant time for DateTime.now()
    const millis = BASE_DATE.toMillis();
    Settings.now = () => millis;
})

beforeEach(() => {
    MOCK_SERVER_HANDLER.server && MOCK_SERVER_HANDLER.server.resetHandlers();
    MOCK_SERVER_HANDLER.setup.initTasks();
    testRoot = new RootStore();
    testTaskStore = testRoot.taskStore;
    testUser = userEvent.setup();
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
    MOCK_SERVER_HANDLER.server && MOCK_SERVER_HANDLER.server.close();
})