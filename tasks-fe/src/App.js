import {Home} from './components/Home';
import { StoreProvider } from "./store/StoreContext";
import AlertBox from './components/AlertWrapper';

function App() {
  return (
      <StoreProvider>
            <AlertBox />
            <Home />
      </StoreProvider>
  );
}

export default App;
