import React, { 
    ComponentPropsWithoutRef,
    Dispatch, 
    ForwardedRef, 
    forwardRef, 
    ForwardRefRenderFunction, 
    ReactElement, 
    ReactNode, 
    SetStateAction, 
    useEffect, 
    useState
 } from 'react';
import {
    FloatingFocusManager,
    UseFloatingOptions,
    useInteractions,
    FloatingPortal,
    ElementProps,
    useFloating,
    useDismiss,
    offset,
    shift,
    flip,
    size,
    autoPlacement,
    autoUpdate,
    Placement,
  } from '@floating-ui/react';
import { observer } from 'mobx-react-lite';
import { 
    PopupSetupProps,
    InnerPopupProps,
    StandaloneProps, 
} from '@util/Popup';
import { assignForwardedRef, combineClassNamePropAndString } from '@util/jsTools';
import { Draggable } from '@/util/Draggable';

export const PORTAL_HOLDER_ID = "portal-holder";

/**
 * Return the "guts" of the popup with Floating UI content applied as needed
 * 
 * @returns 
 */
const getInnerPopupContent = ({
    renderInnerContent,
    isOpen,
    openChange,
    placement,
    alignment,
    doneLoading, 
    draggable,
    useDragHandle,
    ...props
}: InnerPopupProps 
& {
    renderInnerContent: ForwardRefRenderFunction<HTMLElement, {
        popupProps: ComponentPropsWithoutRef<any>,
    }>, 
    isOpen: boolean, 
    openChange: Dispatch<SetStateAction<boolean>>,
}): {
    content: ReactNode,
    anchorRef: ForwardedRef<any>,
    getAnchorProps: () => ComponentPropsWithoutRef<"button">,
} => {
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
    if (placement == "auto") {
        middleware.push(autoPlacement());
    } 
    
    middleware.push(shift());
    middleware.push(flip());
    // TODO: Not sure if this is doing anything
    middleware.push(size({apply: ({availableHeight, elements}) => {
        elements.floating.style.maxHeight = availableHeight >= elements.floating.scrollHeight
        ? ''
        : `${availableHeight}px`;
      }}));
    const positioning: UseFloatingOptions = {
        open: isOpen,
        onOpenChange: openChange,
        // "centered" is a placement I made myself, other combos are Floating UI-specific 
        // https://floating-ui.com/docs/useFloating#placement
        placement: placement && placement !== "centered" ? (`${placement}${alignment && alignment !== "middle" ? "-"+alignment : ""}` as Placement) : undefined,
        middleware: middleware,
        whileElementsMounted: autoUpdate,
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

    let popupPropsToForward = {
        style: floatingStyles,
        ...getFloatingProps(),
        className: combineClassNamePropAndString(`floating popup`, getFloatingProps()),
    }

    const loading = <div className="loading take-full-space centered">
        <p>Loading...</p>
    </div>;

    // Apply focus manager to popup content
    let popupContent = draggable ?
        <Draggable
                droppable={false} 
                useHandle={useDragHandle} 
                actionTitle='Move popup'
                renderDraggableItem={(draggableProps, draggableRef) => { 
                    // Combine normal popup props and draggable props to pass to the rendered popup
                    popupPropsToForward = {
                        ...draggableProps,
                        ...popupPropsToForward,
                    };
                    return doneLoading ? renderInnerContent({ popupProps: popupPropsToForward }, 
                            (node) => {
                                // Assign the popup ref and the draggable element ref
                                assignForwardedRef(draggableRef, node);
                                assignForwardedRef(refs.setFloating, node);
                            }) 
                        : loading;
            }}
        />  
        : <FloatingFocusManager context={context}>
            {/* Only apply popup props */}
            { (doneLoading ? renderInnerContent({popupProps: popupPropsToForward}, 
                (node) => {
                    // only apply popup ref
                    assignForwardedRef(refs.setFloating, node);
                })
            : loading) as ReactElement}
    </FloatingFocusManager>;

    // Portal this shit away
    return {
        content: <FloatingPortal id={PORTAL_HOLDER_ID}>
                        { popupContent }
                    </FloatingPortal>,
        anchorRef: refs.setReference,
        getAnchorProps: () => { return {
                ...getReferenceProps(),
                className: combineClassNamePropAndString("popup-anchor", getReferenceProps()),
            };
        },
    }
}

/** Use Floating UI to create a positioned popup */
export const FloatingUiAttachedPopup = observer(forwardRef((
    {   
        ...props
    } : PopupSetupProps,
    ref: ForwardedRef<any>) => {
    const [showPopup, setShowPopup] = useState(false);

    const open = (callback?: Function) => {
        setShowPopup(true);
        callback && callback();
    };

    const close = (callback?: Function) => {
        setShowPopup(false);
        callback && callback();
    };
    
    const popupSetup = getInnerPopupContent({
        renderInnerContent: (innerProps) => props.renderPopupContent({
            closePopup: close, 
            popupContainerProps: innerProps.popupProps}, 
            ref),
        isOpen: showPopup,
        openChange: setShowPopup,
        ...props
    });
    
    return <>
        {/* Anchor element  */}
        { props.renderElementToClick(
            {
                openPopup: open,
                anchorProps: popupSetup.getAnchorProps(),
            },
            popupSetup.anchorRef, 
        )} 
        {/* Popup */}
        { showPopup && popupSetup.content }
    </>
}))

/**
 * Render a popup positioned near a reference element that will persist even if the
 * reference is unmounted.
 * Returns a method so that the user can set the reference positioning element and
 * a method that opens the popup and a method that closes the popup.
 * Must be wrapped with StandalonePopupContextProvider.
 */
export const FloatingUiStandalonePopup = observer((
    {
        renderElementToClick,
        renderPopupContent,
        setPopupContent,
        ...props
    } : StandaloneProps) =>  {
    const [showPopup, setShowPopup] = useState(false);
    
    const open = (callback?: Function) => {
        setShowPopup(true);
        callback && callback();
    };
    
    const close = (callback?: Function) => {
        setShowPopup(false);
        callback && callback();
    };

    const popupSetup = getInnerPopupContent({
        renderInnerContent: ({popupProps}, ref) => {
            return renderPopupContent({closePopup: close, popupContainerProps: popupProps}, ref);
        },
        isOpen: showPopup,
        openChange: setShowPopup,
        ...props
    });
    
    useEffect(() => {
        if (showPopup) {
            setPopupContent(popupSetup.content as ReactElement);
        }
        else { 
            setPopupContent(null);
        }
    }, [showPopup]);

    return renderElementToClick({
                openPopup: open, 
                anchorProps: popupSetup.getAnchorProps(),
            }, 
            popupSetup.anchorRef,
        );
})