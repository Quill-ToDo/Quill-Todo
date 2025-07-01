'use client'

import DashboardLayout from './home/dashboardLayout';
import AlertWrapper from '@/alerts/AlertWrapper';
import { StoreProvider } from '@/store/StoreProvider';
import { observer } from 'mobx-react-lite';
import { ReactNode } from 'react';
import RootStore from './home/_globalStore/RootStore';
import { PersistentPopupContextProvider } from '@/util/Popup';
import { DragContextProvider } from './@util/Draggable';

const QuillContext = observer(({
  widgets,
  rootStore,
}:{
  widgets?: ReactNode,
  rootStore?: RootStore,
}) => {
  return (
    <StoreProvider rootStore={rootStore}>
      <AlertWrapper>
        <DragContextProvider>
          <PersistentPopupContextProvider>
            <DashboardLayout>
              {widgets}
            </DashboardLayout>
          </PersistentPopupContextProvider>
        </DragContextProvider>
      </AlertWrapper>
    </StoreProvider>
  )
})

export default QuillContext;