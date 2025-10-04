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
    useMergeRefs,
  } from '@floating-ui/react';
import { observer } from 'mobx-react-lite';
import { 
    PopupSetupProps,
    InnerPopupProps,
    PersistentProps, 
} from '@util/Popup';
import { combineClassNamePropAndString } from '@util/jsTools';
import { Draggable } from '@/util/Draggable';

export const PORTAL_HOLDER_ID = "portal-holder";

/**
 *  Get Floating UI positioning options to apply to elements
 * @param param0 
 * @returns 
 */
const configureFloatingUi = ({
    isOpen,
    openChange,
    placement,
    popupMargin,
    alignment,
 }: InnerPopupProps & {isOpen: boolean, openChange: Dispatch<SetStateAction<boolean>>}) => {
    // Configure middleware for Floating UI module
    const middleware = [];
    // Add corresponding middleware configuration for given placement.
    // "centered" is a placement I made myself, other combos are Floating UI-specific 
    // https://floating-ui.com/docs/useFloating#placement
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
    if (popupMargin && popupMargin !== 0) {
        middleware.push(offset(popupMargin));
    }
    // shift the floating element to keep it in view
    middleware.push(shift());
    // allow the popup to "flip" to the other side of the anchor element
    middleware.push(flip());
    // TODO: Not sure if this is doing anything
    // Provides data to change the size of a floating element.
    middleware.push(size({apply: ({availableHeight, elements}) => {
        elements.floating.style.maxHeight = availableHeight >= elements.floating.scrollHeight
        ? ''
        : `${availableHeight}px`;
      }}));
    const positioning: UseFloatingOptions = {
        open: isOpen,
        onOpenChange: openChange,
        placement: placement && placement !== "centered" ? (`${placement}${alignment && alignment !== "middle" ? "-"+alignment : ""}` as Placement) : undefined,
        middleware: middleware,
        // autoUpdate must only be used in this way if popup is conditionally rendered attached to the 
        // isOpen state
        // whileElementsMounted: autoUpdate,
    };
    // Configure interactions
    const { refs, floatingStyles, context, isPositioned, update, elements } = useFloating(positioning);
    const interactions: ElementProps[] = [];
    // context:
    interactions.push(useDismiss(context, {
        // close the popup when click outside of it
        outsidePress: true,
        // close the popup when click anchor element
        referencePress: true,
        // TODO ? what do
        bubbles: false,
    }));
    // generate the positioning props for the anchor and popup from Floating UI module
    const { getReferenceProps, getFloatingProps } = useInteractions(interactions);

    let floatingUiPopupPositioningProps = {
        style: floatingStyles,
        ...getFloatingProps(),
        className: combineClassNamePropAndString(`floating popup`, getFloatingProps()),
    }
    return {
        floatingUiRefs: refs,
        floatingUiContext: context,
        floatingUiPopupPositioningProps: floatingUiPopupPositioningProps,
        floatingUiPopupIsPositioned: isPositioned,
        getFloatingUiAnchorProps: getReferenceProps,
    }
}

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
    popupMargin,
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
    popupIsPositioned: boolean,
} => {
    const {
        floatingUiRefs, 
        floatingUiPopupPositioningProps,
        floatingUiContext, 
        floatingUiPopupIsPositioned, 
        getFloatingUiAnchorProps 
    } = configureFloatingUi({
        isOpen, 
        openChange,
        placement,
        popupMargin,
        alignment
    });

    const popupWithDraggingApplied = draggable ? 
        <Draggable
            droppable={false} 
            useHandle={useDragHandle} 
            actionTitle='Move popup'
            renderDraggableItem={(draggableProps, draggableRef) => renderInnerContent(
                {
                    popupProps: {
                        ...draggableProps,
                        ...floatingUiPopupPositioningProps, 
                        className: combineClassNamePropAndString(floatingUiPopupPositioningProps.className, draggableProps)
                    },
                }, 
                useMergeRefs([draggableRef, floatingUiRefs.setFloating]),
            )}
        />
        : 
        renderInnerContent({popupProps: floatingUiPopupPositioningProps,}, floatingUiRefs.setFloating);

    // Portal this shit away
    const popupWithPortalApplied = 
        <FloatingPortal id={PORTAL_HOLDER_ID}>
            <FloatingFocusManager context={floatingUiContext}>
                { doneLoading ? 
                    popupWithDraggingApplied as ReactElement
                : 
                <div className="loading take-full-space centered">
                    <p>Loading...</p>
                </div>
                }
            </FloatingFocusManager>
        </FloatingPortal>;

    return {
        content: popupWithPortalApplied,
        popupIsPositioned: floatingUiPopupIsPositioned,
        // Set portal anchor and apply anchor props
        anchorRef: floatingUiRefs.setReference,
        getAnchorProps: () => { 
            const anchorProps = getFloatingUiAnchorProps();
            return {
                ...anchorProps,
                className: combineClassNamePropAndString("popup-anchor", anchorProps),
            };
        },
    }
}

/** Use Floating UI to create a positioned popup */
export const FloatingUiAttachedPopup = observer(forwardRef((
    {   
        renderPopupContent,
        ...props
    } : PopupSetupProps,
    forwardedRef: ForwardedRef<any>) => {
    const [showPopup, setShowPopup] = useState(false);

    const popupSetup = getInnerPopupContent({
        renderInnerContent: ({popupProps}, ref) => renderPopupContent({
                closePopup: (callback?: Function) => {
                    setShowPopup(false);
                    callback && callback();
                }, 
                popupContainerProps: popupProps
            }, 
            useMergeRefs([ref, forwardedRef])
        ),
        isOpen: showPopup,
        openChange: setShowPopup,
        ...props
    });
    
    return <>
        {/* Anchor element  */}
        { props.renderElementToClick(
            {
                openPopup: (callback?: Function) => {
                        setShowPopup(true);
                        callback && callback();
                },
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
 * Must be wrapped with PersistentPopupContextProvider.
 */
export const FloatingUiPersistentPopup = observer((
    {
        renderElementToClick,
        renderPopupContent,
        setPopupContent,
        ...props
    } : PersistentProps) =>  {
    // State that determines if the popup is shown or not
    const [showPopup, setShowPopup] = useState(false);

    // Generate the popup content element
    const popupSetup = getInnerPopupContent({
        renderInnerContent: ({popupProps}, ref) => renderPopupContent({
                closePopup: (callback?: Function) => {
                    setShowPopup(false);
                    callback && callback();
                }, 
                popupContainerProps: popupProps
            }, ref),
        isOpen: showPopup,
        openChange: setShowPopup,
        ...props
    });
    
    useEffect(() => {
        // If should show the popup, set the content for parent context to be the popup body.
        // must use context so that the popup persists even when the anchor / reference element is unmounted
        // if is positioned
        if (showPopup) {
            // TODO: Try doing a check for if the popup is positioned before setting the content here. Might need to pass an additional 
            // parameter from popupSetup
            setPopupContent(popupSetup.content as ReactElement);
            // might need to manually add auto update thing here
        }
        else { 
            setPopupContent(null);
        }
    }, [showPopup, popupSetup]);

    return renderElementToClick({
            openPopup: (callback?: Function) => {
                setShowPopup(true);
                callback && callback();
            }, 
                anchorProps: popupSetup.getAnchorProps(),
            }, 
            popupSetup.anchorRef,
        );
})