import {Home} from './components/Home';
import { TaskProvider, AlertProvider } from "./store/StoreContext";
import AlertWrapper from './components/AlertWrapper';

function App() {
  return (
      <TaskProvider>
          <AlertWrapper>
            <Home />
          </AlertWrapper>
      </TaskProvider>
  );
}

export default App;
