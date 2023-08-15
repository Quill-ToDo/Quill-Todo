'use client'

import DashboardLayout from './home/layout';
import List from '@/home/dashboard/@tasks/List';
import AlertWrapper from '@/alerts/AlertWrapper';
import {useTaskStore, StoreProvider} from '@/store/StoreProvider';
import { observer } from 'mobx-react-lite';

const Home = observer(() => {
  const taskStore = useTaskStore();
  return (
    <StoreProvider>
      <AlertWrapper>
          <DashboardLayout>
            <List store={taskStore} />
            {/* <Calendar /> */}
          </DashboardLayout>
      </AlertWrapper>
    </StoreProvider>
  )
})

export default Home;
