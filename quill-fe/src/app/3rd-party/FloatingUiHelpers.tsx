import {
    FloatingTree,
    FloatingNode,
    useFloatingNodeId,
    FloatingPortal,
    useFloating,
    useFloatingParentNodeId,
    UseFloatingOptions,
    useInteractions,
    ElementProps,
    useDismiss,
    FloatingFocusManager,
    offset,
    shift,
    flip,
  } from '@floating-ui/react';
import { observer } from 'mobx-react-lite';
import { RefObject, useContext, useRef, useState } from 'react';
import { AlertWrapperContext } from '@/alerts/AlertWrapper';
import { PopupParams } from '../@util/Popup';
import { combineClassNamePropAndString } from '@util/constants';
import { Draggable } from '../@util/Draggable';

const loading = <div className="loading">
    <p>Loading...</p>
</div>;

export const FloatingUiPopupImplementation = observer((
    {   
        renderPopupContent,
        renderElementToClick,
        placement,
        alignment,
        doneLoading, 
        fullscreenable, 
        draggable,
        useDragHandle,
        ...props
    } : PopupParams) => {
    const parentNodeId = useFloatingParentNodeId();
    const alertWrapperContext: RefObject<any> = useContext(AlertWrapperContext);
    const [showPopup, setShowPopup] = useState(false);
    const close = () => setShowPopup(false);
    const open = () => setShowPopup(true);
    const thisPopup = useRef(null);

    // Configure middleware
    const middleware = [];
    if (placement === "centered") {
        middleware.push(offset(({rects}) => {
            return (
            -rects.floating.width / 2
            );
        }))
    } else {
        middleware.push(offset(10));
    }

    middleware.push(shift());
    middleware.push(flip());
    const positioning: UseFloatingOptions = {
        open: showPopup,
        onOpenChange: setShowPopup,
        // "centered" is a placement I made myself, other combos are Floating UI-specific 
        // https://floating-ui.com/docs/useFloating#placement
        placement: placement && placement !== "centered" ? (`${placement}${alignment && alignment !== "middle" ? "-"+alignment : ""}` as Placement) : undefined,
        middleware: middleware,
        // whileElementsMounted: autoUpdate,
    };
    // Configure interactions
    const { refs, floatingStyles, context } = useFloating(positioning);
    const interactions: ElementProps[] = [];
    interactions.push(useDismiss(context, {
        outsidePress: true,
        referencePress: true,
        bubbles: false,
    }));
    const {getReferenceProps, getFloatingProps} = useInteractions(interactions);

    // This is a root, so we wrap it with the context
    const popupContent = <FloatingNode id={useFloatingNodeId()}>
        {/* Portal this shit away */}
        { positioning.open && <FloatingPortal 
                id={"portal-holder"}
                root={alertWrapperContext.current}
            >
                {/* Actual popup */}
                <FloatingFocusManager context={context}>
                    <div 
                        className='floating'
                        ref={refs.setFloating} 
                        style={floatingStyles} 
                        {...props}
                        {...getFloatingProps()}
                    >
                        { draggable ? 
                            <Draggable 
                                droppable={false} 
                                useHandle={useDragHandle} 
                            > 
                                <section 
                                    className={combineClassNamePropAndString({className: `popup`, props: props})}
                                    ref={thisPopup}
                                >
                                    { doneLoading ? renderPopupContent({closePopup: close}) : loading }
                                </section>
                            </Draggable> 
                            : 
                            <section 
                                className={combineClassNamePropAndString({className: `popup`, props: props})}
                                ref={thisPopup}
                            >
                                { doneLoading ? renderPopupContent({closePopup: close}) : loading }
                            </section> 
                        } 
                    </div>
                </FloatingFocusManager>
            </FloatingPortal>
        }
    </FloatingNode>

    return <>
        {/* Anchor element  */}
        <div 
            ref={refs.setReference}
            className={"popup-anchor"}
            {...getReferenceProps()}
        >
            { renderElementToClick(open) } 
        </div>  
        {/* Popup */}
        { parentNodeId ? popupContent : <FloatingTree> {popupContent} </FloatingTree> }
    </>
})