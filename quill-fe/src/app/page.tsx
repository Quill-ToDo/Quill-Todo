'use client'

import DashboardLayout from './home/layout';
import { ListWidget } from '@/widgets/List/List';
import AlertWrapper from '@/alerts/AlertWrapper';
import {useTaskStore, StoreProvider} from '@/store/StoreProvider';
import { observer } from 'mobx-react-lite';
import { Calendar } from '@/widgets/Calendar/Calendar';
import TaskStore from './home/_globalStore/tasks/TaskStore';

const Home = observer(() => {
  const taskStore: TaskStore = useTaskStore();

  return (
    <StoreProvider>
      <AlertWrapper>
          <DashboardLayout>
            <ListWidget taskStore={taskStore} />
            <Calendar taskStore={taskStore} />
          </DashboardLayout>
      </AlertWrapper>
    </StoreProvider>
  )
})

export default Home;
