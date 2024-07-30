import {
    FloatingTree,
    FloatingNode,
    useFloatingNodeId,
    FloatingPortal,
    useFloating,
    useFloatingParentNodeId,
    UseFloatingOptions,
    UseDismissProps,
    useInteractions,
    ElementProps,
    useDismiss,
    FloatingFocusManager,
    FloatingFocusManagerProps,
  } from '@floating-ui/react';
import { observer } from 'mobx-react-lite';
import { ReactElement } from 'react';
import { ALERT_CAPTURE_ID } from './constants';

// This code is from: https://floating-ui.com/docs/FloatingTree

const NestablePopup = observer(({
    renderRef,
    floatingElement,
    useFloatingParams,
    useDismissParams,
    focusManagerProps,
}: {
    renderRef: (ref: any, props: Record<string, unknown>) => ReactElement,
    floatingElement: ReactElement,
    useFloatingParams: UseFloatingOptions,
    useDismissParams?: UseDismissProps,
    focusManagerProps?: FloatingFocusManagerProps,
  }) => {
    // Subscribe this component to the <FloatingTree> wrapper:
    const nodeId = useFloatingNodeId();
   
    // Pass the subscribed `nodeId` to `useFloating`:
    const { refs, floatingStyles, context } = useFloating(useFloatingParams);
    const interactions: ElementProps[] = [];
    if (useDismissParams) {
      interactions.push(useDismiss(context, useDismissParams));
    }
    const {getReferenceProps, getFloatingProps} = useInteractions(interactions);
    
    // Wrap the rendered floating element in a `<FloatingNode>`,
    // passing in the subscribed `nodeId`:
    return (
      <>
        { renderRef(refs.setReference, getReferenceProps()) } 
        <FloatingNode id={nodeId}>
        { useFloatingParams.open && (
          <FloatingPortal id={"portal-holder"}>
              <FloatingFocusManager context={context} {...focusManagerProps}>
              <div 
                className='floating'
                ref={refs.setFloating} 
                style={floatingStyles} 
                {...getFloatingProps()}
              >
                  {floatingElement}
              </div>
          </FloatingFocusManager>
          </FloatingPortal>
        ) }
        </FloatingNode>
      </>
    );
  })

  // This is the component the consumer uses
export const PositionedPopupAndReferenceElement = observer(({
    renderRef, 
    popupElement,
    popupPositioningOptions,
    dismissPopupOptions,
    popupFocusOptions,
}: {
    renderRef: (ref: any, props: Record<string, unknown>) => ReactElement,
    popupElement: ReactElement,
    popupPositioningOptions: UseFloatingOptions,
    dismissPopupOptions?: UseDismissProps,
    popupFocusOptions? : FloatingFocusManagerProps,
  }) => {

    const parentId = useFloatingParentNodeId();
    const props = {
        renderRef: renderRef,
        floatingElement: popupElement,
        useFloatingParams: popupPositioningOptions,
        useDismissParams: dismissPopupOptions,
        focusManagerProps: popupFocusOptions,
    }
   
    // This is a root, so we wrap it with the tree
    if (parentId === null) {
      return (
        <FloatingTree>
          <NestablePopup 
            {...props}
          />
        </FloatingTree>
      );
    }
   
    return <NestablePopup    
        {...props}
    />;
})