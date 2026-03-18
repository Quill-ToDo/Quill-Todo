import React, { 
    createContext,
    Dispatch, 
    ForwardedRef, 
    forwardRef,  
    ForwardRefRenderFunction,  
    ReactElement, 
    ReactNode, 
    SetStateAction, 
    useContext,  
    useId,  
    useRef, 
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
    Placement,
    autoUpdate,
    useFloatingRootContext,
    UseFloatingRootContextOptions,
    FloatingRootContext,
    FloatingContext,
  } from '@floating-ui/react';
import { observer } from 'mobx-react-lite';
import { 
    PopupPositioningConfig,
    POPUP_CLASS,
    POPUP_ANCHOR_CLASS,
    PopupRenderMethod,
    PopupParams,
    PopupAnchorRenderMethods,
} from '@/app/util/Popup';
import { combineClassNamePropAndString } from '@/app/util/jsTools';
import { DraggableRenderMethod } from '../util/Draggable';

export const PORTAL_HOLDER_ID = "portal-holder";

//#region Floating UI

/**
 *  Get Floating UI positioning options to apply to elements
 * @param param0 
 * @returns 
 */
const getFloatingUiPositioning = ({
    showPopup,
    setShowPopup,
    placement,
    popupMargin,
    alignment,
    closeWhenClickOutside,
 }: PopupPositioningConfig
 & Pick<PopupContextValues, "setShowPopup">
& {showPopup: boolean}) => {
    // Configure middleware for Floating UI module
    const middleware = [];
    // Add corresponding middleware configuration for given placement.
    // "centered" is a placement I made myself, other combos are Floating UI-specific
    // https://floating-ui.com/docs/useFloating#placement
    if (placement === "centered") {
        // Open the popup centered around where the cursor is
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

    const getProps = (context: FloatingRootContext | FloatingContext) => {
        const interactions: ElementProps[] = [];
        interactions.push(useDismiss(context, {
            // close the popup when click outside of it
            outsidePress: closeWhenClickOutside,
            // close the popup when click anchor element
            // referencePress: true,
            // TODO ? what do
            bubbles: false,
        }));
        // generate the positioning props for the anchor and popup from Floating UI module
        const { getReferenceProps, getFloatingProps } = useInteractions(interactions);
        return {
            getAnchorProps: () => { return {
                ...getReferenceProps(),
                className: combineClassNamePropAndString(`${POPUP_ANCHOR_CLASS}`, getReferenceProps()),
            }},
            getPopupProps: () => {return {
                ...getFloatingProps(),
                className: combineClassNamePropAndString(`${POPUP_CLASS}`, getFloatingProps()),
            }}
        }
    }

    return {
        open: showPopup,
        onOpenChange: setShowPopup,
        placement: (`${placement !== "centered" ? placement : ""}${alignment && alignment !== "middle" ? "-"+alignment : ""}` as Placement),
        middleware: middleware,
        // autoUpdate must only be used in this way if popup is conditionally rendered attached to the 
        // isOpen state
        //   whileElementsMounted: autoUpdate,
        getProps,
    }
}

//#endregion Floating UI
//#region Attached popups

/** Use Floating UI to create a positioned popup that will disappear if the anchor element is 
 * re-rendered
 */
export const FloatingUiAttachedPopup = observer((
    {   
        popupRenderMethod,
        anchorRenderMethod,
        closeWhenClickOutside,
        draggable,
        useDragHandle,
        ...popupPositioningConfig
    } : PopupPositioningConfig & PopupAnchorRenderMethods) => {
    const [showPopup, setShowPopup] = useState(false);
    const {getProps, ...positioning} = getFloatingUiPositioning({
        showPopup, 
        setShowPopup,
        ...popupPositioningConfig,
    });

    const { refs, context, floatingStyles } = useFloating(positioning);

    const popupProps: PopupParams = {
        ...getProps(context).getPopupProps(),
        style: floatingStyles,
        closePopup: (callback?: Function) => {
            setShowPopup(false);
            callback && callback();
        },
    };
    const anchorProps = getProps(context).getAnchorProps();

    const final = draggable ? <DraggableRenderMethod
        ref={refs.setFloating}
        {...popupProps}
        render={popupRenderMethod}
        itemData={{
            type: "task popup",
            showDropPreview: false,
        }}
        droppable={false} 
        useHandle={useDragHandle} 
        actionTitle='Move popup'
    /> : popupRenderMethod(popupProps, refs.setFloating);
    
    return <>
        {/* Anchor element  */}
        { anchorRenderMethod(
            {
                ...anchorProps,
                openPopup: (callback?: Function) => {
                    setShowPopup(true);
                    callback && callback();
                },
            }, 
            refs.setReference
        )} 
        {/* Popup */}
        { showPopup && <FloatingPortal id={PORTAL_HOLDER_ID}>
            <FloatingFocusManager context={context}>
                    { final as ReactElement }
            </FloatingFocusManager>
        </FloatingPortal> }
    </>
});

//#endregion Attached popups
//#region Persistent popups

type ForwardedRender = PopupRenderMethod;
export type PopupContextValues = {
    setPersistentPopupRenderMethod: Dispatch<SetStateAction<ForwardedRender>>,
    setCurrentAnchor: Dispatch<SetStateAction<Element | null>>,
    getAnchorProps: () => any,
    setShowPopup: Dispatch<SetStateAction<boolean>>,
    setFloatingConfig: Dispatch<SetStateAction<PopupPositioningConfig | null>>
};

export const PersistentPopupContext = createContext<PopupContextValues>({
    setPersistentPopupRenderMethod: () => null,
    getAnchorProps: () => null,
    setCurrentAnchor: () => null,
    setShowPopup: () => null,
    setFloatingConfig: () => null,
});


/**
 * Render an anchor element with an attached popup that will persist even if the
 * anchor element is unmounted.
 * Returns a method so that the user can set the reference positioning element and
 * a method that opens the popup and a method that closes the popup.
 * Must be wrapped with PersistentPopupContextProvider.
 */
export const FloatingUiPersistentPopupAnchor = observer((
    {
        anchorRenderMethod,
        popupRenderMethod,
        useDragHandle,
        draggable,
        ...popupPositioningConfig
    } : PopupPositioningConfig & PopupAnchorRenderMethods) => {
    const thisAnchor = useRef<Element | null>(null);
    const {
        setShowPopup,
        setPersistentPopupRenderMethod,
        setCurrentAnchor,
        getAnchorProps,
        setFloatingConfig,
    } = useContext(PersistentPopupContext);

    return anchorRenderMethod(
        {
            ...getAnchorProps(),
            openPopup: (callback?: Function) => {
                // When the popup is opened from this anchor, mark this anchor element as
                // the one that should recieve the floating UI anchor ref for persistent popup positioning. 
                // Also set props for popup rendering in the persistent popup context provider so that the 
                // popup can be rendered within PersistentPopupContextProvider based on this anchor's data. 
                setFloatingConfig(popupPositioningConfig);
                setCurrentAnchor(thisAnchor.current);
                const makeDraggable = (props: any, ref: ForwardedRef<any>) => <DraggableRenderMethod
                    render={(props, ref) => {
                        return popupRenderMethod(props, ref)
                    }}
                    itemData={{
                        type: "task popup",
                        showDropPreview: false,
                    }}
                    droppable={false} 
                    useHandle={useDragHandle} 
                    actionTitle='Move popup'
                    {...props}
                    ref={ref}
                />
                setPersistentPopupRenderMethod((prev: ForwardedRender) => draggable ? makeDraggable : popupRenderMethod);
                setShowPopup(true);
                callback && callback();
            },
        }, 
        thisAnchor,
    )
})

/**
 * Provide context to allow:
 * - setting popup props elsewhere that are used to render popup element here 
 * - setting popup to show or not show
 * - setting anchor props used to render the anchor element
 * @param param0 
 * @returns 
 */
export const PersistentPopupContextProvider = observer(({children}: {
    children: ReactNode,
}) => {
    // showPopup controls whether popup is shown or not
    const [showPopup, setShowPopup] = useState(false);
    const [thisPopup, setPopup] = useState<HTMLElement | null>(null);
    // Anchor elements are rendered elsewere in AnchorWithPersistentPopupAttached 
    // components. The openPopup method in FloatingUiPersistentPopupAnchor
    // sets popupPositioningConfig and persistentPopupRenderMethod here
    // so the popup associated with that anchors data is the one that's rendered
    const [currentAnchor, setCurrentAnchor] = useState<Element | null>(null);
    const [popupPositioningConfig, setPopupPositioningConfig] = useState<PopupPositioningConfig | null>(null);  
    const [persistentPopupRenderMethod, setPersistentPopupRenderMethod] = useState<ForwardedRender>(() => () => <></>);

    // Use the config specified by the anchor component that laucnhed this popup 
    // to get methods to apply floating interactions via props, and floating positioning needed
    // to generate floating root context
    const { getProps, ...floatingPositioning } = getFloatingUiPositioning({
        showPopup, 
        setShowPopup,
        ...popupPositioningConfig,
    });

    const ops: UseFloatingRootContextOptions = {
        ...floatingPositioning,
        elements: {
            reference: currentAnchor,
            floating: thisPopup,
        }
    };

    const rootContext = useFloatingRootContext(ops);

    const popup = <Popup 
        persistentPopupRenderMethod={persistentPopupRenderMethod}
        positioning={floatingPositioning}
        setShowPopup={setShowPopup}
        rootContext={rootContext}
        ref={setPopup}
        {...getProps(rootContext).getPopupProps()}
    />;
    // Pass the anchor ref and anchor props used to to position the popup in context so that 
    // the anchor element can access them and render them into its returned anchor element.
    return <PersistentPopupContext.Provider
        value={{
            // Allow anchor elsewhere to set the popup as closed or open via context
            setShowPopup,
            // Allow anchor elsewhere to specify the render method used for this popup
            setPersistentPopupRenderMethod,
            // Allow components elsewhere to specify that they are the current anchor
            // (setCurrentAnchor should be used like a ref)
            setCurrentAnchor,
            // Pass props for anchor from here to the element via context
            getAnchorProps: () => getProps(rootContext).getAnchorProps(),
            // Allow anchor elsewhere to specify the config used here via context
            setFloatingConfig: setPopupPositioningConfig,
        }}
    >
        { children }
        { showPopup && <FloatingPortal 
            id={PORTAL_HOLDER_ID}
        >
                    { popup}
                </FloatingPortal> }
    </PersistentPopupContext.Provider>
})

const Popup = forwardRef<any, {
        persistentPopupRenderMethod : ForwardedRender,
        setShowPopup: PopupContextValues["setShowPopup"],
        rootContext: FloatingRootContext,
        positioning: UseFloatingOptions,
    } & PopupParams
        >(({
        persistentPopupRenderMethod, 
        setShowPopup, 
        rootContext, 
        positioning,
        ...popupComponentProps}, ref) => {
            const persistentPosition = useRef<string | number>();
            
            const {
                context,
                floatingStyles, 
                refs,
            } = useFloating({
                ...positioning,
                rootContext: rootContext,
            });

            // Maintain the popup position 
            // If there's an anchor attached and floating UI has calculated a popup position based on it, 
            // store that position as persistent even if anchor unmounts
            if (refs.reference.current && floatingStyles.transform && persistentPosition.current !== floatingStyles.transform) {
                persistentPosition.current = floatingStyles.transform;
            }
            if (popupComponentProps.style && popupComponentProps.style.transform) {
                persistentPosition.current = popupComponentProps.style.transform;
            }
            // If a different positioning is passed in, use that instead.
            return <FloatingFocusManager context={context as FloatingContext}>
                    { persistentPopupRenderMethod({
                            ...popupComponentProps,
                            style: {
                                ...floatingStyles,
                                transform: persistentPosition.current,
                                ...(popupComponentProps.style ? popupComponentProps.style : {}),
                            },
                            closePopup: (callback?: Function) => {
                                setShowPopup(false);
                                callback && callback();
                                popupComponentProps.closePopup(callback)
                            },
                        }, ref) as ReactElement }
                </FloatingFocusManager>
})
//#endregion Attached popups
