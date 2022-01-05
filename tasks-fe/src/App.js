import {Home} from './components/Home';
import { StoreProvider } from "./store/StoreContext";
import AlertWrapper from './components/AlertWrapper';

function App() {
  return (
      <StoreProvider>
            <Home />
      </StoreProvider>
  );
}

export default App;
